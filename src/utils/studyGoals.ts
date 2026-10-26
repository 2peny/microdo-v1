import { StudyGoals } from '../types';

const STORAGE_KEY_GOALS = 'microdo_study_goals';
const STORAGE_KEY_STUDIED_DATES = 'microdo_studied_dates';

export const DEFAULT_STUDY_GOALS: StudyGoals = {
  weeklyLessonsTarget: 5,
  studyDaysTarget: 4,
  targetMasteryLevel: 'Proficient',
  daysStudiedThisWeek: 2,
  lessonsCompletedThisWeek: 3,
};

export function getStudyGoals(): StudyGoals {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GOALS);
    if (!raw) return DEFAULT_STUDY_GOALS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STUDY_GOALS,
      ...parsed,
      daysStudiedThisWeek: getDaysStudiedThisWeek(),
      lessonsCompletedThisWeek: getLessonsCompletedThisWeek(),
    };
  } catch {
    return DEFAULT_STUDY_GOALS;
  }
}

export function saveStudyGoals(goals: Partial<StudyGoals>): StudyGoals {
  const current = getStudyGoals();
  const updated: StudyGoals = {
    ...current,
    ...goals,
  };
  try {
    localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(updated));
  } catch {
    // Graceful fallback
  }
  return updated;
}

export function recordStudyDay(): void {
  try {
    const today = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem(STORAGE_KEY_STUDIED_DATES);
    const dates: string[] = raw ? JSON.parse(raw) : [];
    if (!dates.includes(today)) {
      dates.push(today);
      localStorage.setItem(STORAGE_KEY_STUDIED_DATES, JSON.stringify(dates.slice(-60)));
    }
  } catch {
    // Graceful fallback
  }
}

function getDaysStudiedThisWeek(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDIED_DATES);
    if (!raw) return 2; // Baseline seed
    const dates: string[] = JSON.parse(raw);
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const count = dates.filter((d) => new Date(d) >= startOfWeek).length;
    return Math.max(count, 1);
  } catch {
    return 2;
  }
}

function getLessonsCompletedThisWeek(): number {
  try {
    const raw = localStorage.getItem('microdo_completed_artifacts');
    if (!raw) return 3; // Baseline seed
    const artifacts: string[] = JSON.parse(raw);
    return Math.max(artifacts.length, 3);
  } catch {
    return 3;
  }
}
