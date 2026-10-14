import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Upload,
  Sparkles,
  BookOpen,
  Loader2,
  CheckCircle2,
  FileText,
  Layers,
  Search,
  BookMarked,
  Info,
} from 'lucide-react';
import { StudyModuleNode } from '../types';
import {
  extractBookOrModuleCurriculum,
  detectChaptersInText,
  sanitizeAcademicText,
  cleanTitle,
  buildResultFromAiSynthesis,
  BookAnalysisResult,
} from '../utils/academicParser';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF worker safely
try {
  if (typeof window !== 'undefined' && pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
  }
} catch {
  // Graceful fallback
}

interface UploadModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModuleCreated: (newModule: StudyModuleNode) => void;
  onModulesCreated?: (
    newModules: StudyModuleNode[],
    bookTitle?: string,
    isMultiChapter?: boolean
  ) => void;
}

export const UploadModuleModal: React.FC<UploadModuleModalProps> = ({
  isOpen,
  onClose,
  onModuleCreated,
  onModulesCreated,
}) => {
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [rawText, setRawText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('Analyzing document architecture...');
  const [errorMsg, setErrorMsg] = useState('');

  // Real-time chapter detection on sanitized text
  const detectedChapters = useMemo(() => {
    if (!rawText || rawText.trim().length < 40) return [];
    const sanitized = sanitizeAcademicText(rawText);
    return detectChaptersInText(sanitized);
  }, [rawText]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setErrorMsg('');
    setIsProcessing(true);
    setProcessingStatus(`Reading "${file.name}"...`);

    try {
      let content = '';
      const lowerName = file.name.toLowerCase();

      if (lowerName.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        try {
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const totalPages = pdf.numPages;
          for (let i = 1; i <= totalPages; i++) {
            setProcessingStatus(`Extracting page ${i} of ${totalPages} from PDF...`);
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            content += textContent.items.map((s: any) => s.str).join(' ') + '\n';
          }
        } catch (pdfErr: any) {
          console.warn('PDF parser worker issue, falling back to text stream:', pdfErr);
          const textDecoder = new TextDecoder('utf-8', { fatal: false });
          content = textDecoder.decode(arrayBuffer);
        }
      } else if (lowerName.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
      } else {
        content = await file.text();
      }

      setRawText(content);

      // Auto-detect title from document heading if not already specified
      if (!courseTitle) {
        const headingMatch =
          content.match(/^#{1,3}\s+(.+)$/m) ||
          content.match(/^(?:Book|Title|Module|Lecture|Chapter)\s*[:\-–—]\s*(.+)$/im);
        if (headingMatch && headingMatch[1].trim().length > 3) {
          setCourseTitle(cleanTitle(headingMatch[1].trim()));
        } else {
          setCourseTitle(cleanTitle(file.name));
        }
      }

      // Auto-detect course code if not specified
      if (!courseCode) {
        const codeMatch = content.match(/\b([A-Z]{2,5}[ -]?\d{2,4}[A-Z]?)\b/);
        const chapterMatch = content.match(
          /\b(Lecture\s+\d+|Chapter\s+\d+|Week\s+\d+|Unit\s+\d+)\b/i
        );
        if (codeMatch && chapterMatch) {
          setCourseCode(`${codeMatch[1]} · ${chapterMatch[1]}`);
        } else if (codeMatch) {
          setCourseCode(codeMatch[1]);
        }
      }
    } catch (err: any) {
      console.error('Error parsing file:', err);
      setErrorMsg('Failed to parse document: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessModule = async () => {
    if (!rawText.trim()) {
      setErrorMsg('Please paste text or upload a book/module document.');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Distilling textbook content & stripping publisher boilerplate...');
    setErrorMsg('');

    try {
      const sanitizedText = sanitizeAcademicText(rawText);
      const textToProcess = sanitizedText.length > 80 ? sanitizedText : rawText;

      let aiResult: any = null;
      try {
        setProcessingStatus('Synthesizing pedagogical notes, verified examples & quizzes...');
        const apiRes = await fetch('/api/summarize-module', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rawText: textToProcess.slice(0, 40000),
            courseName: courseTitle || 'Academic Module',
          }),
        });
        if (apiRes.ok) {
          const json = await apiRes.json();
          if (json.success && json.data) {
            aiResult = json.data;
          }
        }
      } catch {
        // Fallback to local intelligent extractor
      }

      let result: BookAnalysisResult;
      if (aiResult && aiResult.topics && aiResult.topics.length > 0) {
        result = buildResultFromAiSynthesis(aiResult, courseTitle, courseCode);
      } else {
        result = extractBookOrModuleCurriculum(textToProcess, courseTitle, courseCode);
      }

      if (result.isBook && result.modules.length > 1) {
        setProcessingStatus(
          `Synthesized all ${result.totalChapters} chapters into study workspace!`
        );
      } else {
        setProcessingStatus('Extracted concepts, step-by-step examples, and review quiz!');
      }

      await new Promise((resolve) => setTimeout(resolve, 150));

      if (onModulesCreated && result.modules.length > 0) {
        onModulesCreated(result.modules, result.bookTitle, result.isBook);
      } else if (result.modules.length > 0) {
        onModuleCreated(result.modules[0]);
      }

      onClose();
    } catch (err: any) {
      console.error('Error processing curriculum:', err);
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
                  Upload & Synthesize Book or Course Module
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  MicroDo extracts 1 to 300+ chapters with authentic study notes, worked examples, and quizzes
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
            {/* Supported Materials & Architecture Guide */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-600">
              <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800">Supported Materials:</span>
                <span className="ml-1 text-slate-600">
                  Upload PDF, Word (.docx), Markdown (.md), or paste textbooks, course syllabi, and lecture modules. 
                  Automatic chapter recognition supports full textbooks from 1 to 300+ chapters.
                </span>
              </div>
            </div>

            {/* Live Multi-Chapter Detection Status Banner */}
            {detectedChapters.length >= 2 && (
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 flex items-start gap-3">
                <div className="p-1 rounded bg-purple-100 text-purple-700 shrink-0 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-purple-900 font-sans flex items-center gap-2">
                    <span>Multi-Chapter Book Detected</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 font-mono text-[10px] font-semibold">
                      {detectedChapters.length} Chapters Found
                    </span>
                  </div>
                  <p className="text-purple-700 mt-0.5 leading-relaxed font-sans">
                    MicroDo will generate all {detectedChapters.length} chapters as distinct study modules with their exact text breakdown, key topics roadmap, code/case examples, and quizzes.
                  </p>
                </div>
              </div>
            )}

            {/* Inputs: Course/Book Title & Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-600 mb-1 font-semibold">
                  BOOK OR MODULE TITLE (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g. Modern Operating Systems (300 Chapters)"
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 text-xs font-sans shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-600 mb-1 font-semibold">
                  COURSE / DISCIPLINE CODE (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. CS-400 · Core Curriculum"
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 text-xs font-mono shadow-xs"
                />
              </div>
            </div>

            {/* File Drop / Upload */}
            <div>
              <label className="block text-[11px] font-mono text-slate-600 mb-1 font-semibold">
                UPLOAD BOOK OR NOTES FILE (.pdf, .docx, .txt, .md)
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
                    'Drop textbook or module file here, or click to browse'
                  )}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  Full books, chapter dumps, PDF textbooks, DOCX, or Markdown
                </p>
              </div>
            </div>

            {/* Raw Text Paste */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-mono text-slate-600 font-semibold">
                  OR PASTE BOOK CONTENT / CHAPTER BREAKDOWN
                </label>
                {wordCount > 0 && (
                  <span className="text-[10px] font-mono text-slate-400">
                    {wordCount.toLocaleString()} words ({Math.round((rawText.length / 1024) * 10) / 10} KB)
                    {detectedChapters.length > 0 && ` · ${detectedChapters.length} chapters`}
                  </span>
                )}
              </div>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste book chapters (e.g. Chapter 1: ... Chapter 300: ...) or lecture notes here..."
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
              {detectedChapters.length >= 2
                ? `Will generate ${detectedChapters.length} complete chapters`
                : 'Generates MicroDo 3-tier study cards'}
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
                    <span>
                      {detectedChapters.length >= 2
                        ? `Generate All ${detectedChapters.length} Chapters`
                        : 'Build Study Module'}
                    </span>
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
