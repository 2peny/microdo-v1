import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Minimize2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calculator,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Award,
  Sparkles,
} from 'lucide-react';
import { StudyArtifact, StudyTopic, TopicMasteryRecord } from '../types';
import { MarkdownViewer } from './MarkdownViewer';
import { recordQuizAttempt, getTopicMastery, MASTERY_COLORS } from '../utils/masteryEngine';

interface FocusModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifact: StudyArtifact | null;
  topic?: StudyTopic | null;
  courseTitle?: string;
  onPreviousArtifact?: () => void;
  onNextArtifact?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  isCompleted?: boolean;
  onToggleCompleted?: (id: string) => void;
  onMasteryUpdated?: (topicId: string, record: TopicMasteryRecord) => void;
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({
  isOpen,
  onClose,
  artifact,
  topic,
  courseTitle = 'Curriculum',
  onPreviousArtifact,
  onNextArtifact,
  hasPrevious = false,
  hasNext = false,
  isCompleted = false,
  onToggleCompleted,
  onMasteryUpdated,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  if (!isOpen || !artifact) return null;

  const currentMastery = topic ? getTopicMastery(topic.id) : null;
  const masteryTheme = currentMastery ? MASTERY_COLORS[currentMastery.state] : null;

  const handleCopy = () => {
    let text = artifact.overviewMarkdown || artifact.workedExamplesMarkdown || '';
    if (artifact.type === 'quiz' && artifact.quizData) {
      text = `${artifact.quizData.question}\n${artifact.quizData.options.join('\n')}`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuizSubmit = () => {
    if (selectedQuizOption === null || !artifact.quizData || !topic) return;
    const isCorrect = selectedQuizOption === artifact.quizData.correctIndex;
    setQuizSubmitted(true);
    const res = recordQuizAttempt(topic.id, 'course', 'mod', isCorrect, selectedQuizOption, false);
    if (onMasteryUpdated) {
      onMasteryUpdated(topic.id, res.record);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-60 flex flex-col bg-[#0d1117] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
        {/* Distraction-Free Header */}
        <header className="h-14 border-b border-slate-800 bg-slate-950/80 px-4 sm:px-8 flex items-center justify-between shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              FOCUS MODE ACTIVE
            </span>
            <div className="hidden sm:block text-xs text-slate-400 font-mono truncate max-w-sm">
              {courseTitle} {topic && `· ${topic.topicName}`}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentMastery && masteryTheme && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${masteryTheme.badge}`}>
                Mastery: {currentMastery.state} ({currentMastery.score}%)
              </span>
            )}

            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
              title="Copy notes"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline font-mono">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1" />

            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold font-mono transition-colors cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Focus</span>
            </button>
          </div>
        </header>

        {/* Focused Reading Body */}
        <main className="flex-1 overflow-y-auto px-4 py-8 sm:py-12 flex justify-center custom-scrollbar">
          <div className="w-full max-w-3xl space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
                {artifact.type === 'overview' && <BookOpen className="w-4 h-4 text-purple-400" />}
                {artifact.type === 'examples' && <Calculator className="w-4 h-4 text-emerald-400" />}
                {artifact.type === 'quiz' && <HelpCircle className="w-4 h-4 text-blue-400" />}
                <span className="capitalize">{artifact.type}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {artifact.title}
              </h1>
              <p className="text-xs text-slate-400 mt-1">{artifact.tagline}</p>
            </div>

            {/* Content rendering */}
            {artifact.type === 'overview' && (
              <div className="prose prose-invert prose-slate max-w-none text-slate-200 text-sm leading-relaxed">
                <MarkdownViewer content={artifact.overviewMarkdown} />
              </div>
            )}

            {artifact.type === 'examples' && (
              <div className="space-y-4">
                <div className="prose prose-invert prose-slate max-w-none text-slate-200 text-sm leading-relaxed">
                  <MarkdownViewer content={artifact.workedExamplesMarkdown} />
                </div>
              </div>
            )}

            {artifact.type === 'quiz' && artifact.quizData && (
              <div className="space-y-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-mono text-blue-400 font-bold block mb-2">
                  SELF-CHECK CHALLENGE
                </span>
                <p className="text-base font-semibold text-white mb-6">
                  {artifact.quizData.question}
                </p>

                <div className="space-y-2.5">
                  {artifact.quizData.options.map((opt, idx) => {
                    const isSelected = selectedQuizOption === idx;
                    const isCorrect = idx === artifact.quizData!.correctIndex;
                    let style = 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200';
                    if (quizSubmitted) {
                      if (isCorrect) style = 'bg-emerald-950/70 border-emerald-500 text-emerald-200';
                      else if (isSelected) style = 'bg-rose-950/70 border-rose-500 text-rose-200';
                    } else if (isSelected) {
                      style = 'bg-blue-900/50 border-blue-500 text-blue-100';
                    }

                    return (
                      <button
                        key={idx}
                        disabled={quizSubmitted}
                        onClick={() => setSelectedQuizOption(idx)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs font-mono transition-colors flex items-center justify-between cursor-pointer ${style}`}
                      >
                        <span>{opt}</span>
                        {quizSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {quizSubmitted && isSelected && !isCorrect && <AlertCircle className="w-4 h-4 text-rose-400" />}
                      </button>
                    );
                  })}
                </div>

                {!quizSubmitted ? (
                  <button
                    disabled={selectedQuizOption === null}
                    onClick={handleQuizSubmit}
                    className="mt-6 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <div className="mt-6 p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                    <span className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1.5">
                      <Award className="w-4 h-4" /> Explanation
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {artifact.quizData.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Bottom Paging Controls */}
        <footer className="h-14 border-t border-slate-800 bg-slate-950/90 px-4 sm:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {hasPrevious && onPreviousArtifact && (
              <button
                onClick={onPreviousArtifact}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            )}

            {hasNext && onNextArtifact && (
              <button
                onClick={onNextArtifact}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onToggleCompleted && (
              <button
                onClick={() => onToggleCompleted(artifact.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
                  isCompleted
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {isCompleted ? '✓ Lesson Completed' : 'Mark as Completed'}
              </button>
            )}
          </div>
        </footer>
      </div>
    </AnimatePresence>
  );
};
