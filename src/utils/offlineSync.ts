import { recordAnalyticsEvent } from './analyticsEngine';

const STORAGE_KEY_OFFLINE_QUEUE = 'microdo_offline_queue';

export interface OfflineAction {
  id: string;
  type: 'complete_artifact' | 'quiz_attempt' | 'mastery_update';
  payload: any;
  timestamp: string;
}

export function getOfflineActionQueue(): OfflineAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OFFLINE_QUEUE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function queueOfflineAction(type: OfflineAction['type'], payload: any): void {
  const queue = getOfflineActionQueue();
  const action: OfflineAction = {
    id: `off-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type,
    payload,
    timestamp: new Date().toISOString(),
  };
  queue.push(action);
  try {
    localStorage.setItem(STORAGE_KEY_OFFLINE_QUEUE, JSON.stringify(queue));
  } catch {
    // Ignore error
  }
}

export function clearOfflineActionQueue(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_OFFLINE_QUEUE);
  } catch {
    // Ignore error
  }
}

export async function syncOfflineProgress(): Promise<{ syncedCount: number }> {
  const queue = getOfflineActionQueue();
  if (queue.length === 0) return { syncedCount: 0 };

  const count = queue.length;
  // Clear offline action queue
  clearOfflineActionQueue();

  // Record analytics event
  recordAnalyticsEvent('offline_progress_synced', {
    metadata: { syncedCount: count },
    isMeaningful: false,
  });

  return { syncedCount: count };
}

export function isDeviceOnline(): boolean {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  return true;
}

export const processOfflineQueue = syncOfflineProgress;
export const getOfflineQueue = getOfflineActionQueue;
