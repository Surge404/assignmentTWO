export function QuestionCard({ question, selectedChoiceId, onSelect }) {
  return (
    <div className="card" role="group" aria-label="Question">
      <div style={{ marginBottom: 12 }}>
        <div className="badge">Question</div>
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{question.question}</div>
      <div className="row">
        {question.choices.map((choice) => (
          <button
            key={choice.id}
            className={`choice ${selectedChoiceId === choice.id ? 'selected' : ''}`}
            onClick={() => onSelect(choice.id)}
          >
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  );
}
