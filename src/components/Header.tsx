import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  RotateCcw,
  Layers,
  Flame,
  Crown,
  LayoutDashboard,
  Target,
  Wifi,
  WifiOff,
  ChevronDown,
  User,
  LogOut,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { StudyModuleNode, ScholarUser } from '../types';

interface HeaderProps {
  courseName: string;
  totalArtifactsCount: number;
  completedArtifactsCount: number;
  modules?: StudyModuleNode[];
  completedArtifactIds?: string[];
  onSelectModule?: (moduleId: string) => void;
  onOpenUploadModal: () => void;
  onResetFlow: () => void;
  currentUser?: ScholarUser | null;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  onOpenSuperuser?: () => void;
  currentView?: 'dashboard' | 'workspace';
  onViewChange?: (view: 'dashboard' | 'workspace') => void;
  onOpenStudyGoals?: () => void;
  isOffline?: boolean;
  offlinePendingCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  courseName,
  currentUser,
  onOpenAuth,
  onOpenUploadModal,
  onResetFlow,
  onOpenSuperuser,
  currentView = 'workspace',
  onViewChange,
  onOpenStudyGoals,
  isOffline = false,
  offlinePendingCount = 0,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Archetype Bonus Calculation
  const getArchetypeBonus = (archetype?: string) => {
    if (!archetype) return null;
    const hour = new Date().getHours();
    if (archetype === 'midnight_owl' && hour >= 1 && hour <= 4) {
      return { label: 'Night-Owl Bonus (1.5x XP)', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    }
    if (archetype === 'dawn_sentinel' && hour >= 5 && hour <= 8) {
      return { label: 'Dawn-Sentinel Bonus (1.5x XP)', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
    if (archetype === 'caffeine_alchemist') {
      return { label: 'Caffeine Rush Active', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    }
    return null;
  };

  const bonus = getArchetypeBonus(currentUser?.archetype);

  return (
    <header className="sticky top-0 z-40 w-full h-[72px] border-b border-slate-200 bg-white/95 backdrop-blur-xs px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-2xs">
      {/* A. Left: Brand & Wordmark */}
      <div className="flex items-center gap-3 sm:gap-6">
        <button
          onClick={onResetFlow}
          className="flex items-center gap-2.5 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
          title="MicroDo - Return to course overview"
          aria-label="MicroDo Home"
        >
          <div className="w-9 h-9 rounded-[10px] bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-700 transition-colors">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-base tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
              MicroDo
            </span>
            <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase -mt-0.5 hidden sm:inline">
              Adaptive Learning
            </span>
          </div>
        </button>

        {/* Global Navigation - Center/Left Tabs */}
        {onViewChange && (
          <nav
            aria-label="Primary Navigation"
            className="flex items-center p-1 rounded-[10px] bg-slate-100/80 border border-slate-200/70 text-xs"
          >
            <button
              onClick={() => onViewChange('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-[8px] font-medium transition-all cursor-pointer h-8 ${
                currentView === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
              title="Learner Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => onViewChange('workspace')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-[8px] font-medium transition-all cursor-pointer h-8 ${
                currentView === 'workspace'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
              title="Study Workspace"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Study</span>
            </button>
          </nav>
        )}
      </div>

      {/* B. Right: Primary Action & Profile Account Menu */}
      <div className="flex items-center gap-3">
        {/* Network Sync Pill (Subtle, clean) */}
        <div
          className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-xs font-medium border ${
            isOffline
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-emerald-50/70 text-emerald-800 border-emerald-200/80'
          }`}
          title={isOffline ? `${offlinePendingCount} actions queued for sync` : 'All changes synced'}
        >
          {isOffline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-mono text-[11px]">
                Offline {offlinePendingCount > 0 ? `(${offlinePendingCount})` : ''}
              </span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px]">Synced</span>
            </>
          )}
        </div>

        {/* Primary Action: Upload Material */}
        <button
          onClick={onOpenUploadModal}
          className="h-10 px-3.5 sm:px-4 rounded-[10px] bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Upload Module</span>
          <span className="sm:hidden">Upload</span>
        </button>

        {/* C. Consolidated Scholar Profile & Settings Menu */}
        <div ref={profileMenuRef} className="relative">
          <button
            onClick={() => setIsProfileOpen((prev) => !prev)}
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
            aria-label="Account and workspace settings"
            className={`h-10 pl-2.5 pr-2 rounded-[10px] border transition-all flex items-center gap-2 cursor-pointer ${
              isProfileOpen
                ? 'bg-slate-100 border-slate-300 ring-2 ring-indigo-500/20'
                : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs">
              {currentUser?.avatarEmoji || '🎓'}
            </div>
            <span className="text-xs font-semibold text-slate-800 hidden md:inline truncate max-w-[100px]">
              {currentUser ? currentUser.fullName.split(' ')[0] : 'Account'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                isProfileOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div
              className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              role="menu"
            >
              {/* User Overview Section */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{currentUser?.avatarEmoji || '🎓'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {currentUser?.fullName || 'Guest Scholar'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {currentUser?.email || 'Local workspace session'}
                    </p>
                  </div>
                </div>

                {/* Streak & Archetype stats inside menu */}
                {currentUser && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-orange-600 font-medium">
                      <Flame className="w-3.5 h-3.5" />
                      <span>3 Day Streak</span>
                    </div>
                    {bonus && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${bonus.color}`}>
                        {bonus.label}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Learning Tools Section */}
              <div className="py-1">
                {onOpenStudyGoals && (
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenStudyGoals();
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    role="menuitem"
                  >
                    <Target className="w-4 h-4 text-purple-600" />
                    <div className="flex flex-col">
                      <span className="font-medium">Study Goals & Schedule</span>
                      <span className="text-[10px] text-slate-400">Manage daily target & review cadence</span>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onResetFlow();
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  role="menuitem"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">Reset Selection</span>
                    <span className="text-[10px] text-slate-400">Return to root chapter overview</span>
                  </div>
                </button>
              </div>

              {/* Owner / Superuser backend console link (if authorized or present) */}
              {onOpenSuperuser && (
                <div className="py-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenSuperuser();
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-amber-50/60 flex items-center gap-2.5 transition-colors cursor-pointer"
                    role="menuitem"
                  >
                    <Crown className="w-4 h-4 text-amber-500" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-900">Owner Backend</span>
                        {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">Telemetry, logs & system control</span>
                    </div>
                  </button>
                </div>
              )}

              {/* Authentication / Account Overlay trigger */}
              {onOpenAuth && (
                <div className="pt-1 mt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenAuth('login');
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-indigo-700 hover:bg-indigo-50/60 flex items-center gap-2.5 transition-colors cursor-pointer font-medium"
                    role="menuitem"
                  >
                    <User className="w-4 h-4 text-indigo-600" />
                    <span>{currentUser ? 'Scholar Passport & Account' : 'Sign In / Register'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

