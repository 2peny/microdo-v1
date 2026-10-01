import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
} catch (err) {
  console.warn('Notice: Could not read .env file:', err.message);
}

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
function sendJson(res, statusCode, data) {
  const jsonStr = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(jsonStr),
    'Access-Control-Allow-Origin': '*',
  });
  res.end(jsonStr);
}

// 6. Handle AI summarization API using native fetch (built into Node 18+)
async function handleSummarizeModule(req, res) {
  try {
    const { rawText, courseName } = await parseRequestBody(req);

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
      return sendJson(res, 400, { error: 'Course material text is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return sendJson(res, 200, {
        fallback: true,
        message: 'No GEMINI_API_KEY configured on server; using local academic parser.',
      });
    }

    const prompt = `You are an expert curriculum designer and academic summarizer. 
Analyze the following course material or textbook chapter and extract a structured study guide following this exact 3-tier flow:
1. First node (Purple module): Prefix (e.g. "// Module: Name"), module title, course code / chapter, estimated study hours, and 1-sentence summary.
2. Center node (Blue blueprint): Module syllabus filename (e.g. "key-topics.md"), title of key topics, and 3 key core topics that must be learned.
3. Third node (Green cards): For EACH of the 3 key topics, provide:
   - Topic Name
   - Objective
   - 3 child output artifacts:
     a) "Key Concept Overview" (clear, concise breakdown of rules/definitions)
     b) "Worked Real-World Examples" (step-by-step example with concrete solution or code)
     c) "Exam Review & Practice Quiz" (exam checklist with 1 multiple choice question, options, correct answer, and explanation)

Course Material Text:
"""
${rawText.slice(0, 15000)}
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

    const response = await fetch(apiUrl, {
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

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', errText);
      return sendJson(res, 200, {
        fallback: true,
        message: 'Gemini API call failed, falling back to local academic parser.',
      });
    }

    const result = await response.json();
    const candidateText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return sendJson(res, 200, { fallback: true, message: 'Empty Gemini response.' });
    }

    const parsed = JSON.parse(candidateText);
    return sendJson(res, 200, { success: true, data: parsed });
  } catch (error) {
    console.error('Summarize error:', error);
    return sendJson(res, 500, { error: error.message || 'Summarization failed' });
  }
}

// 7. Serve static files with SPA fallback
function serveStaticFile(req, res, pathname) {
  let relativePath = pathname === '/' ? 'index.html' : pathname;
  // Prevent directory traversal attacks
  const safePath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, '');
  let targetFile = path.join(distPath, safePath);

  // If path doesn't exist or is directory without index.html, fall back to dist/index.html (SPA routing)
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
  } catch (e) {
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

    // Cache static assets aggressively, keep index.html fresh
    if (targetFile.includes('/assets/')) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    } else {
      headers['Cache-Control'] = 'no-cache';
    }

    res.writeHead(200, headers);
    res.end(data);
  });
}

// 8. Create the HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS preflight handling
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // API Routes
  if (pathname === '/api/summarize-module' && req.method === 'POST') {
    return handleSummarizeModule(req, res);
  }

  // Static files and SPA fallback
  if (req.method === 'GET' || req.method === 'HEAD') {
    return serveStaticFile(req, res, pathname);
  }

  res.writeHead(405, { 'Content-Type': 'text/plain' });
  res.end('Method Not Allowed');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, () => {
  console.log(`MicroDo production server listening on port ${PORT}`);
});
