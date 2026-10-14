import React, { useMemo } from 'react';
import katex from 'katex';
import {
  Target,
  BookOpen,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Table as TableIcon,
  ChevronRight,
  Sparkles,
  Info,
  Check,
  Calculator,
} from 'lucide-react';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

/**
 * Safely render LaTeX math formulas using KaTeX.
 * Supports inline $formula$ and block $$formula$$.
 */
export function renderMathToHtml(text: string): string {
  if (!text) return '';

  // 1. Replace display math: $$...$$
  let replaced = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try {
      const rendered = katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
      });
      return `<div class="katex-display-wrapper my-3 py-2 px-4 bg-slate-50/80 rounded-xl border border-slate-200/80 text-center overflow-x-auto">${rendered}</div>`;
    } catch {
      return `<code class="bg-slate-100 text-slate-800 px-2 py-1 rounded font-mono">${math}</code>`;
    }
  });

  // 2. Replace inline math: $...$
  replaced = replaced.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return `<code class="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">${math}</code>`;
    }
  });

  return replaced;
}

/**
 * Parses inline formatting: bold (**text**), italic (*text*), inline code (`code`), and math.
 */
function renderInlineContent(text: string): React.ReactNode {
  // First process math
  const withMath = renderMathToHtml(text);

  // Convert markdown bold and code
  const formatted = withMath
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
    .replace(/\*([^\*]+?)\*/g, '<em class="italic text-slate-800">$1</em>')
    .replace(/`([^`]+?)`/g, '<code class="font-mono text-[11px] bg-slate-100 text-purple-700 px-1.5 py-0.5 rounded border border-slate-200">$1</code>');

  return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
}

interface ParsedTable {
  headers: string[];
  alignments: ('left' | 'center' | 'right')[];
  rows: string[][];
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, className = '' }) => {
  // Parse content into blocks: headers, callouts, tables, lists, cards, and paragraphs
  const blocks = useMemo(() => {
    if (!content) return [];
    const lines = content.replace(/\r\n/g, '\n').split('\n');
    const parsedBlocks: any[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Empty line
      if (!trimmed) {
        i++;
        continue;
      }

      // Horizontal rule: --- or ***
      if (/^[-*_]{3,}$/.test(trimmed)) {
        parsedBlocks.push({ type: 'divider' });
        i++;
        continue;
      }

      // Markdown Table
      if (trimmed.startsWith('|') && trimmed.endsWith('|') && i + 1 < lines.length && lines[i + 1].includes('---')) {
        const headerLine = trimmed;
        const separatorLine = lines[i + 1].trim();

        const headers = headerLine
          .slice(1, -1)
          .split('|')
          .map((h) => h.trim());

        const alignments = separatorLine
          .slice(1, -1)
          .split('|')
          .map((col) => {
            const c = col.trim();
            if (c.startsWith(':') && c.endsWith(':')) return 'center' as const;
            if (c.endsWith(':')) return 'right' as const;
            return 'left' as const;
          });

        const rows: string[][] = [];
        i += 2; // Move past header and separator

        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          const rowCells = lines[i]
            .trim()
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim());
          rows.push(rowCells);
          i++;
        }

        parsedBlocks.push({
          type: 'table',
          table: { headers, alignments, rows } as ParsedTable,
        });
        continue;
      }

      // Blockquote / Callout (e.g. > **Critical Distinction**: ...)
      if (trimmed.startsWith('>')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
          i++;
        }
        parsedBlocks.push({
          type: 'callout',
          text: quoteLines.join(' '),
        });
        continue;
      }

      // Heading 1 (# ...)
      if (trimmed.startsWith('# ')) {
        parsedBlocks.push({
          type: 'h1',
          text: trimmed.replace(/^#\s+/, ''),
        });
        i++;
        continue;
      }

      // Heading 2 (## ...)
      if (trimmed.startsWith('## ')) {
        parsedBlocks.push({
          type: 'h2',
          text: trimmed.replace(/^##\s+/, ''),
        });
        i++;
        continue;
      }

      // Heading 3 (### ...)
      if (trimmed.startsWith('### ')) {
        parsedBlocks.push({
          type: 'h3',
          text: trimmed.replace(/^###\s+/, ''),
        });
        i++;
        continue;
      }

      // Heading 4 (#### ...)
      if (trimmed.startsWith('#### ')) {
        parsedBlocks.push({
          type: 'h4',
          text: trimmed.replace(/^####\s+/, ''),
        });
        i++;
        continue;
      }

      // Bullet List item (- or *)
      if (/^[-*]\s+/.test(trimmed)) {
        const bulletItems: string[] = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
          bulletItems.push(lines[i].trim().replace(/^[-*]\s+/, ''));
          i++;
        }
        parsedBlocks.push({
          type: 'bulletList',
          items: bulletItems,
        });
        continue;
      }

      // Numbered List (1. 2. 3.)
      if (/^\d+\.\s+/.test(trimmed)) {
        const numberedItems: { num: number; text: string }[] = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          const match = lines[i].trim().match(/^(\d+)\.\s+(.*)$/);
          if (match) {
            numberedItems.push({
              num: parseInt(match[1], 10),
              text: match[2],
            });
          }
          i++;
        }
        parsedBlocks.push({
          type: 'numberedList',
          items: numberedItems,
        });
        continue;
      }

      // Display math line ($$...$$)
      if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
        parsedBlocks.push({
          type: 'displayMath',
          math: trimmed.slice(2, -2).trim(),
        });
        i++;
        continue;
      }

      // Code Block (```lang ... ```)
      if (trimmed.startsWith('```')) {
        const lang = trimmed.replace(/^```/, '').trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) i++; // skip closing ```
        parsedBlocks.push({
          type: 'codeBlock',
          lang,
          code: codeLines.join('\n'),
        });
        continue;
      }

      // Regular Paragraph or Definition block
      parsedBlocks.push({
        type: 'paragraph',
        text: trimmed,
      });
      i++;
    }

    return parsedBlocks;
  }, [content]);

  return (
    <div className={`space-y-4 font-sans text-slate-800 ${className}`}>
      {blocks.map((block, idx) => {
        // H1 Heading
        if (block.type === 'h1') {
          return (
            <div
              key={idx}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-5 text-white shadow-md border border-purple-800/40"
            >
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 text-[11px] font-mono mb-2">
                    <Sparkles className="w-3 h-3 text-purple-300" />
                    <span>CURRICULUM CHAPTER OVERVIEW</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                    {renderInlineContent(block.text)}
                  </h1>
                </div>
              </div>
            </div>
          );
        }

        // H2 Heading
        if (block.type === 'h2') {
          return (
            <div
              key={idx}
              className="pt-3 pb-1 border-b border-slate-200 flex items-center gap-2"
            >
              <span className="w-1.5 h-4 rounded-full bg-purple-600 shrink-0" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight font-sans">
                {renderInlineContent(block.text)}
              </h2>
            </div>
          );
        }

        // H3 Heading with specialized badges (Learning Objectives, Definitions, Formulas, Golden Rule)
        if (block.type === 'h3') {
          const lower = block.text.toLowerCase();
          const isObjectives = lower.includes('learning objective') || lower.includes('🎯');
          const isDefinitions = lower.includes('definition') || lower.includes('principle') || lower.includes('📖');
          const isFormulas = lower.includes('formula') || lower.includes('geometric') || lower.includes('📐');
          const isGoldenRule = lower.includes('golden rule') || lower.includes('rule') || lower.includes('💡');

          return (
            <div
              key={idx}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border mt-3 ${
                isObjectives
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : isDefinitions
                  ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
                  : isFormulas
                  ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                  : isGoldenRule
                  ? 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              {isObjectives && <Target className="w-4 h-4 text-emerald-600 shrink-0" />}
              {isDefinitions && <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />}
              {isFormulas && <Calculator className="w-4 h-4 text-blue-600 shrink-0" />}
              {isGoldenRule && <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />}
              {!isObjectives && !isDefinitions && !isFormulas && !isGoldenRule && (
                <ChevronRight className="w-4 h-4 text-purple-600 shrink-0" />
              )}
              <h3 className="text-xs sm:text-sm font-bold tracking-tight">
                {renderInlineContent(block.text)}
              </h3>
            </div>
          );
        }

        // H4 Heading
        if (block.type === 'h4') {
          return (
            <h4 key={idx} className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono mt-2">
              {renderInlineContent(block.text)}
            </h4>
          );
        }

        // Divider
        if (block.type === 'divider') {
          return (
            <div key={idx} className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200/80" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-slate-300 text-xs font-mono">• • •</span>
              </div>
            </div>
          );
        }

        // Callout Box (> ...)
        if (block.type === 'callout') {
          const isWarningOrDistinction =
            block.text.toLowerCase().includes('critical distinction') ||
            block.text.toLowerCase().includes('important') ||
            block.text.toLowerCase().includes('warning');

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex items-start gap-3 my-3 shadow-2xs ${
                isWarningOrDistinction
                  ? 'bg-amber-50/70 border-amber-300/80 text-amber-950'
                  : 'bg-purple-50/70 border-purple-200 text-purple-950'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                  isWarningOrDistinction ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                }`}
              >
                {isWarningOrDistinction ? <Info className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
              </div>
              <div className="text-xs sm:text-[13px] leading-relaxed">
                {renderInlineContent(block.text)}
              </div>
            </div>
          );
        }

        // Publication Quality Table
        if (block.type === 'table') {
          const table: ParsedTable = block.table;
          return (
            <div key={idx} className="my-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/90 border-b border-slate-200">
                      {table.headers.map((h, hIdx) => {
                        const align = table.alignments[hIdx] || 'left';
                        return (
                          <th
                            key={hIdx}
                            className={`px-4 py-2.5 font-mono text-[11px] font-bold text-slate-700 tracking-wider uppercase ${
                              align === 'center'
                                ? 'text-center'
                                : align === 'right'
                                ? 'text-right'
                                : 'text-left'
                            }`}
                          >
                            {renderInlineContent(h)}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {table.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          rIdx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                        }`}
                      >
                        {row.map((cell, cIdx) => {
                          const align = table.alignments[cIdx] || 'left';
                          // Make first column stand out if it's concept/figure
                          const isFirstCol = cIdx === 0;

                          return (
                            <td
                              key={cIdx}
                              className={`px-4 py-3 leading-relaxed text-slate-800 ${
                                isFirstCol ? 'font-semibold text-slate-900' : ''
                              } ${
                                align === 'center'
                                  ? 'text-center'
                                  : align === 'right'
                                  ? 'text-right'
                                  : 'text-left'
                              }`}
                            >
                              {renderInlineContent(cell)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        // Bullet List
        if (block.type === 'bulletList') {
          return (
            <div key={idx} className="space-y-2 my-2.5">
              {block.items.map((item: string, bIdx: number) => {
                // Check if it's a key definition like "- **Variable**: A letter or symbol..."
                const defMatch = item.match(/^\*\*([^*]+)\*\*:\s*(.*)$/);

                if (defMatch) {
                  const term = defMatch[1];
                  const definition = defMatch[2];

                  return (
                    <div
                      key={bIdx}
                      className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/90 hover:border-purple-300 hover:bg-purple-50/20 transition-all flex flex-col sm:flex-row sm:items-baseline gap-2 text-xs leading-relaxed"
                    >
                      <div className="shrink-0 flex items-center gap-1.5 font-bold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200/80 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                        <span>{term}</span>
                      </div>
                      <div className="text-slate-700 sm:pt-0.5">
                        {renderInlineContent(definition)}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={bIdx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed pl-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2 shrink-0" />
                    <div className="flex-1">{renderInlineContent(item)}</div>
                  </div>
                );
              })}
            </div>
          );
        }

        // Numbered List / Steps
        if (block.type === 'numberedList') {
          return (
            <div key={idx} className="space-y-2 my-3">
              {block.items.map((item: { num: number; text: string }, nIdx: number) => {
                // Check if it's a Golden Rule or Step e.g. "1. **Always Use Parentheses**: ..."
                const ruleMatch = item.text.match(/^\*\*([^*]+)\*\*:\s*(.*)$/);

                if (ruleMatch) {
                  return (
                    <div
                      key={nIdx}
                      className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-purple-300 transition-all flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-lg bg-purple-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {item.num}
                      </div>
                      <div className="text-xs leading-relaxed">
                        <strong className="font-bold text-slate-900 block mb-0.5">
                          {ruleMatch[1]}
                        </strong>
                        <span className="text-slate-700">
                          {renderInlineContent(ruleMatch[2])}
                        </span>
                      </div>
                    </div>
                  );
                }

                // Check for verified solution result e.g. "Result: 17"
                const isResult = item.text.toLowerCase().includes('result:') || item.text.toLowerCase().includes('result :');

                return (
                  <div
                    key={nIdx}
                    className={`p-3 rounded-xl border flex items-start gap-3 text-xs leading-relaxed transition-all ${
                      isResult
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-mono font-bold shrink-0 ${
                        isResult
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isResult ? <Check className="w-3 h-3 stroke-[3]" /> : item.num}
                    </div>
                    <div className="flex-1">{renderInlineContent(item.text)}</div>
                  </div>
                );
              })}
            </div>
          );
        }

        // Display Math Block
        if (block.type === 'displayMath') {
          return (
            <div
              key={idx}
              className="my-3 py-3 px-5 rounded-xl bg-slate-50 border border-slate-200/90 text-center overflow-x-auto shadow-2xs"
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(block.math, {
                    displayMode: true,
                    throwOnError: false,
                  }),
                }}
              />
            </div>
          );
        }

        // Code Block
        if (block.type === 'codeBlock') {
          return (
            <div key={idx} className="my-3 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 text-slate-100 shadow-md">
              {block.lang && (
                <div className="px-4 py-1.5 bg-slate-800/80 border-b border-slate-700/80 font-mono text-[10px] text-purple-300 uppercase">
                  {block.lang}
                </div>
              )}
              <pre className="p-4 overflow-x-auto font-mono text-xs leading-relaxed text-emerald-300">
                <code>{block.code}</code>
              </pre>
            </div>
          );
        }

        // Paragraph
        return (
          <p key={idx} className="text-xs sm:text-[13px] leading-relaxed text-slate-700">
            {renderInlineContent(block.text)}
          </p>
        );
      })}
    </div>
  );
};
