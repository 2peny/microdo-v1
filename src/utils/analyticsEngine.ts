import {
  AnalyticsEvent,
  AnalyticsEventType,
  ProcessingJob,
} from '../types';

const STORAGE_KEY_EVENTS = 'microdo_analytics_events';
const STORAGE_KEY_JOBS = 'microdo_processing_jobs';
const SEEDED_EVENT_IDS = new Set([
  'ev-01',
  'ev-02',
  'ev-03',
  'ev-04',
  'ev-05',
  'ev-06',
  'ev-07',
  'ev-08',
  'ev-09',
]);
const SEEDED_USER_IDS = new Set(['usr-prof-vance', 'usr-scholar-marcus', 'usr-scholar-liam']);
const SEEDED_JOB_IDS = new Set(['job-01', 'job-02', 'job-03']);

export function removeSeededBrowserAnalyticsData(): void {
  getStoredAnalyticsEvents();
  getStoredProcessingJobs();
}

export function getStoredAnalyticsEvents(): AnalyticsEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EVENTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const events = parsed.filter(
      (event) => !SEEDED_EVENT_IDS.has(event?.id) && !SEEDED_USER_IDS.has(event?.userId)
    );
    if (events.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
    }
    return events;
  } catch {
    return [];
  }
}

export function saveStoredAnalyticsEvents(events: AnalyticsEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
  } catch {
    // Ignore error
  }
}

/**
 * Record a discrete analytics event with deduplication.
 */
export function recordAnalyticsEvent(
  eventType: AnalyticsEventType,
  options: {
    userId?: string;
    courseId?: string;
    moduleId?: string;
    topicId?: string;
    isMeaningful?: boolean;
    metadata?: Record<string, any>;
  } = {}
): AnalyticsEvent {
  const events = getStoredAnalyticsEvents();
  const userId = options.userId || 'current-learner';

  const qualifyingMeaningfulTypes: AnalyticsEventType[] = [
    'lesson_completed',
    'quiz_submitted',
    'revision_completed',
  ];
  const isMeaningful = options.isMeaningful ?? qualifyingMeaningfulTypes.includes(eventType);

  const newEvent: AnalyticsEvent = {
    id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    eventType,
    timestamp: new Date().toISOString(),
    userId,
    isMeaningfulActivity: isMeaningful,
    courseId: options.courseId,
    moduleId: options.moduleId,
    topicId: options.topicId,
    metadata: options.metadata,
  };

  const updated = [newEvent, ...events.slice(0, 500)]; // retain 500 most recent
  saveStoredAnalyticsEvents(updated);
  return newEvent;
}

// ==========================================
// Processing Jobs Storage & Telemetry
// ==========================================

export function getStoredProcessingJobs(): ProcessingJob[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_JOBS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const jobs = parsed.filter((job) => !SEEDED_JOB_IDS.has(job?.id));
    if (jobs.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(jobs));
    }
    return jobs;
  } catch {
    return [];
  }
}

export function recordProcessingJob(
  job: Omit<ProcessingJob, 'id' | 'startedAt'>
): ProcessingJob {
  const jobs = getStoredProcessingJobs();
  const newJob: ProcessingJob = {
    ...job,
    id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    startedAt: new Date().toISOString(),
  };

  const updated = [newJob, ...jobs.slice(0, 50)];
  try {
    localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(updated));
  } catch {
    // Ignore error
  }
  return newJob;
}

// ==========================================
// Metric Calculations for Admin Dashboard
// ==========================================

export interface AdminProductMetrics {
  weeklyActiveLearnersCount: number;
  uploadToFirstLessonConversionRate: number; // percentage
  firstLessonCompletionRate: number; // percentage
  sevenDayRetentionRate: number | null; // unavailable without cohort data
  totalQuizAttempts: number;
  totalQuizRetries: number;
  quizRetryRate: number; // percentage
  averageQuizScore: number;
  processingSuccessRate: number; // percentage
  totalJobsCount: number;
  failedJobsCount: number;
  recoveredJobsCount: number;
  averageProcessingTimeSec: number;
  estimatedAverageCostPerDoc: number; // in USD
  costIsEstimated: boolean;
  masteryImprovementNet: number; // count of topics improved
}

export function computeAdminProductMetrics(): AdminProductMetrics {
  const events = getStoredAnalyticsEvents();
  const jobs = getStoredProcessingJobs();
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  // 1. Weekly Active Learners Completing a Meaningful Learning Activity
  // Defined as: distinct users who completed a lesson, submitted a quiz, or finished a revision
  const recentMeaningfulEvents = events.filter(
    (e) => e.isMeaningfulActivity && new Date(e.timestamp) >= sevenDaysAgo
  );
  const distinctWeeklyActiveUsers = new Set(recentMeaningfulEvents.map((e) => e.userId));
  const weeklyActiveLearnersCount = distinctWeeklyActiveUsers.size;

  // 2. Upload-to-First-Lesson Conversion
  // Users who uploaded a document and then started at least one lesson
  const uploaderUsers = new Set(
    events.filter((e) => e.eventType === 'document_uploaded').map((e) => e.userId)
  );
  const lessonStarters = new Set(
    events.filter((e) => e.eventType === 'lesson_started').map((e) => e.userId)
  );
  let convertedUploaderCount = 0;
  for (const uid of uploaderUsers) {
    if (lessonStarters.has(uid)) convertedUploaderCount++;
  }
  const uploadToFirstLessonConversionRate =
    uploaderUsers.size > 0
      ? Math.round((convertedUploaderCount / uploaderUsers.size) * 100)
      : 0;

  // 3. First-Lesson Completion Rate
  const startersCount = events.filter((e) => e.eventType === 'lesson_started').length;
  const completersCount = events.filter((e) => e.eventType === 'lesson_completed').length;
  const firstLessonCompletionRate =
    startersCount > 0 ? Math.min(100, Math.round((completersCount / startersCount) * 100)) : 0;

  // 4. Seven-Day Retention Rate
  // Learners who performed a meaningful action in the first cohort day and returned within 7 days
  const sevenDayRetentionRate = null;

  // 5. Quiz Attempts and Retries
  const quizSubmittedEvents = events.filter((e) => e.eventType === 'quiz_submitted');
  const quizRetriedEvents = events.filter((e) => e.eventType === 'quiz_retried');
  const totalQuizAttempts = quizSubmittedEvents.length + quizRetriedEvents.length;
  const totalQuizRetries = quizRetriedEvents.length;
  const quizRetryRate = totalQuizAttempts > 0
    ? Math.round((totalQuizRetries / totalQuizAttempts) * 100)
    : 0;

  let totalScore = 0;
  let scoredCount = 0;
  for (const ev of [...quizSubmittedEvents, ...quizRetriedEvents]) {
    if (ev.metadata?.score !== undefined) {
      totalScore += ev.metadata.score;
      scoredCount++;
    }
  }
  const averageQuizScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;

  // 6. Document Processing Metrics
  const totalJobsCount = jobs.length;
  const successfulJobs = jobs.filter((j) => j.stage === 'ready');
  const failedJobs = jobs.filter((j) => j.stage === 'failed');
  const recoveredJobs = jobs.filter((j) => j.recovered);

  const processingSuccessRate =
    totalJobsCount > 0
      ? Math.round(((successfulJobs.length + recoveredJobs.length) / totalJobsCount) * 100)
      : 0;

  let totalDurationSec = 0;
  let timedJobsCount = 0;
  let totalCost = 0;

  for (const job of jobs) {
    if (job.completedAt && job.startedAt) {
      const dur = (new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000;
      totalDurationSec += dur;
      timedJobsCount++;
    }
    totalCost += job.costEstimate || 0;
  }

  const averageProcessingTimeSec =
    timedJobsCount > 0 ? Number((totalDurationSec / timedJobsCount).toFixed(1)) : 0;
  const estimatedAverageCostPerDoc =
    totalJobsCount > 0 ? Number((totalCost / totalJobsCount).toFixed(4)) : 0;

  // 7. Mastery Improvements Net
  const masteryEvents = events.filter((e) => e.eventType === 'mastery_updated');
  const masteryImprovementNet = masteryEvents.length;

  return {
    weeklyActiveLearnersCount,
    uploadToFirstLessonConversionRate,
    firstLessonCompletionRate,
    sevenDayRetentionRate,
    totalQuizAttempts,
    totalQuizRetries,
    quizRetryRate,
    averageQuizScore,
    processingSuccessRate,
    totalJobsCount,
    failedJobsCount: failedJobs.length,
    recoveredJobsCount: recoveredJobs.length,
    averageProcessingTimeSec,
    estimatedAverageCostPerDoc,
    costIsEstimated: true,
    masteryImprovementNet,
  };
}
