import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  HelpCircle,
  BookOpen,
  Layers,
  GraduationCap,
  Upload,
  CheckCircle2,
  ChevronDown,
  Search,
  Sparkles,
  Compass,
  ArrowRight,
} from 'lucide-react';

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUploadModal?: () => void;
}

interface FaqItem {
  id: string;
  category: 'workflow' | 'tracking' | 'upload' | 'general';
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'what-is-microdo',
    category: 'workflow',
    question: 'What is MicroDo and how is it different from normal notes?',
    answer:
      'MicroDo is a spec-driven study directory built around a 3-tier progressive learning architecture. Instead of dumping endless text on a single page, MicroDo structures course material into a progressive hierarchy: Modules (broad chapter units) → Blueprints (key competencies) → Study Artifacts (concise theory, real-world examples, and interactive quizzes). This prevents cognitive overload and keeps you focused on one mastery goal at a time.',
  },
  {
    id: 'three-tier-explained',
    category: 'workflow',
    question: 'How does the 3-tier reveal architecture work?',
    answer:
      '1. Tier 1 (Purple Rail / Grid): Displays high-level course modules with course codes and estimated study hours. Clicking a module anchors it as the left rail.\n\n2. Tier 2 (Center Blue Roadmap): Reveals the syllabus roadmap and key core topics for that module. Selecting a topic unlocks its study artifacts.\n\n3. Tier 3 (Right Green Study Cards): Surfaces 3 dedicated mastery artifacts for the selected topic: Core Concept Overview, Worked Real-World Examples, and an Exam Review Practice Quiz.',
  },
  {
    id: 'how-to-start',
    category: 'workflow',
    question: 'How do I start when my workspace is empty?',
    answer:
      'When you start with an empty workspace, you have two simple paths: 1) Click "Upload Module" in the top header or on the empty state screen to paste your own syllabus or notes, or 2) Click "Load Sample Course" to instantly explore a pre-populated Computer Systems course and test the full 3-tier experience.',
  },
  {
    id: 'track-progress',
    category: 'tracking',
    question: 'How do I track my study progress?',
    answer:
      'Every green study card and study modal features a "Mark done" completion toggle. When you check off an artifact, the radial progress gauge on the module card and the header progress overview instantly recalculate your completion percentage. Progress is automatically saved in your browser (localStorage).',
  },
  {
    id: 'nonlinear-nav',
    category: 'workflow',
    question: 'How does non-linear navigation work?',
    answer:
      'The breadcrumb bar at the top of the workspace tracks your exact hierarchy path (Course Root → Active Module → Active Topic). You can click directly on any segment or use the dropdown menus to quickly switch between sibling modules or topics without returning to the home screen.',
  },
  {
    id: 'upload-formats',
    category: 'upload',
    question: 'What file or text formats can I upload?',
    answer:
      'You can paste raw text from course syllabi, lecture slides, textbook excerpts, or Markdown notes. The built-in parser automatically extracts module prefixes, syllabus files, topics, objectives, and child study artifacts.',
  },
  {
    id: 'pulsing-lines',
    category: 'general',
    question: 'What do the connecting circuit lines mean?',
    answer:
      'The pulsing lines visually connect active relational nodes—from your active purple module in the rail into the blue roadmap card, and from the active topic into each green study card. They anchor visual context so you always know where you are in the curriculum.',
  },
  {
    id: 'privacy-storage',
    category: 'general',
    question: 'Is my data sent to external cloud servers?',
    answer:
      'No. Your curriculum state, completion progress, and uploaded modules are stored locally in your browser session. If you configure a server API key, material summarization is securely processed via server-side endpoints.',
  },
];

export const FaqModal: React.FC<FaqModalProps> = ({
  isOpen,
  onClose,
  onOpenUploadModal,
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'faq'>('guide');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('what-is-microdo');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden text-slate-800"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans tracking-tight">
                  How It Works & FAQ
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Spec-Driven Progressive Study Architecture
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Close guide"
              aria-label="Close guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 pt-3 pb-2 border-b border-slate-100 flex items-center justify-between gap-4 bg-white">
            <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab('guide')}
                className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                  activeTab === 'guide'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Visual Guide (3-Tier Flow)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('faq')}
                className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                  activeTab === 'faq'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Frequently Asked Questions ({FAQ_ITEMS.length})
              </button>
            </div>

            {activeTab === 'faq' && (
              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search FAQ..."
                  className="w-full pl-8 pr-3 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-xs"
                />
              </div>
            )}
          </div>

          {/* Modal Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'guide' ? (
              <div className="space-y-6">
                {/* Introduction Callout */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-indigo-50/40 border border-slate-200/80">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                        The Core Principle
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Traditional notes overwhelm students with walls of unorganized text. MicroDo decomposes complex curricula into an interactive, 3-tier relational flow. Each tier serves a distinct cognitive purpose:
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3-Tier Visual Architecture Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Tier 1 */}
                  <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-purple-700 mb-2">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>TIER 1 · MODULE RAIL</span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 mb-1.5">
                        Course Modules
                      </h5>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        High-level curriculum topics or textbook chapters. Selecting a module docks it as the left rail and loads its blueprint roadmap.
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-purple-100 text-[10px] font-mono text-purple-700">
                      ✓ Module radial progress ring
                    </div>
                  </div>

                  {/* Tier 2 */}
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-blue-700 mb-2">
                        <Layers className="w-3.5 h-3.5" />
                        <span>TIER 2 · BLUEPRINT</span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 mb-1.5">
                        Key Topics Roadmap
                      </h5>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Core competencies that must be mastered. Outlines concrete learning objectives before jumping into granular notes.
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-blue-100 text-[10px] font-mono text-blue-700">
                      ✓ Pulsing circuit connection line
                    </div>
                  </div>

                  {/* Tier 3 */}
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-700 mb-2">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>TIER 3 · STUDY NOTES</span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 mb-1.5">
                        High-Yield Artifacts
                      </h5>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Three concrete mastery tools per topic: Concept Rules, Worked Code Benchmarks, and an Interactive Practice Quiz.
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-emerald-100 text-[10px] font-mono text-emerald-700">
                      ✓ Mark done & live self-quiz
                    </div>
                  </div>
                </div>

                {/* Step-by-Step Flow Instructions */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">
                    How To Study with MicroDo
                  </h4>

                  <div className="space-y-3 text-xs text-slate-600">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <strong className="text-slate-800">Select a Module:</strong> Click any course card from the directory to enter focused study mode.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <strong className="text-slate-800">Pick a Roadmap Topic:</strong> Click a core topic in the center blue card to reveal its green study notes.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <strong className="text-slate-800">Deep Dive & Quiz:</strong> Click any study card to inspect detailed Markdown notes, code snippets, and test your knowledge with interactive quiz problems.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        4
                      </div>
                      <div>
                        <strong className="text-slate-800">Mark Complete:</strong> Check off cards as you master them to update your module progress ring and overall course mastery.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call to Action Bar */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-600">
                    Ready to build your curriculum? Upload your syllabus or notes.
                  </span>
                  {onOpenUploadModal && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenUploadModal();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium cursor-pointer shadow-xs transition-colors shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Module</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* FAQ Accordion Tab */
              <div className="space-y-3">
                {filteredFaqs.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-xs font-mono">No matching FAQ entries found.</p>
                  </div>
                ) : (
                  filteredFaqs.map((faq) => {
                    const isExpanded = expandedFaqId === faq.id;

                    return (
                      <div
                        key={faq.id}
                        className={`rounded-xl border transition-all ${
                          isExpanded
                            ? 'bg-slate-50/80 border-indigo-200 ring-1 ring-indigo-100 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                          className="w-full text-left p-4 flex items-start justify-between gap-3 cursor-pointer"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 shrink-0 mt-0.5">
                              {faq.category.toUpperCase()}
                            </span>
                            <span className="text-xs font-bold text-slate-900 leading-snug">
                              {faq.question}
                            </span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 shrink-0 mt-0.5 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-indigo-600' : ''
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 text-xs text-slate-600 border-t border-slate-100/80 leading-relaxed whitespace-pre-line font-sans">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Microdo - powered by Nodegrid Labs
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-xs"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
