import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { StudyModuleNode } from '../types';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  ChevronRight,
  SearchX,
  Trash2,
  HardDrive,
  Search,
  Hash,
  ChevronLeft,
  Layers,
} from 'lucide-react';
import { ModuleProgressDashboard } from './ModuleProgressDashboard';
import { EmptyStateView } from './EmptyStateView';

interface LeftCardsColumnProps {
  modules: StudyModuleNode[];
  selectedModuleId: string | null;
  onSelectModule: (id: string) => void;
  isRailMode: boolean;
  completedArtifactIds?: string[];
  onOpenUploadModal?: () => void;
  onOpenFaq?: () => void;
  hasAnyModules?: boolean;
  onClearSearch?: () => void;
  onRequestUnload?: (module: StudyModuleNode) => void;
}

const CHAPTERS_PER_PAGE = 50;

export const LeftCardsColumn: React.FC<LeftCardsColumnProps> = ({
  modules,
  selectedModuleId,
  onSelectModule,
  isRailMode,
  completedArtifactIds = [],
  onOpenUploadModal,
  onOpenFaq,
  hasAnyModules = true,
  onClearSearch,
  onRequestUnload,
}) => {
  const [railSearch, setRailSearch] = useState('');
  const [activeRangeIndex, setActiveRangeIndex] = useState<number>(0);
  const [jumpInput, setJumpInput] = useState('');

  // 1. RAIL MODE (When a module is selected): Narrow vertical left sidebar
  if (isRailMode) {
    const filteredRailModules = modules.filter((m) => {
      if (!railSearch.trim()) return true;
      const q = railSearch.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.prefix.toLowerCase().includes(q) ||
        m.courseCode.toLowerCase().includes(q)
      );
    });

    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full sm:w-72 lg:w-80 shrink-0 flex flex-col gap-2.5"
      >
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-purple-700">
            <BookOpen className="w-3.5 h-3.5" />
            <span>CHAPTER / MODULE RAIL</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 font-semibold">
            {modules.length} {modules.length === 1 ? 'chapter' : 'chapters'}
          </span>
        </div>

        {/* Quick rail filter for books with many chapters */}
        {modules.length > 8 && (
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={railSearch}
              onChange={(e) => setRailSearch(e.target.value)}
              placeholder={`Filter ${modules.length} chapters...`}
              className="w-full pl-7 pr-2.5 py-1 text-[11px] font-mono bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 shadow-2xs"
            />
          </div>
        )}

        <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-190px)] pr-1">
          {filteredRailModules.map((mod, idx) => {
            const isSelected = mod.id === selectedModuleId;

            return (
              <div
                key={mod.id}
                id={`left-module-${mod.id}`}
                onClick={() => onSelectModule(mod.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectModule(mod.id);
                  }
                }}
                className={`w-full text-left rounded-lg p-2.5 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-purple-50/70 border-purple-500 ring-1 ring-purple-300 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[11px] font-semibold text-purple-700 truncate mr-2">
                    {mod.prefix}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <ModuleProgressDashboard
                      module={mod}
                      completedArtifactIds={completedArtifactIds}
                      size="sm"
                      showDetails={false}
                    />
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-purple-700 font-semibold shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-purple-600" />
                        <span>Active</span>
                      </span>
                    )}
                    {onRequestUnload && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestUnload(mod);
                        }}
                        title="Unload chapter"
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                        aria-label={`Unload ${mod.title}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                  {mod.title}
                </h3>

                <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-100 pt-1">
                  <span className="truncate">{mod.courseCode}</span>
                  <span className="shrink-0 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-slate-400" />
                    <span>{mod.estimatedHours}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // 2. GRID MODE (Initial Screen)
  if (!hasAnyModules) {
    return (
      <EmptyStateView
        onOpenUploadModal={onOpenUploadModal || (() => {})}
        onOpenFaq={onOpenFaq || (() => {})}
      />
    );
  }

  // If modules exist but are filtered out by search
  if (modules.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto py-16 text-center flex flex-col items-center bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <SearchX className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">No matching chapters or modules</h3>
        <p className="text-xs text-slate-500 mt-1">
          No items matched your current filter criteria.
        </p>
        {onClearSearch && (
          <button
            type="button"
            onClick={onClearSearch}
            className="mt-4 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono cursor-pointer transition-colors shadow-xs"
          >
            Clear Search Filter
          </button>
        )}
      </div>
    );
  }

  // Range pagination if many chapters (e.g. 50 to 300 chapters)
  const isLargeBook = modules.length > CHAPTERS_PER_PAGE;
  const totalPages = Math.ceil(modules.length / CHAPTERS_PER_PAGE);

  const displayedModules = useMemo(() => {
    if (!isLargeBook || activeRangeIndex < 0) return modules;
    const start = activeRangeIndex * CHAPTERS_PER_PAGE;
    return modules.slice(start, start + CHAPTERS_PER_PAGE);
  }, [modules, isLargeBook, activeRangeIndex]);

  const handleJumpToChapter = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(jumpInput, 10);
    if (!isNaN(num) && num >= 1 && num <= modules.length) {
      // Find matching module by chapter number or index
      const target =
        modules.find(
          (m) =>
            m.prefix.includes(`Chapter ${num}`) ||
            m.prefix.includes(`Chapter ${String(num).padStart(2, '0')}`) ||
            m.courseCode.includes(`Ch. ${num}`)
        ) || modules[num - 1];

      if (target) {
        onSelectModule(target.id);
      }
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-5xl mx-auto flex flex-col gap-4"
    >
      {/* Top Bar with Chapter Count and Jump Form */}
      <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-200/80 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
            {modules.length >= 2 ? 'Textbook Chapters Directory' : 'Course Modules Directory'}
          </h2>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">
            {modules.length} {modules.length === 1 ? 'Chapter' : 'Chapters'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Jump to Chapter input for large books */}
          {modules.length >= 10 && (
            <form onSubmit={handleJumpToChapter} className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-slate-500 font-semibold">
                Go to Ch:
              </span>
              <input
                type="number"
                min="1"
                max={modules.length}
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                placeholder={`1..${modules.length}`}
                className="w-16 px-2 py-0.5 text-xs font-mono bg-white border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 shadow-2xs"
              />
              <button
                type="submit"
                className="px-2 py-0.5 text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors cursor-pointer shadow-2xs"
              >
                Go
              </button>
            </form>
          )}

          <span
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
            title="All chapters are fully parsed with study notes and quizzes"
          >
            <HardDrive className="w-3 h-3 text-emerald-600" />
            <span>Ready</span>
          </span>
        </div>
      </div>

      {/* Chapter Range Tabs (Shown when book has over 50 chapters, up to 300 chapters) */}
      {isLargeBook && (
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/80 rounded-xl border border-slate-200 shadow-2xs text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveRangeIndex(-1)}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeRangeIndex === -1
                ? 'bg-purple-600 text-white font-bold shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            }`}
          >
            All ({modules.length})
          </button>

          {Array.from({ length: totalPages }).map((_, pIdx) => {
            const rangeStart = pIdx * CHAPTERS_PER_PAGE + 1;
            const rangeEnd = Math.min((pIdx + 1) * CHAPTERS_PER_PAGE, modules.length);
            const isRangeActive = activeRangeIndex === pIdx;

            return (
              <button
                key={pIdx}
                type="button"
                onClick={() => setActiveRangeIndex(pIdx)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  isRangeActive
                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                Ch. {rangeStart} – {rangeEnd}
              </button>
            );
          })}
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedModules.map((mod, idx) => {
          const topicCount = mod.blueRoadmap.topics.length;
          const artifactCount = mod.blueRoadmap.topics.reduce(
            (sum, t) => sum + t.artifacts.length,
            0
          );

          return (
            <div
              key={mod.id}
              onClick={() => onSelectModule(mod.id)}
              className="group relative bg-white rounded-xl border border-slate-200 hover:border-purple-400 p-5 transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <span className="font-mono text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded border border-purple-100">
                    {mod.prefix}
                  </span>

                  <div className="flex items-center gap-2">
                    <ModuleProgressDashboard
                      module={mod}
                      completedArtifactIds={completedArtifactIds}
                      size="md"
                      showDetails={true}
                    />

                    {onRequestUnload && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestUnload(mod);
                        }}
                        title="Unload chapter"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 transition-colors cursor-pointer shadow-2xs"
                        aria-label={`Unload ${mod.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-950 transition-colors mt-1">
                  {mod.title}
                </h3>

                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
                  {mod.summary}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-slate-500 font-medium">
                    {mod.courseCode}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{mod.estimatedHours}</span>
                  </span>
                  <span className="hidden sm:inline-block font-mono text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                    {topicCount} topics · {artifactCount} notes
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {onRequestUnload && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestUnload(mod);
                      }}
                      className="text-[11px] font-mono text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Unload this chapter"
                    >
                      Unload
                    </button>
                  )}
                  <span className="flex items-center gap-0.5 text-xs font-medium text-purple-700 group-hover:text-purple-900 transition-colors">
                    <span>Study chapter</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
