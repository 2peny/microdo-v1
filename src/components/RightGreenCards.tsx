import React from 'react';
import { motion } from 'motion/react';
import { StudyArtifact, StudyTopic } from '../types';

interface RightGreenCardsProps {
  activeTopic: StudyTopic | null;
  completedArtifactIds?: string[];
  onToggleArtifactCompleted?: (artifactId: string) => void;
  onOpenArtifactDetail: (artifact: StudyArtifact) => void;
}

export const RightGreenCards: React.FC<RightGreenCardsProps> = ({
  activeTopic,
  onOpenArtifactDetail,
}) => {
  // Must not render anything while activeTopic === null
  if (!activeTopic) {
    return null;
  }

  const artifacts = activeTopic.artifacts;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="w-full sm:w-[320px] lg:w-[360px] shrink-0 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="text-sm font-semibold text-slate-800">
          <span>Study notes</span>
        </div>
        <span className="text-xs text-slate-500">
          {artifacts.length} study modules
        </span>
      </div>

      {/* Cards List: Clean cards without raw filenames or mark as done */}
      <div className="flex flex-col gap-3">
        {artifacts.map((artifact) => {
          return (
            <div
              key={artifact.id}
              id={`green-artifact-${artifact.id}`}
              onClick={() => onOpenArtifactDetail(artifact)}
              className="group rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-slate-50/50 p-4 transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm text-left flex flex-col justify-between"
            >
              <div>
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-slate-500">
                    {artifact.type === 'overview'
                      ? 'Key concepts'
                      : artifact.type === 'examples'
                      ? 'Practical example'
                      : 'Self-check'}
                  </span>

                  <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                    <span>Open</span>
                  </span>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-950 transition-colors leading-snug">
                  {artifact.title}
                </h3>

                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                  {artifact.tagline}
                </p>
              </div>

              <div className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="text-slate-500">
                  {artifact.type === 'overview'
                    ? 'Lesson notes'
                    : artifact.type === 'examples'
                    ? 'Worked solution'
                    : 'Practice questions'}
                </span>
                <span className="text-slate-500">{artifact.type === 'quiz' ? 'Practice' : 'Read'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
