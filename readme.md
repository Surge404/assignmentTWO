# AI-Assisted Knowledge Quiz (MERN + Recoil)

An interactive quiz that uses AI to generate multiple-choice questions and personalized feedback.

## 1. Project Setup & Demo

Web:

```bash
npm run install-all
npm start
# client: http://localhost:5173, server: http://localhost:4000
```

Mobile:
- Not provided in this repo. Consider React Native with a similar API.

Demo:
- Host the `client` build (e.g., Vercel/Netlify) and deploy server (e.g., Render/Fly). Add env vars `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`.

## 2. Problem Understanding
- Topic selection triggers AI to generate 5 MCQs (4 options each with one correct), handled by the server. Loading state is shown.
- User navigates questions with next/previous, with a progress bar. State is handled via Recoil.
- After completion, the server generates an AI feedback message based on score.
- JSON outputs must be consistent. Server validates with Zod, retries malformed responses, and falls back to mocks if AI fails.

Assumptions:
- OpenAI-compatible API is available via `AI_BASE_URL` and `AI_API_KEY`. If not, mocks provide deterministic fallback content.
- Web-first solution (mobile is out-of-scope here but straightforward to port).

## 3. AI Prompts & Iterations
Initial prompts are constructed in `server/src/services/aiService.js`:
- Questions prompt: strictly requests JSON matching `{ questions: [{ id, question, choices: [{ id, text, isCorrect }] }] }` with 5 questions and 4 choices each, one correct.
- Feedback prompt: returns `{ message: string }` tailored by score.

Iteration & robustness:
- `response_format: { type: 'json_object' }` requested where supported.
- Zod schemas validate. If invalid, a repair instruction is appended and retried up to 3 times.
- If still invalid or API errors, a mock generator returns well-formed JSON.

## 4. Architecture & Code Structure

- `server/` Express API
  - `src/index.js` server bootstrap and routes
  - `src/routes/quiz.js` endpoints: `POST /api/quiz/generate`, `POST /api/quiz/feedback`
  - `src/services/aiService.js` prompts, schema validation, retries, mocks

- `client/` Vite React app with Recoil
  - `src/screens/App.jsx` navigation and 3-screen flow
  - `src/components/QuestionCard.jsx` reusable question UI
  - `src/components/ProgressBar.jsx` progress
  - `src/state/quizAtoms.js` Recoil atoms
  - `src/services/api.js` axios wrapper
  - `src/styles.css` basic dark UI

- Root scripts
  - `npm run install-all` to install
  - `npm start` to run client and server concurrently

State Management:
- Recoil holds `topic`, `questions`, `currentIndex`, `answers`, `loading`, `error`, `feedback`.

## 5. Screenshots / Screen Recording
- Run locally and capture the topic screen, quiz question screens with navigation, and final results with AI feedback.

## 6. Known Issues / Improvements
- Accessibility: further ARIA roles and keyboard focus management can be improved.
- Persist answers across reloads with localStorage.
- Add animations/transitions and dark/light mode toggle.
- Add previous/next keyboard navigation and a mini map to jump between questions.
- Server streaming could make feedback appear progressively.

## 7. Bonus Work
- Modern dark UI styling.
- Deterministic mock fallback for offline/demo.

## Environment
Create `server/.env` (optional) for real AI:

```
PORT=4000
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
```
