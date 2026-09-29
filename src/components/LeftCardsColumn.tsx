import React from 'react';
import { motion } from 'motion/react';
import { StudyModuleNode } from '../types';
import { BookOpen, Clock, CheckCircle2, ChevronRight } from 'lucide-react';

interface LeftCardsColumnProps {
  modules: StudyModuleNode[];
  selectedModuleId: string | null;
  onSelectModule: (id: string) => void;
  isRailMode: boolean;
}

export const LeftCardsColumn: React.FC<LeftCardsColumnProps> = ({
  modules,
  selectedModuleId,
  onSelectModule,
  isRailMode,
}) => {
  // 1. RAIL MODE (When a module is selected): Narrow vertical left sidebar
  if (isRailMode) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full sm:w-72 lg:w-80 shrink-0 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-purple-700">
            <BookOpen className="w-3.5 h-3.5" />
            <span>MODULE RAIL</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {modules.length} modules
          </span>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-160px)] pr-1">
          {modules.map((mod) => {
            const isSelected = mod.id === selectedModuleId;

            return (
              <button
                key={mod.id}
                id={`left-module-${mod.id}`}
                onClick={() => onSelectModule(mod.id)}
                className={`w-full text-left rounded-lg p-3 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-purple-50/70 border-purple-500 ring-1 ring-purple-300 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[11px] font-semibold text-purple-700 truncate">
                    {mod.prefix}
                  </span>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-purple-700 font-semibold shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-purple-600" />
                      <span>Selected</span>
                    </span>
                  )}
                </div>

                <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                  {mod.title}
                </h3>

                <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-100 pt-1.5">
                  <span className="truncate">{mod.courseCode}</span>
                  <span className="shrink-0 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-slate-400" />
                    <span>{mod.estimatedHours}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // 2. GRID MODE (Initial Screen): Clean 2-column responsive directory
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-5xl mx-auto flex flex-col gap-4"
    >
      <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-600" />
          <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-700">
            Course Modules Directory
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {modules.length} {modules.length === 1 ? 'module' : 'modules'} available
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((mod) => {
          return (
            <div
              key={mod.id}
              onClick={() => onSelectModule(mod.id)}
              className="group bg-white rounded-xl border border-slate-200 hover:border-purple-400 p-4 transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                    {mod.prefix}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{mod.estimatedHours}</span>
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-950 transition-colors mt-1">
                  {mod.title}
                </h3>

                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
                  {mod.summary}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-slate-500 font-medium">
                  {mod.courseCode}
                </span>
                <span className="flex items-center gap-0.5 text-xs font-medium text-purple-700 group-hover:text-purple-900 transition-colors">
                  <span>View roadmap</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
