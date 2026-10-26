import {
  RevisionReminder,
  StudyDirectoryCourse,
  StudyTopic,
  StudyArtifact,
} from '../types';
import { getAllMasteryRecords } from './masteryEngine';

export function getDueRevisions(course: StudyDirectoryCourse): RevisionReminder[] {
  const allMastery = getAllMasteryRecords();
  const now = new Date();
  const reminders: RevisionReminder[] = [];

  for (const moduleNode of course.modules) {
    for (const topic of moduleNode.blueRoadmap.topics) {
      const record = allMastery[topic.id];
      if (!record || record.state === 'Not Started' || !record.nextRevisionDue) {
        continue;
      }

      const dueDate = new Date(record.nextRevisionDue);
      const isOverdue = dueDate < now;
      const isDueToday =
        !isOverdue &&
        dueDate.toDateString() === now.toDateString();

      if (isOverdue || isDueToday || record.state === 'Needs Practice') {
        const urgency = isOverdue
          ? 'overdue'
          : isDueToday
          ? 'due_today'
          : 'upcoming';

        let reason = 'Scheduled spaced repetition review.';
        if (record.state === 'Needs Practice') {
          reason = `Prior practice scored ${record.score}%. Requires reinforcement.`;
        } else if (isOverdue) {
          const daysLate = Math.max(1, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
          reason = `Overdue by ${daysLate} day${daysLate > 1 ? 's' : ''}. Complete today to prevent memory loss.`;
        } else {
          reason = `Spaced review interval (${record.revisionIntervalDays}d) reached.`;
        }

        reminders.push({
          id: `rem-${topic.id}`,
          topicId: topic.id,
          topicName: topic.topicName,
          courseName: course.name,
          courseId: course.id,
          moduleId: moduleNode.id,
          dueDate: record.nextRevisionDue,
          isOverdue,
          urgency,
          reason,
          currentMastery: record.state,
        });
      }
    }
  }

  // Sort: overdue first, then by earliest due date
  return reminders.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

/**
 * Gets a variant question if available for a quiz artifact, preventing rote memorization.
 */
export function getQuestionForRevision(artifact: StudyArtifact, attemptNumber: number) {
  if (!artifact.quizData) return null;
  const variants = artifact.quizData.variantQuestions;
  if (variants && variants.length > 0 && attemptNumber > 1) {
    const variantIdx = (attemptNumber - 1) % variants.length;
    return {
      ...variants[variantIdx],
      isVariant: true,
      variantNumber: variantIdx + 1,
    };
  }
  return {
    ...artifact.quizData,
    isVariant: false,
    variantNumber: 0,
  };
}
