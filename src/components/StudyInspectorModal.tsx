import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, BookOpen, Code2, HelpCircle, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { StudyArtifact } from '../types';

interface StudyInspectorModalProps {
  artifact: StudyArtifact | null;
  isCompleted?: boolean;
  onToggleCompleted?: (id: string) => void;
  onClose: () => void;
}

export const StudyInspectorModal: React.FC<StudyInspectorModalProps> = ({
  artifact,
  isCompleted = false,
  onToggleCompleted,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'examples' | 'quiz'>('overview');
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync tab with clicked card type
  React.useEffect(() => {
    if (artifact) {
      if (artifact.type === 'examples') setActiveTab('examples');
      else if (artifact.type === 'quiz') setActiveTab('quiz');
      else setActiveTab('overview');
      setSelectedQuizOption(null);
      setQuizSubmitted(false);
    }
  }, [artifact]);

  if (!artifact) return null;

  const handleCopyNotes = () => {
    const fullText = `# ${artifact.title} (${artifact.path})\n\n## Key Overview\n${artifact.overviewMarkdown}\n\n## Worked Examples\n${artifact.workedExamplesMarkdown}`;
    navigator.clipboard.writeText(fullText);
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
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 font-sans">
                    {artifact.title}
                  </h2>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                    {artifact.path}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{artifact.tagline}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onToggleCompleted && (
                <button
                  onClick={() => onToggleCompleted(artifact.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer border shadow-xs ${
                    isCompleted
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold hover:bg-emerald-100'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-400 bg-white'
                    }`}
                  >
                    {isCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span>{isCompleted ? 'Completed' : 'Mark Done'}</span>
                </button>
              )}

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

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/40 px-6 gap-2 pt-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-mono border-b-2 transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-emerald-600 text-emerald-800 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>1. Key Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('examples')}
              className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-mono border-b-2 transition-colors cursor-pointer ${
                activeTab === 'examples'
                  ? 'border-emerald-600 text-emerald-800 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>2. Worked Examples & Code</span>
            </button>
            {artifact.quizData && (
              <button
                onClick={() => setActiveTab('quiz')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-mono border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'quiz'
                    ? 'border-emerald-600 text-emerald-800 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>3. Self-Check Quiz</span>
              </button>
            )}
          </div>

          {/* Tab Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-white text-slate-700 text-xs leading-relaxed">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-900 font-sans">
                    <strong>Study Directive:</strong> Master the core invariants and definitions below. These constitute the fundamental grading criteria in technical assessments.
                  </p>
                </div>

                <div className="space-y-2 font-mono whitespace-pre-wrap leading-relaxed text-slate-800">
                  {artifact.overviewMarkdown.split('\n').map((line, idx) => {
                    const isHeading = line.startsWith('#');
                    const isBullet = line.trim().startsWith('-') || line.trim().startsWith('*');
                    const isQuote = line.trim().startsWith('>');

                    return (
                      <div
                        key={idx}
                        className={`${
                          isHeading
                            ? 'text-slate-900 font-bold text-sm pt-2 border-b border-slate-100 pb-1'
                            : isBullet
                            ? 'text-slate-800 pl-3 border-l-2 border-emerald-500'
                            : isQuote
                            ? 'text-amber-900 bg-amber-50 p-2 rounded border border-amber-200'
                            : 'text-slate-700'
                        }`}
                      >
                        {line || ' '}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'examples' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-emerald-800 font-bold">
                    Step-by-Step Implementation & Calculation
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs overflow-x-auto leading-relaxed shadow-xs">
                  <pre className="text-emerald-300">
                    {artifact.workedExamplesMarkdown}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'quiz' && artifact.quizData && (
              <div className="space-y-5">
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
