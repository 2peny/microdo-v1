import React, { useState, useRef } from 'react';
import { EMPTY_STUDY_COURSE, INITIAL_STUDY_COURSES } from './data/initialStudyCourses';
import { StudyDirectoryCourse, StudyModuleNode, StudyArtifact, ScholarUser } from './types';
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
import { getStoredUser, saveStoredUser } from './utils/authStorage';
import { Search, CheckCircle2, X, Sparkles, BookOpen, Bookmark, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Start with clean empty state when user starts using the system (or restored from localStorage)
  const [courses, setCourses] = useState<StudyDirectoryCourse[]>(() => {
    try {
      const saved = localStorage.getItem('microdo_courses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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

  const handleToggleArtifactCompleted = (artifactId: string) => {
    setCompletedArtifactIds((prev) => {
      const next = prev.includes(artifactId)
        ? prev.filter((id) => id !== artifactId)
        : [...prev, artifactId];
      try {
        localStorage.setItem('microdo_completed_artifacts', JSON.stringify(next));
      } catch {
        // Safe localStorage write fallback
      }
      return next;
    });
  };

  // Modals, Drawers & Auth State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentUser, setCurrentUser] = useState<ScholarUser | null>(() => getStoredUser());
  const [mobileActiveTab, setMobileActiveTab] = useState<'modules' | 'roadmap' | 'notes'>('roadmap');

  const handleLoginSuccess = (user: ScholarUser) => {
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

  // Load Sample Course (Computer Systems)
  const handleLoadSampleCourse = () => {
    setCourses(INITIAL_STUDY_COURSES);
    setSelectedModuleId(null);
    setActiveTopicId(null);
    try {
      localStorage.setItem('microdo_courses', JSON.stringify(INITIAL_STUDY_COURSES));
    } catch {
      // Safe fallback
    }
  };

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
  const handleSelectTopic = (topicId: string) => {
    setActiveTopicId(topicId);
    setMobileActiveTab('notes');
  };

  // Handle module created via Upload
  const handleModuleCreated = (newModule: StudyModuleNode) => {
    const updatedCourses = courses.map((c, idx) => {
      if (idx === 0 || c.id === currentCourse.id) {
        return {
          ...c,
          modules: [newModule, ...c.modules],
        };
      }
      return c;
    });

    setCourses(updatedCourses);
    setSelectedModuleId(null);
    setActiveTopicId(null);
    try {
      localStorage.setItem('microdo_courses', JSON.stringify(updatedCourses));
    } catch {
      // Safe fallback
    }
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
      />

      {/* 2. Secondary Bar: Dynamic Breadcrumb Path & Filters */}
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

      {/* 3. Main Progressive Workspace */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-x-auto min-h-[580px]">
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
                onLoadSampleCourse={handleLoadSampleCourse}
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
                        onOpenArtifactDetail={(artifact) => setInspectedArtifact(artifact)}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* 4. Footer with User Session & Auth Trigger */}
      <FooterBar
        currentUser={currentUser}
        onOpenFaq={() => setIsFaqOpen(true)}
        onClearToEmptyState={handleClearToEmptyState}
        hasModules={currentCourse.modules.length > 0}
        onOpenAuth={handleOpenAuth}
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
        isCompleted={
          inspectedArtifact ? completedArtifactIds.includes(inspectedArtifact.id) : false
        }
        onToggleCompleted={handleToggleArtifactCompleted}
        onClose={() => setInspectedArtifact(null)}
      />

      {/* Upload Module Modal */}
      <UploadModuleModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onModuleCreated={handleModuleCreated}
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
