import axios from 'axios';

export async function fetchQuestions(topic) {
  const resp = await axios.post('/api/quiz/generate', { topic });
  return resp.data.questions;
}

export async function fetchFeedback(topic, score) {
  const resp = await axios.post('/api/quiz/feedback', { topic, score });
  return resp.data.message;
}
