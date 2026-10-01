import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, AlertTriangle, X, HardDrive, CheckCircle2, BookOpen } from 'lucide-react';
import { StudyModuleNode } from '../types';

interface UnloadConfirmModalProps {
  moduleToUnload: StudyModuleNode | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmUnload: (module: StudyModuleNode) => void;
  isUnloading?: boolean;
}

export const UnloadConfirmModal: React.FC<UnloadConfirmModalProps> = ({
  moduleToUnload,
  isOpen,
  onClose,
  onConfirmUnload,
  isUnloading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isUnloading) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isUnloading, onClose]);

  if (!isOpen || !moduleToUnload) return null;

  const topicsCount = moduleToUnload.blueRoadmap?.topics?.length || 0;
  const artifactsCount = moduleToUnload.blueRoadmap?.topics?.reduce(
    (acc, t) => acc + (t.artifacts?.length || 0),
    0
  ) || 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-red-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-100 text-red-700 shadow-2xs">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans">
                  Unload Module & Document
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  Purge from workspace and server memory
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isUnloading}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold text-purple-700 uppercase tracking-wider">
                  {moduleToUnload.prefix}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {moduleToUnload.courseCode}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                {moduleToUnload.title}
              </h4>
              <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                {moduleToUnload.summary}
              </p>
            </div>

            {/* What will be purged */}
            <div className="space-y-2">
              <span className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                Purge Scope:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-mono text-[11px] text-slate-700">
                    {topicsCount} Core Topics
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-mono text-[11px] text-slate-700">
                    {artifactsCount} Study Artifacts
                  </span>
                </div>
              </div>
            </div>

            {/* Server Memory explanation */}
            <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex gap-2.5 items-start">
              <HardDrive className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">Prevents Server Storage Full</span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Unloading immediately releases the document text, parsed memory buffers, and cached study materials so server resources remain clean and responsive.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-slate-100 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              disabled={isUnloading}
              className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-mono text-xs border border-slate-200 transition-colors cursor-pointer shadow-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirmUnload(moduleToUnload)}
              disabled={isUnloading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isUnloading ? 'Purging Module...' : 'Confirm Unload'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
