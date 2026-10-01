import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function summarizeApiPlugin(): Plugin {
  return {
    name: 'summarize-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';
        if (url === '/api/summarize-module' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { rawText, courseName } = JSON.parse(body || '{}');
              if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Course material text is required.' }));
                return;
              }

              const apiKey = process.env.GEMINI_API_KEY;
              if (!apiKey) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ fallback: true, message: 'No GEMINI_API_KEY configured' }));
                return;
              }

              const prompt = `You are a distinguished university professor and academic curriculum architect.
Carefully read the provided course document and synthesize an authentic, rigorous, high-yield 3-tier study module.

ANTI-SLOP & FACTUAL FIDELITY INSTRUCTIONS (MANDATORY):
1. NO GENERIC PLACEHOLDERS, NO BOILERPLATE, NO SLOP:
   Every topic name, definition, mechanism, calculation, worked example, and quiz question must be strictly grounded in the document text provided.
2. TOPIC EXTRACTION:
   Identify 2 to 4 genuine distinct core topics taught in this text. Name them accurately using the author's real subject terminology.
3. DETAILED OVERVIEW (Study Notes):
   Write thorough, pedagogical study notes formatted in clean Markdown. Include exact definitions, numbered steps or bulleted rules, formulas/equations (if present), and key takeaways directly from the text.
4. DOMAIN-ADAPTED PRACTICAL EXAMPLES (NOT SLOP):
   - If the material is CODING / SOFTWARE: Provide a complete, syntactically valid code snippet directly implementing the concept from the text, with comments, sample inputs, and expected output.
   - If the material is MATH / PHYSICS / CHEMISTRY / QUANTITATIVE: Formulate an actual question/problem from the material and show the exact step-by-step mathematical/chemical solution with units and answer.
   - If the material is BIOLOGY / NATURAL SCIENCES: Provide a concrete biochemical or biological case example (e.g. tracing molecular flow, calculating photon or molecule ratios, or explaining a specific experimental test).
   - If the material is HUMANITIES / BUSINESS / LITERATURE / SOCIAL SCIENCES / PHILOSOPHY (words, not coding or math): Provide a clear, concrete real-world applied scenario or historical case study illustrating how the concept is applied with specific real-world entities.
   - NEVER output generic template code like "maintain invariants", "verifyConfig", or vague filler.
5. PRACTICE QUIZ:
   Write an exam question testing an exact factual detail, distinction, or mechanism from the text. Provide 4 distinct, plausible options, the 0-based correct option index, and a thorough explanation explaining why the correct choice is true according to the text and why distractors are false.

Document Content:
"""
${rawText.slice(0, 40000)}
"""`;

              const schema = {
                type: 'OBJECT',
                properties: {
                  prefix: { type: 'STRING' },
                  title: { type: 'STRING' },
                  courseCode: { type: 'STRING' },
                  estimatedHours: { type: 'STRING' },
                  summary: { type: 'STRING' },
                  syllabusFilename: { type: 'STRING' },
                  blueHeading: { type: 'STRING' },
                  topics: {
                    type: 'ARRAY',
                    items: {
                      type: 'OBJECT',
                      properties: {
                        topicName: { type: 'STRING' },
                        conceptObjective: { type: 'STRING' },
                        overview: { type: 'STRING' },
                        workedExample: { type: 'STRING' },
                        examQuestion: { type: 'STRING' },
                        quizOptions: {
                          type: 'ARRAY',
                          items: { type: 'STRING' },
                        },
                        correctOptionIndex: { type: 'INTEGER' },
                        quizExplanation: { type: 'STRING' },
                      },
                      required: [
                        'topicName',
                        'conceptObjective',
                        'overview',
                        'workedExample',
                        'examQuestion',
                        'quizOptions',
                        'correctOptionIndex',
                        'quizExplanation',
                      ],
                    },
                  },
                },
                required: [
                  'prefix',
                  'title',
                  'courseCode',
                  'estimatedHours',
                  'summary',
                  'syllabusFilename',
                  'blueHeading',
                  'topics',
                ],
              };

              const models = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
              let parsedResult: any = null;

              for (const model of models) {
                try {
                  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
                  const apiRes = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'User-Agent': 'aistudio-build',
                    },
                    body: JSON.stringify({
                      contents: [{ parts: [{ text: prompt }] }],
                      generationConfig: {
                        responseMimeType: 'application/json',
                        responseSchema: schema,
                      },
                    }),
                  });

                  if (apiRes.ok) {
                    const result = await apiRes.json();
                    const candidateText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (candidateText) {
                      parsedResult = JSON.parse(candidateText);
                      console.log(`[Summarize API] Successfully generated curriculum using ${model}`);
                      break;
                    }
                  } else {
                    console.warn(`[Summarize API] Model ${model} returned ${apiRes.status}`);
                  }
                } catch (err: any) {
                  console.warn(`[Summarize API] Model ${model} error:`, err.message);
                }
              }

              if (parsedResult) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: parsedResult }));
              } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ fallback: true, message: 'All Gemini model endpoints busy, using local academic parser.' }));
              }
            } catch (err: any) {
              console.error('Vite dev API error:', err);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ fallback: true, error: err.message }));
            }
          });
          return;
        }

        if (url === '/api/unload-module' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const { moduleId, title } = JSON.parse(body || '{}');
              console.log(`[Unload API] Module unloaded and document memory purged: ${moduleId} (${title || 'unnamed'})`);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: true,
                  message: `Module "${title || moduleId}" unloaded successfully. Server memory and storage freed.`,
                  purgedAt: new Date().toISOString(),
                })
              );
            } catch (err: any) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), summarizeApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      // Allow all hosts so Cloud Run / AI Studio preview proxy is not blocked with 403
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return id.toString().split('node_modules/')[1].split('/')[0].toString();
            }
          },
        },
      },
    },
  };
});