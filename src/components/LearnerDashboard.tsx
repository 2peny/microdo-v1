import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Play,
  CheckCircle2,
  Award,
  Clock,
  Sparkles,
  BookOpen,
  RotateCcw,
  TrendingUp,
  Target,
  ArrowRight,
  Flame,
  AlertTriangle,
  ChevronRight,
  Layers,
  Calendar,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import {
  StudyDirectoryCourse,
  StudyModuleNode,
  StudyTopic,
  StudyArtifact,
  ContinueLearningPosition,
  AdaptiveRecommendation,
  MasteryState,
} from '../types';
import {
  getAllMasteryRecords,
  computeCourseMasterySummary,
  MASTERY_COLORS,
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
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                CONTINUE LEARNING
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {currentCourse.name}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {lastPosition
                ? `Resume: ${lastPosition.topicName}`
                : `Continue ${currentCourse.name}`}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              {lastPosition
                ? `Return directly to ${lastPosition.moduleTitle} where you left off. Your notes, practice answers, and reading position are preserved.`
                : 'Start your personal study journey. Convert course documents into structured learning, practice quizzes, and verified mastery.'}
            </p>

            {/* Progress indicators inside hero */}
            <div className="flex items-center gap-4 pt-2 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Course Progress: {courseProgressPercent}%</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-400" />
                <span>Topic Mastery: {masterySummary.overallMasteryPercent}%</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            {lastPosition ? (
              <button
                onClick={() => onResumeLearning(lastPosition)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Continue Lesson</span>
              </button>
            ) : (
              <button
                onClick={onSwitchToWorkspace}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Course Rails</span>
              </button>
            )}

            <button
              onClick={onSwitchToWorkspace}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-mono transition-colors cursor-pointer"
            >
              <span>View Full Chapter Rails &amp; Roadmap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Subtle decorative glow */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 2. LEARNING OVERVIEW: PROGRESS VS MASTERY (MANDATORY SEPARATION) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Learning Overview (Progress &amp; Topic Mastery)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Distinguishing content you have completed from concepts you genuinely understand
            </p>
          </div>

          <button
            onClick={onOpenGoalsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono transition-colors cursor-pointer shadow-2xs"
          >
            <Target className="w-3.5 h-3.5 text-indigo-600" />
            <span>Study Goals ({goals.daysStudiedThisWeek}/{goals.studyDaysTarget}d)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Content Completion Progress */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Learning Progress</span>
                <span className="p-1 rounded bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {courseProgressPercent}%
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {completedCount}/{totalArtifactsCount} completed
                </span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${courseProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Card 2: Demonstrated Topic Mastery */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Topic Mastery</span>
                <span className="p-1 rounded bg-purple-50 text-purple-600">
                  <Award className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-purple-900">
                  {masterySummary.overallMasteryPercent}%
                </span>
                <span className="text-xs font-mono text-purple-700">
                  {masterySummary.masteredCount} Mastered · {masterySummary.proficientCount} Proficient
                </span>
              </div>
            </div>
            {/* Mastery mini-indicator pills */}
            <div className="flex items-center gap-1 mt-3 text-[10px] font-mono">
              <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                {masterySummary.masteredCount} M
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                {masterySummary.proficientCount} P
              </span>
              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                {masterySummary.needsPracticeCount} NP
              </span>
              <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                {masterySummary.learningCount} L
              </span>
            </div>
          </div>

          {/* Card 3: Spaced Revision Due */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Revision Activities Due</span>
                <span className="p-1 rounded bg-amber-50 text-amber-600">
                  <RotateCcw className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-amber-900">
                  {dueRevisions.length}
                </span>
                <span className="text-xs text-amber-700 font-mono">
                  {dueRevisions.filter((r) => r.isOverdue).length} overdue
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-mono">
              Spaced repetition prevents long-term memory loss
            </p>
          </div>

          {/* Card 4: Weekly Study Goal Target */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Weekly Study Goal</span>
                <span className="p-1 rounded bg-indigo-50 text-indigo-600">
                  <Target className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-indigo-900">
                  {goals.daysStudiedThisWeek}/{goals.studyDaysTarget}
                </span>
                <span className="text-xs text-indigo-700 font-mono">
                  days studied this week
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
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
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Recommended Next Actions (Adaptive Journey)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic recommendations prioritizing weak topics, due revisions, and in-progress lessons
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                      rec.priority === 'high'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                    }`}
                  >
                    {rec.badgeLabel}
                  </span>

                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>~{rec.estimatedMinutes} mins</span>
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{rec.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  <strong>Why recommended:</strong> {rec.reason}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => onSelectTopic(rec.moduleId, rec.topicId, rec.artifactId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold font-sans transition-colors cursor-pointer shadow-xs"
                >
                  <span>Start Activity</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. RECENT LEARNING ACTIVITY */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-600" />
          <span>Recent Learning Activity</span>
        </h2>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="divide-y divide-slate-100">
            {recentActivities.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-mono">
                No recent study activity recorded yet. Start a lesson or take a practice quiz to build mastery.
              </div>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                      {act.type === 'mastery' ? (
                        <Award className="w-3.5 h-3.5 text-purple-600" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 block truncate max-w-md">
                        {act.title}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {act.timeAgo}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${act.badgeColor}`}>
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
