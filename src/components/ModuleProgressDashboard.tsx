import React, { useState } from 'react';
import { StudyModuleNode } from '../types';
import { Check, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

export interface ModuleProgressDashboardProps {
  module: StudyModuleNode;
  completedArtifactIds?: string[];
  className?: string;
  size?: 'sm' | 'md';
  showDetails?: boolean;
}

export const ModuleProgressDashboard: React.FC<ModuleProgressDashboardProps> = ({
  module,
  completedArtifactIds = [],
  className = '',
  size = 'md',
  showDetails = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Extract all artifacts inside this module
  const allArtifacts = module.blueRoadmap.topics.flatMap((t) => t.artifacts);
  const totalCount = allArtifacts.length;
  const completedCount = allArtifacts.filter((a) =>
    completedArtifactIds.includes(a.id)
  ).length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isDone = totalCount > 0 && completedCount >= totalCount;

  // Radial SVG Parameters
  // Radius = 17, Circumference = 2 * pi * 17 ≈ 106.814
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        // Allow clicks on the dashboard widget without preventing module card navigation
        // If clicking the tooltip, stop propagation
      }}
    >
      {/* Dashboard Overlay Container */}
      <div
        className={`group/modprog flex items-center gap-2 rounded-lg border transition-all duration-200 select-none ${
          isDone
            ? 'bg-emerald-50/90 border-emerald-200 shadow-xs text-emerald-950 hover:bg-emerald-100/90 hover:border-emerald-300'
            : completedCount > 0
            ? 'bg-white/95 border-purple-200 shadow-xs hover:border-purple-300 hover:bg-purple-50/40'
            : 'bg-white/90 border-slate-200/90 shadow-xs hover:border-slate-300 hover:bg-slate-50/90'
        } ${size === 'sm' ? 'px-2 py-1' : 'px-2.5 py-1.5'}`}
        title={`Module Progress: ${completedCount} of ${totalCount} artifacts completed (${percentage}%)`}
      >
        {/* Radial Progress Gauge */}
        <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0">
          <svg
            className="w-full h-full -rotate-90 transform"
            viewBox="0 0 44 44"
            aria-hidden="true"
          >
            {/* Background Track Circle */}
            <circle
              cx="22"
              cy="22"
              r={radius}
              fill="transparent"
              strokeWidth="3.5"
              className={
                isDone
                  ? 'stroke-emerald-100'
                  : completedCount > 0
                  ? 'stroke-purple-100'
                  : 'stroke-slate-100'
              }
            />

            {/* Foreground Radial Progress Bar */}
            <circle
              cx="22"
              cy="22"
              r={radius}
              fill="transparent"
              strokeWidth="3.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-500 ease-out ${
                isDone
                  ? 'stroke-emerald-500'
                  : completedCount > 0
                  ? 'stroke-purple-600'
                  : 'stroke-slate-300'
              }`}
            />
          </svg>

          {/* Center Text or Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isDone ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
            ) : (
              <span
                className={`text-[9px] font-mono font-bold ${
                  completedCount > 0 ? 'text-purple-700' : 'text-slate-500'
                }`}
              >
                {percentage}%
              </span>
            )}
          </div>
        </div>

        {/* Text Metric Labels */}
        {showDetails && (
          <div className="flex flex-col text-left justify-center pr-0.5">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-mono font-bold text-slate-800 leading-none">
                {completedCount}/{totalCount}
              </span>
              <span className="text-[9px] font-mono text-slate-400">done</span>
            </div>
            <span
              className={`text-[9px] font-mono uppercase tracking-tight font-medium mt-0.5 leading-none ${
                isDone
                  ? 'text-emerald-700'
                  : completedCount > 0
                  ? 'text-purple-600'
                  : 'text-slate-400'
              }`}
            >
              {isDone ? 'Mastered' : completedCount > 0 ? 'In Progress' : 'Pending'}
            </span>
          </div>
        )}
      </div>

      {/* Floating Topic Progress Tooltip on Hover */}
      {isHovered && totalCount > 0 && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-2 w-64 bg-slate-900 text-white rounded-lg p-3 shadow-xl z-30 text-xs font-mono pointer-events-auto border border-slate-700 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="font-semibold text-slate-200">Module Progress</span>
            <span className="text-purple-300 font-bold">
              {completedCount} / {totalCount} ({percentage}%)
            </span>
          </div>

          <div className="space-y-2">
            {module.blueRoadmap.topics.map((t, idx) => {
              const tCompleted = t.artifacts.filter((a) =>
                completedArtifactIds.includes(a.id)
              ).length;
              const tTotal = t.artifacts.length;
              const tDone = tTotal > 0 && tCompleted >= tTotal;

              return (
                <div key={t.id} className="flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    {tDone ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                    )}
                    <span className="truncate text-slate-300">{t.topicName}</span>
                  </div>
                  <span
                    className={`shrink-0 font-bold ${
                      tDone ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {tCompleted}/{tTotal}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const ModuleProgress = ModuleProgressDashboard;
