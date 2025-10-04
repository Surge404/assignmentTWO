import express from 'express';
import { z } from 'zod';
import { generateQuestions, generateFeedback } from '../services/aiService.js';

export const quizRouter = express.Router();

const TopicSchema = z.object({
  topic: z.string().min(2).max(60)
});

quizRouter.post('/generate', async (req, res) => {
  const parse = TopicSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid request', details: parse.error.flatten() });
  }
  try {
    const questions = await generateQuestions(parse.data.topic);
    res.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
});

const ScoreSchema = z.object({
  topic: z.string().min(2).max(60),
  score: z.number().int().min(0).max(5)
});

quizRouter.post('/feedback', async (req, res) => {
  const parse = ScoreSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid request', details: parse.error.flatten() });
  }
  try {
    const message = await generateFeedback(parse.data.topic, parse.data.score);
    res.json({ message });
  } catch (error) {
    console.error('Error generating feedback:', error);
    res.status(500).json({ error: 'Failed to generate feedback' });
  }
});
