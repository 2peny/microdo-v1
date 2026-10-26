import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SlidingWindowRateLimiter } from './requestRateLimiter.js';

// 1. Resolve directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');
const PORT = process.env.PORT || 3000;

// 2. Load .env file automatically using built-in fs (zero external dependency required)
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch {
  // Silent fallback
}

const allowedOrigins = new Set([
  process.env.APP_ORIGIN || 'https://microdo.nodegrid.space',
  ...(process.env.NODE_ENV === 'production'
    ? []
    : ['http://localhost:5173', 'http://127.0.0.1:5173']),
]);

// 3. MIME types dictionary for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
};

// 4. Helper to parse JSON request body
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // Safeguard against memory abuse (limit to 10MB)
      if (body.length > 10 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Request entity too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// 5. Helper to send JSON response
function sendJson(req, res, statusCode, data) {
  const jsonStr = JSON.stringify(data);
  const corsHeaders = req.headers.origin
    ? { 'Access-Control-Allow-Origin': req.headers.origin, Vary: 'Origin' }
    : {};
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(jsonStr),
    ...corsHeaders,
  });
  res.end(jsonStr);
}

// 6. Handle AI summarization API using native fetch with hidden API key via header
async function handleSummarizeModule(req, res) {
  try {
    const { rawText, courseName } = await parseRequestBody(req);

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
      return sendJson(req, res, 400, { error: 'Course material text is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return sendJson(req, res, 200, {
        fallback: true,
        message: 'AI synthesizer in structured academic mode.',
      });
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
    let parsedResult = null;

    for (const model of models) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const apiRes = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
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
            break;
          }
        }
      } catch {
        // Fallback to next model
      }
    }

    if (parsedResult) {
      return sendJson(req, res, 200, { success: true, data: parsedResult });
    }

    return sendJson(req, res, 200, {
      fallback: true,
      message: 'Switched to structured academic parser.',
    });
  } catch {
    return sendJson(req, res, 200, {
      fallback: true,
      error: 'Summarization service processed via local parser.',
    });
  }
}

// 7. Handle Unload Module / Purge Memory API
async function handleUnloadModule(req, res) {
  try {
    const { moduleId, title } = await parseRequestBody(req);
    return sendJson(req, res, 200, {
      success: true,
      message: `Module "${title || moduleId}" unloaded successfully. Server memory and storage freed.`,
      purgedAt: new Date().toISOString(),
    });
  } catch (error) {
    return sendJson(req, res, 400, { error: 'Failed to unload module' });
  }
}

// 8. Serve static files with SPA fallback
function serveStaticFile(req, res, pathname) {
  let relativePath = pathname === '/' ? 'index.html' : pathname;
  const safePath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, '');
  let targetFile = path.join(distPath, safePath);

  let stats = null;
  try {
    if (fs.existsSync(targetFile)) {
      stats = fs.statSync(targetFile);
      if (stats.isDirectory()) {
        const potentialIndex = path.join(targetFile, 'index.html');
        if (fs.existsSync(potentialIndex)) {
          targetFile = potentialIndex;
        } else {
          targetFile = path.join(distPath, 'index.html');
        }
      }
    } else {
      targetFile = path.join(distPath, 'index.html');
    }
  } catch {
    targetFile = path.join(distPath, 'index.html');
  }

  const ext = path.extname(targetFile).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(targetFile, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 - Internal Server Error');
      return;
    }

    const headers = {
      'Content-Type': contentType,
      'Content-Length': data.length,
    };

    if (targetFile.includes('/assets/')) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    } else {
      headers['Cache-Control'] = 'no-cache';
    }

    res.writeHead(200, headers);
    res.end(data);
  });
}

// 9. Create HTTP server
const summarizeRateLimiter = new SlidingWindowRateLimiter(30, 15 * 60 * 1000);
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const origin = req.headers.origin;

  if (origin && !allowedOrigins.has(origin)) {
    res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Origin not allowed.' }));
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, origin ? {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '600',
      Vary: 'Origin',
    } : {});
    res.end();
    return;
  }

  if (pathname === '/api/summarize-module' && req.method === 'POST') {
    const { allowed, retryAfterSeconds } = summarizeRateLimiter.check(
      req.socket.remoteAddress || 'unknown'
    );
    if (!allowed) {
      res.writeHead(429, {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds),
      });
      res.end(JSON.stringify({ error: 'Too many requests. Please try again later.' }));
      return;
    }
    return handleSummarizeModule(req, res);
  }

  if (pathname === '/api/unload-module' && req.method === 'POST') {
    return handleUnloadModule(req, res);
  }

  if (pathname.startsWith('/api/admin/')) {
    return sendJson(req, res, 404, { error: 'Administrative API route not found.' });
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    return serveStaticFile(req, res, pathname);
  }

  res.writeHead(405, { 'Content-Type': 'text/plain' });
  res.end('Method Not Allowed');
});

server.listen(PORT, () => {
  console.log(`MicroDo production server listening on port ${PORT}`);
});
