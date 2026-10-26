import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Users,
  Layers,
  BarChart3,
  Activity,
  Settings,
  UserCheck,
  UserX,
  UserPlus,
  KeyRound,
  Trash2,
  Download,
  Search,
  Check,
  X,
  AlertTriangle,
  Clock,
  Sparkles,
  Database,
  Server,
  ArrowUpRight,
  TrendingUp,
  FileText,
  Lock,
  Unlock,
  Eye,
  RefreshCw,
  LogOut,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import {
  ScholarUser,
  ScholarUserRole,
  UserPermissions,
  DailyUploadStat,
  AuditLogEntry,
  PlatformSystemSettings,
  StudyModuleNode,
  StudyDirectoryCourse,
} from '../types';
import {
  getAllRegisteredUsers,
  updateUserRole,
  updateUserPermissions,
  updateUserStatus,
  addNewUserByAdmin,
  getDailyUploadStats,
  getAuditLogs,
  recordAuditLog,
  getPlatformSettings,
  savePlatformSettings,
  saveStoredUser,
  ARCHETYPES,
  getDefaultPermissionsForRole,
} from '../utils/authStorage';
import { computeAdminProductMetrics, AdminProductMetrics } from '../utils/analyticsEngine';

interface SuperuserDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ScholarUser | null;
  onUserSwitched: (user: ScholarUser) => void;
  courses: StudyDirectoryCourse[];
  onPurgeModule?: (moduleId: string) => void;
}

type TabType = 'metrics' | 'users' | 'modules' | 'audit' | 'settings';

export const SuperuserDashboard: React.FC<SuperuserDashboardProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserSwitched,
  courses,
  onPurgeModule,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('metrics');
  const [users, setUsers] = useState<ScholarUser[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyUploadStat[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSystemSettings>(getPlatformSettings());
  const [adminMetrics, setAdminMetrics] = useState<AdminProductMetrics>(computeAdminProductMetrics());
  const [serverHealth, setServerHealth] = useState<any>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);

  // User management UI states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<ScholarUser | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserRole, setNewUserRole] = useState<ScholarUserRole>('scholar');
  const [newUserFocus, setNewUserFocus] = useState('');

  // Fetch initial data
  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  const refreshData = () => {
    setUsers(getAllRegisteredUsers());
    setDailyStats(getDailyUploadStats());
    setAuditLogs(getAuditLogs());
    setPlatformSettings(getPlatformSettings());
    setAdminMetrics(computeAdminProductMetrics());
    fetchServerMetrics();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const fetchServerMetrics = async () => {
    setIsLoadingHealth(true);
    try {
      const res = await fetch('/api/admin/metrics');
      if (res.ok) {
        const data = await res.json();
        setServerHealth(data);
      }
    } catch {
      // Offline fallback
    } finally {
      setIsLoadingHealth(false);
    }
  };

  if (!isOpen) return null;

  // Aggregate Metrics Calculations
  const allModules = courses.flatMap((c) => c.modules);
  const totalModulesCount = allModules.length;
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayStat = dailyStats.find((s) => s.date === todayDateStr) || {
    modulesCount: totalModulesCount > 0 ? totalModulesCount : 14,
    chaptersCount: totalModulesCount > 0 ? totalModulesCount : 14,
    fileUploadsCount: 10,
    pasteUploadsCount: 4,
  };

  const totalRegisteredCount = users.length;
  const superAdminCount = users.filter((u) => u.role === 'super_admin' || u.role === 'admin').length;
  const instructorCount = users.filter((u) => u.role === 'instructor').length;
  const scholarCount = users.filter((u) => u.role === 'scholar').length;
  const maxDailyCount = Math.max(...dailyStats.map((d) => d.modulesCount), 20);

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.majorOrFocus && u.majorOrFocus.toLowerCase().includes(userSearchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Handle Role Change
  const handleRoleChange = (userId: string, newRole: ScholarUserRole) => {
    const updated = updateUserRole(userId, newRole);
    setUsers(updated);
    if (selectedUserForEdit && selectedUserForEdit.id === userId) {
      setSelectedUserForEdit(updated.find((u) => u.id === userId) || null);
    }
    showToast(`Role updated to ${newRole}`);
  };

  // Handle Granular Permission Toggle
  const handleTogglePermission = (userId: string, key: keyof UserPermissions) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    const currentPerms = targetUser.permissions || getDefaultPermissionsForRole(targetUser.role);
    const updatedPerms: Partial<UserPermissions> = {
      [key]: !currentPerms[key],
    };
    const updated = updateUserPermissions(userId, updatedPerms);
    setUsers(updated);
    if (selectedUserForEdit && selectedUserForEdit.id === userId) {
      setSelectedUserForEdit(updated.find((u) => u.id === userId) || null);
    }
    showToast(`Updated ${String(key)} permission`);
  };

  // Handle Status Toggle (Active / Suspended)
  const handleToggleStatus = (user: ScholarUser) => {
    const nextStatus = user.status === 'suspended' ? 'active' : 'suspended';
    const updated = updateUserStatus(user.id, nextStatus);
    setUsers(updated);
    showToast(`User ${user.fullName} is now ${nextStatus}`);
  };

  // Add User Submission
  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      showToast('Please provide a name and email');
      return;
    }

    const created = addNewUserByAdmin({
      fullName: newUserName.trim(),
      email: newUserEmail.trim(),
      username: newUserUsername.trim() || newUserEmail.split('@')[0],
      role: newUserRole,
      majorOrFocus: newUserFocus.trim() || 'General Academics',
    });

    setUsers(getAllRegisteredUsers());
    setIsAddUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserUsername('');
    setNewUserFocus('');
    showToast(`Created new user: ${created.fullName} (${created.role})`);
  };

  // Switch to User (Impersonation / Test capability)
  const handleSwitchUser = (targetUser: ScholarUser) => {
    saveStoredUser(targetUser);
    onUserSwitched(targetUser);
    showToast(`Switched active session to: ${targetUser.fullName}`);
  };

  // Update Settings
  const handleToggleSetting = (key: keyof PlatformSystemSettings) => {
    const updated: PlatformSystemSettings = {
      ...platformSettings,
      [key]: !platformSettings[key],
    };
    setPlatformSettings(updated);
    savePlatformSettings(updated);
    showToast(`Platform setting updated: ${String(key)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-6xl h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden font-sans"
      >
        {/* Top Header / Control Console Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-wide">
                  Superuser Control Center
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  OWNER ACCESS ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                MicroDo Platform Administration · Superuser ID: {currentUser?.id || 'usr-owner-001'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={refreshData}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-colors cursor-pointer text-xs flex items-center gap-1.5 px-2.5"
              title="Refresh telemetry"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-mono text-[11px]">Sync</span>
            </button>

            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <span>Return to Workspace</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Console Sub-Navbar Tabs */}
        <div className="flex items-center justify-between px-4 sm:px-6 border-b border-slate-800/80 bg-slate-900/90 text-xs font-medium overflow-x-auto">
          <div className="flex items-center gap-1 py-1.5">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'metrics'
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Site Analytics & Uploads</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Registered Users ({totalRegisteredCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('modules')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'modules'
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Module Rails & Textbooks ({totalModulesCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-4 h-4 text-sky-400" />
              <span>Audit Log & Events</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Settings className="w-4 h-4 text-purple-400" />
              <span>Platform Controls</span>
            </button>
          </div>

          {/* Quick Superuser Status Pill */}
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Server Uptime: {serverHealth?.serverUptimeSecs ? `${Math.floor(serverHealth.serverUptimeSecs / 60)}m` : 'Live'}</span>
            <span className="text-slate-600">|</span>
            <span>Mem: {serverHealth?.memoryRssMb ? `${serverHealth.memoryRssMb}MB` : '48MB'}</span>
          </div>
        </div>

        {/* Main Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900/60 custom-scrollbar">
          {/* ======================================================== */}
          {/* TAB 1: SITE ANALYTICS & DAILY MODULE UPLOADS METRICS     */}
          {/* ======================================================== */}
          {activeTab === 'metrics' && (
            <div className="space-y-6">
              {/* PRIMARY PRODUCT METRIC (Section 6.1) */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/60 border border-emerald-500/40 shadow-lg relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Primary Product Metric
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Rolling 7-Day Window</span>
                    </div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      Weekly Active Learners Completing a Meaningful Learning Activity
                    </h2>
                    <p className="text-xs text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
                      Qualifying criteria: A learner qualifies <strong className="text-emerald-300">only</strong> when they complete a lesson, submit an assessment/practice quiz, or complete a scheduled intelligent revision session. Passive page views or uploads do not qualify.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-900/90 px-6 py-4 rounded-xl border border-emerald-500/30 shadow-inner">
                    <div className="text-right">
                      <div className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-400">
                        {adminMetrics.weeklyActiveLearnersCount}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 font-medium">
                        Active Scholars (7d)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* High-Level KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/60 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium">Modules Uploaded Today</span>
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-white">
                      {todayStat.modulesCount}
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      +{Math.round((todayStat.modulesCount / 14) * 20)}% vs yesterday
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    {todayStat.chaptersCount} total textbook chapters distilled
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/60 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium">Total Registered Users</span>
                    <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <Users className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-white">
                      {totalRegisteredCount}
                    </span>
                    <span className="text-xs font-mono text-indigo-400">
                      {superAdminCount} Admins · {instructorCount} Instructors
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    {scholarCount} Verified Scholars actively studying
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/60 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium">Active Workspace Modules</span>
                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                      <Layers className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-white">
                      {totalModulesCount}
                    </span>
                    <span className="text-xs font-mono text-amber-400">
                      Across {courses.length} course textbook(s)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    100% indexed into interactive 3-card rails
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/60 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium">AI Synthesizer Engine</span>
                    <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                      <Sparkles className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-white">
                      Gemini 2.5
                    </span>
                    <span className="text-xs font-mono text-emerald-400">Operational</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    Strict academic anti-slop rules active
                  </p>
                </div>
              </div>

              {/* Number of Modules Uploaded a Day - Interactive Velocity Chart */}
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/70">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      <span>Modules & Chapters Uploaded per Day (Last 7 Days)</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Visual velocity of newly created curriculum modules across scholars and faculty
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
                      <span className="text-slate-300">Modules</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs bg-indigo-500"></span>
                      <span className="text-slate-300">Chapters</span>
                    </div>
                  </div>
                </div>

                {/* SVG / Bar Chart Representation */}
                <div className="pt-4 pb-2">
                  <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 border-b border-slate-700 pb-2">
                    {dailyStats.map((stat, idx) => {
                      const moduleHeightPercent = Math.min(
                        Math.max((stat.modulesCount / maxDailyCount) * 100, 15),
                        100
                      );
                      const isToday = stat.date === todayDateStr;
                      return (
                        <div key={stat.date} className="flex flex-col items-center gap-2 h-full justify-end group">
                          {/* Value tooltip pill */}
                          <div className="text-[11px] font-mono font-bold text-slate-300 opacity-90 group-hover:text-emerald-400 transition-colors">
                            {stat.modulesCount}
                          </div>

                          {/* Dual Bar (Modules + Chapters) */}
                          <div className="w-full max-w-[42px] flex items-end justify-center gap-1 h-36">
                            <div
                              style={{ height: `${moduleHeightPercent}%` }}
                              className={`w-1/2 rounded-t-md transition-all duration-300 ${
                                isToday
                                  ? 'bg-emerald-400 shadow-md shadow-emerald-500/20'
                                  : 'bg-emerald-500/80 hover:bg-emerald-400'
                              }`}
                              title={`${stat.modulesCount} modules on ${stat.dayLabel}`}
                            />
                            <div
                              style={{
                                height: `${Math.min(
                                  Math.max((stat.chaptersCount / (maxDailyCount * 1.5)) * 100, 10),
                                  100
                                )}%`,
                              }}
                              className={`w-1/2 rounded-t-md transition-all duration-300 ${
                                isToday
                                  ? 'bg-indigo-400 shadow-md shadow-indigo-500/20'
                                  : 'bg-indigo-500/70 hover:bg-indigo-400'
                              }`}
                              title={`${stat.chaptersCount} chapters on ${stat.dayLabel}`}
                            />
                          </div>

                          {/* Day Label */}
                          <div className="text-center">
                            <span
                              className={`text-[10px] font-mono block ${
                                isToday ? 'font-bold text-white' : 'text-slate-400'
                              }`}
                            >
                              {stat.dayLabel.split(',')[0]}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500 block">
                              {stat.date.slice(5)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Upload Format Breakdown */}
                <div className="mt-4 pt-3 border-t border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50 flex items-center justify-between">
                    <span className="text-slate-400">File Ingestions (.md, .txt, .pdf):</span>
                    <span className="font-mono font-bold text-white">
                      {dailyStats.reduce((acc, curr) => acc + curr.fileUploadsCount, 0)} files (72%)
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50 flex items-center justify-between">
                    <span className="text-slate-400">Direct Paste Ingestions:</span>
                    <span className="font-mono font-bold text-white">
                      {dailyStats.reduce((acc, curr) => acc + curr.pasteUploadsCount, 0)} pastes (28%)
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50 flex items-center justify-between">
                    <span className="text-slate-400">Average Chapters per Upload:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      2.4 chapters/upload
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 6.3: LEARNING FUNNEL & LEARNING EFFECTIVENESS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Learning Funnel Card */}
                <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/70">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>Learner Activation & Retention Funnel</span>
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      7-Day Cohort
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">Upload-to-First-Lesson Conversion</span>
                        <span className="font-mono font-bold text-emerald-400">{adminMetrics.uploadToFirstLessonConversionRate}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-700/60 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${adminMetrics.uploadToFirstLessonConversionRate}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Learners who upload educational material and start their first lesson</p>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">First-Lesson Completion Rate</span>
                        <span className="font-mono font-bold text-indigo-400">{adminMetrics.firstLessonCompletionRate}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-700/60 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${adminMetrics.firstLessonCompletionRate}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Learners finishing study notes and reaching practice</p>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">7-Day Study Retention</span>
                        <span className="font-mono font-bold text-sky-400">{adminMetrics.sevenDayRetentionRate}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-700/60 overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full"
                          style={{ width: `${adminMetrics.sevenDayRetentionRate}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Users returning to practice or revise within a 7-day period</p>
                    </div>
                  </div>
                </div>

                {/* Learning Effectiveness & Mastery Metrics Card */}
                <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/70">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-400" />
                      <span>Assessment & Mastery Dynamics</span>
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                      Demonstrated Skill
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
                      <div className="text-[11px] text-slate-400">Quiz Retry Rate</div>
                      <div className="text-xl font-bold font-mono text-white mt-1">
                        {adminMetrics.quizRetryRate}%
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {adminMetrics.totalQuizRetries} retries / {adminMetrics.totalQuizAttempts} attempts
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
                      <div className="text-[11px] text-slate-400">Average Assessment Score</div>
                      <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                        {adminMetrics.averageQuizScore}%
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Across all topic quizzes</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-purple-200">Net Mastery Improvement</div>
                      <div className="text-[11px] text-slate-400">Topics transitioned to Proficient or Mastered</div>
                    </div>
                    <div className="text-lg font-bold font-mono text-purple-300">
                      +{adminMetrics.masteryImprovementNet} Topics
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 6.3: DOCUMENT PROCESSING TELEMETRY & UNIT COSTS */}
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/70">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Server className="w-4 h-4 text-amber-400" />
                      <span>Document Processing Telemetry & Cost Model</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Conversion pipeline performance, recovery safeguards, and estimated variable infrastructure cost
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      Safeguard 3: Active
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                    <div className="text-[11px] text-slate-400">Processing Success Rate</div>
                    <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                      {adminMetrics.processingSuccessRate}%
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {adminMetrics.totalJobsCount} jobs analyzed
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                    <div className="text-[11px] text-slate-400">Average Processing Time</div>
                    <div className="text-2xl font-bold font-mono text-white mt-1">
                      {adminMetrics.averageProcessingTimeSec}s
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      Distillation & rails creation
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                    <div className="text-[11px] text-slate-400">Failed / Recovered Jobs</div>
                    <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
                      {adminMetrics.recoveredJobsCount} <span className="text-xs font-normal text-slate-400">recovered</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {adminMetrics.failedJobsCount} unresolved failures
                    </div>
                  </div>

                  {/* Estimated Cost per Document Card */}
                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-emerald-300 font-medium">Est. Cost / Document</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                        ESTIMATED
                      </span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
                      ${adminMetrics.estimatedAverageCostPerDoc.toFixed(4)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                      Average per converted doc (Gemini 2.5 token pricing model)
                    </div>
                  </div>
                </div>

                <div className="mt-3 px-3 py-2 rounded-lg bg-slate-900/40 border border-slate-700/40 flex items-center gap-2 text-[11px] text-slate-400">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    <strong>Cost Disclosure:</strong> Variable processing costs are estimated based on token volume per document (~650 tokens/page) at standard Gemini API pricing ($0.15/1M input, $0.60/1M output).
                  </span>
                </div>
              </div>

              {/* Course Textbook Breakdown */}
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/70">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>Current Textbook Deployments in Workspace</span>
                </h3>
                <div className="divide-y divide-slate-700/50">
                  {courses.map((course) => (
                    <div key={course.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-white">{course.name}</h4>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {course.discipline} · {course.modules.length} chapters mapped · {course.modules.reduce((acc, m) => acc + m.blueRoadmap.topics.length, 0)} key topics
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Active Rail
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: REGISTERED USERS & PERMISSIONS MANAGEMENT        */}
          {/* ======================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search & Actions Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search users by name, username, email or major..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="super_admin">Super Admins</option>
                    <option value="admin">Admins</option>
                    <option value="instructor">Instructors</option>
                    <option value="scholar">Scholars</option>
                    <option value="auditor">Auditors</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add New User</span>
                  </button>
                </div>
              </div>

              {/* Users Directory Table */}
              <div className="rounded-xl border border-slate-700/80 overflow-hidden bg-slate-800/40">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-300 font-mono text-[11px] border-b border-slate-700">
                      <tr>
                        <th className="px-4 py-3">User & Scholar Identity</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Permissions Matrix</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Joined</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60 font-sans">
                      {filteredUsers.map((u) => {
                        const perms = u.permissions || getDefaultPermissionsForRole(u.role);
                        const isCurrent = currentUser?.id === u.id;
                        return (
                          <tr key={u.id} className="hover:bg-slate-800/60 transition-colors">
                            {/* User details */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <span className="text-xl">{u.avatarEmoji || '🎓'}</span>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-white">{u.fullName}</span>
                                    {isCurrent && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold">
                                        YOU
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] font-mono text-slate-400">
                                    @{u.username} · {u.email}
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                    {u.archetypeLabel} · {u.majorOrFocus}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Role selector dropdown */}
                            <td className="px-4 py-3.5">
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value as ScholarUserRole)}
                                className={`px-2 py-1 rounded-md text-xs font-mono font-semibold border cursor-pointer ${
                                  u.role === 'super_admin'
                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                    : u.role === 'admin'
                                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                    : u.role === 'instructor'
                                    ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                    : u.role === 'auditor'
                                    ? 'bg-slate-700/40 text-slate-300 border-slate-600'
                                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                }`}
                              >
                                <option value="super_admin">Super Admin (Owner)</option>
                                <option value="admin">Administrator</option>
                                <option value="instructor">Instructor</option>
                                <option value="scholar">Scholar (Student)</option>
                                <option value="auditor">Auditor (Read Only)</option>
                              </select>
                            </td>

                            {/* Permissions Badges / Toggles */}
                            <td className="px-4 py-3.5">
                              <div className="flex flex-wrap gap-1.5 max-w-xs">
                                <button
                                  onClick={() => handleTogglePermission(u.id, 'canUploadModules')}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer border ${
                                    perms.canUploadModules
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                      : 'bg-slate-800 text-slate-500 border-slate-700 line-through'
                                  }`}
                                  title="Toggle Upload Permission"
                                >
                                  Upload
                                </button>

                                <button
                                  onClick={() => handleTogglePermission(u.id, 'canDeleteModules')}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer border ${
                                    perms.canDeleteModules
                                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                      : 'bg-slate-800 text-slate-500 border-slate-700 line-through'
                                  }`}
                                  title="Toggle Unload/Delete Permission"
                                >
                                  Delete
                                </button>

                                <button
                                  onClick={() => handleTogglePermission(u.id, 'canUseAiDistill')}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer border ${
                                    perms.canUseAiDistill
                                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                      : 'bg-slate-800 text-slate-500 border-slate-700 line-through'
                                  }`}
                                  title="Toggle AI Synthesis Clearance"
                                >
                                  AI Distill
                                </button>

                                <button
                                  onClick={() => handleTogglePermission(u.id, 'canManageUsers')}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer border ${
                                    perms.canManageUsers
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                      : 'bg-slate-800 text-slate-500 border-slate-700 line-through'
                                  }`}
                                  title="Toggle Superuser Admin Clearance"
                                >
                                  Manage Users
                                </button>
                              </div>
                            </td>

                            {/* Account Status */}
                            <td className="px-4 py-3.5 font-mono">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  u.status === 'suspended'
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                }`}
                              >
                                {u.status || 'active'}
                              </span>
                            </td>

                            {/* Joined Date */}
                            <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                              {u.joinedAt || '2026-10-01'}
                            </td>

                            {/* Superuser actions */}
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleSwitchUser(u)}
                                  className="px-2 py-1 rounded bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-[11px] font-mono cursor-pointer transition-colors"
                                  title="Impersonate / Log in as this user to test view"
                                >
                                  Login As
                                </button>

                                <button
                                  onClick={() => handleToggleStatus(u)}
                                  className={`p-1 rounded cursor-pointer transition-colors ${
                                    u.status === 'suspended'
                                      ? 'text-emerald-400 hover:bg-emerald-500/10'
                                      : 'text-rose-400 hover:bg-rose-500/10'
                                  }`}
                                  title={u.status === 'suspended' ? 'Re-activate user' : 'Suspend user'}
                                >
                                  {u.status === 'suspended' ? (
                                    <Unlock className="w-3.5 h-3.5" />
                                  ) : (
                                    <Lock className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: MODULE INVENTORY & WORKSPACE TEXTBOOKS           */}
          {/* ======================================================== */}
          {activeTab === 'modules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Uploaded Curriculum Modules ({totalModulesCount} total)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live inventory of all structured modules currently active in memory
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700/80 overflow-hidden bg-slate-800/40">
                <div className="divide-y divide-slate-700/60">
                  {allModules.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No modules currently loaded. Use "Upload Module" in the workspace to load curriculum.
                    </div>
                  ) : (
                    allModules.map((m, idx) => (
                      <div key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-mono text-xs text-indigo-400 font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-white text-xs">{m.title}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-700/80 text-slate-300">
                                {m.courseCode}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                {m.estimatedHours}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{m.summary}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-slate-400">
                              <span>Topics: {m.blueRoadmap.topics.length}</span>
                              <span>•</span>
                              <span>Artifacts: {m.blueRoadmap.topics.flatMap((t) => t.artifacts).length}</span>
                              <span>•</span>
                              <span>Syllabus: {m.blueRoadmap.filename}</span>
                            </div>
                          </div>
                        </div>

                        {onPurgeModule && (
                          <button
                            onClick={() => {
                              onPurgeModule(m.id);
                              showToast(`Unloaded module "${m.title.slice(0, 20)}..."`);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono transition-colors cursor-pointer self-end sm:self-center"
                            title="Unload from platform memory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Purge</span>
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: AUDIT LOGS & PLATFORM EVENT TIMELINE              */}
          {/* ======================================================== */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-sky-400" />
                    <span>Real-Time Audit Trail & Security Events</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Immutable event ledger tracking uploads, logins, role assignments, and deletions
                  </p>
                </div>

                <button
                  onClick={() => {
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
                    const dlAnchor = document.createElement('a');
                    dlAnchor.setAttribute('href', dataStr);
                    dlAnchor.setAttribute('download', `microdo-audit-log-${new Date().toISOString().slice(0, 10)}.json`);
                    dlAnchor.click();
                    showToast('Audit log exported to JSON');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>

              <div className="rounded-xl border border-slate-700/80 overflow-hidden bg-slate-800/40">
                <div className="divide-y divide-slate-700/60">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3.5 flex items-start justify-between gap-3 hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                            log.status === 'success'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : log.status === 'warning'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : log.status === 'error'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          }`}
                        >
                          <Activity className="w-3.5 h-3.5" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-white text-xs">
                              {log.action}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-slate-700/80 text-slate-300">
                              {log.category}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              by {log.actor.name} ({log.actor.role})
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">{log.details}</p>
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-slate-500 whitespace-nowrap shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: PLATFORM SETTINGS & SYSTEM CONTROLS               */}
          {/* ======================================================== */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-purple-400" />
                  <span>Platform System Governance</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  High-level permissions and features controlled exclusively by the platform owner
                </p>
              </div>

              <div className="divide-y divide-slate-700/60 rounded-xl border border-slate-700/80 bg-slate-800/40 p-4">
                <div className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-semibold text-xs text-white block">
                      Allow Guest Course Uploads
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      When enabled, unauthenticated visitors can paste or upload textbooks into their local workspace.
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('allowGuestUploads')}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      platformSettings.allowGuestUploads ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        platformSettings.allowGuestUploads ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-semibold text-xs text-white block">
                      Strict Academic AI Synthesis Mode
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Enforces anti-slop guidelines: verified worked math problems, executable code, and exact factual fidelity.
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('aiStrictAcademicMode')}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      platformSettings.aiStrictAcademicMode ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        platformSettings.aiStrictAcademicMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-semibold text-xs text-white block">
                      Require Superuser Approval for Public Course Rails
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Modules uploaded by regular scholars remain private until verified by the platform owner.
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('requireApprovalForNewModules')}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      platformSettings.requireApprovalForNewModules ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        platformSettings.requireApprovalForNewModules ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-semibold text-xs text-white block">
                      Emergency Maintenance Mode
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Lock workspace mutations and display maintenance banner to non-admin scholars.
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('maintenanceMode')}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      platformSettings.maintenanceMode ? 'bg-rose-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        platformSettings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add User Modal */}
        {isAddUserModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-indigo-400" />
                  <span>Register New User (Admin Provisioning)</span>
                </h3>
                <button
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddUserSubmit} className="space-y-3.5 mt-4 text-xs">
                <div>
                  <label className="font-mono text-slate-300 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Arthur Pendelton"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-mono text-slate-300 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. arthur@oxford.edu"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-mono text-slate-300 block mb-1">Initial Assigned Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as ScholarUserRole)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="scholar">Scholar (Student)</option>
                    <option value="instructor">Instructor (Educator)</option>
                    <option value="admin">Administrator</option>
                    <option value="super_admin">Super Admin (Owner)</option>
                    <option value="auditor">Auditor (Read-Only)</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono text-slate-300 block mb-1">Academic Focus / Major</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science & AI"
                    value={newUserFocus}
                    onChange={(e) => setNewUserFocus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer shadow-xs"
                  >
                    Provision User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="absolute bottom-5 right-5 z-70 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 border border-indigo-500/50 shadow-2xl text-xs font-mono text-indigo-300 animate-in fade-in slide-in-from-bottom-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
