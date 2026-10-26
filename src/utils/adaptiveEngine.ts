import {
  AdaptiveRecommendation,
  StudyDirectoryCourse,
  TopicMasteryRecord,
  ContinueLearningPosition,
} from '../types';
import { getAllMasteryRecords } from './masteryEngine';
import { getDueRevisions } from './revisionEngine';

/**
 * Deterministic Rules-Based Adaptive Recommendation Engine (Section 2.2).
 * Formulates high-yield next steps with concise pedagogical reasons.
 */
export function generateAdaptiveRecommendations(
  course: StudyDirectoryCourse,
  completedArtifactIds: string[],
  lastPosition: ContinueLearningPosition | null
): AdaptiveRecommendation[] {
  const recommendations: AdaptiveRecommendation[] = [];
  const masteryRecords = getAllMasteryRecords();
  const dueRevisions = getDueRevisions(course);

  // 1. RULE 1: Spaced Repetition Due (High Priority)
  // If topics are overdue or due for revision today, prioritize them to lock in retention
  for (const rev of dueRevisions.slice(0, 2)) {
    recommendations.push({
      id: `rec-rev-${rev.topicId}`,
      actionType: 'review_revision',
      title: `Revise: ${rev.topicName}`,
      reason: rev.isOverdue
        ? `Scheduled revision is overdue. Reviewing now prevents memory decay according to spaced repetition.`
        : `Due for spaced review today to consolidate your knowledge into long-term memory.`,
      courseId: course.id,
      moduleId: rev.moduleId,
      topicId: rev.topicId,
      priority: 'high',
      estimatedMinutes: 5,
      badgeLabel: rev.isOverdue ? 'Overdue Revision' : 'Revision Due',
    });
  }

  // 2. RULE 2: Weak Topics Needing Practice (High / Medium Priority)
  // Topics marked as 'Needs Practice' or with score < 65
  for (const moduleNode of course.modules) {
    for (const topic of moduleNode.blueRoadmap.topics) {
      const record = masteryRecords[topic.id];
      if (record && (record.state === 'Needs Practice' || (record.score > 0 && record.score < 65))) {
        recommendations.push({
          id: `rec-practice-${topic.id}`,
          actionType: 'practice_topic',
          title: `Practice: ${topic.topicName}`,
          reason: `Current mastery score is ${record.score}%. A quick practice quiz will reinforce weak concepts.`,
          courseId: course.id,
          moduleId: moduleNode.id,
          topicId: topic.id,
          priority: 'high',
          estimatedMinutes: 6,
          badgeLabel: 'Needs Practice',
        });
      }
    }
  }

  // 3. RULE 3: Continue Current Incomplete Lesson (Continue Learning)
  if (lastPosition) {
    const targetModule = course.modules.find((m) => m.id === lastPosition.moduleId);
    if (targetModule) {
      const targetTopic = targetModule.blueRoadmap.topics.find((t) => t.id === lastPosition.topicId);
      if (targetTopic) {
        const incompleteArtifacts = targetTopic.artifacts.filter(
          (a) => !completedArtifactIds.includes(a.id)
        );
        if (incompleteArtifacts.length > 0) {
          recommendations.push({
            id: `rec-continue-${targetTopic.id}`,
            actionType: 'continue_lesson',
            title: `Continue: ${targetTopic.topicName}`,
            reason: `You were studying this topic in ${targetModule.title.slice(0, 24)}. Complete the remaining notes and self-check.`,
            courseId: course.id,
            moduleId: targetModule.id,
            topicId: targetTopic.id,
            artifactId: incompleteArtifacts[0].id,
            priority: 'high',
            estimatedMinutes: 8,
            badgeLabel: 'In Progress',
          });
        }
      }
    }
  }

  // 4. RULE 4: Next Sequential Unstarted Topic
  // Find the first uncompleted topic in the course to keep linear progression smooth
  let foundNextSequential = false;
  for (const moduleNode of course.modules) {
    if (foundNextSequential) break;
    for (const topic of moduleNode.blueRoadmap.topics) {
      const allDone = topic.artifacts.every((a) => completedArtifactIds.includes(a.id));
      const record = masteryRecords[topic.id];
      const isUnstarted = !record || record.state === 'Not Started';

      if (!allDone && isUnstarted) {
        recommendations.push({
          id: `rec-next-${topic.id}`,
          actionType: 'continue_lesson',
          title: `Start: ${topic.topicName}`,
          reason: `Next core curriculum topic in ${moduleNode.courseCode || moduleNode.title}. Complete foundational overview and examples.`,
          courseId: course.id,
          moduleId: moduleNode.id,
          topicId: topic.id,
          priority: 'medium',
          estimatedMinutes: 10,
          badgeLabel: 'Next Up',
        });
        foundNextSequential = true;
        break;
      }
    }
  }

  // Fallback: If all are mastered or complete, recommend advanced review
  if (recommendations.length === 0 && course.modules.length > 0) {
    const firstMod = course.modules[0];
    const firstTopic = firstMod.blueRoadmap.topics[0];
    if (firstTopic) {
      recommendations.push({
        id: `rec-advance-${firstTopic.id}`,
        actionType: 'practice_topic',
        title: `Comprehensive Review: ${firstTopic.topicName}`,
        reason: `All assigned activities completed. Test retention with challenge problems.`,
        courseId: course.id,
        moduleId: firstMod.id,
        topicId: firstTopic.id,
        priority: 'low',
        estimatedMinutes: 5,
        badgeLabel: 'Deepen Mastery',
      });
    }
  }

  // Deduplicate and cap to top 4 recommendations
  const seen = new Set<string>();
  const uniqueRecs: AdaptiveRecommendation[] = [];
  for (const r of recommendations) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      uniqueRecs.push(r);
    }
  }

  return uniqueRecs.slice(0, 4);
}
