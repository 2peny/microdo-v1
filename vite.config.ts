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

              const prompt = `You are an expert curriculum designer and academic summarizer. 
Analyze the following course material or textbook chapter and extract a structured study guide following this exact 3-tier flow:
1. First node (Purple module): Prefix (e.g. "// Module: Name"), module title, course code / chapter, estimated study hours, and 1-sentence summary.
2. Center node (Blue blueprint): Module syllabus filename (e.g. "key-topics.md"), title of key topics, and 3 key core topics that must be learned.
3. Third node (Green cards): For EACH of the 3 key topics, provide:
   - Topic Name: Specific conceptual topic extracted directly from this section
   - Objective: Measurable learning objective for this specific topic
   - 3 child output artifacts:
     a) "Key Concept Overview" (clear, concise breakdown of rules, definitions, mental models, key points with markdown)
     b) "Worked Real-World Examples" (step-by-step example with concrete solution or code using domain terminology from the text)
     c) "Exam Review & Practice Quiz" (exam checklist with 1 high-yield multiple choice question, 4 distinct options, correct answer index 0-3, and comprehensive explanation)

Course Material Text:
"""
${rawText.slice(0, 30000)}
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

              const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

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

              if (!apiRes.ok) {
                const errText = await apiRes.text();
                console.warn('Gemini API Warning in Vite dev:', errText);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ fallback: true }));
                return;
              }

              const result = await apiRes.json();
              const candidateText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (!candidateText) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ fallback: true }));
                return;
              }

              const parsed = JSON.parse(candidateText);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, data: parsed }));
            } catch (err: any) {
              console.error('Vite dev API error:', err);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ fallback: true, error: err.message }));
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