import React from 'react';
import { HelpCircle, Trash2, Layers } from 'lucide-react';

interface FooterBarProps {
  currentUser?: string;
  onOpenFaq: () => void;
  onClearToEmptyState?: () => void;
  hasModules?: boolean;
}

export const FooterBar: React.FC<FooterBarProps> = ({
  currentUser = 'student@nodegrid.space',
  onOpenFaq,
  onClearToEmptyState,
  hasModules = true,
}) => {
  return (
    <footer className="w-full border-t border-slate-200 bg-white py-2.5 px-6 flex flex-wrap items-center justify-between gap-4 text-xs font-sans text-slate-500 z-20">
      {/* Left side: Brand, FAQ & controls */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-medium text-slate-700 font-mono flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-600" />
          <span>Microdo - powered by Nodegrid Labs</span>
        </span>
        <span className="text-slate-300">·</span>

        {/* FAQ & How It Works Button moved to the footer */}
        <button
          type="button"
          onClick={onOpenFaq}
          className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-medium transition-colors cursor-pointer"
          title="Open FAQ and visual study guide"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>FAQ & How It Works</span>
        </button>

        {/* State Toggle Helper: Reset to Empty State when modules exist */}
        {hasModules && onClearToEmptyState && (
          <>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={onClearToEmptyState}
              className="flex items-center gap-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Reset workspace to clean empty state"
            >
              <Trash2 className="w-3 h-3" />
              <span>Reset to Empty State</span>
            </button>
          </>
        )}
      </div>

      {/* Right side: Session status */}
      <div className="flex items-center gap-3 text-xs font-mono">
        <span className="text-slate-400 text-[11px] hidden sm:inline">
          Local Session Active
        </span>
        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
          {currentUser}
        </span>
      </div>
    </footer>
  );
};
