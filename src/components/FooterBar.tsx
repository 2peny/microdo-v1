import React from 'react';
import { HelpCircle, Trash2, Layers, UserCheck } from 'lucide-react';
import { ScholarUser } from '../types';

interface FooterBarProps {
  currentUser?: ScholarUser | string | null;
  onOpenFaq: () => void;
  onClearToEmptyState?: () => void;
  hasModules?: boolean;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export const FooterBar: React.FC<FooterBarProps> = ({
  currentUser,
  onOpenFaq,
  onClearToEmptyState,
  hasModules = true,
  onOpenAuth,
}) => {
  const userDisplay = typeof currentUser === 'string'
    ? currentUser
    : currentUser?.email || 'student@nodegrid.space';

  const userAvatar = typeof currentUser === 'object' && currentUser?.avatarEmoji
    ? currentUser.avatarEmoji
    : '🦉';

  const userLabel = typeof currentUser === 'object' && currentUser?.fullName
    ? currentUser.fullName
    : userDisplay;

  return (
    <footer className="w-full border-t border-slate-200 bg-white py-2.5 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs font-sans text-slate-500 z-20">
      {/* Left side: Brand, FAQ & controls */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <span className="font-medium text-slate-700 font-mono flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-600" />
          <span>MicroDo · Nodegrid</span>
        </span>
        <span className="text-slate-300">·</span>

        {/* FAQ & How It Works Button */}
        <button
          type="button"
          onClick={onOpenFaq}
          className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-medium transition-colors cursor-pointer"
          title="Open FAQ and visual study guide"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>FAQ &amp; Guide</span>
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
              <span>Reset State</span>
            </button>
          </>
        )}
      </div>

      {/* Right side: Session status & Auth Overlay Trigger */}
      <div className="flex items-center gap-2.5 text-xs font-mono">
        <span className="text-slate-400 text-[11px] hidden md:inline">
          Station Clearance Active
        </span>

        {onOpenAuth ? (
          <button
            type="button"
            onClick={() => onOpenAuth('login')}
            className="flex items-center gap-1.5 text-slate-700 hover:text-indigo-700 bg-slate-50 hover:bg-indigo-50/70 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-indigo-300 text-[11px] transition-all cursor-pointer group"
            title="Open Scholar Passport & Authentication Overlay"
          >
            <span>{userAvatar}</span>
            <span className="font-sans font-medium truncate max-w-[130px] sm:max-w-[180px]">
              {userLabel}
            </span>
            <UserCheck className="w-3 h-3 text-emerald-600 group-hover:text-indigo-600" />
          </button>
        ) : (
          <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
            {userDisplay}
          </span>
        )}
      </div>
    </footer>
  );
};
