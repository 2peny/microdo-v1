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

const STORAGE_KEY_AUTH = 'microdo_current_scholar';

export function getStoredUser(): ScholarUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (!raw) return null;
    return JSON.parse(raw) as ScholarUser;
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
    // Authentication state remains authoritative in Firebase.
  }
}
