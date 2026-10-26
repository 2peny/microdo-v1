import { ScholarUser, ScholarArchetype, ScholarUserRole, UserPermissions, DailyUploadStat, AuditLogEntry, PlatformSystemSettings } from '../types';

export interface ArchetypeDetail {
  id: ScholarArchetype;
  label: string;
  emoji: string;
  motto: string;
  trait: string;
  badgeColor: string;
}

export const ARCHETYPES: Record<ScholarArchetype, ArchetypeDetail> = {
  caffeine_alchemist: {
    id: 'caffeine_alchemist',
    label: 'Caffeine Alchemist',
    emoji: '☕',
    motto: 'Transmutes roasted beans into mathematical proofs.',
    trait: '+15% Late night speed',
    badgeColor: 'amber',
  },
  midnight_owl: {
    id: 'midnight_owl',
    label: 'Midnight Synthesizer',
    emoji: '🦉',
    motto: 'Brain peaks between 1:00 AM and 4:30 AM.',
    trait: '+20% Deep focus stamina',
    badgeColor: 'indigo',
  },
  deep_monk: {
    id: 'deep_monk',
    label: 'Deep Focus Monk',
    emoji: '🧘',
    motto: 'Zero notifications. Zero multitasking. Pure synthesis.',
    trait: '+25% Concept retention',
    badgeColor: 'emerald',
  },
  speed_runner: {
    id: 'speed_runner',
    label: 'Sprint Speedrunner',
    emoji: '⚡',
    motto: 'Finishes full course syllabus before dawn.',
    trait: '+30% Rapid review rate',
    badgeColor: 'sky',
  },
  formula_crafter: {
    id: 'formula_crafter',
    label: 'Formula Crafter',
    emoji: '📐',
    motto: 'Dreams in LaTeX syntax, ASCII trees, and pure logic.',
    trait: '+20% Proof & code rigor',
    badgeColor: 'violet',
  },
};

const STORAGE_KEY_AUTH = 'microdo_current_scholar';
const STORAGE_KEY_USERS = 'microdo_all_registered_users';
const STORAGE_KEY_DAILY_STATS = 'microdo_daily_upload_stats';
const STORAGE_KEY_AUDIT_LOGS = 'microdo_audit_logs';
const STORAGE_KEY_SETTINGS = 'microdo_platform_settings';

export function getDefaultPermissionsForRole(role: ScholarUserRole): UserPermissions {
  switch (role) {
    case 'super_admin':
      return {
        canUploadModules: true,
        canDeleteModules: true,
        canUseAiDistill: true,
        canManageUsers: true,
        canViewAnalytics: true,
        isSuperUser: true,
      };
    case 'admin':
      return {
        canUploadModules: true,
        canDeleteModules: true,
        canUseAiDistill: true,
        canManageUsers: true,
        canViewAnalytics: true,
        isSuperUser: false,
      };
    case 'instructor':
      return {
        canUploadModules: true,
        canDeleteModules: true,
        canUseAiDistill: true,
        canManageUsers: false,
        canViewAnalytics: true,
        isSuperUser: false,
      };
    case 'auditor':
      return {
        canUploadModules: false,
        canDeleteModules: false,
        canUseAiDistill: false,
        canManageUsers: false,
        canViewAnalytics: true,
        isSuperUser: false,
      };
    case 'scholar':
    default:
      return {
        canUploadModules: true,
        canDeleteModules: false,
        canUseAiDistill: true,
        canManageUsers: false,
        canViewAnalytics: false,
        isSuperUser: false,
      };
  }
}

export const INITIAL_REGISTERED_USERS: ScholarUser[] = [
  {
    id: 'usr-owner-001',
    username: 'owner',
    email: 'owner@microdo.space',
    fullName: 'Platform Owner (Superuser)',
    archetype: 'deep_monk',
    archetypeLabel: 'Deep Focus Monk',
    avatarEmoji: '👑',
    majorOrFocus: 'Platform Architecture & Research',
    joinedAt: '2026-09-01',
    role: 'super_admin',
    status: 'active',
    lastActive: 'Just now',
    modulesUploadedCount: 42,
    permissions: getDefaultPermissionsForRole('super_admin'),
  },
  {
    id: 'usr-prof-vance',
    username: 'prof_vance',
    email: 'k.vance@stanford.edu',
    fullName: 'Prof. Katherine Vance',
    archetype: 'formula_crafter',
    archetypeLabel: 'Formula Crafter',
    avatarEmoji: '📐',
    majorOrFocus: 'Discrete Mathematics & Algorithms',
    joinedAt: '2026-09-15',
    role: 'instructor',
    status: 'active',
    lastActive: '2 hours ago',
    modulesUploadedCount: 18,
    permissions: getDefaultPermissionsForRole('instructor'),
  },
  {
    id: 'usr-scholar-marcus',
    username: 'marcus_b',
    email: 'm.brody@mit.edu',
    fullName: 'Marcus Brody',
    archetype: 'midnight_owl',
    archetypeLabel: 'Midnight Synthesizer',
    avatarEmoji: '🦉',
    majorOrFocus: 'Quantum Physics & Electrodynamics',
    joinedAt: '2026-10-02',
    role: 'scholar',
    status: 'active',
    lastActive: '34 mins ago',
    modulesUploadedCount: 6,
    permissions: getDefaultPermissionsForRole('scholar'),
  },
  {
    id: 'usr-dr-elena',
    username: 'dr_elena',
    email: 'e.rostova@cambridge.ac.uk',
    fullName: 'Dr. Elena Rostova',
    archetype: 'deep_monk',
    archetypeLabel: 'Deep Focus Monk',
    avatarEmoji: '🧬',
    majorOrFocus: 'Molecular Biology & Bioinformatics',
    joinedAt: '2026-10-05',
    role: 'instructor',
    status: 'active',
    lastActive: '1 day ago',
    modulesUploadedCount: 12,
    permissions: getDefaultPermissionsForRole('instructor'),
  },
  {
    id: 'usr-scholar-liam',
    username: 'liam_systems',
    email: 'l.chen@berkeley.edu',
    fullName: 'Liam Chen',
    archetype: 'speed_runner',
    archetypeLabel: 'Sprint Speedrunner',
    avatarEmoji: '⚡',
    majorOrFocus: 'Computer Systems & Cache Architecture',
    joinedAt: '2026-10-08',
    role: 'scholar',
    status: 'active',
    lastActive: '5 hours ago',
    modulesUploadedCount: 9,
    permissions: getDefaultPermissionsForRole('scholar'),
  },
  {
    id: 'usr-auditor-zara',
    username: 'zara_patel',
    email: 'zara.patel@oxford.edu',
    fullName: 'Zara Patel',
    archetype: 'caffeine_alchemist',
    archetypeLabel: 'Caffeine Alchemist',
    avatarEmoji: '☕',
    majorOrFocus: 'Higher Education Curriculum Audit',
    joinedAt: '2026-10-10',
    role: 'auditor',
    status: 'active',
    lastActive: '3 days ago',
    modulesUploadedCount: 0,
    permissions: getDefaultPermissionsForRole('auditor'),
  },
];

export function getStoredUser(): ScholarUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredUser(user: ScholarUser | null): void {
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } else {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
    }
  } catch {
    // LocalStorage fallback
  }
}

export function getAllRegisteredUsers(): ScholarUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(INITIAL_REGISTERED_USERS));
      return INITIAL_REGISTERED_USERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure all users have permissions populated
      const hydrated = parsed.map((u: ScholarUser) => ({
        ...u,
        permissions: u.permissions || getDefaultPermissionsForRole(u.role || 'scholar'),
      }));
      return hydrated;
    }
  } catch {
    // Fallback
  }
  return INITIAL_REGISTERED_USERS;
}

export function saveAllRegisteredUsers(users: ScholarUser[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch {
    // Fallback
  }
}

export function updateUserRole(userId: string, newRole: ScholarUserRole): ScholarUser[] {
  const users = getAllRegisteredUsers();
  const defaultPerms = getDefaultPermissionsForRole(newRole);
  const updated = users.map((u) => {
    if (u.id === userId) {
      return {
        ...u,
        role: newRole,
        permissions: {
          ...defaultPerms,
          isSuperUser: newRole === 'super_admin',
        },
      };
    }
    return u;
  });
  saveAllRegisteredUsers(updated);

  // If current logged-in user was modified, update their session too
  const current = getStoredUser();
  if (current && current.id === userId) {
    const modified = updated.find((u) => u.id === userId);
    if (modified) saveStoredUser(modified);
  }

  recordAuditLog(
    'ROLE_UPDATED',
    'security',
    `Updated role to "${newRole}" for user ID ${userId}`,
    { name: 'Platform Owner', email: 'owner@microdo.space', role: 'super_admin' },
    'success'
  );

  return updated;
}

export function updateUserPermissions(userId: string, permissions: Partial<UserPermissions>): ScholarUser[] {
  const users = getAllRegisteredUsers();
  const updated = users.map((u) => {
    if (u.id === userId) {
      return {
        ...u,
        permissions: {
          ...(u.permissions || getDefaultPermissionsForRole(u.role)),
          ...permissions,
        },
      };
    }
    return u;
  });
  saveAllRegisteredUsers(updated);

  const current = getStoredUser();
  if (current && current.id === userId) {
    const modified = updated.find((u) => u.id === userId);
    if (modified) saveStoredUser(modified);
  }

  recordAuditLog(
    'PERMISSIONS_UPDATED',
    'security',
    `Customized permissions for user ID ${userId}`,
    { name: 'Platform Owner', email: 'owner@microdo.space', role: 'super_admin' },
    'info'
  );

  return updated;
}

export function updateUserStatus(userId: string, status: 'active' | 'suspended' | 'pending'): ScholarUser[] {
  const users = getAllRegisteredUsers();
  const updated = users.map((u) => (u.id === userId ? { ...u, status } : u));
  saveAllRegisteredUsers(updated);

  recordAuditLog(
    'USER_STATUS_CHANGED',
    'user',
    `Status changed to "${status}" for user ID ${userId}`,
    { name: 'Platform Owner', email: 'owner@microdo.space', role: 'super_admin' },
    status === 'suspended' ? 'warning' : 'info'
  );

  return updated;
}

export function addNewUserByAdmin(data: {
  fullName: string;
  email: string;
  username: string;
  role: ScholarUserRole;
  archetype?: ScholarArchetype;
  majorOrFocus?: string;
}): ScholarUser {
  const all = getAllRegisteredUsers();
  const archetype = data.archetype || 'midnight_owl';
  const detail = ARCHETYPES[archetype];
  const newUser: ScholarUser = {
    id: `usr-${Date.now().toString(36)}`,
    fullName: data.fullName.trim(),
    email: data.email.trim(),
    username: data.username.trim(),
    archetype,
    archetypeLabel: detail.label,
    avatarEmoji: data.role === 'super_admin' ? '👑' : detail.emoji,
    majorOrFocus: data.majorOrFocus?.trim() || 'General Academics',
    joinedAt: new Date().toISOString().split('T')[0],
    role: data.role,
    status: 'active',
    lastActive: 'Never',
    modulesUploadedCount: 0,
    permissions: getDefaultPermissionsForRole(data.role),
  };

  const updated = [newUser, ...all];
  saveAllRegisteredUsers(updated);

  recordAuditLog(
    'USER_CREATED',
    'user',
    `Superuser registered new user "${newUser.fullName}" (${newUser.role})`,
    { name: 'Platform Owner', email: 'owner@microdo.space', role: 'super_admin' },
    'success'
  );

  return newUser;
}

export function authenticateUser(identifier: string, password: string): ScholarUser | null {
  const all = getAllRegisteredUsers();
  const clean = identifier.trim().toLowerCase();
  const user = all.find(
    (u) => u.email.toLowerCase() === clean || u.username.toLowerCase() === clean
  );
  if (user) {
    saveStoredUser(user);
    recordAuditLog(
      'USER_LOGIN',
      'user',
      `User ${user.fullName} logged into platform`,
      { name: user.fullName, email: user.email, role: user.role },
      'success'
    );
    return user;
  }
  return null;
}

export function registerScholarUser(userData: Omit<ScholarUser, 'id' | 'joinedAt'>): ScholarUser {
  const all = getAllRegisteredUsers();
  const newUser: ScholarUser = {
    ...userData,
    id: `usr-${Date.now().toString(36)}`,
    joinedAt: new Date().toISOString().split('T')[0],
    status: 'active',
    lastActive: 'Just now',
    modulesUploadedCount: 0,
    permissions: userData.permissions || getDefaultPermissionsForRole(userData.role || 'scholar'),
  };

  const updated = [newUser, ...all.filter(u => u.username !== newUser.username && u.email !== newUser.email)];
  saveAllRegisteredUsers(updated);
  saveStoredUser(newUser);

  recordAuditLog(
    'USER_REGISTERED',
    'user',
    `New scholar registered: ${newUser.fullName} (${newUser.email})`,
    { name: newUser.fullName, email: newUser.email, role: newUser.role },
    'success'
  );

  return newUser;
}

// ==========================================
// Daily Upload Statistics & Metrics Tracking
// ==========================================

export function getDailyUploadStats(): DailyUploadStat[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DAILY_STATS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fallback
  }

  // Generate realistic recent 7-day data baseline
  const now = new Date();
  const stats: DailyUploadStat[] = [];
  const counts = [4, 7, 3, 11, 8, 14, 18]; // Daily trend culminating in today
  const chapters = [4, 12, 5, 23, 15, 26, 31];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const idx = 6 - i;
    stats.push({
      date: dateStr,
      dayLabel,
      modulesCount: counts[idx],
      chaptersCount: chapters[idx],
      fileUploadsCount: Math.ceil(counts[idx] * 0.7),
      pasteUploadsCount: Math.floor(counts[idx] * 0.3),
    });
  }

  try {
    localStorage.setItem(STORAGE_KEY_DAILY_STATS, JSON.stringify(stats));
  } catch {
    // Fallback
  }
  return stats;
}

export function recordModuleUploadStat(modulesCount: number, chaptersCount: number, isFile: boolean): void {
  const stats = getDailyUploadStats();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const existingIdx = stats.findIndex((s) => s.date === todayStr);
  if (existingIdx >= 0) {
    stats[existingIdx].modulesCount += modulesCount;
    stats[existingIdx].chaptersCount += chaptersCount;
    if (isFile) {
      stats[existingIdx].fileUploadsCount += modulesCount;
    } else {
      stats[existingIdx].pasteUploadsCount += modulesCount;
    }
  } else {
    stats.push({
      date: todayStr,
      dayLabel: todayLabel,
      modulesCount,
      chaptersCount,
      fileUploadsCount: isFile ? modulesCount : 0,
      pasteUploadsCount: isFile ? 0 : modulesCount,
    });
  }

  try {
    localStorage.setItem(STORAGE_KEY_DAILY_STATS, JSON.stringify(stats));
  } catch {
    // Fallback
  }

  // Also post event to backend for logging
  try {
    fetch('/api/admin/log-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'MODULE_UPLOADED',
        category: 'module',
        details: `Uploaded ${modulesCount} module(s) (${chaptersCount} chapters) via ${isFile ? 'File Upload' : 'Text Paste'}`,
      }),
    }).catch(() => {});
  } catch {
    // Ignore error
  }
}

// ==========================================
// Audit Logs & Activity Feed
// ==========================================

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    action: 'MODULE_UPLOADED',
    category: 'module',
    actor: { name: 'Platform Owner', email: 'owner@microdo.space', role: 'super_admin' },
    details: 'Uploaded "CK-12 Algebra I" 13-chapter textbook with golden rules and formula tables',
    status: 'success',
  },
  {
    id: 'log-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    action: 'USER_REGISTERED',
    category: 'user',
    actor: { name: 'Zara Patel', email: 'zara.patel@oxford.edu', role: 'auditor' },
    details: 'New Auditor registered with read-only inspection clearance',
    status: 'info',
  },
  {
    id: 'log-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    action: 'PERMISSIONS_UPDATED',
    category: 'security',
    actor: { name: 'Platform Owner', email: 'owner@microdo.space', role: 'super_admin' },
    details: 'Promoted Prof. Katherine Vance to Instructor with module authoring clearance',
    status: 'success',
  },
  {
    id: 'log-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    action: 'AI_SYNTHESIS_COMPLETED',
    category: 'system',
    actor: { name: 'Marcus Brody', email: 'm.brody@mit.edu', role: 'scholar' },
    details: 'Synthesized 3-tier study artifact for Quantum Electrodynamics (2,410 tokens)',
    status: 'success',
  },
  {
    id: 'log-005',
    timestamp: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    action: 'UNLOAD_MODULE',
    category: 'module',
    actor: { name: 'Platform Owner', email: 'owner@microdo.space', role: 'super_admin' },
    details: 'Purged temporary scratch module from server memory and localStorage cache',
    status: 'warning',
  },
];

export function getAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fallback
  }
  return INITIAL_AUDIT_LOGS;
}

export function recordAuditLog(
  action: string,
  category: 'module' | 'user' | 'security' | 'system',
  details: string,
  actor?: { name: string; email: string; role: string },
  status: 'success' | 'warning' | 'info' | 'error' = 'info'
): void {
  const currentLogs = getAuditLogs();
  const currentActor = actor || {
    name: 'Platform Owner',
    email: 'owner@microdo.space',
    role: 'super_admin',
  };

  const newLog: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    action,
    category,
    actor: currentActor,
    details,
    status,
  };

  const updated = [newLog, ...currentLogs.slice(0, 100)]; // keep 100 recent
  try {
    localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(updated));
  } catch {
    // Fallback
  }
}

// ==========================================
// Platform System Settings
// ==========================================

export const DEFAULT_PLATFORM_SETTINGS: PlatformSystemSettings = {
  allowGuestUploads: true,
  aiStrictAcademicMode: true,
  maxDailyUploadsPerUser: 25,
  maintenanceMode: false,
  requireApprovalForNewModules: false,
  defaultNewUserRole: 'scholar',
};

export function getPlatformSettings(): PlatformSystemSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch {
    // Fallback
  }
  return DEFAULT_PLATFORM_SETTINGS;
}

export function savePlatformSettings(settings: PlatformSystemSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch {
    // Fallback
  }
  recordAuditLog(
    'SETTINGS_UPDATED',
    'system',
    'Platform governance settings updated by Superuser',
    { name: 'Platform Owner', email: 'owner@microdo.space', role: 'super_admin' },
    'info'
  );
}
