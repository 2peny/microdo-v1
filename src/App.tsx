import React, { useState, useRef } from 'react';
import { INITIAL_STUDY_COURSES } from './data/initialStudyCourses';
import { StudyDirectoryCourse, StudyModuleNode, StudyArtifact } from './types';
import { Header } from './components/Header';
import { LeftCardsColumn } from './components/LeftCardsColumn';
import { CenterBlueCard } from './components/CenterBlueCard';
import { RightGreenCards } from './components/RightGreenCards';
import { ConnectorLines } from './components/ConnectorLines';
import { StudyInspectorModal } from './components/StudyInspectorModal';
import { UploadModuleModal } from './components/UploadModuleModal';
import { BeginnerGuideDrawer } from './components/BeginnerGuideDrawer';
import { FooterBar } from './components/FooterBar';
import { Search, Compass, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [courses, setCourses] = useState<StudyDirectoryCourse[]>(INITIAL_STUDY_COURSES);
  const [currentCourseId] = useState<string>('cs-systems');

  // Currently active course
  const currentCourse =
    courses.find((c) => c.id === currentCourseId) || courses[0];

  // Progressive reveal state:
  // Step 1: Selected Module (null = grid mode directory)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Step 2: Selected Blue topic (null = green pane hidden)
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

  // Step 3: Inspected green artifact modal
  const [inspectedArtifact, setInspectedArtifact] = useState<StudyArtifact | null>(null);

  // Modals & Drawers
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
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
  // Requirement 11: Add to current course and return user to module directory (do NOT force open subsequent panes)
  const handleModuleCreated = (newModule: StudyModuleNode) => {
    const updatedCourses = courses.map((c) => {
      if (c.id === currentCourseId) {
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

  return (
    <div className="min-h-screen bg-[#f6f8fa] text-slate-800 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1. Header */}
      <Header
        courseName={currentCourse.name}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onResetFlow={handleResetFlow}
      />

      {/* 2. Secondary Bar */}
      <div className="w-full border-b border-slate-200 bg-white/90 px-6 py-2 flex flex-wrap items-center justify-between gap-4 text-xs font-mono shadow-xs z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Compass className="w-4 h-4 text-purple-600" />
            <span className="text-slate-900 font-bold">{currentCourse.name}</span>
            <span>·</span>
            <span className="text-slate-500">{currentCourse.discipline}</span>
          </div>

          {selectedModuleId && (
            <button
              onClick={handleResetFlow}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-900 font-sans transition-colors cursor-pointer bg-slate-100 hover:bg-slate-200/70 px-2 py-0.5 rounded text-[11px]"
              title="Return to full module directory"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>All Modules</span>
            </button>
          )}

          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter modules..."
              className="pl-8 pr-3 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white w-48 transition-all shadow-xs"
            />
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          {selectedModuleId ? (
            <span>
              Workspace active {activeTopic ? '· 3 columns open' : '· 2 columns open'}
            </span>
          ) : (
            <span>{filteredModules.length} modules</span>
          )}
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
              />

              {/* Column 2: Center Blue Key Topics Roadmap */}
              <CenterBlueCard
                moduleNode={activeModuleNode}
                activeTopicId={activeTopicId}
                onSelectTopic={handleSelectTopic}
              />

              {/* Column 3: Right Green Study Content Panel (Only rendered when topic selected!) */}
              <AnimatePresence>
                {activeTopic && (
                  <RightGreenCards
                    activeTopic={activeTopic}
                    onOpenArtifactDetail={(artifact) => setInspectedArtifact(artifact)}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 4. Footer */}
      <FooterBar currentUser="student@nodegrid.space" />

      {/* Study Inspector Modal */}
      <StudyInspectorModal
        artifact={inspectedArtifact}
        onClose={() => setInspectedArtifact(null)}
      />

      {/* Upload Module Modal */}
      <UploadModuleModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onModuleCreated={handleModuleCreated}
      />

      {/* Beginner Guide Drawer */}
      <BeginnerGuideDrawer
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        selectedModuleId={selectedModuleId}
        activeTopicId={activeTopicId}
        isGreenPopped={Boolean(activeTopic)}
      />
    </div>
  );
}
