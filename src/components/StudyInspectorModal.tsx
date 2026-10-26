import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Copy,
  Check,
  BookOpen,
  Code2,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calculator,
  RotateCcw,
  Maximize2,
  FileText,
  ExternalLink,
  Award,
  ShieldCheck,
  Info,
  ChevronLeft,
  ChevronRight,
  Crown,
} from 'lucide-react';
import { StudyArtifact, TopicMasteryRecord, MasteryState } from '../types';
import { MarkdownViewer } from './MarkdownViewer';
import { recordQuizAttempt, getTopicMastery, MASTERY_COLORS } from '../utils/masteryEngine';
import { recordAnalyticsEvent } from '../utils/analyticsEngine';
import { isRawOrCorruptedLesson } from '../utils/lessonDistiller';

interface StudyInspectorModalProps {
  artifact: StudyArtifact | null;
  topicId?: string;
  courseId?: string;
  moduleId?: string;
  isCompleted?: boolean;
  onToggleCompleted?: (id: string) => void;
  onClose: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPreviousArtifact?: () => void;
  onNextArtifact?: () => void;
  onOpenGuardian?: () => void;
  onOpenSuperuser?: () => void;
  onOpenFocusMode?: (artifact: StudyArtifact) => void;
  onMasteryUpdated?: (topicId: string, record: TopicMasteryRecord) => void;
  onRegenerateLesson?: (artifactId: string) => void;
  isRegenerating?: boolean;
}

export const StudyInspectorModal: React.FC<StudyInspectorModalProps> = ({
  artifact,
  topicId = 'default-topic',
  courseId = 'default-course',
  moduleId = 'default-module',
  isCompleted = false,
  onToggleCompleted,
  onClose,
  hasPrevious = false,
  hasNext = false,
  onPreviousArtifact,
  onNextArtifact,
  onOpenGuardian,
  onOpenSuperuser,
  onOpenFocusMode,
  onMasteryUpdated,
  onRegenerateLesson,
  isRegenerating = false,
}) => {
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [attemptCount, setAttemptCount] = useState(1);
  const [isRetryAttempt, setIsRetryAttempt] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0); // 0 is base question, 1+ are variants
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [masteryResult, setMasteryResult] = useState<{
    score: number;
    state: MasteryState;
    deltaText?: string;
  } | null>(null);

  // Retrieve current mastery for this topic
  const [currentMastery, setCurrentMastery] = useState<TopicMasteryRecord | null>(null);

  // Reset quiz state whenever a new artifact is inspected
  useEffect(() => {
    setSelectedQuizOption(null);
    setQuizSubmitted(false);
    setAttemptCount(1);
    setIsRetryAttempt(false);
    setActiveQuestionIndex(0);
    setMasteryResult(null);
    setShowSourceModal(false);

    if (topicId) {
      const rec = getTopicMastery(topicId, courseId, moduleId);
      setCurrentMastery(rec);
    }

    if (artifact) {
      // Record lesson_started analytics event
      recordAnalyticsEvent('lesson_started', {
        courseId,
        moduleId,
        topicId,
        metadata: { artifactId: artifact.id, artifactType: artifact.type },
      });
    }
  }, [artifact, topicId, courseId, moduleId]);

  if (!artifact) return null;

  // Active quiz question (supports variant questions for retries)
  const baseQuiz = artifact.quizData;
  const variants = baseQuiz?.variantQuestions || [];
  const currentQuizData =
    activeQuestionIndex > 0 && variants[activeQuestionIndex - 1]
      ? variants[activeQuestionIndex - 1]
      : baseQuiz;

  const handleCopyNotes = () => {
    let textToCopy = '';
    if (artifact.type === 'overview') {
      textToCopy = `# ${artifact.title}\n\n${artifact.overviewMarkdown}`;
    } else if (artifact.type === 'examples') {
      textToCopy = `# ${artifact.title}\n\n${artifact.workedExamplesMarkdown}`;
    } else if (artifact.type === 'quiz' && currentQuizData) {
      textToCopy = `# ${artifact.title}\n\nQuestion: ${currentQuizData.question}\n\nOptions:\n${currentQuizData.options
        .map((o, idx) => `${idx + 1}. ${o}`)
        .join('\n')}\n\nCorrect Answer: ${currentQuizData.options[currentQuizData.correctIndex]}\nExplanation: ${
        currentQuizData.explanation
      }`;
    } else {
      textToCopy = `# ${artifact.title}\n\n${artifact.overviewMarkdown}`;
    }
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuizSubmit = () => {
    if (selectedQuizOption === null || !currentQuizData) return;

    const isCorrect = selectedQuizOption === currentQuizData.correctIndex;
    setQuizSubmitted(true);

    // Record assessment attempt in Mastery Engine
    const result = recordQuizAttempt(
      topicId,
      courseId,
      moduleId,
      isCorrect,
      selectedQuizOption,
      isRetryAttempt
    );

    setCurrentMastery(result.record);
    setMasteryResult({
      score: result.record.score,
      state: result.record.state,
      deltaText: result.stateChanged
        ? `${result.oldState} → ${result.newState}`
        : `${result.record.score}% Mastery`,
    });

    if (onMasteryUpdated) {
      onMasteryUpdated(topicId, result.record);
    }

    // Automatically mark lesson as completed upon first assessment
    if (onToggleCompleted && !isCompleted) {
      onToggleCompleted(artifact.id);
    }
  };

  const handleRetryQuestion = () => {
    setQuizSubmitted(false);
    setSelectedQuizOption(null);
    setIsRetryAttempt(true);
    setAttemptCount((prev) => prev + 1);

    // If variant questions exist, rotate to variant to avoid rote memorization (Section 2.4)
    if (variants.length > 0) {
      const nextIdx = (activeQuestionIndex + 1) % (variants.length + 1);
      setActiveQuestionIndex(nextIdx);
    }
  };

  const isCorrect =
    currentQuizData &&
    selectedQuizOption === currentQuizData.correctIndex;

  const masteryTheme = currentMastery ? MASTERY_COLORS[currentMastery.state] : MASTERY_COLORS['Not Started'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/90">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`p-2 rounded-xl border shadow-xs shrink-0 ${
                  artifact.type === 'overview'
                    ? 'bg-purple-50 border-purple-200 text-purple-700'
                    : artifact.type === 'examples'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}
              >
                {artifact.type === 'overview' && <BookOpen className="w-5 h-5" />}
                {artifact.type === 'examples' && <Calculator className="w-5 h-5" />}
                {artifact.type === 'quiz' && <HelpCircle className="w-5 h-5" />}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    {artifact.title}
                  </h2>

                  {/* Topic Mastery Badge */}
                  {currentMastery && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${masteryTheme.badge}`}
                      title={`Demonstrated Topic Mastery: ${currentMastery.state} (${currentMastery.score}%)`}
                    >
                      Mastery: {currentMastery.state}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{artifact.tagline}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {onOpenGuardian && (
                <button
                  type="button"
                  onClick={onOpenGuardian}
                  aria-label="Open Parent / Guardian workspace"
                  title="Open Parent / Guardian workspace"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Guardian</span>
                </button>
              )}
              {onOpenSuperuser && (
                <button
                  type="button"
                  onClick={onOpenSuperuser}
                  aria-label="Open Owner Backend"
                  title="Open Owner Backend"
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
                >
                  <Crown className="h-4 w-4" />
                  <span className="hidden sm:inline">Owner</span>
                </button>
              )}
              {/* Focus Mode button */}
              {onOpenFocusMode && (
                <button
                  onClick={() => onOpenFocusMode(artifact)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-white hover:bg-slate-100 text-indigo-700 border border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer shadow-2xs"
                  title="Enter distraction-free Focus Mode (Section 3.5)"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Focus Mode</span>
                </button>
              )}

              {/* Source Reference Safeguard 1 Trigger */}
              {artifact.sourceReference && (
                <button
                  onClick={() => setShowSourceModal(!showSourceModal)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                  title="View verified original source citation & page"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Source Ref</span>
                </button>
              )}

              {/* Regenerate Lesson (Safeguard / Educational Accuracy) */}
              {artifact.type === 'overview' && onRegenerateLesson && (
                <button
                  onClick={() => onRegenerateLesson(artifact.id)}
                  disabled={isRegenerating}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                  title="Regenerate structured lesson from source (re-distills formulas, objectives, and core concepts without raw PDF noise)"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-purple-600 ${isRegenerating ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isRegenerating ? 'Regenerating...' : 'Regenerate Lesson'}</span>
                </button>
              )}

              <button
                onClick={handleCopyNotes}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                title="Copy notes to clipboard"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200 shadow-2xs"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Safeguard 1: Source Reference Dropdown / Banner */}
          {showSourceModal && artifact.sourceReference && (
            <div className="bg-slate-50 border-b border-slate-200 p-3 sm:px-6 flex items-start justify-between gap-3 text-xs animate-in fade-in">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    VERIFIED SOURCE TRACEABILITY
                  </span>
                  <span className="font-semibold text-slate-800">
                    {artifact.sourceReference.documentName}
                  </span>
                  <span className="font-mono text-slate-500">
                    (Page ~{artifact.sourceReference.pageNumber || 1})
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-mono italic bg-white p-2 rounded border border-slate-200">
                  "{artifact.sourceReference.snippetText}"
                </p>
                <span className="text-[10px] text-slate-400">
                  Section: {artifact.sourceReference.sectionHeading} · Traceable to authentic uploaded document
                </span>
              </div>
              <button
                onClick={() => setShowSourceModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white text-slate-700 text-xs leading-relaxed custom-scrollbar">
            {/* 1. KEY CONCEPTS & OVERVIEW */}
            {artifact.type === 'overview' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-purple-900 font-sans">
                    <strong>Core Curriculum Notes:</strong> Master definitions, geometric formulas, and mental models synthesized directly from your chapter.
                  </p>
                </div>

                {isRawOrCorruptedLesson(artifact.overviewMarkdown) ? (
                  <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 space-y-3.5 shadow-2xs">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-amber-950">
                          Structured Lesson Requires Distillation
                        </h4>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          This topic contains unformatted extracted document text rather than a pedagogical lesson. MicroDo separates raw source text from study resources to guarantee quality.
                        </p>
                      </div>
                    </div>

                    {onRegenerateLesson && (
                      <div className="pt-1">
                        <button
                          onClick={() => onRegenerateLesson(artifact.id)}
                          disabled={isRegenerating}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer transition-all disabled:opacity-50"
                        >
                          <Sparkles className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                          <span>{isRegenerating ? 'Distilling Lesson...' : 'Generate Structured Lesson Now'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-2 sm:p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                    <MarkdownViewer content={artifact.overviewMarkdown} />
                  </div>
                )}
              </div>
            )}

            {/* 2. PRACTICAL EXAMPLE & WORKED SOLUTION */}
            {artifact.type === 'examples' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-2.5">
                  <Calculator className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-900 font-sans">
                    <strong>Step-by-Step Verified Solution:</strong> Methodical problem walkthrough with substitution, parentheses rules, and verified computations.
                  </p>
                </div>

                {artifact.workedExamplesMarkdown.trim().startsWith('//') ||
                artifact.workedExamplesMarkdown.includes('```') ||
                artifact.workedExamplesMarkdown.includes('function ') ||
                artifact.workedExamplesMarkdown.includes('const ') ||
                artifact.workedExamplesMarkdown.includes('def ') ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-emerald-800 font-bold">
                        Code Implementation &amp; Execution
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs overflow-x-auto leading-relaxed shadow-xs">
                      <pre className="text-emerald-300 whitespace-pre-wrap">
                        {artifact.workedExamplesMarkdown}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 sm:p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                    <MarkdownViewer content={artifact.workedExamplesMarkdown} />
                  </div>
                )}
              </div>
            )}

            {/* 3. EXAM REVIEW & PRACTICE QUIZ */}
            {artifact.type === 'quiz' && currentQuizData && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <HelpCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-blue-900 font-sans font-semibold">
                        Mastery Assessment &amp; Self-Check
                      </p>
                      <p className="text-[11px] text-blue-700 font-sans mt-0.5">
                        Demonstrated performance updates your topic mastery. Answer without penalties.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold border border-blue-200">
                      Attempt #{attemptCount}
                    </span>
                    {activeQuestionIndex > 0 && (
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold border border-purple-200">
                        Variant #{activeQuestionIndex}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-mono text-blue-700 font-bold block mb-1.5">
                    PRACTICE QUESTION
                  </span>
                  <p className="text-sm font-bold text-slate-900 font-sans mb-4">
                    {currentQuizData.question}
                  </p>

                  <div className="space-y-2">
                    {currentQuizData.options.map((option, optIdx) => {
                      const isSelected = selectedQuizOption === optIdx;
                      const isOptionCorrect = optIdx === currentQuizData.correctIndex;

                      let buttonStyle =
                        'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-2xs';
                      if (quizSubmitted) {
                        if (isOptionCorrect) {
                          buttonStyle =
                            'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500';
                        } else if (isSelected && !isOptionCorrect) {
                          buttonStyle =
                            'bg-red-50 border-red-400 text-red-950';
                        }
                      } else if (isSelected) {
                        buttonStyle =
                          'bg-blue-50 border-blue-600 text-blue-950 font-semibold ring-1 ring-blue-500';
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={quizSubmitted}
                          onClick={() => setSelectedQuizOption(optIdx)}
                          className={`w-full text-left p-3 rounded-lg border text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${buttonStyle}`}
                        >
                          <span>{option}</span>
                          {quizSubmitted && isOptionCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                          )}
                          {quizSubmitted && isSelected && !isOptionCorrect && (
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {!quizSubmitted ? (
                    <div className="mt-4 flex items-center justify-between">
                      <button
                        disabled={selectedQuizOption === null}
                        onClick={handleQuizSubmit}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-sans text-xs font-semibold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Submit Answer</span>
                      </button>

                      <span className="text-[11px] font-mono text-slate-400">
                        Correct answers are never revealed before submission.
                      </span>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {/* Result feedback */}
                      <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isCorrect ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1 font-mono text-xs">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Correct!
                              </span>
                            ) : (
                              <span className="text-red-700 font-bold flex items-center gap-1 font-mono text-xs">
                                <AlertCircle className="w-4 h-4 text-red-600" /> Incorrect
                              </span>
                            )}
                          </div>

                          {/* Mastery Impact Badge */}
                          {masteryResult && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                              <Award className="w-3.5 h-3.5" />
                              <span>{masteryResult.deltaText}</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-700 font-sans leading-relaxed">
                          <strong>Explanation:</strong> {currentQuizData.explanation}
                        </p>
                      </div>

                      {/* Retry & Reassessment Options (Section 3.4 & 2.1) */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={handleRetryQuestion}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>
                            {variants.length > 0
                              ? 'Retry with Equivalent Variant Question'
                              : 'Retry Question (Practice Mode)'}
                          </span>
                        </button>

                        <span className="text-[11px] font-mono text-slate-500">
                          Retries strengthen retention without inflating first-try mastery.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Autosaved locally &amp; session synced</span>
            </div>

            <div className="flex items-center gap-2">
              {onPreviousArtifact && (
                <button
                  type="button"
                  onClick={onPreviousArtifact}
                  disabled={!hasPrevious}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 font-sans font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              {onNextArtifact && (
                <button
                  type="button"
                  onClick={onNextArtifact}
                  disabled={!hasNext}
                  className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 font-sans font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
              {onToggleCompleted && (
                <button
                  onClick={() => onToggleCompleted(artifact.id)}
                  className={`px-3 py-1 rounded-md text-xs font-mono border transition-colors cursor-pointer ${
                    isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {isCompleted ? '✓ Completed' : 'Mark Lesson Complete'}
                </button>
              )}

              <button
                onClick={onClose}
                className="px-3.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-white cursor-pointer shadow-xs font-sans font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
