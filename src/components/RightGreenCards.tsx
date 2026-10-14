import React from 'react';
import { motion } from 'motion/react';
import { StudyArtifact, StudyTopic } from '../types';
import { FileText, Calculator, HelpCircle, ArrowUpRight, GraduationCap } from 'lucide-react';

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
        <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-800">
          <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
          <span>STUDY NOTES</span>
        </div>
        <span className="text-[11px] font-mono font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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
                <div className="flex items-center justify-between mb-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                      artifact.type === 'overview'
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : artifact.type === 'examples'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    {artifact.type === 'overview' && <FileText className="w-3 h-3" />}
                    {artifact.type === 'examples' && <Calculator className="w-3 h-3" />}
                    {artifact.type === 'quiz' && <HelpCircle className="w-3 h-3" />}
                    <span>
                      {artifact.type === 'overview'
                        ? 'Core Overview'
                        : artifact.type === 'examples'
                        ? 'Worked Example'
                        : 'Practice Quiz'}
                    </span>
                  </span>

                  <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700 group-hover:text-emerald-800 transition-colors">
                    <span>Open</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
                    ? 'Interactive Notes'
                    : artifact.type === 'examples'
                    ? 'Step-by-step Math'
                    : 'Multiple Choice Challenge'}
                </span>
                <span className="text-emerald-600 font-semibold group-hover:underline">
                  {artifact.type === 'quiz' ? 'Take Quiz →' : 'Read Notes →'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
