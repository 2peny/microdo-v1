import React from 'react';
import { BookOpen, Upload, RotateCcw, Layers } from 'lucide-react';

interface HeaderProps {
  courseName: string;
  onOpenUploadModal: () => void;
  onOpenGuide: () => void;
  onResetFlow: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  courseName,
  onOpenUploadModal,
  onOpenGuide,
  onResetFlow,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white px-6 py-2.5 flex items-center justify-between shadow-xs">
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
      <div className="hidden sm:flex items-center justify-center text-center">
        <h1 className="text-sm font-semibold text-slate-800 tracking-tight font-sans truncate max-w-md">
          {courseName}
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onResetFlow}
          className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer shadow-xs"
          title="Reset selection"
          aria-label="Reset selection"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenGuide}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 transition-colors text-xs font-mono cursor-pointer whitespace-nowrap shadow-xs"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-500" />
          <span>How It Works</span>
        </button>

        <button
          onClick={onOpenUploadModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium font-sans transition-colors cursor-pointer shadow-xs whitespace-nowrap"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Module</span>
        </button>
      </div>
    </header>
  );
};
