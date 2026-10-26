import React, { useState, useRef, useEffect } from 'react';
import { EMPTY_STUDY_COURSE } from './data/initialStudyCourses';
import {
  StudyDirectoryCourse,
  StudyModuleNode,
  StudyArtifact,
  ScholarUser,
  ContinueLearningPosition,
  TopicMasteryRecord,
} from './types';
import { Header } from './components/Header';
import { LeftCardsColumn } from './components/LeftCardsColumn';
import { CenterBlueCard } from './components/CenterBlueCard';
import { RightGreenCards } from './components/RightGreenCards';
import { ConnectorLines } from './components/ConnectorLines';
import { BreadcrumbNav } from './components/BreadcrumbNav';
import { StudyInspectorModal } from './components/StudyInspectorModal';
import { UploadModuleModal } from './components/UploadModuleModal';
import { FaqModal } from './components/FaqModal';
import { UnloadConfirmModal } from './components/UnloadConfirmModal';
import { AuthOverlay } from './components/AuthOverlay';
import { FooterBar } from './components/FooterBar';
import { SuperuserDashboard } from './components/SuperuserDashboard';
import { LearnerDashboard } from './components/LearnerDashboard';
import { FocusModeModal } from './components/FocusModeModal';
import { StudyGoalsModal } from './components/StudyGoalsModal';
import { getStoredUser, saveStoredUser, recordModuleUploadStat, recordAuditLog } from './utils/authStorage';
import { onScholarAuthStateChanged, validateFirestoreConnection } from './lib/firebase';
import { recordAnalyticsEvent } from './utils/analyticsEngine';
import { processOfflineQueue, getOfflineQueue } from './utils/offlineSync';
import {
  distillTopicIntoStructuredLesson,
  compileStructuredLessonToMarkdown,
  isRawOrCorruptedLesson,
} from './utils/lessonDistiller';
import { Search, CheckCircle2, X, Sparkles, BookOpen, Bookmark, GraduationCap, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function sanitizeExistingCourses(loadedCourses: StudyDirectoryCourse[]): {
  courses: StudyDirectoryCourse[];
  repaired: boolean;
} {
  let repaired = false;

  const cleaned = loadedCourses.map((c) => {
    let courseRepaired = false;
    const modules = c.modules.map((m) => {
      let moduleRepaired = false;
      const topics = m.blueRoadmap.topics.map((t, tIdx) => {
        let topicRepaired = false;
        const artifacts = t.artifacts.map((a) => {
          if (a.type === 'overview' && isRawOrCorruptedLesson(a.overviewMarkdown)) {
            // Re-distill authentic structured lesson without raw noise
            const cleanLesson = distillTopicIntoStructuredLesson(
              t.topicName,
              a.overviewMarkdown,
              'math',
              c.name,
              tIdx + 1
            );
            const compiled = compileStructuredLessonToMarkdown(cleanLesson);
            courseRepaired = true;
            moduleRepaired = true;
            topicRepaired = true;
            repaired = true;
            return {
              ...a,
              overviewMarkdown: compiled,
              workedExamplesMarkdown: '',
              structuredLesson: cleanLesson,
              sourceReference: cleanLesson.sourceReference || a.sourceReference,
            };
          }
          return a;
        });
        return topicRepaired ? { ...t, artifacts } : t;
      });
      return moduleRepaired ? { ...m, blueRoadmap: { ...m.blueRoadmap, topics } } : m;
    });
    return courseRepaired ? { ...c, modules } : c;
  });

  return { courses: cleaned, repaired };
}

export default function App() {
  // Start with clean empty state when user starts using the system (or restored & auto-healed from localStorage)
  const [courses, setCourses] = useState<StudyDirectoryCourse[]>(() => {
    try {
      const saved = localStorage.getItem('microdo_courses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If the cached course is the dummy sample course, clean it for a production-ready workspace
          if (parsed[0]?.id === 'cs-systems') {
            localStorage.removeItem('microdo_courses');
            return [EMPTY_STUDY_COURSE];
          }

          // Auto-heal any raw/corrupted lesson text from prior extractions
          const { courses: healedCourses, repaired } = sanitizeExistingCourses(parsed);
          if (repaired) {
            try {
              localStorage.setItem('microdo_courses', JSON.stringify(healedCourses));
            } catch {
              // Safe fallback
            }
          }
          return healedCourses;
        }
      }
    } catch {
      // Fallback
    }
    return [EMPTY_STUDY_COURSE];
  });

  const [currentCourseId] = useState<string>('course-new');

  // Currently active course
  const currentCourse = courses[0] || EMPTY_STUDY_COURSE;

  // Progressive reveal state:
  // Step 1: Selected Module (null = grid mode directory)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Step 2: Selected Blue topic (null = green pane hidden)
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

  // Step 3: Inspected green artifact modal
  const [inspectedArtifact, setInspectedArtifact] = useState<StudyArtifact | null>(null);

  // Completed Artifacts Progress State (persisted to localStorage)
  const [completedArtifactIds, setCompletedArtifactIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('microdo_completed_artifacts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Current Screen View: 'dashboard' (Learner Home) or 'workspace' (3-Card Progressive Rails)
  const [currentView, setCurrentView] = useState<'dashboard' | 'workspace'>('workspace');

  // Continue Learning Position (persisted for multi-session resumption)
  const [lastPosition, setLastPosition] = useState<ContinueLearningPosition | null>(() => {
    try {
      const saved = localStorage.getItem('microdo_continue_position');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const updateContinuePosition = (
    moduleId: string,
    topicId: string,
    artifactId?: string
  ) => {
    const mod = currentCourse.modules.find((m) => m.id === moduleId);
    const top = mod?.blueRoadmap.topics.find((t) => t.id === topicId);
    if (!mod || !top) return;

    const completedInMod = mod.blueRoadmap.topics
      .flatMap((t) => t.artifacts)
      .filter((a) => completedArtifactIds.includes(a.id)).length;
    const totalInMod = mod.blueRoadmap.topics.flatMap((t) => t.artifacts).length;
    const progressPercent = totalInMod > 0 ? Math.round((completedInMod / totalInMod) * 100) : 0;

    const pos: ContinueLearningPosition = {
      courseId: currentCourse.id,
      courseName: currentCourse.name,
      moduleId: mod.id,
      moduleTitle: mod.title,
      topicId: top.id,
      topicName: top.topicName,
      artifactId,
      lastStudiedAt: new Date().toISOString(),
      progressPercent,
    };
    setLastPosition(pos);
    try {
      localStorage.setItem('microdo_continue_position', JSON.stringify(pos));
    } catch {
      // Safe fallback
    }
  };

  const handleToggleArtifactCompleted = (artifactId: string) => {
    setCompletedArtifactIds((prev) => {
      const isNowCompleted = !prev.includes(artifactId);
      const next = isNowCompleted
        ? [...prev, artifactId]
        : prev.filter((id) => id !== artifactId);
      try {
        localStorage.setItem('microdo_completed_artifacts', JSON.stringify(next));
      } catch {
        // Safe localStorage write fallback
      }

      if (isNowCompleted) {
        recordAnalyticsEvent('lesson_completed', {
          courseId: currentCourse.id,
          moduleId: selectedModuleId || undefined,
          topicId: activeTopicId || undefined,
          metadata: { artifactId },
        });
      }
      return next;
    });
  };

  // Modals, Drawers & Auth State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSuperuserOpen, setIsSuperuserOpen] = useState(false);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [focusArtifact, setFocusArtifact] = useState<StudyArtifact | null>(null);
  const [masteryRevisionKey, setMasteryRevisionKey] = useState(0);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentUser, setCurrentUser] = useState<ScholarUser | null>(() => getStoredUser());
  const [mobileActiveTab, setMobileActiveTab] = useState<'modules' | 'roadmap' | 'notes'>('roadmap');
  const [isRegeneratingLesson, setIsRegeneratingLesson] = useState(false);

  // Offline network status tracking & queue synchronization
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [offlinePendingCount, setOfflinePendingCount] = useState<number>(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      processOfflineQueue();
      setOfflinePendingCount(getOfflineQueue().length);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setOfflinePendingCount(getOfflineQueue().length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setOfflinePendingCount(getOfflineQueue().length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Validate Firestore connection on app boot
    validateFirestoreConnection().catch((err) => {
      console.warn('Firestore initial boot check:', err);
    });

    // Listen to real Firebase auth changes across sessions
    const unsubscribe = onScholarAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
        saveStoredUser(user);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (user: ScholarUser | null) => {
    setCurrentUser(user);
    saveStoredUser(user);
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Active module object
  const activeModuleNode = selectedModuleId
    ? currentCourse.modules.find((m) => m.id === selectedModuleId) || null
    : null;

  // Active topic object
  const activeTopic = activeModuleNode && activeTopicId
    ? activeModuleNode.blueRoadmap.topics.find((t) => t.id === activeTopicId) || null
    : null;


  // Reset to Clean Empty State
  const handleClearToEmptyState = () => {
    setCourses([EMPTY_STUDY_COURSE]);
    setSelectedModuleId(null);
    setActiveTopicId(null);
    setCompletedArtifactIds([]);
    try {
      localStorage.setItem('microdo_courses', JSON.stringify([EMPTY_STUDY_COURSE]));
      localStorage.removeItem('microdo_completed_artifacts');
    } catch {
      // Safe fallback
    }

    try {
      fetch('/api/unload-module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: 'all', title: 'All Modules' }),
      });
    } catch {
      // Safe fallback
    }

    setUnloadToast({
      message: 'Workspace Cleared',
      sub: 'All modules unloaded and server memory purged.',
    });
    setTimeout(() => {
      setUnloadToast((curr) => (curr?.message === 'Workspace Cleared' ? null : curr));
    }, 4000);
  };

  // Handle clicking a module
  const handleSelectModule = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setActiveTopicId(null); // Reset topic when switching module; green pane will only reveal on topic click
    setMobileActiveTab('roadmap');
  };

  // Handle clicking a blue topic
  const handleSelectTopic = (topicId: string, artId?: string) => {
    setActiveTopicId(topicId);
    setMobileActiveTab('notes');
    if (selectedModuleId) {
      updateContinuePosition(selectedModuleId, topicId, artId);
    }
    recordAnalyticsEvent('lesson_started', {
      courseId: currentCourse.id,
      moduleId: selectedModuleId || undefined,
      topicId,
    });
  };

  // Handle modules created via Upload (supports single modules or 300-chapter books)
  const handleModuleCreated = (newModule: StudyModuleNode) => {
    handleModulesCreated([newModule], undefined, false);
  };

  const handleModulesCreated = (
    newModules: StudyModuleNode[],
    bookTitle?: string,
    isMultiChapterBook?: boolean
  ) => {
    let updatedCourses: StudyDirectoryCourse[];

    if (isMultiChapterBook && newModules.length > 1) {
      // Create a dedicated course/textbook containing all chapters (e.g. 300 chapters)
      const newBookCourse: StudyDirectoryCourse = {
        id: `book-${Date.now()}`,
        name: bookTitle || `${newModules.length}-Chapter Master Curriculum`,
        discipline: 'Academic Textbook',
        quote: 'COMPREHENSIVE CHAPTER BREAKDOWN',
        subquote: `${newModules.length} chapters mapped directly from source book`,
        modules: newModules,
      };
      updatedCourses = [newBookCourse, ...courses.filter((c) => c.modules.length > 0)];
    } else {
      updatedCourses = courses.map((c, idx) => {
        if (idx === 0 || c.id === currentCourse.id) {
          return {
            ...c,
            name: bookTitle && c.modules.length === 0 ? bookTitle : c.name,
            modules: [...newModules, ...c.modules],
          };
        }
        return c;
      });
    }

    setCourses(updatedCourses);
    // Auto-select first chapter to immediately enter Rail Mode showing all chapters in the rail
    if (newModules.length > 0) {
      setSelectedModuleId(newModules[0].id);
      if (newModules[0].blueRoadmap.topics.length > 0) {
        setActiveTopicId(newModules[0].blueRoadmap.topics[0].id);
      } else {
        setActiveTopicId(null);
      }
    } else {
      setSelectedModuleId(null);
      setActiveTopicId(null);
    }
    try {
      localStorage.setItem('microdo_courses', JSON.stringify(updatedCourses));
    } catch {
      // Safe fallback
    }

    // Record upload metrics & audit logging for Owner Backend
    recordModuleUploadStat(newModules.length, newModules.length, true);
    recordAuditLog(
      'MODULE_UPLOADED',
      'module',
      `Ingested ${newModules.length} module(s) (${bookTitle || 'Course Material'}) into workspace`,
      currentUser ? { name: currentUser.fullName, email: currentUser.email, role: currentUser.role } : undefined,
      'success'
    );

    setUnloadToast({
      message:
        isMultiChapterBook && newModules.length > 1
          ? `Loaded ${newModules.length} Chapters!`
          : `Added Module "${newModules[0]?.title.slice(0, 24)}..."`,
      sub: `${bookTitle || 'Course material'} synthesized into workspace.`,
    });
    setTimeout(() => {
      setUnloadToast((curr) =>
        curr?.message?.includes('Loaded') || curr?.message?.includes('Added Module')
          ? null
          : curr
      );
    }, 4500);
  };

  // Unload module state & server document purge handler
  const [moduleToUnload, setModuleToUnload] = useState<StudyModuleNode | null>(null);
  const [isUnloading, setIsUnloading] = useState(false);
  const [unloadToast, setUnloadToast] = useState<{ message: string; sub?: string } | null>(null);

  const handleConfirmUnloadModule = async (mod: StudyModuleNode) => {
    setIsUnloading(true);
    const modTitle = mod.title;
    const modId = mod.id;

    // Collect all artifact ids from this module to purge progress
    const modArtifactIds = mod.blueRoadmap.topics.flatMap((t) => t.artifacts.map((a) => a.id));

    // 1. Remove from courses state
    const updatedCourses = courses.map((c, idx) => {
      if (idx === 0 || c.id === currentCourse.id) {
        return {
          ...c,
          modules: c.modules.filter((m) => m.id !== modId),
        };
      }
      return c;
    });

    setCourses(updatedCourses);

    // 2. Clean up artifact completion progress
    const updatedCompletedIds = completedArtifactIds.filter(
      (id) => !modArtifactIds.includes(id)
    );
    setCompletedArtifactIds(updatedCompletedIds);

    // 3. Reset selection if the unloaded module was active
    if (selectedModuleId === modId) {
      setSelectedModuleId(null);
      setActiveTopicId(null);
      setInspectedArtifact(null);
    }

    // 4. Update localStorage
    try {
      localStorage.setItem('microdo_courses', JSON.stringify(updatedCourses));
      localStorage.setItem(
        'microdo_completed_artifacts',
        JSON.stringify(updatedCompletedIds)
      );
    } catch {
      // Safe fallback
    }

    // 5. Notify server API to purge document buffers and free memory
    try {
      await fetch('/api/unload-module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: modId, title: modTitle }),
      });
    } catch (err) {
      console.warn('Notice: Server unload API call completed with local purge:', err);
    }

    setIsUnloading(false);
    setModuleToUnload(null);
    setUnloadToast({
      message: `Unloaded "${modTitle}"`,
      sub: 'Document parsed data purged & server memory freed.',
    });

    setTimeout(() => {
      setUnloadToast((curr) => (curr?.message === `Unloaded "${modTitle}"` ? null : curr));
    }, 4500);
  };

  // Re-distill and regenerate structured lesson for selected topic artifact
  const handleRegenerateLesson = async (artifactId: string) => {
    setIsRegeneratingLesson(true);
    try {
      let targetCourseName = currentCourse.name;
      let targetTopicName = 'Key Concepts';
      let targetSourceText = '';
      let targetTopicIndex = 1;

      for (const course of courses) {
        for (const mod of course.modules) {
          for (let tIdx = 0; tIdx < mod.blueRoadmap.topics.length; tIdx++) {
            const top = mod.blueRoadmap.topics[tIdx];
            const art = top.artifacts.find((a) => a.id === artifactId);
            if (art) {
              targetCourseName = course.name;
              targetTopicName = top.topicName;
              targetSourceText = art.overviewMarkdown || '';
              targetTopicIndex = tIdx + 1;
              break;
            }
          }
        }
      }

      // Re-distill into clean structured lesson without raw textbook noise
      const newLesson = distillTopicIntoStructuredLesson(
        targetTopicName,
        targetSourceText,
        'math',
        targetCourseName,
        targetTopicIndex
      );
      const compiledMarkdown = compileStructuredLessonToMarkdown(newLesson);

      // Update course topics in state
      const updatedCourses = courses.map((course) => ({
        ...course,
        modules: course.modules.map((mod) => ({
          ...mod,
          blueRoadmap: {
            ...mod.blueRoadmap,
            topics: mod.blueRoadmap.topics.map((top) => ({
              ...top,
              artifacts: top.artifacts.map((art) => {
                if (art.id === artifactId) {
                  const updated: StudyArtifact = {
                    ...art,
                    overviewMarkdown: compiledMarkdown,
                    workedExamplesMarkdown: '',
                    structuredLesson: newLesson,
                    sourceReference: newLesson.sourceReference || art.sourceReference,
                  };
                  return updated;
                }
                return art;
              }),
            })),
          },
        })),
      }));

      setCourses(updatedCourses);

      // Update currently inspected artifact
      if (inspectedArtifact && inspectedArtifact.id === artifactId) {
        setInspectedArtifact({
          ...inspectedArtifact,
          overviewMarkdown: compiledMarkdown,
          workedExamplesMarkdown: '',
          structuredLesson: newLesson,
          sourceReference: newLesson.sourceReference || inspectedArtifact.sourceReference,
        });
      }

      try {
        localStorage.setItem('microdo_courses', JSON.stringify(updatedCourses));
      } catch {
        // Safe fallback
      }

      setUnloadToast({
        message: 'Lesson Regenerated',
        sub: 'Cleaned definitions, KaTeX formulas, and key takeaways without raw text noise.',
      });
      setTimeout(() => {
        setUnloadToast((curr) => (curr?.message === 'Lesson Regenerated' ? null : curr));
      }, 4000);
    } finally {
      setIsRegeneratingLesson(false);
    }
  };

  // Reset Flow / Return to initial module directory
  const handleResetFlow = () => {
    setSelectedModuleId(null);
    setActiveTopicId(null);
    setSearchQuery('');
  };

  // Filter modules
  const filteredModules = currentCourse.modules.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.prefix.toLowerCase().includes(q) ||
      m.courseCode.toLowerCase().includes(q) ||
      m.summary.toLowerCase().includes(q)
    );
  });

  // Calculate total artifacts and completed artifacts ratio across all modules
  const allCourseArtifacts = currentCourse.modules.flatMap((m) =>
    m.blueRoadmap.topics.flatMap((t) => t.artifacts)
  );
  const totalArtifactsCount = allCourseArtifacts.length;
  const completedArtifactsCount = allCourseArtifacts.filter((a) =>
    completedArtifactIds.includes(a.id)
  ).length;

  return (
    <div className="min-h-screen bg-[#f6f8fa] text-slate-800 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1. Header */}
      <Header
        courseName={currentCourse.name}
        totalArtifactsCount={totalArtifactsCount}
        completedArtifactsCount={completedArtifactsCount}
        modules={currentCourse.modules}
        completedArtifactIds={completedArtifactIds}
        onSelectModule={handleSelectModule}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onResetFlow={handleResetFlow}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onOpenSuperuser={() => setIsSuperuserOpen(true)}
        currentView={currentView}
        onViewChange={(v) => setCurrentView(v)}
        onOpenStudyGoals={() => setIsGoalsModalOpen(true)}
        isOffline={isOffline}
        offlinePendingCount={offlinePendingCount}
      />

      {/* 2. Secondary Bar: Dynamic Breadcrumb Path & Filters (Shown only in workspace view) */}
      {currentView === 'workspace' && (
        <div className="w-full border-b border-slate-200 bg-white/95 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-xs z-20 sticky top-[53px]">
          {/* Hierarchical Breadcrumb Navigation */}
          <BreadcrumbNav
            course={currentCourse}
            selectedModule={activeModuleNode}
            activeTopic={activeTopic}
            onSelectCourseRoot={handleResetFlow}
            onSelectModule={handleSelectModule}
            onSelectTopic={handleSelectTopic}
          />

          {/* Right side: Module filter and depth indicator */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter modules..."
                className="pl-8 pr-3 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white w-44 transition-all shadow-xs"
              />
            </div>

            <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
              {selectedModuleId ? (
                <span>
                  Workspace {activeTopic ? '· 3 levels active' : '· 2 levels active'}
                </span>
              ) : (
                <span>{filteredModules.length} modules</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Progressive Workspace or Learner Home Dashboard */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-x-auto min-h-[580px]">
        {currentView === 'dashboard' ? (
          <LearnerDashboard
            currentCourse={currentCourse}
            courses={courses}
            completedArtifactIds={completedArtifactIds}
            lastPosition={lastPosition}
            onResumeLearning={(pos) => {
              setCurrentView('workspace');
              setSelectedModuleId(pos.moduleId);
              setActiveTopicId(pos.topicId);
              if (pos.artifactId) {
                const mod = currentCourse.modules.find((m) => m.id === pos.moduleId);
                const top = mod?.blueRoadmap.topics.find((t) => t.id === pos.topicId);
                const art = top?.artifacts.find((a) => a.id === pos.artifactId);
                if (art) setInspectedArtifact(art);
              }
            }}
            onSelectTopic={(moduleId, topicId, artifactId) => {
              setCurrentView('workspace');
              setSelectedModuleId(moduleId);
              setActiveTopicId(topicId);
              if (artifactId) {
                const mod = currentCourse.modules.find((m) => m.id === moduleId);
                const top = mod?.blueRoadmap.topics.find((t) => t.id === topicId);
                const art = top?.artifacts.find((a) => a.id === artifactId);
                if (art) setInspectedArtifact(art);
              }
            }}
            onOpenGoalsModal={() => setIsGoalsModalOpen(true)}
            onSwitchToWorkspace={() => setCurrentView('workspace')}
          />
        ) : (
          <AnimatePresence mode="wait">
            {selectedModuleId === null ? (
              /* INITIAL SCREEN: ONLY show responsive module directory grid */
              <div key="grid-view" className="w-full flex-1 flex flex-col justify-start">
                <LeftCardsColumn
                  modules={filteredModules}
                  selectedModuleId={null}
                  onSelectModule={handleSelectModule}
                  isRailMode={false}
                  completedArtifactIds={completedArtifactIds}
                  onOpenUploadModal={() => setIsUploadModalOpen(true)}
                  onOpenFaq={() => setIsFaqOpen(true)}
                  hasAnyModules={currentCourse.modules.length > 0}
                  onClearSearch={() => setSearchQuery('')}
                  onRequestUnload={(mod) => setModuleToUnload(mod)}
                />
              </div>
            ) : (
              /* WORKSPACE MODE: Responsive across desktop, laptop, tablet, and mobile */
              <div key="workspace-view" className="w-full max-w-7xl mx-auto flex flex-col">
              {/* Responsive Level Switcher Tabs for Mobile Phones & Small Screens */}
              <div className="md:hidden flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl mb-4 border border-slate-300/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setMobileActiveTab('modules')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition-all text-center flex items-center justify-center gap-1 ${
                    mobileActiveTab === 'modules'
                      ? 'bg-white text-purple-800 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3 h-3 text-purple-600" />
                  <span>1. Rail</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileActiveTab('roadmap')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition-all text-center flex items-center justify-center gap-1 ${
                    mobileActiveTab === 'roadmap'
                      ? 'bg-white text-blue-800 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Bookmark className="w-3 h-3 text-blue-600" />
                  <span>2. Roadmap</span>
                </button>
                {activeTopic && (
                  <button
                    type="button"
                    onClick={() => setMobileActiveTab('notes')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition-all text-center flex items-center justify-center gap-1 ${
                      mobileActiveTab === 'notes'
                        ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <GraduationCap className="w-3 h-3 text-emerald-600" />
                    <span>3. Notes</span>
                  </button>
                )}
              </div>

              {/* Multi-Column Canvas: Side-by-side on tablet/laptop/desktop; tabbed/fluid on mobile */}
              <motion.div
                ref={workspaceRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative flex flex-col md:flex-row gap-5 lg:gap-6 w-full overflow-x-auto pb-6 items-start"
              >
                {/* Progressive Node Connector Lines (rendered on tablets/desktops) */}
                <div className="hidden md:block">
                  <ConnectorLines
                    containerRef={workspaceRef}
                    selectedModuleId={selectedModuleId}
                    activeTopicId={activeTopicId}
                    greenArtifactIds={activeTopic ? activeTopic.artifacts.map((a) => a.id) : []}
                    isBluePopped={Boolean(selectedModuleId)}
                    isGreenPopped={Boolean(activeTopic)}
                  />
                </div>

                {/* Column 1: Left Modules Rail */}
                <div className={`w-full md:w-auto ${mobileActiveTab === 'modules' ? 'block' : 'hidden'} md:block shrink-0`}>
                  <LeftCardsColumn
                    modules={filteredModules}
                    selectedModuleId={selectedModuleId}
                    onSelectModule={handleSelectModule}
                    isRailMode={true}
                    completedArtifactIds={completedArtifactIds}
                    onRequestUnload={(mod) => setModuleToUnload(mod)}
                  />
                </div>

                {/* Column 2: Center Blue Key Topics Roadmap */}
                <div className={`w-full md:w-auto ${mobileActiveTab === 'roadmap' ? 'block' : 'hidden'} md:block shrink-0`}>
                  <CenterBlueCard
                    moduleNode={activeModuleNode}
                    activeTopicId={activeTopicId}
                    completedArtifactIds={completedArtifactIds}
                    onSelectTopic={handleSelectTopic}
                    onRequestUnload={(mod) => setModuleToUnload(mod)}
                  />
                </div>

                {/* Column 3: Right Green Study Content Panel */}
                <AnimatePresence>
                  {activeTopic && (
                    <div className={`w-full md:w-auto ${mobileActiveTab === 'notes' ? 'block' : 'hidden'} md:block shrink-0`}>
                      <RightGreenCards
                        activeTopic={activeTopic}
                        completedArtifactIds={completedArtifactIds}
                        onToggleArtifactCompleted={handleToggleArtifactCompleted}
                        onOpenArtifactDetail={(artifact) => {
                          setInspectedArtifact(artifact);
                          if (selectedModuleId && activeTopicId) {
                            updateContinuePosition(selectedModuleId, activeTopicId, artifact.id);
                          }
                        }}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        )}
      </main>

      {/* 4. Footer with User Session & Auth Trigger */}
      <FooterBar
        currentUser={currentUser}
        onOpenFaq={() => setIsFaqOpen(true)}
        onClearToEmptyState={handleClearToEmptyState}
        hasModules={currentCourse.modules.length > 0}
        onOpenAuth={handleOpenAuth}
        onOpenSuperuser={() => setIsSuperuserOpen(true)}
      />

      {/* Superuser / Owner Backend Control Center */}
      <SuperuserDashboard
        isOpen={isSuperuserOpen}
        onClose={() => setIsSuperuserOpen(false)}
        currentUser={currentUser}
        onUserSwitched={handleLoginSuccess}
        courses={courses}
        onPurgeModule={(moduleId) => {
          const mod = courses.flatMap((c) => c.modules).find((m) => m.id === moduleId);
          if (mod) handleConfirmUnloadModule(mod);
        }}
      />

      {/* Quirky Scholar Authentication & Registration Overlay */}
      <AuthOverlay
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        initialMode={authMode}
      />

      {/* Study Inspector Modal */}
      <StudyInspectorModal
        artifact={inspectedArtifact}
        topicId={activeTopic?.id}
        courseId={currentCourse.id}
        moduleId={selectedModuleId || undefined}
        isCompleted={
          inspectedArtifact ? completedArtifactIds.includes(inspectedArtifact.id) : false
        }
        onToggleCompleted={handleToggleArtifactCompleted}
        onClose={() => setInspectedArtifact(null)}
        onOpenFocusMode={(art) => {
          setFocusArtifact(art);
          setIsFocusModeOpen(true);
        }}
        onMasteryUpdated={() => setMasteryRevisionKey((k) => k + 1)}
        onRegenerateLesson={handleRegenerateLesson}
        isRegenerating={isRegeneratingLesson}
      />

      {/* Focus Mode Distraction-Free Study Modal */}
      <FocusModeModal
        isOpen={isFocusModeOpen}
        onClose={() => setIsFocusModeOpen(false)}
        artifact={focusArtifact || inspectedArtifact}
        topic={activeTopic}
        courseTitle={currentCourse.name}
        isCompleted={
          (focusArtifact || inspectedArtifact)
            ? completedArtifactIds.includes((focusArtifact || inspectedArtifact)!.id)
            : false
        }
        onToggleCompleted={handleToggleArtifactCompleted}
        onMasteryUpdated={() => setMasteryRevisionKey((k) => k + 1)}
        hasPrevious={
          activeTopic && (focusArtifact || inspectedArtifact)
            ? activeTopic.artifacts.findIndex((a) => a.id === (focusArtifact || inspectedArtifact)!.id) > 0
            : false
        }
        hasNext={
          activeTopic && (focusArtifact || inspectedArtifact)
            ? activeTopic.artifacts.findIndex((a) => a.id === (focusArtifact || inspectedArtifact)!.id) < activeTopic.artifacts.length - 1
            : false
        }
        onPreviousArtifact={() => {
          if (!activeTopic || !(focusArtifact || inspectedArtifact)) return;
          const idx = activeTopic.artifacts.findIndex((a) => a.id === (focusArtifact || inspectedArtifact)!.id);
          if (idx > 0) setFocusArtifact(activeTopic.artifacts[idx - 1]);
        }}
        onNextArtifact={() => {
          if (!activeTopic || !(focusArtifact || inspectedArtifact)) return;
          const idx = activeTopic.artifacts.findIndex((a) => a.id === (focusArtifact || inspectedArtifact)!.id);
          if (idx < activeTopic.artifacts.length - 1) setFocusArtifact(activeTopic.artifacts[idx + 1]);
        }}
      />

      {/* Study Goals & Spaced Repetition Reminders Modal */}
      <StudyGoalsModal
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
        course={currentCourse}
        onSelectRevision={(moduleId, topicId) => {
          setIsGoalsModalOpen(false);
          setCurrentView('workspace');
          setSelectedModuleId(moduleId);
          setActiveTopicId(topicId);
          updateContinuePosition(moduleId, topicId);
        }}
      />

      {/* Upload Module Modal */}
      <UploadModuleModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onModuleCreated={handleModuleCreated}
        onModulesCreated={handleModulesCreated}
      />

      {/* FAQ & How It Works Modal */}
      <FaqModal
        isOpen={isFaqOpen}
        onClose={() => setIsFaqOpen(false)}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
      />

      {/* Module Unload & Document Purge Confirmation Modal */}
      <UnloadConfirmModal
        moduleToUnload={moduleToUnload}
        isOpen={Boolean(moduleToUnload)}
        onClose={() => setModuleToUnload(null)}
        onConfirmUnload={handleConfirmUnloadModule}
        isUnloading={isUnloading}
      />

      {/* Realtime Unload & Storage Purge Toast Banner */}
      <AnimatePresence>
        {unloadToast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-10 right-6 z-50 bg-slate-900 text-white rounded-xl px-4 py-3 shadow-2xl border border-slate-700/70 flex items-center gap-3 max-w-sm sm:max-w-md pointer-events-auto"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate font-sans">
                {unloadToast.message}
              </p>
              {unloadToast.sub && (
                <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                  {unloadToast.sub}
                </p>
              )}
            </div>
            <button
              onClick={() => setUnloadToast(null)}
              className="p-1 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
