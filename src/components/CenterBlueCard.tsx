import React from 'react';
import { motion } from 'motion/react';
import { StudyModuleNode } from '../types';
import { ChevronRight, Bookmark } from 'lucide-react';

interface CenterBlueCardProps {
  moduleNode: StudyModuleNode | null;
  activeTopicId: string | null;
  completedArtifactIds?: string[];
  onSelectTopic: (topicId: string) => void;
}

export const CenterBlueCard: React.FC<CenterBlueCardProps> = ({
  moduleNode,
  activeTopicId,
  completedArtifactIds = [],
  onSelectTopic,
}) => {
  // If no module is selected, do not render anything
  if (!moduleNode) {
    return null;
  }

  const roadmap = moduleNode.blueRoadmap;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="w-full sm:w-[320px] lg:w-[360px] shrink-0 flex flex-col gap-3"
    >
      {/* Roadmap Panel Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-blue-700">
          <Bookmark className="w-3.5 h-3.5" />
          <span>KEY TOPICS ROADMAP</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {roadmap.topics.length} topics
        </span>
      </div>

      {/* Main Roadmap Container */}
      <div id="center-blue-card" className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col gap-3">
        {/* Module Context */}
        <div className="border-b border-slate-100 pb-3">
          <div className="text-[11px] font-mono font-medium text-blue-600 mb-0.5 truncate">
            {moduleNode.prefix} · {moduleNode.courseCode}
          </div>
          <h2 className="text-sm font-bold text-slate-900 leading-snug">
            {roadmap.heading || 'Key Topics Roadmap'}
          </h2>
          {roadmap.description && (
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {roadmap.description}
            </p>
          )}
        </div>

        {/* Topics List */}
        <div className="flex flex-col gap-2">
          {roadmap.topics.map((topic) => {
            const isTopicActive = activeTopicId === topic.id;
            const topicCompletedCount = topic.artifacts.filter((a) =>
              completedArtifactIds.includes(a.id)
            ).length;
            const isAllCompleted =
              topic.artifacts.length > 0 && topicCompletedCount === topic.artifacts.length;

            return (
              <button
                key={topic.id}
                id={`blue-topic-${topic.id}`}
                onClick={() => onSelectTopic(topic.id)}
                className={`w-full text-left rounded-lg p-3 transition-all cursor-pointer border ${
                  isTopicActive
                    ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-400 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className={`text-xs font-semibold leading-snug ${
                      isTopicActive ? 'text-blue-900' : 'text-slate-800'
                    }`}
                  >
                    {topic.topicName}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    {topicCompletedCount > 0 && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${
                          isAllCompleted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                        title={`${topicCompletedCount} of ${topic.artifacts.length} artifacts completed`}
                      >
                        {topicCompletedCount}/{topic.artifacts.length}
                      </span>
                    )}
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isTopicActive
                          ? 'text-blue-600 translate-x-0.5'
                          : 'text-slate-400'
                      }`}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  {topic.objective}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
