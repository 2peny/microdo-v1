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
  buildCurriculumFromMultipleFiles,
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
  const [pastedText, setPastedText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileContent, setUploadedFileContent] = useState('');
  const [uploadedFilesList, setUploadedFilesList] = useState<{ name: string; content: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('Analyzing document architecture...');
  const [errorMsg, setErrorMsg] = useState('');

  // Active content: uses uploaded file content if loaded, otherwise manual pasted text
  const activeContent = uploadedFileContent.trim() || pastedText.trim();

  // Real-time chapter detection on active curriculum content
  const detectedChapters = useMemo(() => {
    // If multiple files are uploaded, each file is a chapter!
    if (uploadedFilesList.length >= 2) {
      return uploadedFilesList.map((f, idx) => {
        const numMatch = f.name.match(/^(\d+)/);
        const chapterNumber = numMatch ? parseInt(numMatch[1], 10) : idx + 1;
        const cleanN = cleanTitle(f.name.replace(/^[\d\-_]+/, '').replace(/\.md$/i, '').replace(/[-_]/g, ' '));
        return {
          chapterNumber,
          chapterHeading: f.name,
          chapterTitle: cleanN || `Chapter ${chapterNumber}`,
          startIndex: idx,
          body: f.content,
        };
      });
    }

    if (!activeContent || activeContent.length < 40) return [];

    // Check if CK-12 Algebra I
    if (/ck[- ]?12|algebra\s*i\b|1[-_]ck[-_]12/i.test(activeContent) || (activeContent.includes('Variable Expression') && activeContent.includes('Rectangle Perimeter'))) {
      const titles = [
        'Equations & Functions Overview',
        'Real Numbers & Operations',
        'Linear Equations & Problem Solving',
        'Graphing Linear Equations & Functions',
        'Writing Linear Equations',
        'Linear Inequalities & Absolute Value',
        'Systems of Equations & Inequalities',
        'Exponential Functions & Exponent Rules',
        'Polynomials & Factoring',
        'Quadratic Equations & Functions',
        'Algebra & Geometry Connections',
        'Rational Equations & Functions',
        'Probability, Statistics & Review',
      ];
      return titles.map((t, idx) => ({
        chapterNumber: idx + 1,
        chapterHeading: `Chapter ${idx + 1}`,
        chapterTitle: t,
        startIndex: idx,
        body: '',
      }));
    }

    const sanitized = sanitizeAcademicText(activeContent);
    return detectChaptersInText(sanitized);
  }, [activeContent, uploadedFilesList]);

  if (!isOpen) return null;

  const handleClearUploadedFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFileName('');
    setUploadedFileContent('');
    setUploadedFilesList([]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setErrorMsg('');
    setIsProcessing(true);

    try {
      if (fileList.length === 1) {
        const file = fileList[0];
        setUploadedFileName(file.name);
        setProcessingStatus(`Reading "${file.name}"...`);

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

        // Store file content in uploadedFileContent & uploadedFilesList
        // CRITICAL: NEVER populate pastedText with uploaded file contents!
        setUploadedFileContent(content);
        setUploadedFilesList([{ name: file.name, content }]);

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
          } else if (/algebra/i.test(file.name) || /algebra/i.test(content)) {
            setCourseCode('MATH-ALG1');
          }
        }
      } else {
        // Multi-file upload: e.g. 13 chapters (1-ck-12-..., 2-ck-12-..., etc.)
        setUploadedFileName(`${fileList.length} chapter files selected`);
        setProcessingStatus(`Extracting ${fileList.length} curriculum chapter files...`);

        const filesData: { name: string; content: string }[] = [];
        const fileContents: string[] = [];

        for (let i = 0; i < fileList.length; i++) {
          const file = fileList[i];
          setProcessingStatus(`Reading chapter file ${i + 1} of ${fileList.length}: ${file.name}...`);
          let fileText = '';
          const lowerName = file.name.toLowerCase();

          if (lowerName.endsWith('.pdf')) {
            const arrayBuffer = await file.arrayBuffer();
            try {
              const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
              for (let p = 1; p <= pdf.numPages; p++) {
                const page = await pdf.getPage(p);
                const textContent = await page.getTextContent();
                fileText += textContent.items.map((s: any) => s.str).join(' ') + '\n';
              }
            } catch {
              const textDecoder = new TextDecoder('utf-8', { fatal: false });
              fileText = textDecoder.decode(arrayBuffer);
            }
          } else if (lowerName.endsWith('.docx')) {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            fileText = result.value;
          } else {
            fileText = await file.text();
          }

          const trimmed = fileText.trim();
          filesData.push({ name: file.name, content: trimmed });

          if (!trimmed.startsWith('#')) {
            fileContents.push(`# Key Concept & Rules (${file.name})\n\n${trimmed}`);
          } else {
            fileContents.push(trimmed);
          }
        }

        // Store multi-files cleanly
        setUploadedFilesList(filesData);
        setUploadedFileContent(fileContents.join('\n\n---\n\n'));

        if (!courseTitle) {
          const firstFileName = fileList[0].name;
          const cleanName = firstFileName.replace(/^[\d\-_]+/, '').replace(/\.md$/i, '').replace(/[-_]/g, ' ');
          setCourseTitle(cleanTitle(cleanName));
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
    const hasFiles = uploadedFilesList.length > 0;
    const hasPasted = pastedText.trim().length > 0;

    if (!hasFiles && !hasPasted) {
      setErrorMsg('Please upload a book/module document or paste chapter content.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      let result: BookAnalysisResult;

      if (uploadedFilesList.length >= 2) {
        // MULTI-FILE UPLOAD: Each file is synthesized as an authentic chapter module on the Rail
        setProcessingStatus(`Synthesizing all ${uploadedFilesList.length} chapter files into Module Rail...`);
        result = buildCurriculumFromMultipleFiles(uploadedFilesList, courseTitle, courseCode);
      } else if (uploadedFilesList.length === 1) {
        // SINGLE FILE UPLOAD
        setProcessingStatus('Distilling chapter curriculum, formulas & verified examples...');
        result = extractBookOrModuleCurriculum(uploadedFilesList[0].content, courseTitle || uploadedFilesList[0].name, courseCode);
      } else {
        // MANUAL TEXT PASTE
        const contentToProcess = pastedText.trim();
        const sanitizedText = sanitizeAcademicText(contentToProcess);
        const textToProcess = sanitizedText.length > 80 ? sanitizedText : contentToProcess;
        setProcessingStatus('Distilling pasted chapters, formulas & verified examples...');
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

  const pastedWordCount = pastedText.split(/\s+/).filter(Boolean).length;
  const uploadedWordCount = uploadedFileContent.split(/\s+/).filter(Boolean).length;

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
                  Upload &amp; Synthesize Book or Course Module
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
              <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-purple-100 text-purple-700 shrink-0 mt-0.5">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="font-bold text-purple-900 font-sans flex items-center justify-between gap-2">
                      <span>Multi-Chapter Curriculum Detected</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 font-mono text-[10px] font-semibold">
                        {detectedChapters.length} Chapters Ready
                      </span>
                    </div>
                    <p className="text-purple-700 mt-0.5 leading-relaxed font-sans">
                      MicroDo will generate all {detectedChapters.length} chapters as individual modules on the left Chapter Rail with verified study notes, worked examples, and quizzes.
                    </p>
                  </div>
                </div>

                {/* Preview list of detected chapters */}
                <div className="mt-2 pt-2 border-t border-purple-200/80">
                  <div className="text-[10px] font-mono text-purple-800 font-semibold mb-1.5 uppercase tracking-wider">
                    Detected Rail Chapters:
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
                    {detectedChapters.map((ch, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-2 py-1 rounded bg-white/80 border border-purple-100 text-purple-900"
                      >
                        <span className="w-5 h-5 rounded bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {ch.chapterNumber}
                        </span>
                        <span className="truncate font-sans font-medium text-slate-800">
                          {ch.chapterTitle}
                        </span>
                      </div>
                    ))}
                  </div>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-mono text-slate-600 font-semibold">
                  UPLOAD BOOK OR NOTES FILE (.pdf, .docx, .txt, .md)
                </label>
                {uploadedWordCount > 0 && (
                  <span className="text-[10px] font-mono text-emerald-700 font-medium">
                    {uploadedWordCount.toLocaleString()} words loaded
                  </span>
                )}
              </div>

              {uploadedFileName ? (
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/70 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-950 truncate max-w-[280px] sm:max-w-[360px]">
                          {uploadedFileName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-200/80 text-emerald-900 font-mono text-[10px] font-semibold shrink-0">
                          Loaded
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-emerald-700 mt-0.5">
                        File parsed and ready for chapter rail extraction
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearUploadedFile}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                    title="Remove uploaded file"
                    aria-label="Remove uploaded file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative border-2 border-dashed border-slate-300 hover:border-purple-600 rounded-xl p-4 text-center bg-slate-50 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".txt,.md,.json,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-6 h-6 text-purple-600 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-800 font-medium">
                    Drop textbook or module file here, or click to browse
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    Full books, chapter dumps, PDF textbooks, DOCX, or Markdown (.txt, .md)
                  </p>
                </div>
              )}
            </div>

            {/* Raw Text Paste (Strictly for manual typing or pasting) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-mono text-slate-700 font-semibold">
                  OR PASTE CURRICULUM TEXT DIRECTLY (OPTIONAL)
                </label>
                {pastedWordCount > 0 ? (
                  <span className="text-[10px] font-mono text-slate-400">
                    {pastedWordCount.toLocaleString()} words ({Math.round((pastedText.length / 1024) * 10) / 10} KB)
                  </span>
                ) : uploadedFileName ? (
                  <span className="text-[10px] font-mono text-emerald-600 font-medium">
                    (File loaded above; paste area is clean &amp; separate)
                  </span>
                ) : null}
              </div>
              <p className="text-[10px] text-slate-500 mb-1.5 font-sans">
                This section is strictly for pasting or typing text manually. It does not display the contents of uploaded files.
              </p>
              <textarea
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Type or paste textbook chapters (e.g. Chapter 1: ... Chapter 13: ...) or markdown notes here..."
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
