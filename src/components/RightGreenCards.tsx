import React from 'react';
import { motion } from 'motion/react';
import { StudyArtifact, StudyTopic } from '../types';
import { FileText, Code2, HelpCircle, ArrowUpRight, GraduationCap } from 'lucide-react';

interface RightGreenCardsProps {
  activeTopic: StudyTopic | null;
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
        <span className="text-[11px] font-mono text-slate-400">
          {artifacts.length} items
        </span>
      </div>

      {/* Cards List */}
      <div className="flex flex-col gap-3">
        {artifacts.map((artifact) => {
          return (
            <div
              key={artifact.id}
              id={`green-artifact-${artifact.id}`}
              onClick={() => onOpenArtifactDetail(artifact)}
              className="group bg-white rounded-xl border border-slate-200 hover:border-emerald-400 p-4 transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    {artifact.type === 'overview' && <FileText className="w-3.5 h-3.5" />}
                    {artifact.type === 'examples' && <Code2 className="w-3.5 h-3.5" />}
                    {artifact.type === 'quiz' && <HelpCircle className="w-3.5 h-3.5" />}
                    <span className="font-mono text-[11px] text-slate-500">{artifact.path}</span>
                  </div>

                  <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700 group-hover:text-emerald-800 transition-colors">
                    <span>Open</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-950 transition-colors">
                  {artifact.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                  {artifact.tagline}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>
                  {artifact.type === 'quiz'
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
