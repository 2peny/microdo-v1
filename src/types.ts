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
  quizData?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
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
}

export interface StudyModuleNode {
  id: string;
  prefix: string; // e.g. "// Module 01: Cache Hierarchy"
  title: string;
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
