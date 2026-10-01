import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Sparkles, BookOpen, Loader2, CheckCircle2, FileText } from 'lucide-react';
import { StudyModuleNode } from '../types';
import { extractAcademicStudyGuide } from '../utils/academicParser';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface UploadModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModuleCreated: (newModule: StudyModuleNode) => void;
}

const SAMPLE_TEXTS = {
  ml: {
    title: 'Transformer Self-Attention & Multi-Head Scaling',
    code: 'CS-229 · Lecture 12',
    raw: `Attention mechanisms allow neural networks to focus on specific parts of an input sequence dynamically.
In scaled dot-product attention, Queries (Q), Keys (K), and Values (V) are computed via linear projections of word embeddings.
The attention formula is Softmax((Q * K^T) / sqrt(d_k)) * V.
Dividing by sqrt(d_k) prevents dot products from growing excessively large for large dimensions, which would push softmax into regions with vanishing gradients.
Multi-Head Attention runs this mechanism h times in parallel with separate projection weights, allowing the model to jointly attend to information from different representation subspaces at different positions.`,
  },
  distributed: {
    title: 'Distributed Consensus & Raft Protocol',
    code: 'CS-6824 · Chapter 8',
    raw: `Consensus involves multiple servers agreeing on values in the presence of network partitions and node crashes.
Raft achieves consensus via leader election, log replication, and safety guarantees.
Nodes transition between Leader, Follower, and Candidate states.
Elections use randomized timers between 150ms and 300ms to avoid split votes.
Once a leader is elected, it accepts client commands and appends log entries, replicating them across a majority quorum before committing.`,
  },
  graphs: {
    title: 'Graph Shortest Paths & Dijkstra Algorithm',
    code: 'CS-61B · Chapter 14',
    raw: `Dijkstra's algorithm finds the shortest path from a single source to all other vertices in a weighted directed graph with non-negative edge weights.
It maintains a min-priority queue of tentative distances.
At each step, the vertex u with minimum distance is extracted, and all incident edges (u, v) are relaxed: if dist[u] + weight(u, v) < dist[v], then dist[v] is updated.
Time complexity is O((V + E) log V) using a binary heap, or O(E + V log V) with a Fibonacci heap.
If negative weights exist, Dijkstra fails because greedy assumptions no longer hold; Bellman-Ford must be used instead.`,
  },
};

export const UploadModuleModal: React.FC<UploadModuleModalProps> = ({
  isOpen,
  onClose,
  onModuleCreated,
}) => {
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [rawText, setRawText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('Analyzing course material...');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLoadSample = (key: 'ml' | 'distributed' | 'graphs') => {
    const sample = SAMPLE_TEXTS[key];
    setCourseTitle(sample.title);
    setCourseCode(sample.code);
    setRawText(sample.raw);
    setUploadedFileName('');
    setErrorMsg('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setErrorMsg('');

    try {
      let content = '';
      const lowerName = file.name.toLowerCase();

      if (lowerName.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          content += textContent.items.map((s: any) => s.str).join(' ') + '\n';
        }
      } else if (lowerName.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
      } else if (lowerName.endsWith('.doc')) {
        content = await file.text();
      } else {
        content = await file.text();
      }

      setRawText(content);

      // Auto-detect title from document heading if not already specified
      if (!courseTitle) {
        const headingMatch = content.match(/^#{1,3}\s+(.+)$/m) || content.match(/^(?:Title|Module|Lecture|Chapter)\s*[:\-]\s*(.+)$/im);
        if (headingMatch && headingMatch[1].trim().length > 3) {
          setCourseTitle(headingMatch[1].trim());
        } else {
          setCourseTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
        }
      }

      // Auto-detect course code if not specified
      if (!courseCode) {
        const codeMatch = content.match(/\b([A-Z]{2,5}[ -]?\d{2,4}[A-Z]?)\b/);
        const chapterMatch = content.match(/\b(Lecture\s+\d+|Chapter\s+\d+|Week\s+\d+|Unit\s+\d+)\b/i);
        if (codeMatch && chapterMatch) {
          setCourseCode(`${codeMatch[1]} · ${chapterMatch[1]}`);
        } else if (codeMatch) {
          setCourseCode(codeMatch[1]);
        }
      }
    } catch (err: any) {
      console.error('Error parsing file:', err);
      setErrorMsg('Failed to parse document: ' + err.message);
    }
  };

  const handleProcessModule = async () => {
    if (!rawText.trim()) {
      setErrorMsg('Please paste text or upload a course material document.');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Analyzing uploaded curriculum & extracting key topics...');
    setErrorMsg('');

    try {
      // 1. Try server API with gemini-3.8-flash
      let structuredData: any = null;
      try {
        const res = await fetch('/api/summarize-module', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rawText,
            courseName: courseTitle || 'Course Module',
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            structuredData = json.data;
          }
        }
      } catch (err) {
        console.warn('Server API failed or offline, falling back to local academic parser:', err);
      }

      // 2. Client-side smart academic parser fallback
      if (!structuredData || !structuredData.topics || structuredData.topics.length === 0) {
        setProcessingStatus('Extracting concepts, worked examples, and review questions...');
        structuredData = extractAcademicStudyGuide(rawText, courseTitle, courseCode);
      }

      // 3. Assemble StudyModuleNode
      const finalTitle = structuredData.title || courseTitle || 'Uploaded Course Module';
      const finalPrefix = structuredData.prefix || `// Module: ${finalTitle.slice(0, 24)}`;
      const finalCode = structuredData.courseCode || courseCode || 'Custom Notes';

      const newModule: StudyModuleNode = {
        id: `mod-${Date.now()}`,
        prefix: finalPrefix,
        title: finalTitle,
        courseCode: finalCode,
        estimatedHours: structuredData.estimatedHours || '3.0 hrs study',
        summary: structuredData.summary || rawText.slice(0, 160).trim() + '...',
        lines: [{ width: '90%' }, { width: '65%' }, { width: '80%' }, { width: '45%' }],
        blueRoadmap: {
          filename: structuredData.syllabusFilename || 'module-syllabus.md',
          heading: structuredData.blueHeading || `Key Topics & Roadmap: ${finalTitle}`,
          description: `Master these ${structuredData.topics.length} core topics extracted from your course materials.`,
          topics: structuredData.topics.map((t: any, idx: number) => {
            const topicSlug = t.topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || `topic-${idx + 1}`;
            return {
              id: `topic-${Date.now()}-${idx}`,
              topicName: t.topicName,
              objective: t.conceptObjective || `Master the principles and applications of ${t.topicName}.`,
              lines: [
                { width: '90%', highlight: true },
                { width: '70%' },
                { width: '80%' },
              ],
              artifacts: [
                {
                  id: `art-ov-${Date.now()}-${idx}`,
                  type: 'overview' as const,
                  path: `${topicSlug}-overview.md`,
                  title: 'Key Concept & Rules',
                  tagline: 'Distilled principles, definitions, and mental models',
                  lines: [{ width: '92%' }, { width: '75%' }, { width: '82%' }],
                  overviewMarkdown: t.overview,
                  workedExamplesMarkdown: t.workedExample,
                  quizData: {
                    question: t.examQuestion,
                    options: t.quizOptions,
                    correctIndex: t.correctOptionIndex,
                    explanation: t.quizExplanation,
                  },
                },
                {
                  id: `art-ex-${Date.now()}-${idx}`,
                  type: 'examples' as const,
                  path: `${topicSlug}-worked-example.ts`,
                  title: 'Worked Examples & Code',
                  tagline: 'Step-by-step problem solution and verification',
                  lines: [{ width: '88%' }, { width: '65%' }, { width: '75%' }],
                  overviewMarkdown: t.overview,
                  workedExamplesMarkdown: t.workedExample,
                  quizData: {
                    question: t.examQuestion,
                    options: t.quizOptions,
                    correctIndex: t.correctOptionIndex,
                    explanation: t.quizExplanation,
                  },
                },
                {
                  id: `art-qz-${Date.now()}-${idx}`,
                  type: 'quiz' as const,
                  path: `${topicSlug}-exam-quiz.json`,
                  title: 'Exam Review & Self-Check',
                  tagline: 'High-yield practice quiz challenge',
                  lines: [{ width: '94%' }, { width: '80%' }, { width: '60%' }],
                  overviewMarkdown: t.overview,
                  workedExamplesMarkdown: t.workedExample,
                  quizData: {
                    question: t.examQuestion,
                    options: t.quizOptions,
                    correctIndex: t.correctOptionIndex,
                    explanation: t.quizExplanation,
                  },
                },
              ],
            };
          }),
        },
      };

      onModuleCreated(newModule);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process course materials.');
    } finally {
      setIsProcessing(false);
    }
  };

  const wordCount = rawText.split(/\s+/).filter(Boolean).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 font-sans">
                  Upload & Synthesize Course Module
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  MicroDo extracts real topics, concept overviews, worked code, and quizzes
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200 shadow-xs"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Quick Sample Presets */}
            <div>
              <span className="block text-[11px] font-mono text-slate-500 mb-1.5 font-semibold">
                TRY WITH ACADEMIC PRESET:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadSample('ml')}
                  className="px-2.5 py-1 rounded-md text-xs font-mono bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                >
                  Machine Learning (Attention)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('distributed')}
                  className="px-2.5 py-1 rounded-md text-xs font-mono bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                >
                  Distributed Systems (Raft)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('graphs')}
                  className="px-2.5 py-1 rounded-md text-xs font-mono bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                >
                  Algorithms (Dijkstra)
                </button>
              </div>
            </div>

            {/* Inputs: Course Title & Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-600 mb-1 font-semibold">
                  MODULE TITLE (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus & Raft Protocol"
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 text-xs font-sans shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-600 mb-1 font-semibold">
                  COURSE / CHAPTER CODE (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. CS-6824 · Chapter 8"
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 text-xs font-mono shadow-xs"
                />
              </div>
            </div>

            {/* File Drop / Upload */}
            <div>
              <label className="block text-[11px] font-mono text-slate-600 mb-1 font-semibold">
                UPLOAD NOTES FILE (.pdf, .docx, .txt, .md)
              </label>
              <div className="relative border-2 border-dashed border-slate-300 hover:border-purple-600 rounded-xl p-4 text-center bg-slate-50 transition-colors">
                <input
                  type="file"
                  accept=".txt,.md,.json,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-6 h-6 text-purple-600 mx-auto mb-1.5" />
                <p className="text-xs text-slate-800 font-medium">
                  {uploadedFileName ? (
                    <span className="text-emerald-700 flex items-center justify-center gap-1 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Loaded: {uploadedFileName}
                    </span>
                  ) : (
                    'Drop course material file here or click to browse'
                  )}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  Markdown, text notes, syllabus, PDF, or Word Docs (.docx)
                </p>
              </div>
            </div>

            {/* Raw Text Paste */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-mono text-slate-600 font-semibold">
                  OR PASTE LECTURE TEXT / SYLLABUS CONTENT
                </label>
                {wordCount > 0 && (
                  <span className="text-[10px] font-mono text-slate-400">
                    {wordCount} words ({Math.round(rawText.length / 1024 * 10) / 10} KB)
                  </span>
                )}
              </div>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste course syllabus, lecture transcript, or textbook section here..."
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 font-mono text-xs leading-relaxed shadow-xs"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-mono">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50">
            <span className="text-[11px] font-mono text-slate-500">
              Generates MicroDo 3-tier study cards
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-mono text-xs border border-slate-200 cursor-pointer shadow-xs"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleProcessModule}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-medium cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
                    <span>{processingStatus}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-300" />
                    <span>Build Course Module</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
