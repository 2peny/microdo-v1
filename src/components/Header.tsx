import React from 'react';
import { Upload, RotateCcw, Layers } from 'lucide-react';
import { ProgressOverview } from './ProgressOverview';
import { StudyModuleNode } from '../types';

interface HeaderProps {
  courseName: string;
  totalArtifactsCount: number;
  completedArtifactsCount: number;
  modules?: StudyModuleNode[];
  completedArtifactIds?: string[];
  onSelectModule?: (moduleId: string) => void;
  onOpenUploadModal: () => void;
  onResetFlow: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  courseName,
  totalArtifactsCount,
  completedArtifactsCount,
  modules,
  completedArtifactIds,
  onSelectModule,
  onOpenUploadModal,
  onResetFlow,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-xs gap-3">
      {/* Left: Wordmark / Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onResetFlow}
          className="text-base font-bold tracking-tight text-slate-900 hover:text-indigo-600 transition-colors flex items-center gap-2 cursor-pointer"
          title="MicroDo - Return to overview"
        >
          <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono tracking-tight font-extrabold text-slate-900">MicroDo</span>
          <span className="text-slate-400 font-normal text-xs font-mono">
            / interactive directory
          </span>
        </button>
      </div>

      {/* Centre: Dynamic current course name */}
      <div className="hidden lg:flex items-center justify-center text-center">
        <h1 className="text-xs font-semibold text-slate-700 tracking-tight font-sans truncate max-w-xs xl:max-w-sm">
          {courseName}
        </h1>
      </div>

      {/* Right: Progress Overview & Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <ProgressOverview
          completedCount={completedArtifactsCount}
          totalCount={totalArtifactsCount}
          modules={modules}
          completedArtifactIds={completedArtifactIds}
          onSelectModule={onSelectModule}
        />

        <div className="h-4 w-px bg-slate-200 hidden sm:block mx-0.5" />

        <button
          onClick={onResetFlow}
          className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer shadow-xs"
          title="Reset selection"
          aria-label="Reset selection"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenUploadModal}
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium font-sans transition-colors cursor-pointer shadow-xs whitespace-nowrap"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload Module</span>
          <span className="sm:hidden">Upload</span>
        </button>
      </div>
    </header>
  );
};
