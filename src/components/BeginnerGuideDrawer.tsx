import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, BookOpen } from 'lucide-react';

interface BeginnerGuideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModuleId: string | null;
  activeTopicId: string | null;
  isGreenPopped: boolean;
}

export const BeginnerGuideDrawer: React.FC<BeginnerGuideDrawerProps> = ({
  isOpen,
  onClose,
  selectedModuleId,
  activeTopicId,
  isGreenPopped,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const codeSnippet = `// 3-Tier Progressive Study Flow in MicroDo
import React, { useState } from 'react';

export function MicroDoApp({ modules }) {
  // Step 1: Which module is selected (null = responsive directory grid)
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  // Step 2: Which key topic is selected (null = study notes hidden)
  const [activeTopicId, setActiveTopicId] = useState(null);

  const activeModule = modules.find(m => m.id === selectedModuleId);
  const activeTopic = activeModule?.blueRoadmap?.topics.find(t => t.id === activeTopicId);

  return (
    <div className="workspace">
      {/* 1. Module Rail (or Grid if none selected) */}
      <ModuleColumn
        modules={modules}
        selectedId={selectedModuleId}
        onSelect={(id) => {
          setSelectedModuleId(id);
          setActiveTopicId(null); // Reset downstream topic
        }}
      />

      {/* 2. Key Topics Roadmap (Only visible when module selected) */}
      {activeModule && (
        <RoadmapColumn
          roadmap={activeModule.blueRoadmap}
          activeTopicId={activeTopicId}
          onSelectTopic={(topicId) => setActiveTopicId(topicId)}
        />
      )}

      {/* 3. Study Notes Panel (Only visible when topic selected) */}
      {activeTopic && (
        <StudyNotesColumn
          artifacts={activeTopic.artifacts}
        />
      )}
    </div>
  );
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="relative w-full max-w-xl h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col overflow-hidden text-slate-800"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-mono tracking-tight">
                  PROGRESSIVE STUDY DIRECTORY
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  How the 3-tier study reveal works
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200 shadow-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs leading-relaxed font-sans">
            {/* Live State Tracker */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono space-y-2">
              <span className="text-[11px] text-slate-900 font-bold block mb-1">
                CURRENT LIVE REACT STATE:
              </span>
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-purple-700 font-semibold">1. selectedModuleId:</span>
                <span className="text-slate-900 font-bold">
                  {selectedModuleId ? `"${selectedModuleId}"` : 'null (Showing directory grid)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-blue-700 font-semibold">2. activeTopicId:</span>
                <span className="text-slate-900 font-bold">
                  {activeTopicId ? `"${activeTopicId}"` : 'null (Awaiting topic selection)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-emerald-700 font-semibold">3. Study Notes Visible:</span>
                <span className="text-slate-900 font-bold">
                  {isGreenPopped ? 'Yes (3 items open)' : 'No (Hidden)'}
                </span>
              </div>
            </div>

            {/* Core Principle */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs font-bold text-slate-900 uppercase tracking-tight">
                The 3 Levels of Progressive Study
              </h4>

              <div className="space-y-2.5">
                <div className="p-3 rounded-lg bg-purple-50/70 border border-purple-200">
                  <div className="font-mono font-bold text-purple-900 mb-0.5">
                    Level 1 · Course Modules
                  </div>
                  <p className="text-slate-700">
                    Initially displayed as a clean 2-column directory grid. Clicking any module smoothly opens the workspace and condenses modules into an accessible left rail.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200">
                  <div className="font-mono font-bold text-blue-900 mb-0.5">
                    Level 2 · Key Topics Roadmap
                  </div>
                  <p className="text-slate-700">
                    Appears beside the module rail, showing the extracted core topics and clear learning objectives for the selected module.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
                  <div className="font-mono font-bold text-emerald-900 mb-0.5">
                    Level 3 · Study Notes & Artifacts
                  </div>
                  <p className="text-slate-700">
                    Only reveals after a topic is clicked. Displays Key Concept Overviews, Worked Examples, and Exam Practice Quizzes. Clicking any note opens the full study inspector.
                  </p>
                </div>
              </div>
            </div>

            {/* Architecture snippet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900">
                  REACT WORKSPACE ARCHITECTURE:
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] font-mono text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto font-mono text-[11px] text-slate-200 shadow-xs">
                <pre>{codeSnippet}</pre>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-mono border border-slate-200 cursor-pointer shadow-xs font-medium"
            >
              Close Guide
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
