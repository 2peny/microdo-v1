import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Maximize2,
  MoreHorizontal,
  PanelLeft,
  X,
} from 'lucide-react';
import { StudyArtifact } from '../types';
import { MarkdownViewer, extractMarkdownHeadings } from './MarkdownViewer';
import { isRawOrCorruptedLesson } from '../utils/lessonDistiller';

interface LearningContentWorkspaceProps {
  artifact: StudyArtifact;
  courseTitle: string;
  chapterTitle?: string;
  topicTitle?: string;
  isCompleted: boolean;
  onToggleCompleted: (artifactId: string) => void;
  onClose: () => void;
  onOpenFocusMode?: (artifact: StudyArtifact) => void;
  onRegenerateLesson?: (artifactId: string) => void;
  isRegenerating?: boolean;
}

export const LearningContentWorkspace: React.FC<LearningContentWorkspaceProps> = ({
  artifact,
  courseTitle,
  chapterTitle,
  topicTitle,
  isCompleted,
  onToggleCompleted,
  onClose,
  onOpenFocusMode,
  onRegenerateLesson,
  isRegenerating = false,
}) => {
  const content = artifact.type === 'examples'
    ? artifact.workedExamplesMarkdown
    : artifact.overviewMarkdown;
  const headingIdPrefix = `lesson-${artifact.id}`;
  const headings = useMemo(
    () => extractMarkdownHeadings(content, headingIdPrefix),
    [content, headingIdPrefix]
  );
  const scrollAreaRef = useRef<HTMLElement>(null);
  const [activeHeading, setActiveHeading] = useState(headings[0]?.id || '');
  const [isContentsOpen, setIsContentsOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  useEffect(() => {
    setActiveHeading(headings[0]?.id || '');
  }, [headings]);

  useEffect(() => {
    const root = scrollAreaRef.current;
    if (!root || headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleHeadings = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visibleHeadings[0]) setActiveHeading(visibleHeadings[0].target.id);
      },
      { root, rootMargin: '0px 0px -72% 0px', threshold: 0 }
    );

    headings.forEach(({ id }) => {
      const heading = root.querySelector(`#${CSS.escape(id)}`);
      if (heading) observer.observe(heading);
    });

    return () => observer.disconnect();
  }, [headings]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isContentsOpen) {
          setIsContentsOpen(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isContentsOpen, onClose]);

  const scrollToHeading = (id: string) => {
    const heading = scrollAreaRef.current?.querySelector(`#${CSS.escape(id)}`);
    heading?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveHeading(id);
    setIsContentsOpen(false);
  };

  const copyLesson = async () => {
    try {
      await navigator.clipboard.writeText(`# ${artifact.title}\n\n${content}`);
      setCopyError(false);
      setHasCopied(true);
      window.setTimeout(() => setHasCopied(false), 1800);
    } catch (error) {
      console.error('Unable to copy lesson content', error);
      setCopyError(true);
      setHasCopied(false);
    }
  };

  const isCorruptedLesson = artifact.type === 'overview' && isRawOrCorruptedLesson(content);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={artifact.title}
      className="fixed inset-0 z-50 flex flex-col bg-[#f8f9fb] text-slate-800"
    >
      <header className="z-10 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:px-3"
            aria-label="Back to Study Workspace"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Study Workspace</span>
            <span className="sm:hidden">Back</span>
          </button>
          <button
            type="button"
            onClick={() => setIsContentsOpen(true)}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:hidden"
            aria-expanded={isContentsOpen}
            aria-controls="learning-content-outline"
          >
            <PanelLeft className="h-4 w-4" />
            Contents
          </button>
          <ChevronRight className="hidden h-4 w-4 shrink-0 text-slate-400 sm:block" />
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-xs text-slate-500">{courseTitle}</p>
            <p className="truncate text-sm font-medium text-slate-800">
              {topicTitle || artifact.title}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleCompleted(artifact.id)}
            aria-pressed={isCompleted}
            aria-label={isCompleted ? 'Mark lesson incomplete' : 'Mark lesson complete'}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              isCompleted
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                : 'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isCompleted
              ? <CheckCircle2 className="h-4 w-4" />
              : <Check className="h-4 w-4" />}
            <span className="hidden sm:inline">
              {isCompleted ? 'Completed' : 'Mark complete'}
            </span>
          </button>

          <details className="group relative">
            <summary
              aria-label="More reading actions"
              className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 [&::-webkit-details-marker]:hidden"
            >
              <MoreHorizontal className="h-5 w-5" />
            </summary>
            <div className="absolute right-0 top-12 z-20 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
              <button
                type="button"
                onClick={copyLesson}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                {hasCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Clipboard className="h-4 w-4" />}
                {copyError ? 'Copy unavailable' : hasCopied ? 'Copied' : 'Copy lesson'}
              </button>
              {onOpenFocusMode && (
                <button
                  type="button"
                  onClick={() => onOpenFocusMode(artifact)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Maximize2 className="h-4 w-4" />
                  Focus mode
                </button>
              )}
            </div>
          </details>
        </div>
      </header>

      <main
        ref={scrollAreaRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[220px_minmax(0,760px)] lg:gap-16 lg:px-8 lg:py-12">
          <aside className="sticky top-8 hidden self-start lg:block">
            <ContentOutline
              headings={headings}
              activeHeading={activeHeading}
              onSelect={scrollToHeading}
            />
          </aside>

          <article className="min-w-0">
            <div className="mb-8 border-b border-slate-200 pb-6">
              <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                <span>{courseTitle}</span>
                {chapterTitle && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{chapterTitle}</span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span>{artifact.type === 'examples' ? 'Practical example' : 'Key concepts'}</span>
              </div>
              {topicTitle && topicTitle !== artifact.title && (
                <p className="text-sm text-slate-500">{topicTitle}</p>
              )}
            </div>

            {isCorruptedLesson ? (
              <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
                <div className="flex items-center gap-2 font-semibold">
                  <h1 id="learning-content-title" className="text-lg">Structured lesson unavailable</h1>
                </div>
                <p className="text-sm leading-6 text-amber-900">
                  This lesson contains unformatted source text rather than a structured reading.
                </p>
                {onRegenerateLesson && (
                  <button
                    type="button"
                    onClick={() => onRegenerateLesson(artifact.id)}
                    disabled={isRegenerating}
                    className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRegenerating ? 'Preparing lesson…' : 'Generate structured lesson'}
                  </button>
                )}
              </div>
            ) : (
              <>
                {!headings.some((heading) => heading.level === 1) && (
                  <h1
                    id="learning-content-title"
                    className="mb-8 text-3xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-4xl"
                  >
                    {artifact.title}
                  </h1>
                )}
                <div id={!headings.some((heading) => heading.level === 1) ? undefined : 'learning-content-title'}>
                  <MarkdownViewer
                    content={content}
                    headingIdPrefix={headingIdPrefix}
                    readingMode
                    className="max-w-none"
                  />
                </div>
              </>
            )}

            {artifact.sourceReference && (
              <section className="mt-10 border-t border-slate-200 pt-6" aria-label="Original source reference">
                <h2 className="mb-3 text-sm font-semibold text-slate-800">Original source</h2>
                <p className="text-sm leading-6 text-slate-700">
                  <cite className="not-italic font-medium">{artifact.sourceReference.documentName}</cite>
                  {artifact.sourceReference.pageNumber && (
                    <span className="text-slate-500"> · Page {artifact.sourceReference.pageNumber}</span>
                  )}
                  {artifact.sourceReference.sectionHeading && (
                    <span className="text-slate-500"> · {artifact.sourceReference.sectionHeading}</span>
                  )}
                </p>
                {artifact.sourceReference.snippetText && (
                  <details className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
                    <summary className="cursor-pointer text-sm font-medium text-slate-700">
                      View source excerpt
                    </summary>
                    <blockquote className="mt-3 border-l-2 border-indigo-300 pl-4 text-sm leading-6 text-slate-600">
                      {artifact.sourceReference.snippetText}
                    </blockquote>
                  </details>
                )}
              </section>
            )}
          </article>
        </div>
      </main>

      {isContentsOpen && (
        <div
          className="fixed inset-0 z-20 flex items-start bg-slate-950/30 p-4 pt-20 lg:hidden"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsContentsOpen(false);
          }}
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">On this page</h2>
              <button
                type="button"
                onClick={() => setIsContentsOpen(false)}
                aria-label="Close contents"
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ContentOutline
              headings={headings}
              activeHeading={activeHeading}
              onSelect={scrollToHeading}
              id="learning-content-outline"
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface ContentOutlineProps {
  headings: ReturnType<typeof extractMarkdownHeadings>;
  activeHeading: string;
  onSelect: (id: string) => void;
  id?: string;
}

const ContentOutline: React.FC<ContentOutlineProps> = ({
  headings,
  activeHeading,
  onSelect,
  id,
}) => (
  <nav id={id} aria-label="On this page">
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      On this page
    </p>
    {headings.length > 0 ? (
      <ol className="space-y-1">
        {headings.map((heading) => (
          <li key={heading.id}>
            <button
              type="button"
              onClick={() => onSelect(heading.id)}
              aria-current={activeHeading === heading.id ? 'location' : undefined}
              className={`w-full rounded-md py-1.5 text-left text-sm leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                heading.level > 2 ? 'pl-6' : heading.level === 2 ? 'pl-3' : 'pl-0'
              } ${
                activeHeading === heading.id
                  ? 'font-medium text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ol>
    ) : (
      <p className="text-sm text-slate-500">No section headings</p>
    )}
  </nav>
);
