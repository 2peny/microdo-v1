import React from 'react';
import { StudyArtifact } from '../types';

type VisualDiagram =
  | {
      kind: 'architecture';
      title: string;
      components: string[];
      source: string;
    }
  | {
      kind: 'comparison';
      title: string;
      models: { name: string; definition: string }[];
      source: string;
    }
  | {
      kind: 'process';
      title: string;
      steps: string[];
      source: string;
    }
  | {
      kind: 'function';
      title: string;
      formula: string;
      source: string;
    };

const visualCache = new Map<string, VisualDiagram | null>();
const MAX_VISUAL_CACHE_ENTRIES = 64;

function contentFingerprint(content: string): string {
  let hash = 2166136261;
  for (let index = 0; index < content.length; index += 1) {
    hash ^= content.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function cacheVisual(key: string, value: VisualDiagram | null): VisualDiagram | null {
  if (visualCache.size >= MAX_VISUAL_CACHE_ENTRIES) {
    const oldestKey = visualCache.keys().next().value;
    if (oldestKey) visualCache.delete(oldestKey);
  }
  visualCache.set(key, value);
  return value;
}

function findDefinition(artifact: StudyArtifact, name: string): string | null {
  const concept = artifact.structuredLesson?.keyConcepts.find((item) =>
    item.term.toLowerCase().includes(name.toLowerCase())
  );
  if (concept?.definition && concept.definition.length <= 600) return concept.definition;

  const source = artifact.sourceText || '';
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(
    new RegExp(`(?:^|\\n)\\s*(?:[-*]\\s*)?\\*{0,2}${escapedName}\\*{0,2}\\s*:\\s*([^\\n]+)`, 'i')
  );
  const definition = match?.[1]?.trim();
  return definition && definition.length <= 600 ? definition : null;
}

export function selectLearningVisual(artifact: StudyArtifact): VisualDiagram | null {
  if (artifact.type !== 'overview') return null;
  const source = artifact.sourceText?.trim() || '';
  const lesson = artifact.structuredLesson;
  if ((!source && !lesson) || source.length > 100_000) return null;

  const cacheKey = `${artifact.id}:${contentFingerprint(`${source}\n${artifact.overviewMarkdown}`)}`;
  if (visualCache.has(cacheKey)) return visualCache.get(cacheKey) || null;

  const title = lesson?.topicTitle || artifact.title;
  const lessonText = [
    lesson?.topicTitle,
    lesson?.introduction,
    ...(lesson?.keyConcepts || []).flatMap((concept) => [concept.term, concept.definition]),
    ...(lesson?.rulesAndFormulas || []).flatMap((rule) => [rule.concept, rule.formula || '', rule.explanation]),
  ].join(' ');
  const content = `${source}\n${lessonText}`;
  const lower = content.toLowerCase();
  const sourceReference = artifact.sourceReference?.documentName
    ? `${artifact.sourceReference.documentName}${artifact.sourceReference.pageNumber ? ` · Page ${artifact.sourceReference.pageNumber}` : ''}`
    : 'Lesson source text';

  const serviceModels = ['Infrastructure as a Service (IaaS)', 'Platform as a Service (PaaS)', 'Software as a Service (SaaS)'];
  if (
    !/\barchitecture\b/i.test(title) &&
    serviceModels.every((model) => lower.includes(model.toLowerCase()))
  ) {
    const models = serviceModels.map((name) => {
      const definition = findDefinition(artifact, name);
      return definition ? { name, definition } : null;
    });
    if (models.every((model) => model !== null)) {
      return cacheVisual(cacheKey, {
        kind: 'comparison',
        title: 'Cloud service models',
        models: models as { name: string; definition: string }[],
        source: sourceReference,
      });
    }
  }

  const cloudComponents = ['servers', 'storage', 'databases', 'networking', 'software', 'analytics']
    .filter((component) => lower.includes(component));
  if (
    /\barchitecture\b/i.test(title) &&
    /\bcloud computing\b/i.test(content) &&
    /\bover the internet\b/i.test(content) &&
    cloudComponents.length >= 3
  ) {
    return cacheVisual(cacheKey, {
      kind: 'architecture',
      title: 'Cloud services described in this lesson',
      components: cloudComponents,
      source: sourceReference,
    });
  }

  const numberedSteps = source
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*(?:\*\*)?(\d{1,2})[.)]\s+(.+?)\s*(?:\*\*)?\s*$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => match[2].replace(/\*\*/g, '').trim())
    .filter((step) => step.length > 8 && step.length < 180);
  if (numberedSteps.length >= 2 && numberedSteps.length <= 5) {
    return cacheVisual(cacheKey, {
      kind: 'process',
      title: 'Procedure from the source',
      steps: numberedSteps,
      source: sourceReference,
    });
  }

  if (/\b(?:function|functions)\b/i.test(content)) {
    const formula = source.match(/(?:f\s*\(\s*[a-z]\s*\)\s*=|y\s*=)[^\n.;]{1,80}/i)?.[0]?.trim();
    if (formula) {
      return cacheVisual(cacheKey, {
        kind: 'function',
        title: 'Function relationship',
        formula,
        source: sourceReference,
      });
    }
  }

  return cacheVisual(cacheKey, null);
}

function wrapText(text: string, maxCharacters: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (!word) continue;
    if (current && `${current} ${word}`.length > maxCharacters) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function SvgLabel({ text, x, y, maxCharacters = 24, lineHeight = 18, maxLines = 4, className = '' }: {
  text: string;
  x: number;
  y: number;
  maxCharacters?: number;
  lineHeight?: number;
  maxLines?: number;
  className?: string;
}) {
  return (
    <text x={x} y={y} textAnchor="middle" className={className}>
      {wrapText(text, maxCharacters).slice(0, maxLines).map((line, index) => (
        <tspan key={`${index}-${line}`} x={x} dy={index === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

const boxClass = 'fill-white stroke-indigo-300';
const labelClass = 'fill-slate-800 text-[14px] font-medium';

function ArchitectureDiagram({ diagram }: { diagram: Extract<VisualDiagram, { kind: 'architecture' }> }) {
  return (
    <svg viewBox="0 0 720 230" role="img" aria-labelledby="learning-visual-title learning-visual-desc" className="h-auto w-full">
      <title id="learning-visual-title">{diagram.title}</title>
      <desc id="learning-visual-desc">
        A non-directional list of cloud services named in the lesson. No relationships between components are inferred.
      </desc>
      <defs>
        <marker id="cloud-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" className="fill-indigo-500" />
        </marker>
      </defs>
      <rect x="28" y="80" width="140" height="64" rx="14" className={boxClass} />
      <SvgLabel text="Internet" x={98} y={118} className={labelClass} />
      <path d="M168 112 H215" stroke="currentColor" strokeWidth="2" className="text-indigo-500" markerEnd="url(#cloud-arrow)" />
      <rect x="226" y="28" width="466" height="174" rx="18" className="fill-indigo-50 stroke-indigo-200" />
      <SvgLabel text="Cloud services named in the lesson" x={459} y={56} className="fill-indigo-900 text-[15px] font-semibold" />
      {diagram.components.map((component, index) => {
        const column = index % 3;
        const row = Math.floor(index / 3);
        const x = 248 + column * 143;
        const y = 76 + row * 58;
        return (
          <g key={component}>
            <rect x={x} y={y} width="128" height="42" rx="10" className="fill-white stroke-slate-300" />
            <SvgLabel text={component} x={x + 64} y={y + 25} maxCharacters={18} className={labelClass} />
          </g>
        );
      })}
    </svg>
  );
}

function ComparisonDiagram({ diagram }: { diagram: Extract<VisualDiagram, { kind: 'comparison' }> }) {
  const columnWidth = 720 / diagram.models.length;
  const descriptions = diagram.models.map((model) => wrapText(model.definition, 29));
  const diagramHeight = Math.max(250, 104 + Math.max(...descriptions.map((lines) => lines.length)) * 16);
  return (
    <svg viewBox={`0 0 720 ${diagramHeight}`} role="img" aria-labelledby="learning-visual-title learning-visual-desc" className="h-auto w-full">
      <title id="learning-visual-title">{diagram.title}</title>
      <desc id="learning-visual-desc">
        Side-by-side definitions of the IaaS, PaaS, and SaaS models, taken from the lesson content.
      </desc>
      {diagram.models.map((model, index) => {
        const x = index * columnWidth + 8;
        const center = x + (columnWidth - 16) / 2;
        return (
          <g key={model.name}>
            <rect x={x} y="8" width={columnWidth - 16} height={diagramHeight - 16} rx="14" className={boxClass} />
            <SvgLabel text={model.name} x={center} y={34} maxCharacters={23} className="fill-indigo-800 text-[14px] font-semibold" />
            <line x1={x + 18} y1="78" x2={x + columnWidth - 34} y2="78" className="stroke-slate-200" />
            <SvgLabel
              text={model.definition}
              x={center}
              y={101}
              maxCharacters={29}
              lineHeight={16}
              maxLines={Math.ceil((diagramHeight - 120) / 16)}
              className="fill-slate-700 text-[11px]"
            />
          </g>
        );
      })}
    </svg>
  );
}

function ProcessDiagram({ diagram }: { diagram: Extract<VisualDiagram, { kind: 'process' }> }) {
  const count = diagram.steps.length;
  const cardWidth = Math.min(160, 650 / count);
  const gap = (650 - cardWidth * count) / (count - 1);
  const start = 35;
  return (
    <svg viewBox="0 0 720 190" role="img" aria-labelledby="learning-visual-title learning-visual-desc" className="h-auto w-full">
      <title id="learning-visual-title">{diagram.title}</title>
      <desc id="learning-visual-desc">A sequence of {count} numbered steps, in the same order as the source text.</desc>
      <defs>
        <marker id="process-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" className="fill-indigo-500" />
        </marker>
      </defs>
      {diagram.steps.map((step, index) => {
        const x = start + index * (cardWidth + gap);
        return (
          <g key={`${index}-${step}`}>
            <rect x={x} y="46" width={cardWidth} height="98" rx="14" className={boxClass} />
            <circle cx={x + 22} cy="69" r="12" className="fill-indigo-100" />
            <text x={x + 22} y="74" textAnchor="middle" className="fill-indigo-800 text-[12px] font-semibold">{index + 1}</text>
            <SvgLabel text={step} x={x + cardWidth / 2} y={99} maxCharacters={Math.max(14, Math.floor(cardWidth / 7))} lineHeight={16} className="fill-slate-800 text-[12px]" />
            {index < count - 1 && (
              <path
                d={`M${x + cardWidth + 3} 95 H${x + cardWidth + gap - 5}`}
                stroke="currentColor"
                strokeWidth="2"
                className="text-indigo-500"
                markerEnd="url(#process-arrow)"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

function FunctionDiagram({ diagram }: { diagram: Extract<VisualDiagram, { kind: 'function' }> }) {
  return (
    <svg viewBox="0 0 720 170" role="img" aria-labelledby="learning-visual-title learning-visual-desc" className="h-auto w-full">
      <title id="learning-visual-title">{diagram.title}</title>
      <desc id="learning-visual-desc">The source formula is shown as a rule connecting an input to an output; no sample values are assumed.</desc>
      <defs>
        <marker id="function-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" className="fill-indigo-500" />
        </marker>
      </defs>
      <rect x="25" y="50" width="140" height="64" rx="14" className={boxClass} />
      <SvgLabel text="Input" x={95} y={88} className={labelClass} />
      <path d="M165 82 H245" stroke="currentColor" strokeWidth="2" className="text-indigo-500" markerEnd="url(#function-arrow)" />
      <rect x="258" y="40" width="205" height="84" rx="14" className="fill-indigo-50 stroke-indigo-300" />
      <SvgLabel text={diagram.formula} x={360} y={88} maxCharacters={27} className="fill-indigo-900 text-[14px] font-semibold" />
      <path d="M463 82 H543" stroke="currentColor" strokeWidth="2" className="text-indigo-500" markerEnd="url(#function-arrow)" />
      <rect x="555" y="50" width="140" height="64" rx="14" className={boxClass} />
      <SvgLabel text="Output" x={625} y={88} className={labelClass} />
    </svg>
  );
}

export const LearningVisual: React.FC<{ artifact: StudyArtifact }> = ({ artifact }) => {
  const diagram = selectLearningVisual(artifact);
  if (!diagram) return null;

  return (
    <figure className="my-8 overflow-hidden rounded-xl border border-indigo-100 bg-white">
      <figcaption className="border-b border-indigo-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">{diagram.title}</h2>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          {diagram.kind === 'architecture' && 'Shows services named in the lesson; component relationships are not inferred.'}
          {diagram.kind === 'comparison' && 'Definitions are drawn from this lesson and shown side by side.'}
          {diagram.kind === 'process' && 'The steps follow the order given in the source.'}
          {diagram.kind === 'function' && 'The source formula is shown without adding example values.'}
        </p>
      </figcaption>
      <div className="overflow-x-auto p-3 sm:p-5">
        <div className="min-w-[560px]">
          {diagram.kind === 'architecture' && <ArchitectureDiagram diagram={diagram} />}
          {diagram.kind === 'comparison' && <ComparisonDiagram diagram={diagram} />}
          {diagram.kind === 'process' && <ProcessDiagram diagram={diagram} />}
          {diagram.kind === 'function' && <FunctionDiagram diagram={diagram} />}
        </div>
      </div>
      <p className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">
        MicroDo-generated diagram · Source: {diagram.source}
      </p>
    </figure>
  );
};
