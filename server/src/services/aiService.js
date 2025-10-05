import axios from 'axios';
import { z } from 'zod';

const ChoiceSchema = z.object({
  id: z.string(),
  text: z.string(),
  isCorrect: z.boolean()
});

const QuestionSchema = z
  .object({
    id: z.string(),
    question: z.string(),
    choices: z.array(ChoiceSchema).length(4)
  })
  .refine(
    (q) => q.choices.filter((c) => c.isCorrect).length === 1,
    {
      message: 'Each question must have exactly one correct choice',
      path: ['choices']
    }
  );

const QuestionsSchema = z.object({
  questions: z.array(QuestionSchema).length(5)
});

function buildQuestionsPrompt(topic) {
  return [
    {
      role: 'system',
      content: 'You are an assistant that generates JSON strictly matching a schema.'
    },
    {
      role: 'user',
      content: `Generate 5 multiple-choice questions about ${topic}. Each question must have 4 choices with exactly one correct. Respond ONLY with JSON matching: {"questions":[{"id":"string","question":"string","choices":[{"id":"string","text":"string","isCorrect":boolean}]}]}`
    }
  ];
}

function buildFeedbackPrompt(topic, score) {
  return [
    { role: 'system', content: 'You write concise motivational feedback.' },
    { role: 'user', content: `Topic: ${topic}. Score: ${score}/5. Return ONLY JSON: {"message":"string"}. Tailor to performance tiers.` }
  ];
}

function splitSystemAndUser(messages) {
  let systemText = '';
  const userTexts = [];
  for (const m of messages) {
    if (m.role === 'system') {
      systemText += (systemText ? '\n' : '') + m.content;
    } else if (m.role === 'user') {
      userTexts.push(m.content);
    }
  }
  return { systemText: systemText || undefined, userText: userTexts.join('\n') };
}

async function callGemini(messages) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  if (!apiKey) return null;

  const { systemText, userText } = splitSystemAndUser(messages);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userText }]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      response_mime_type: 'application/json'
    }
  };
  if (systemText) {
    body.systemInstruction = { parts: [{ text: systemText }] };
  }
  try {
    const resp = await axios.post(url, body);
    const text = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || null;
  } catch (e) {
    console.error('Gemini call failed:', e?.response?.data || e.message);
    return null;
  }
}

async function callOpenAI(messages) {
  const baseURL = process.env.AI_BASE_URL; // compatible with OpenAI-like APIs
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || 'gpt-4o-mini';
  if (!baseURL || !apiKey) return null;
  try {
    const resp = await axios.post(
      `${baseURL}/chat/completions`,
      {
        model,
        messages,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      },
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    return resp.data?.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.error('OpenAI call failed:', e?.response?.data || e.message);
    return null;
  }
}

async function callAI(messages) {
  // Prefer Gemini if available; otherwise try OpenAI-compatible; otherwise null
  const gemini = await callGemini(messages);
  if (gemini) return gemini;
  const openai = await callOpenAI(messages);
  if (openai) return openai;
  return null;
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function robustJsonCall(messages, schema, fallbackFactory) {
  // up to 3 attempts, repairing JSON if malformed
  for (let attempt = 1; attempt <= 3; attempt++) {
    const content = await callAI(messages);
    if (content) {
      const json = tryParseJson(content);
      if (json) {
        const parsed = schema.safeParse(json);
        if (parsed.success) return parsed.data;
      }
    }
    // repair: ask AI to fix to schema
    messages = [
      ...messages,
      { role: 'user', content: 'Your previous output was invalid. Return ONLY valid JSON for the schema.' }
    ];
  }
  return fallbackFactory();
}

export async function generateQuestions(topic) {
  const data = await robustJsonCall(
    buildQuestionsPrompt(topic),
    QuestionsSchema,
    () => mockQuestions(topic)
  );
  return data.questions;
}

export async function generateFeedback(topic, score) {
  const FeedbackSchema = z.object({ message: z.string().min(1).max(300) });
  const data = await robustJsonCall(
    buildFeedbackPrompt(topic, score),
    FeedbackSchema,
    () => ({ message: mockFeedback(topic, score) })
  );
  return data.message;
}

function mockQuestions(topic) {
  const base = [
    {
      id: 'q1',
      question: `Which statement is true about ${topic}?`,
      choices: [
        { id: 'a', text: 'Statement A', isCorrect: false },
        { id: 'b', text: 'Statement B', isCorrect: true },
        { id: 'c', text: 'Statement C', isCorrect: false },
        { id: 'd', text: 'Statement D', isCorrect: false }
      ]
    },
    {
      id: 'q2',
      question: `A common misconception about ${topic} is?`,
      choices: [
        { id: 'a', text: 'Misconception A', isCorrect: true },
        { id: 'b', text: 'Misconception B', isCorrect: false },
        { id: 'c', text: 'Misconception C', isCorrect: false },
        { id: 'd', text: 'Misconception D', isCorrect: false }
      ]
    },
    {
      id: 'q3',
      question: `Best practice related to ${topic} includes:`,
      choices: [
        { id: 'a', text: 'Practice A', isCorrect: false },
        { id: 'b', text: 'Practice B', isCorrect: false },
        { id: 'c', text: 'Practice C', isCorrect: true },
        { id: 'd', text: 'Practice D', isCorrect: false }
      ]
    },
    {
      id: 'q4',
      question: `A key metric for ${topic} is:`,
      choices: [
        { id: 'a', text: 'Metric A', isCorrect: false },
        { id: 'b', text: 'Metric B', isCorrect: true },
        { id: 'c', text: 'Metric C', isCorrect: false },
        { id: 'd', text: 'Metric D', isCorrect: false }
      ]
    },
    {
      id: 'q5',
      question: `An application of ${topic}:`,
      choices: [
        { id: 'a', text: 'Application A', isCorrect: false },
        { id: 'b', text: 'Application B', isCorrect: false },
        { id: 'c', text: 'Application C', isCorrect: true },
        { id: 'd', text: 'Application D', isCorrect: false }
      ]
    }
  ];
  return { questions: base };
}

function mockFeedback(topic, score) {
  if (score >= 4) return `Excellent work on ${topic}! You clearly mastered the material.`;
  if (score === 3) return `Nice job on ${topic}. Review a few tricky areas and try again.`;
  if (score === 2) return `You’re getting there with ${topic}. Revisit the basics and build up.`;
  return `Good start on ${topic}. Focus on fundamentals and take another run!`;
}
