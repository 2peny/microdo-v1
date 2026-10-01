import { ScholarUser, ScholarArchetype } from '../types';

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

export const DEMO_SCHOLARS: ScholarUser[] = [
  {
    id: 'usr-001',
    username: 'ada.lovelace',
    email: 'ada@nodegrid.space',
    fullName: 'Countess Ada Lovelace',
    archetype: 'caffeine_alchemist',
    archetypeLabel: 'Caffeine Alchemist',
    avatarEmoji: '☕',
    majorOrFocus: 'Analytical Engines & Computation',
    joinedAt: '2026-01-15',
    role: 'scholar',
  },
  {
    id: 'usr-002',
    username: 'alan.turing',
    email: 'alan@nodegrid.space',
    fullName: 'Dr. Alan Turing',
    archetype: 'formula_crafter',
    archetypeLabel: 'Formula Crafter',
    avatarEmoji: '📐',
    majorOrFocus: 'Cryptography & Morphogenesis',
    joinedAt: '2026-02-01',
    role: 'instructor',
  },
  {
    id: 'usr-003',
    username: 'curious.scholar',
    email: 'student@nodegrid.space',
    fullName: 'Alex Vance',
    archetype: 'midnight_owl',
    archetypeLabel: 'Midnight Synthesizer',
    avatarEmoji: '🦉',
    majorOrFocus: 'Computer Systems & Bio-Informatics',
    joinedAt: '2026-03-01',
    role: 'scholar',
  },
];

const STORAGE_KEY_AUTH = 'microdo_current_scholar';
const STORAGE_KEY_USERS = 'microdo_all_registered_users';

export function getStoredUser(): ScholarUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (!raw) return DEMO_SCHOLARS[2]; // Default to student@nodegrid.space
    return JSON.parse(raw);
  } catch {
    return DEMO_SCHOLARS[2];
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
    if (!raw) return DEMO_SCHOLARS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Fallback
  }
  return DEMO_SCHOLARS;
}

export function registerScholarUser(userData: Omit<ScholarUser, 'id' | 'joinedAt'>): ScholarUser {
  const all = getAllRegisteredUsers();
  const newUser: ScholarUser = {
    ...userData,
    id: `usr-${Date.now().toString(36)}`,
    joinedAt: new Date().toISOString().split('T')[0],
  };

  const updated = [newUser, ...all.filter(u => u.username !== newUser.username && u.email !== newUser.email)];
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(newUser));
  } catch {
    // Ignore error
  }
  return newUser;
}
