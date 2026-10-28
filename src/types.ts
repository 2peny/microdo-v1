export interface SourceReference {
  documentName: string;
  pageNumber?: number;
  sectionHeading?: string;
  snippetText?: string;
  confidence: 'verified' | 'inferred' | 'unlinked';
}

export type MasteryState = 'Not Started' | 'Learning' | 'Needs Practice' | 'Proficient' | 'Mastered';

export interface QuizAttemptRecord {
  attemptId: string;
  timestamp: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  timeSpentSeconds?: number;
  isRetry: boolean;
  attemptNumber: number;
}

export interface TopicMasteryRecord {
  topicId: string;
  courseId: string;
  moduleId: string;
  state: MasteryState;
  score: number; // 0 to 100
  attemptsCount: number;
  correctCount: number;
  incorrectCount: number;
  consecutiveCorrect: number;
  lastAssessedAt: string | null;
  lastRevisionAt: string | null;
  nextRevisionDue: string | null;
  revisionIntervalDays: number;
  history: QuizAttemptRecord[];
}

export interface StructuredTopicLesson {
  topicTitle: string;
  introduction: string;
  learningObjectives: string[];
  keyConcepts: { term: string; definition: string; note?: string }[];
  rulesAndFormulas?: {
    concept: string;
    formula?: string;
    explanation: string;
  }[];
  conceptApplication: {
    scenario: string;
    explanation: string;
  };
  keyTakeaways: string[];
  sourceReference?: SourceReference;
}

export interface StudyArtifact {
  id: string;
  type: 'overview' | 'examples' | 'quiz';
  path: string; // e.g. "summary.md", "examples.ts", "exam-review.md"
  title: string;
  tagline: string;
  lines: {
    width: string;
  }[];
  overviewMarkdown: string;
  workedExamplesMarkdown: string;
  /**
   * Original extracted document source text for this topic.
   * Kept separate from overviewMarkdown (the generated lesson) so that
   * lesson regeneration always uses real source content, never the lesson itself.
   */
  sourceText?: string;
  quizData?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    variantQuestions?: {
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }[];
  };
  sourceReference?: SourceReference;
  structuredLesson?: StructuredTopicLesson;
}

export interface StudyTopic {
  id: string;
  topicName: string;
  objective: string;
  lines: {
    width: string;
    highlight?: boolean;
  }[];
  artifacts: StudyArtifact[];
  sourceReference?: SourceReference;
  mastery?: TopicMasteryRecord;
}

export interface StudyModuleNode {
  id: string;
  prefix: string; // e.g. "// Module 01: Cache Hierarchy"
  title: string;
  sourceChapterText?: string;
  courseCode: string; // e.g. "CS-6004 · Chapter 5"
  estimatedHours: string; // e.g. "3.5 hrs"
  summary: string;
  lines: {
    width: string;
  }[];
  
  // Center Blue Card Data: Key topics of what needs to be learnt
  blueRoadmap: {
    filename: string; // e.g. "syllabus.md"
    heading: string;
    description: string;
    topics: StudyTopic[];
  };
}

export interface StudyDirectoryCourse {
  id: string;
  name: string;
  discipline: string;
  quote: string;
  subquote: string;
  modules: StudyModuleNode[];
}

export type ScholarArchetype = 
  | 'caffeine_alchemist' 
  | 'midnight_owl' 
  | 'deep_monk' 
  | 'speed_runner' 
  | 'formula_crafter';

export type ScholarUserRole = 
  | 'admin' 
  | 'instructor' 
  | 'scholar' 
  | 'auditor'
  | 'guardian';

export type PlatformRole = 'LEARNER' | 'PARENT_GUARDIAN';
export type RegistrationRole = 'scholar' | 'guardian' | 'admin_request';

export interface UserPermissions {
  canUploadModules: boolean;
  canDeleteModules: boolean;
  canUseAiDistill: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  isSuperUser: boolean;
}

export interface ScholarUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  archetype: ScholarArchetype;
  archetypeLabel: string;
  avatarEmoji: string;
  majorOrFocus: string;
  joinedAt: string;
  role: ScholarUserRole;
  roles?: PlatformRole[];
  status?: 'active' | 'suspended' | 'pending';
  lastActive?: string;
  modulesUploadedCount?: number;
  permissions?: UserPermissions;
}

export interface DailyUploadStat {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "Mon, Oct 12"
  modulesCount: number;
  chaptersCount: number;
  fileUploadsCount: number;
  pasteUploadsCount: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  category: 'module' | 'user' | 'security' | 'system';
  actor: {
    name: string;
    email: string;
    role: string;
  };
  details: string;
  status: 'success' | 'warning' | 'info' | 'error';
}

export interface PlatformSystemSettings {
  allowGuestUploads: boolean;
  aiStrictAcademicMode: boolean;
  maxDailyUploadsPerUser: number;
  maintenanceMode: boolean;
  requireApprovalForNewModules: boolean;
  defaultNewUserRole: 'scholar' | 'instructor';
}

export type RecommendationActionType =
  | 'continue_lesson'
  | 'practice_topic'
  | 'review_revision'
  | 'retry_mistakes';

export interface AdaptiveRecommendation {
  id: string;
  actionType: RecommendationActionType;
  title: string;
  reason: string;
  courseId: string;
  moduleId: string;
  topicId: string;
  artifactId?: string;
  priority: 'high' | 'medium' | 'low';
  estimatedMinutes: number;
  badgeLabel: string;
}

export interface ContinueLearningPosition {
  courseId: string;
  courseName: string;
  moduleId: string;
  moduleTitle: string;
  topicId: string;
  topicName: string;
  artifactId?: string;
  artifactTitle?: string;
  lastStudiedAt: string;
  progressPercent: number;
}

export interface StudyGoals {
  weeklyLessonsTarget: number;
  studyDaysTarget: number;
  targetMasteryLevel: 'Proficient' | 'Mastered';
  daysStudiedThisWeek: number;
  lessonsCompletedThisWeek: number;
}

export interface RevisionReminder {
  id: string;
  topicId: string;
  topicName: string;
  courseName: string;
  courseId: string;
  moduleId: string;
  dueDate: string;
  isOverdue: boolean;
  urgency: 'overdue' | 'due_today' | 'upcoming';
  reason: string;
  currentMastery: MasteryState;
}

export type AnalyticsEventType =
  | 'document_uploaded'
  | 'document_processing_started'
  | 'document_processing_completed'
  | 'document_processing_failed'
  | 'document_processing_retried'
  | 'course_created'
  | 'lesson_started'
  | 'lesson_completed'
  | 'quiz_started'
  | 'quiz_submitted'
  | 'quiz_retried'
  | 'mastery_updated'
  | 'revision_due'
  | 'revision_completed'
  | 'learning_session_resumed'
  | 'offline_progress_synced';

export interface AnalyticsEvent {
  id: string;
  eventType: AnalyticsEventType;
  timestamp: string;
  userId: string;
  isMeaningfulActivity: boolean; // qualifying: lesson_completed, quiz_submitted, revision_completed
  courseId?: string;
  moduleId?: string;
  topicId?: string;
  metadata?: Record<string, any>;
}

export interface ProcessingJob {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  startedAt: string;
  completedAt?: string;
  stage: 'reading_file' | 'detecting_structure' | 'awaiting_review' | 'generating_curriculum' | 'ready' | 'failed';
  errorMessage?: string;
  recovered?: boolean;
  retryCount: number;
  detectedChaptersCount: number;
  costEstimate: number; // in USD based on model tokens
}
