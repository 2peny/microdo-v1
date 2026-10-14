import React, { useState } from 'react';
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
} from 'lucide-react';
import { StudyArtifact } from '../types';
import { MarkdownViewer } from './MarkdownViewer';

interface StudyInspectorModalProps {
  artifact: StudyArtifact | null;
  isCompleted?: boolean;
  onToggleCompleted?: (id: string) => void;
  onClose: () => void;
}

export const StudyInspectorModal: React.FC<StudyInspectorModalProps> = ({
  artifact,
  onClose,
}) => {
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset quiz state whenever a new artifact is inspected
  React.useEffect(() => {
    setSelectedQuizOption(null);
    setQuizSubmitted(false);
  }, [artifact]);

  if (!artifact) return null;

  const handleCopyNotes = () => {
    let textToCopy = '';
    if (artifact.type === 'overview') {
      textToCopy = `# ${artifact.title}\n\n${artifact.overviewMarkdown}`;
    } else if (artifact.type === 'examples') {
      textToCopy = `# ${artifact.title}\n\n${artifact.workedExamplesMarkdown}`;
    } else if (artifact.type === 'quiz' && artifact.quizData) {
      textToCopy = `# ${artifact.title}\n\nQuestion: ${artifact.quizData.question}\n\nOptions:\n${artifact.quizData.options.map((o, idx) => `${idx + 1}. ${o}`).join('\n')}\n\nCorrect Answer: ${artifact.quizData.options[artifact.quizData.correctIndex]}\nExplanation: ${artifact.quizData.explanation}`;
    } else {
      textToCopy = `# ${artifact.title}\n\n${artifact.overviewMarkdown}`;
    }
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCorrect =
    artifact.quizData &&
    selectedQuizOption === artifact.quizData.correctIndex;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="relative w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden"
        >
          {/* Header - Clean, without file path badge and without mark as done */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl border shadow-xs ${
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
              <div>
                <h2 className="text-base font-bold text-slate-900 font-sans">
                  {artifact.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{artifact.tagline}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyNotes}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copied' : 'Copy Notes'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200 shadow-xs"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Content: Each artifact opens ONLY its own content (No Tab Bar!) */}
          <div className="flex-1 overflow-y-auto p-6 bg-white text-slate-700 text-xs leading-relaxed">
            {/* 1. KEY CONCEPTS & OVERVIEW ONLY */}
            {artifact.type === 'overview' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-purple-900 font-sans">
                    <strong>Core Curriculum Notes:</strong> Master definitions, geometric formulas, and mental models synthesized directly from your chapter.
                  </p>
                </div>

                <div className="p-2 sm:p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                  <MarkdownViewer content={artifact.overviewMarkdown} />
                </div>
              </div>
            )}

            {/* 2. PRACTICAL EXAMPLE & WORKED SOLUTION ONLY */}
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

            {/* 3. EXAM REVIEW & SELF-CHECK QUIZ ONLY */}
            {artifact.type === 'quiz' && artifact.quizData && (
              <div className="space-y-5">
                <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-900 font-sans">
                    <strong>Self-Check Challenge:</strong> Test your understanding with an authentic exam-style concept question.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-mono text-blue-700 font-bold block mb-1.5">
                    PRACTICE EXAM QUESTION
                  </span>
                  <p className="text-sm font-bold text-slate-900 font-sans mb-4">
                    {artifact.quizData.question}
                  </p>

                  <div className="space-y-2">
                    {artifact.quizData.options.map((option, optIdx) => {
                      const isSelected = selectedQuizOption === optIdx;
                      const isOptionCorrect = optIdx === artifact.quizData!.correctIndex;

                      let buttonStyle =
                        'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-xs';
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
                    <button
                      disabled={selectedQuizOption === null}
                      onClick={() => setQuizSubmitted(true)}
                      className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-sans text-xs font-semibold transition-all cursor-pointer shadow-xs"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <div className="mt-4 p-3 rounded-lg bg-white border border-slate-200 space-y-1.5 shadow-xs">
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
                      <p className="text-xs text-slate-600 font-sans leading-relaxed">
                        {artifact.quizData.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 font-mono">
            <span>MicroDo Inspector · Press ESC to close</span>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer shadow-xs font-medium"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
