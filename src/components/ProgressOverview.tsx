import React, { useState, useRef, useEffect } from 'react';
import { StudyModuleNode } from '../types';
import { CheckCircle2, ChevronDown, Award, Sparkles, BookOpen } from 'lucide-react';

export interface ProgressOverviewProps {
  completedCount: number;
  totalCount: number;
  modules?: StudyModuleNode[];
  completedArtifactIds?: string[];
  className?: string;
  onSelectModule?: (moduleId: string) => void;
}

export const ProgressOverview: React.FC<ProgressOverviewProps> = ({
  completedCount,
  totalCount,
  modules = [],
  completedArtifactIds = [],
  className = '',
  onSelectModule,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllCompleted = totalCount > 0 && completedCount >= totalCount;

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Compute breakdown per module if modules are provided
  const moduleBreakdowns = modules.map((mod) => {
    const allModArtifacts = mod.blueRoadmap.topics.flatMap((t) => t.artifacts);
    const modTotal = allModArtifacts.length;
    const modCompleted = allModArtifacts.filter((a) =>
      completedArtifactIds.includes(a.id)
    ).length;
    const modPercent = modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0;

    return {
      module: mod,
      total: modTotal,
      completed: modCompleted,
      percent: modPercent,
      isDone: modTotal > 0 && modCompleted >= modTotal,
    };
  });

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      {/* Header Pill / Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title="View course progress overview"
        className={`group flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer shadow-xs ${
          isOpen
            ? 'bg-slate-100 border-slate-300 ring-2 ring-indigo-500/20'
            : isAllCompleted
            ? 'bg-emerald-50/70 border-emerald-300 hover:bg-emerald-100/70 text-emerald-900'
            : completedCount > 0
            ? 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80 text-slate-800'
            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
        }`}
      >
        {/* Status Icon */}
        <div className="flex items-center justify-center shrink-0">
          {isAllCompleted ? (
            <Award className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          ) : completedCount > 0 ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <div className="w-3 h-3 rounded-full border-2 border-slate-300 border-t-indigo-500" />
          )}
        </div>

        {/* Text Labels & Ratio */}
        <div className="flex items-baseline gap-1.5">
          <span className="font-semibold text-slate-900 hidden sm:inline">Progress:</span>
          <span
            className={`font-bold font-mono ${
              isAllCompleted
                ? 'text-emerald-700'
                : completedCount > 0
                ? 'text-indigo-600'
                : 'text-slate-700'
            }`}
          >
            {percentage}%
          </span>
          <span className="text-[11px] text-slate-500 font-normal">
            ({completedCount}/{totalCount})
          </span>
        </div>

        {/* Mini Linear Progress Bar */}
        <div className="w-12 sm:w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden shrink-0">
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${
              isAllCompleted
                ? 'bg-emerald-500'
                : completedCount > 0
                ? 'bg-indigo-600'
                : 'bg-slate-300'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Dropdown Indicator */}
        <ChevronDown
          className={`w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-slate-700' : ''
          }`}
        />
      </button>

      {/* Floating Detailed Progress Overview Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Progress Overview Details"
          className="absolute right-0 sm:right-auto sm:left-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl border border-slate-200 shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 duration-150 text-slate-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isAllCompleted
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-indigo-50 text-indigo-600'
                }`}
              >
                {isAllCompleted ? (
                  <Sparkles className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold font-sans text-slate-900">
                  Course Progress Overview
                </h4>
                <p className="text-[11px] font-mono text-slate-500">
                  Artifact mastery across all modules
                </p>
              </div>
            </div>

            {/* Percentage Badge */}
            <div
              className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${
                isAllCompleted
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : completedCount > 0
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              {percentage}%
            </div>
          </div>

          {/* Overall Progress Gauge Bar */}
          <div className="my-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-600 font-medium">Mastery Ratio:</span>
              <span className="font-semibold text-slate-900">
                {completedCount} of {totalCount} artifacts
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${
                  isAllCompleted
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Module-by-Module Progress Breakdown */}
          {moduleBreakdowns.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5 max-h-60 overflow-y-auto pr-1">
              <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                Breakdown by Module
              </div>

              {moduleBreakdowns.map(({ module: mod, total, completed, percent, isDone }) => (
                <div
                  key={mod.id}
                  onClick={() => {
                    if (onSelectModule) {
                      onSelectModule(mod.id);
                      setIsOpen(false);
                    }
                  }}
                  className={`p-2 rounded-lg border transition-all ${
                    onSelectModule ? 'cursor-pointer hover:bg-slate-50' : ''
                  } ${
                    isDone
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono text-slate-500 truncate">
                        {mod.courseCode || mod.prefix}
                      </div>
                      <div className="text-xs font-semibold text-slate-800 truncate">
                        {mod.title}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-[11px] font-mono font-bold ${
                          isDone ? 'text-emerald-700' : 'text-slate-700'
                        }`}
                      >
                        {percent}%
                      </span>
                      <div className="text-[10px] font-mono text-slate-400">
                        {completed}/{total}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar per module */}
                  <div className="w-full bg-slate-200/80 rounded-full h-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isDone ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Helper Tip */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-slate-400" />
              Toggle cards to track mastery
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-600 hover:text-slate-900 underline cursor-pointer text-[10px]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
