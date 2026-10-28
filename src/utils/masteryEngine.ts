import {
  MasteryState,
  TopicMasteryRecord,
  QuizAttemptRecord,
  StudyDirectoryCourse,
} from '../types';
import { recordAnalyticsEvent } from './analyticsEngine';
import { getUserStorageItem, setUserStorageItem } from './userStorage';

const STORAGE_KEY_MASTERY = 'microdo_topic_mastery';

export const MASTERY_THRESHOLDS = {
  NOT_STARTED: 0,
  LEARNING_MIN: 1,
  NEEDS_PRACTICE_MIN: 45,
  PROFICIENT_MIN: 70,
  MASTERED_MIN: 85,
};

export const MASTERY_COLORS: Record<
  MasteryState,
  { label: string; bg: string; text: string; border: string; badge: string; dot: string }
> = {
  'Not Started': {
    label: 'Not Started',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  },
  Learning: {
    label: 'Learning',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  'Needs Practice': {
    label: 'Needs Practice',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  Proficient: {
    label: 'Proficient',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  Mastered: {
    label: 'Mastered',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
  },
};

export function getAllMasteryRecords(): Record<string, TopicMasteryRecord> {
  try {
    const raw = getUserStorageItem(STORAGE_KEY_MASTERY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function saveAllMasteryRecords(records: Record<string, TopicMasteryRecord>): void {
  try {
    setUserStorageItem(STORAGE_KEY_MASTERY, JSON.stringify(records));
  } catch {
    // Graceful fallback
  }
}

export function getTopicMastery(
  topicId: string,
  courseId: string = 'default-course',
  moduleId: string = 'default-module'
): TopicMasteryRecord {
  const all = getAllMasteryRecords();
  if (all[topicId]) {
    return all[topicId];
  }
  return {
    topicId,
    courseId,
    moduleId,
    state: 'Not Started',
    score: 0,
    attemptsCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    consecutiveCorrect: 0,
    lastAssessedAt: null,
    lastRevisionAt: null,
    nextRevisionDue: null,
    revisionIntervalDays: 1,
    history: [],
  };
}

/**
 * Calculates Mastery State based on assessment rules:
 * - Never award mastery simply for viewing or completing reading.
 * - Requires verified quiz attempts.
 * - Mastered requires score >= 85 and either multiple consecutive correct answers or a successful revision.
 */
export function calculateMasteryState(
  score: number,
  attemptsCount: number,
  incorrectCount: number,
  consecutiveCorrect: number,
  isRevisionPassed: boolean
): MasteryState {
  if (attemptsCount === 0 || score === 0) {
    return 'Not Started';
  }

  if (score >= MASTERY_THRESHOLDS.MASTERED_MIN && (consecutiveCorrect >= 2 || isRevisionPassed)) {
    return 'Mastered';
  }

  if (score >= MASTERY_THRESHOLDS.PROFICIENT_MIN) {
    return 'Proficient';
  }

  if (incorrectCount > 0 && score < MASTERY_THRESHOLDS.PROFICIENT_MIN) {
    return 'Needs Practice';
  }

  if (score >= MASTERY_THRESHOLDS.LEARNING_MIN) {
    return 'Learning';
  }

  return 'Not Started';
}

/**
 * Record a Quiz Attempt and update Topic Mastery using the defined scoring model.
 */
export function recordQuizAttempt(
  topicId: string,
  courseId: string,
  moduleId: string,
  isCorrect: boolean,
  selectedOptionIndex: number,
  isRetry: boolean = false,
  isRevision: boolean = false
): {
  record: TopicMasteryRecord;
  stateChanged: boolean;
  oldState: MasteryState;
  newState: MasteryState;
} {
  const all = getAllMasteryRecords();
  const current = getTopicMastery(topicId, courseId, moduleId);
  const oldState = current.state;

  const now = new Date();
  const nowIso = now.toISOString();

  const newAttempt: QuizAttemptRecord = {
    attemptId: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: nowIso,
    selectedOptionIndex,
    isCorrect,
    isRetry,
    attemptNumber: current.attemptsCount + 1,
  };

  let newScore = current.score;
  let newConsecutive = isCorrect ? current.consecutiveCorrect + 1 : 0;
  const newAttemptsCount = current.attemptsCount + 1;
  const newCorrectCount = isCorrect ? current.correctCount + 1 : current.correctCount;
  const newIncorrectCount = !isCorrect ? current.incorrectCount + 1 : current.incorrectCount;

  if (isCorrect) {
    if (!isRetry && current.attemptsCount === 0) {
      // First attempt correct: high yield
      newScore = 75;
    } else if (!isRetry) {
      // Subsequent genuine attempt
      newScore = Math.min(100, current.score + 20);
    } else {
      // Retry attempt: partial mastery progression
      // Avoid awarding 100% simply by retrying the same question repeatedly
      const retryGain = current.score < 60 ? 15 : 8;
      newScore = Math.min(84, current.score + retryGain); // capped below Mastered on immediate retry without revision
    }

    if (isRevision) {
      // Passed a scheduled revision: validates genuine retention
      newScore = Math.min(100, Math.max(85, newScore + 15));
    }
  } else {
    // Incorrect answer: reduces mastery and flags for practice
    newScore = Math.max(25, current.score - 25);
  }

  // Calculate Next Revision Interval using Spaced Repetition (SuperMemo-2 inspired)
  let nextInterval = current.revisionIntervalDays;
  if (isCorrect) {
    if (nextInterval === 1) nextInterval = 3;
    else if (nextInterval === 3) nextInterval = 7;
    else if (nextInterval === 7) nextInterval = 14;
    else nextInterval = 30;
  } else {
    nextInterval = 1; // reset to 1 day on mistake
  }

  const nextDueDate = new Date(now);
  nextDueDate.setDate(nextDueDate.getDate() + nextInterval);

  const newState = calculateMasteryState(
    newScore,
    newAttemptsCount,
    newIncorrectCount,
    newConsecutive,
    isRevision && isCorrect
  );

  const updatedRecord: TopicMasteryRecord = {
    topicId,
    courseId,
    moduleId,
    state: newState,
    score: Math.round(newScore),
    attemptsCount: newAttemptsCount,
    correctCount: newCorrectCount,
    incorrectCount: newIncorrectCount,
    consecutiveCorrect: newConsecutive,
    lastAssessedAt: nowIso,
    lastRevisionAt: isRevision ? nowIso : current.lastRevisionAt,
    nextRevisionDue: nextDueDate.toISOString(),
    revisionIntervalDays: nextInterval,
    history: [newAttempt, ...current.history].slice(0, 30),
  };

  all[topicId] = updatedRecord;
  saveAllMasteryRecords(all);

  // Track Analytics Events
  recordAnalyticsEvent(isRetry ? 'quiz_retried' : 'quiz_submitted', {
    courseId,
    moduleId,
    topicId,
    isMeaningful: true,
    metadata: {
      isCorrect,
      score: newScore,
    },
  });

  if (oldState !== newState) {
    recordAnalyticsEvent('mastery_updated', {
      courseId,
      moduleId,
      topicId,
      metadata: {
        oldState,
        newState,
        score: newScore,
      },
    });
  }

  return {
    record: updatedRecord,
    stateChanged: oldState !== newState,
    oldState,
    newState,
  };
}

/**
 * Summarize mastery across an entire course.
 */
export function computeCourseMasterySummary(
  course: StudyDirectoryCourse,
  allMastery: Record<string, TopicMasteryRecord>
) {
  const allTopics = course.modules.flatMap((m) => m.blueRoadmap.topics);
  const totalTopics = allTopics.length;

  let masteredCount = 0;
  let proficientCount = 0;
  let needsPracticeCount = 0;
  let learningCount = 0;
  let notStartedCount = 0;
  let totalScore = 0;

  for (const topic of allTopics) {
    const record = allMastery[topic.id];
    if (!record || record.attemptsCount === 0 || record.state === 'Not Started') {
      notStartedCount++;
    } else if (record.state === 'Mastered') {
      masteredCount++;
      totalScore += record.score;
    } else if (record.state === 'Proficient') {
      proficientCount++;
      totalScore += record.score;
    } else if (record.state === 'Needs Practice') {
      needsPracticeCount++;
      totalScore += record.score;
    } else {
      learningCount++;
      totalScore += record.score;
    }
  }

  const assessedCount = totalTopics - notStartedCount;
  const averageMasteryScore = assessedCount > 0 ? Math.round(totalScore / assessedCount) : 0;
  const overallMasteryPercent =
    totalTopics > 0 ? Math.round(((masteredCount * 1.0 + proficientCount * 0.75 + learningCount * 0.4 + needsPracticeCount * 0.25) / totalTopics) * 100) : 0;

  return {
    totalTopics,
    masteredCount,
    proficientCount,
    needsPracticeCount,
    learningCount,
    notStartedCount,
    averageMasteryScore,
    overallMasteryPercent,
  };
}
