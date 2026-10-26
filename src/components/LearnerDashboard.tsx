import React, { useMemo } from 'react';
import {
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import {
  StudyDirectoryCourse,
  ContinueLearningPosition,
} from '../types';
import {
  getAllMasteryRecords,
  computeCourseMasterySummary,
} from '../utils/masteryEngine';
import { generateAdaptiveRecommendations } from '../utils/adaptiveEngine';
import { getDueRevisions } from '../utils/revisionEngine';
import { getStudyGoals } from '../utils/studyGoals';

interface LearnerDashboardProps {
  currentCourse: StudyDirectoryCourse;
  courses: StudyDirectoryCourse[];
  completedArtifactIds: string[];
  lastPosition: ContinueLearningPosition | null;
  onResumeLearning: (pos: ContinueLearningPosition) => void;
  onSelectTopic: (moduleId: string, topicId: string, artifactId?: string) => void;
  onOpenGoalsModal: () => void;
  onSwitchToWorkspace: () => void;
}

export const LearnerDashboard: React.FC<LearnerDashboardProps> = ({
  currentCourse,
  courses,
  completedArtifactIds,
  lastPosition,
  onResumeLearning,
  onSelectTopic,
  onOpenGoalsModal,
  onSwitchToWorkspace,
}) => {
  const allMastery = getAllMasteryRecords();
  const goals = getStudyGoals();
  const dueRevisions = getDueRevisions(currentCourse);

  // Compute Learning Progress vs Topic Mastery (Separated measurements)
  const allArtifacts = currentCourse.modules.flatMap((m) =>
    m.blueRoadmap.topics.flatMap((t) => t.artifacts)
  );
  const totalArtifactsCount = allArtifacts.length;
  const completedCount = allArtifacts.filter((a) =>
    completedArtifactIds.includes(a.id)
  ).length;
  const courseProgressPercent =
    totalArtifactsCount > 0 ? Math.round((completedCount / totalArtifactsCount) * 100) : 0;

  const masterySummary = useMemo(
    () => computeCourseMasterySummary(currentCourse, allMastery),
    [currentCourse, allMastery]
  );

  // Adaptive next actions recommendations with deterministic rules
  const recommendations = useMemo(
    () =>
      generateAdaptiveRecommendations(
        currentCourse,
        completedArtifactIds,
        lastPosition
      ),
    [currentCourse, completedArtifactIds, lastPosition]
  );

  // Derive recent learning activities
  const recentActivities = useMemo(() => {
    const list: {
      id: string;
      title: string;
      type: 'mastery' | 'completion' | 'revision';
      timeAgo: string;
      badgeText: string;
      badgeColor: string;
    }[] = [];

    // Checked completed artifacts
    const completedSet = new Set(completedArtifactIds);
    for (const mod of currentCourse.modules) {
      for (const t of mod.blueRoadmap.topics) {
        for (const a of t.artifacts) {
          if (completedSet.has(a.id)) {
            list.push({
              id: a.id,
              title: `${t.topicName} · ${a.title}`,
              type: 'completion',
              timeAgo: 'Recently completed',
              badgeText: 'Completed',
              badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            });
          }
        }
      }
    }

    // Add mastery achievements
    for (const [tId, rec] of Object.entries(allMastery)) {
      if (rec.state === 'Mastered') {
        list.push({
          id: `mastery-${tId}`,
          title: `Demonstrated Mastery (${rec.score}%)`,
          type: 'mastery',
          timeAgo: 'Assessment verified',
          badgeText: 'Mastered',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        });
      } else if (rec.state === 'Proficient') {
        list.push({
          id: `prof-${tId}`,
          title: `Attained Proficiency (${rec.score}%)`,
          type: 'mastery',
          timeAgo: 'Assessment verified',
          badgeText: 'Proficient',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        });
      }
    }

    return list.slice(0, 5);
  }, [currentCourse, completedArtifactIds, allMastery]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 font-sans">
      {/* 1. CONTINUE LEARNING HERO BANNER */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="text-sm font-medium text-slate-500">
              {currentCourse.name}
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {lastPosition
                ? `Resume: ${lastPosition.topicName}`
                : `Continue ${currentCourse.name}`}
            </h1>

            <p className="text-sm leading-6 text-slate-600">
              {lastPosition
                ? `Return directly to ${lastPosition.moduleTitle} where you left off. Your notes, practice answers, and reading position are preserved.`
                : 'Start your personal study journey. Convert course documents into structured learning, practice quizzes, and verified mastery.'}
            </p>

            {/* Progress indicators inside hero */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-slate-600">
              <div>
                <span className="font-medium text-slate-800">Course progress</span>
                <span className="ml-2">{courseProgressPercent}%</span>
              </div>
              <div>
                <span className="font-medium text-slate-800">Topic mastery</span>
                <span className="ml-2">{masterySummary.overallMasteryPercent}%</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            {lastPosition ? (
              <button
                onClick={() => onResumeLearning(lastPosition)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <span>Continue Lesson</span>
              </button>
            ) : (
              <button
                onClick={onSwitchToWorkspace}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <span>Explore Course Rails</span>
              </button>
            )}

            <button
              onClick={onSwitchToWorkspace}
              className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View Full Chapter Rails &amp; Roadmap</span>
              <ChevronRight aria-hidden="true" className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. LEARNING OVERVIEW: PROGRESS VS MASTERY (MANDATORY SEPARATION) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Learning overview
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Distinguishing content you have completed from concepts you genuinely understand
            </p>
          </div>

          <button
            onClick={onOpenGoalsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm transition-colors cursor-pointer"
          >
            <span>Study Goals ({goals.daysStudiedThisWeek}/{goals.studyDaysTarget}d)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Content Completion Progress */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Learning Progress</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-slate-900">
                  {courseProgressPercent}%
                </span>
                <span className="text-sm text-slate-500">
                  {completedCount}/{totalArtifactsCount} completed
                </span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-slate-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${courseProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Card 2: Demonstrated Topic Mastery */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Topic Mastery</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-slate-900">
                  {masterySummary.overallMasteryPercent}%
                </span>
                <span className="text-sm text-slate-500">
                  {masterySummary.masteredCount} Mastered · {masterySummary.proficientCount} Proficient
                </span>
              </div>
            </div>
            <div className="mt-3 text-sm text-slate-500">
              {masterySummary.needsPracticeCount} need practice · {masterySummary.learningCount} in progress
            </div>
          </div>

          {/* Card 3: Spaced Revision Due */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Revision Activities Due</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-slate-900">
                  {dueRevisions.length}
                </span>
                <span className="text-sm text-slate-500">
                  {dueRevisions.filter((r) => r.isOverdue).length} overdue
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2">
              Spaced repetition prevents long-term memory loss
            </p>
          </div>

          {/* Card 4: Weekly Study Goal Target */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Weekly Study Goal</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-slate-900">
                  {goals.daysStudiedThisWeek}/{goals.studyDaysTarget}
                </span>
                <span className="text-sm text-slate-500">
                  days studied this week
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-slate-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((goals.daysStudiedThisWeek / goals.studyDaysTarget) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. RECOMMENDED NEXT ACTIONS (ADAPTIVE LEARNING JOURNEY) */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Recommended next actions
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Prioritized topics, due revisions, and lessons in progress
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-medium ${
                      rec.priority === 'high'
                        ? 'text-amber-800'
                        : 'text-slate-500'
                    }`}
                  >
                    {rec.badgeLabel}
                  </span>

                  <span className="text-sm text-slate-500">
                    ~{rec.estimatedMinutes} mins
                  </span>
                </div>

                <h3 className="text-base font-semibold text-slate-900">{rec.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  <strong>Why recommended:</strong> {rec.reason}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => onSelectTopic(rec.moduleId, rec.topicId, rec.artifactId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  <span>Start Activity</span>
                  <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. RECENT LEARNING ACTIVITY */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Recent learning activity
        </h2>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="divide-y divide-slate-100">
            {recentActivities.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No recent study activity recorded yet. Start a lesson or take a practice quiz to build mastery.
              </div>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div>
                      <span className="font-medium text-slate-800 block truncate max-w-md">
                        {act.title}
                      </span>
                      <span className="text-sm text-slate-500">
                        {act.timeAgo}
                      </span>
                    </div>
                  </div>

                  <span className="text-sm text-slate-500 shrink-0">
                    {act.badgeText}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
