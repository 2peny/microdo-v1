import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.static('public'));

// Initialize Gemini client server-side with User-Agent header as required
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Server endpoint to analyze and summarize course material
app.post('/api/summarize-module', async (req, res) => {
  try {
    const { rawText, courseName, fileName } = req.body;

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
      return res.status(400).json({ error: 'Course material text is required.' });
    }

    if (!ai) {
      // Return structured fallback if API key is not yet configured
      return res.json({
        fallback: true,
        message: 'No API key detected, using structured academic parser.',
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prefix: { type: Type.STRING, description: 'e.g. // Module 01: Cache Systems' },
            title: { type: Type.STRING, description: 'Short module title' },
            courseCode: { type: Type.STRING, description: 'e.g. CS-201 · Chapter 4' },
            estimatedHours: { type: Type.STRING, description: 'e.g. 3.5 hrs' },
            summary: { type: Type.STRING, description: 'Summary of the book/module' },
            syllabusFilename: { type: Type.STRING, description: 'e.g. syllabus.md or topics.md' },
            blueHeading: { type: Type.STRING, description: 'e.g. Core Competencies & Roadmap' },
            topics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topicName: { type: Type.STRING },
                  conceptObjective: { type: Type.STRING },
                  overview: { type: Type.STRING, description: 'Concise explanation with bullet points' },
                  workedExample: { type: Type.STRING, description: 'Step-by-step worked problem or code example' },
                  examQuestion: { type: Type.STRING, description: 'Practice exam question' },
                  quizOptions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctOptionIndex: { type: Type.INTEGER },
                  quizExplanation: { type: Type.STRING },
                },
                required: ['topicName', 'conceptObjective', 'overview', 'workedExample', 'examQuestion', 'quizOptions', 'correctOptionIndex', 'quizExplanation'],
              },
            },
          },
          required: ['prefix', 'title', 'courseCode', 'estimatedHours', 'summary', 'syllabusFilename', 'blueHeading', 'topics'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Gemini summarization error:', error);
    return res.status(500).json({ error: error.message || 'Summarization failed' });
  }
});

async function startServer() {
  // Mount Vite middleware in dev
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
