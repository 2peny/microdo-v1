import React from 'react';
import { motion } from 'motion/react';
import { StudyArtifact, StudyTopic } from '../types';
import { FileText, Code2, HelpCircle, ArrowUpRight, GraduationCap, Check } from 'lucide-react';

interface RightGreenCardsProps {
  activeTopic: StudyTopic | null;
  completedArtifactIds?: string[];
  onToggleArtifactCompleted?: (artifactId: string) => void;
  onOpenArtifactDetail: (artifact: StudyArtifact) => void;
}

export const RightGreenCards: React.FC<RightGreenCardsProps> = ({
  activeTopic,
  completedArtifactIds = [],
  onToggleArtifactCompleted,
  onOpenArtifactDetail,
}) => {
  // Must not render anything while activeTopic === null
  if (!activeTopic) {
    return null;
  }

  const artifacts = activeTopic.artifacts;
  const completedCount = artifacts.filter((a) => completedArtifactIds.includes(a.id)).length;
  const progressPercent =
    artifacts.length > 0 ? Math.round((completedCount / artifacts.length) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="w-full sm:w-[320px] lg:w-[360px] shrink-0 flex flex-col gap-3"
    >
      {/* Header with Progress Tracker */}
      <div className="flex flex-col gap-1.5 px-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-800">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
            <span>STUDY NOTES</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {completedCount} / {artifacts.length} done ({progressPercent}%)
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-200/80 rounded-full h-1 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Cards List */}
      <div className="flex flex-col gap-3">
        {artifacts.map((artifact) => {
          const isCompleted = completedArtifactIds.includes(artifact.id);

          return (
            <div
              key={artifact.id}
              id={`green-artifact-${artifact.id}`}
              onClick={() => onOpenArtifactDetail(artifact)}
              className={`group rounded-xl border p-4 transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm text-left flex flex-col justify-between ${
                isCompleted
                  ? 'bg-emerald-50/30 border-emerald-300 hover:border-emerald-500 ring-1 ring-emerald-200/50'
                  : 'bg-white border-slate-200 hover:border-emerald-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 truncate mr-2">
                    {artifact.type === 'overview' && <FileText className="w-3.5 h-3.5 shrink-0" />}
                    {artifact.type === 'examples' && <Code2 className="w-3.5 h-3.5 shrink-0" />}
                    {artifact.type === 'quiz' && <HelpCircle className="w-3.5 h-3.5 shrink-0" />}
                    <span className="font-mono text-[11px] text-slate-500 truncate">{artifact.path}</span>
                  </div>

                  {/* Completion Checkbox / Toggle Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleArtifactCompleted?.(artifact.id);
                    }}
                    className={`shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono transition-all cursor-pointer border ${
                      isCompleted
                        ? 'bg-emerald-100/90 text-emerald-800 border-emerald-300 font-semibold'
                        : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-300'
                    }`}
                    title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                    aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                        isCompleted
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-400 bg-white group-hover:border-emerald-500'
                      }`}
                    >
                      {isCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span>{isCompleted ? 'Done' : 'Mark done'}</span>
                  </button>
                </div>

                <div className="flex items-start justify-between gap-2 mt-1">
                  <h3
                    className={`text-xs font-bold transition-colors leading-snug ${
                      isCompleted ? 'text-emerald-950' : 'text-slate-900 group-hover:text-emerald-950'
                    }`}
                  >
                    {artifact.title}
                  </h3>
                  <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700 group-hover:text-emerald-800 shrink-0 mt-0.5">
                    <span>Open</span>
                    <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                  {artifact.tagline}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className={isCompleted ? 'text-emerald-700 font-medium' : ''}>
                  {isCompleted
                    ? '✓ Completed'
                    : artifact.type === 'quiz'
                    ? 'Interactive Quiz'
                    : artifact.type === 'examples'
                    ? 'Code & Examples'
                    : 'Summary & Concepts'}
                </span>
                <span className="text-emerald-600 font-semibold group-hover:underline">
                  View full notes
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
