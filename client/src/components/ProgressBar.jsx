export function ProgressBar({ current, total }) {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div className="progress" aria-label={`Progress ${pct}%`}>
      <div style={{ width: `${pct}%` }} />
    </div>
  );
}
