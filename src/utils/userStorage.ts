const LEGACY_STORAGE_KEYS = [
  'microdo_courses',
  'microdo_completed_artifacts',
  'microdo_continue_position',
  'microdo_analytics_events',
  'microdo_processing_jobs',
  'microdo_topic_mastery',
  'microdo_offline_queue',
  'microdo_study_goals',
  'microdo_studied_dates',
];
const LEGACY_STORAGE_CLEARED_KEY = 'microdo_unscoped_storage_cleared_v1';

let activeUserId: string | null = null;

function scopedKey(key: string): string | null {
  return activeUserId ? `${key}:${activeUserId}` : null;
}

export function setActiveStorageUser(userId: string | null): void {
  activeUserId = userId;
}

export function clearLegacyUnscopedStorage(): void {
  try {
    if (localStorage.getItem(LEGACY_STORAGE_CLEARED_KEY)) return;
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    localStorage.setItem(LEGACY_STORAGE_CLEARED_KEY, 'true');
  } catch {
    // Browser storage is optional; Firebase remains the authority for sign-in state.
  }
}

export function getUserStorageItem(key: string): string | null {
  try {
    const keyForUser = scopedKey(key);
    return keyForUser ? localStorage.getItem(keyForUser) : null;
  } catch {
    return null;
  }
}

export function setUserStorageItem(key: string, value: string): void {
  try {
    const keyForUser = scopedKey(key);
    if (keyForUser) localStorage.setItem(keyForUser, value);
  } catch {
    // A quota or privacy-mode failure must not interrupt learning.
  }
}

export function removeUserStorageItem(key: string): void {
  try {
    const keyForUser = scopedKey(key);
    if (keyForUser) localStorage.removeItem(keyForUser);
  } catch {
    // A storage failure must not interrupt learning.
  }
}