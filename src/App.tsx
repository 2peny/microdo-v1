import React, { useState, useRef } from 'react';
import { EMPTY_STUDY_COURSE, INITIAL_STUDY_COURSES } from './data/initialStudyCourses';
import { StudyDirectoryCourse, StudyModuleNode, StudyArtifact } from './types';
import { Header } from './components/Header';
import { LeftCardsColumn } from './components/LeftCardsColumn';
import { CenterBlueCard } from './components/CenterBlueCard';
import { RightGreenCards } from './components/RightGreenCards';
import { ConnectorLines } from './components/ConnectorLines';
import { BreadcrumbNav } from './components/BreadcrumbNav';
import { StudyInspectorModal } from './components/StudyInspectorModal';
import { UploadModuleModal } from './components/UploadModuleModal';
import { FaqModal } from './components/FaqModal';
import { FooterBar } from './components/FooterBar';
import { Search } from 'lucide-react';
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

  // Modals & Drawers
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
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
  };

  // Handle clicking a module
  const handleSelectModule = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setActiveTopicId(null); // Reset topic when switching module; green pane will only reveal on topic click
  };

  // Handle clicking a blue topic
  const handleSelectTopic = (topicId: string) => {
    setActiveTopicId(topicId);
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
      />

      {/* 2. Secondary Bar: Dynamic Breadcrumb Path & Filters */}
      <div className="w-full border-b border-slate-200 bg-white/95 px-6 py-2 flex flex-wrap items-center justify-between gap-4 text-xs font-mono shadow-xs z-20 sticky top-[53px]">
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
      <main className="flex-1 flex flex-col p-6 lg:p-8 overflow-x-auto min-h-[580px]">
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
              />
            </div>
          ) : (
            /* WORKSPACE MODE: Narrow left rail | Blue Roadmap | Green Study Content */
            <motion.div
              ref={workspaceRef}
              key="workspace-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative flex flex-row gap-6 w-full max-w-7xl mx-auto overflow-x-auto pb-6 items-start"
            >
              {/* Progressive Node Connector Lines */}
              <ConnectorLines
                containerRef={workspaceRef}
                selectedModuleId={selectedModuleId}
                activeTopicId={activeTopicId}
                greenArtifactIds={activeTopic ? activeTopic.artifacts.map((a) => a.id) : []}
                isBluePopped={Boolean(selectedModuleId)}
                isGreenPopped={Boolean(activeTopic)}
              />

              {/* Column 1: Left Modules Rail */}
              <LeftCardsColumn
                modules={filteredModules}
                selectedModuleId={selectedModuleId}
                onSelectModule={handleSelectModule}
                isRailMode={true}
                completedArtifactIds={completedArtifactIds}
              />

              {/* Column 2: Center Blue Key Topics Roadmap */}
              <CenterBlueCard
                moduleNode={activeModuleNode}
                activeTopicId={activeTopicId}
                completedArtifactIds={completedArtifactIds}
                onSelectTopic={handleSelectTopic}
              />

              {/* Column 3: Right Green Study Content Panel (Only rendered when topic selected!) */}
              <AnimatePresence>
                {activeTopic && (
                  <RightGreenCards
                    activeTopic={activeTopic}
                    completedArtifactIds={completedArtifactIds}
                    onToggleArtifactCompleted={handleToggleArtifactCompleted}
                    onOpenArtifactDetail={(artifact) => setInspectedArtifact(artifact)}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 4. Footer */}
      <FooterBar
        currentUser="student@nodegrid.space"
        onOpenFaq={() => setIsFaqOpen(true)}
        onClearToEmptyState={handleClearToEmptyState}
        hasModules={currentCourse.modules.length > 0}
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
    </div>
  );
}
