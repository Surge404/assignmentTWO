import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { topicAtom, questionsAtom, currentIndexAtom, answersAtom, loadingAtom, errorAtom, feedbackAtom, showResultsAtom } from '../state/quizAtoms.js';
import { fetchQuestions, fetchFeedback } from '../services/api.js';
import { ProgressBar } from '../components/ProgressBar.jsx';
import { QuestionCard } from '../components/QuestionCard.jsx';
import { useEffect } from 'react';

function ScreenWrapper({ title, children, subtitle }) {
  return (
    <div className="container">
      <div className="header">
        <div>
          <div className="title">{title}</div>
          {subtitle && <div className="subtitle">{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

function TopicScreen() {
  const [topic, setTopic] = useRecoilState(topicAtom);
  const setQuestions = useSetRecoilState(questionsAtom);
  const setIndex = useSetRecoilState(currentIndexAtom);
  const [loading, setLoading] = useRecoilState(loadingAtom);
  const setError = useSetRecoilState(errorAtom);
  const setAnswers = useSetRecoilState(answersAtom);
  const setShowResults = useSetRecoilState(showResultsAtom);
  const setFeedback = useSetRecoilState(feedbackAtom);

  const handleStart = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError('');
    setShowResults(false);
    setFeedback('');
    setAnswers({});
    try {
      const qs = await fetchQuestions(topic.trim());
      setQuestions(qs);
      setIndex(0);
    } catch (e) {
      setError('Failed to fetch questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper title="AI-Assisted Knowledge Quiz" subtitle="Choose a topic to begin">
      <div className="card" style={{ marginBottom: 16 }}>
        <label htmlFor="topic">Topic</label>
        <input
          id="topic"
          style={{ width: '100%', marginTop: 8, padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#0b1220', color: '#e2e8f0' }}
          placeholder="e.g. Wellness, Tech Trends"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleStart()}
        />
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className="btn primary" onClick={handleStart} disabled={!topic.trim() || loading}>
            {loading ? 'Generating…' : 'Generate Questions'}
          </button>
        </div>
        <div style={{ marginTop: 8, minHeight: 20, color: '#fca5a5' }}>{useRecoilValue(errorAtom)}</div>
      </div>
    </ScreenWrapper>
  );
}

function QuizScreen() {
  const questions = useRecoilValue(questionsAtom);
  const [index, setIndex] = useRecoilState(currentIndexAtom);
  const [answers, setAnswers] = useRecoilState(answersAtom);
  const setShowResults = useSetRecoilState(showResultsAtom);

  const current = questions[index];
  const total = questions.length;

  const handleSelect = (choiceId) => {
    setAnswers({ ...answers, [current.id]: choiceId });
  };

  const next = () => {
    if (index < total - 1) setIndex(index + 1);
  };
  const prev = () => {
    if (index > 0) setIndex(index - 1);
  };
  const finish = () => {
    setShowResults(true);
  };

  return (
    <ScreenWrapper title="Quiz" subtitle={`Question ${index + 1} of ${total}`}>
      <div style={{ marginBottom: 12 }}>
        <ProgressBar current={index} total={total} />
      </div>
      <QuestionCard
        question={current}
        selectedChoiceId={answers[current.id]}
        onSelect={handleSelect}
      />
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn" onClick={prev} disabled={index === 0}>Previous</button>
        {index < total - 1 ? (
          <button className="btn primary" onClick={next}>Next</button>
        ) : (
          <button className="btn primary" onClick={finish}>Finish</button>
        )}
      </div>
    </ScreenWrapper>
  );
}

function ResultsScreen() {
  const topic = useRecoilValue(topicAtom);
  const questions = useRecoilValue(questionsAtom);
  const answers = useRecoilValue(answersAtom);
  const [feedback, setFeedback] = useRecoilState(feedbackAtom);
  const [loading, setLoading] = useRecoilState(loadingAtom);
  const setError = useSetRecoilState(errorAtom);

  const score = questions.reduce((acc, q) => {
    const picked = answers[q.id];
    const correct = q.choices.find((c) => c.isCorrect)?.id;
    return acc + (picked === correct ? 1 : 0);
  }, 0);

  useEffect(() => {
    let aborted = false;
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const msg = await fetchFeedback(topic, score);
        if (!aborted) setFeedback(msg);
      } catch {
        if (!aborted) setFeedback('Nice effort! Consider revisiting the material and try again.');
      } finally {
        if (!aborted) setLoading(false);
      }
    };
    fetch();
    return () => { aborted = true; };
  }, [topic, score, setFeedback, setLoading, setError]);

  return (
    <ScreenWrapper title="Results" subtitle={`Your score: ${score} / ${questions.length}`}>
      <div className="card">
        <div style={{ marginBottom: 8, color: '#94a3b8' }}>AI Feedback</div>
        <div>{loading ? 'Generating feedback…' : feedback}</div>
      </div>
    </ScreenWrapper>
  );
}

export function App() {
  const questions = useRecoilValue(questionsAtom);
  const showResults = useRecoilValue(showResultsAtom);

  if (!questions.length) return <TopicScreen />;
  if (!showResults) return <QuizScreen />;
  return <ResultsScreen />;
}
