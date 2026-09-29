import React from 'react';
import { LogOut } from 'lucide-react';

interface FooterBarProps {
  currentUser?: string;
  onLogout?: () => void;
}

export const FooterBar: React.FC<FooterBarProps> = ({
  currentUser = 'student@nodegrid.space',
  onLogout,
}) => {
  return (
    <footer className="w-full border-t border-slate-200 bg-white py-2.5 px-6 flex flex-wrap items-center justify-between gap-4 text-xs font-sans text-slate-500 z-20">
      {/* Left side: Powered by and links */}
      <div className="flex items-center gap-3">
        <span className="font-medium text-slate-700">Powered by NodeGrid</span>
        <span className="text-slate-300">·</span>
        <nav className="flex items-center gap-3 text-slate-500">
          <a
            href="#about"
            onClick={(e) => e.preventDefault()}
            className="hover:text-slate-900 transition-colors"
          >
            About
          </a>
          <a
            href="#contact"
            onClick={(e) => e.preventDefault()}
            className="hover:text-slate-900 transition-colors"
          >
            Contact
          </a>
          <a
            href="#partners"
            onClick={(e) => e.preventDefault()}
            className="hover:text-slate-900 transition-colors"
          >
            Partners
          </a>
        </nav>
      </div>

      {/* Right side: User placeholder and logout */}
      <div className="flex items-center gap-3 text-xs">
        <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {currentUser}
        </span>
        <button
          onClick={onLogout || (() => {})}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </footer>
  );
};
