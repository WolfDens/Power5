export function calcPowerScore(history = []) {
  if (history.length === 0) return 0;
  const recent = history.slice(0, 14);
  const completionRate = recent.reduce((s, h) => {
    return s + (h.tasks.length > 0 ? h.tasks.filter(t => t.done).length / h.tasks.length : 0);
  }, 0) / recent.length;
  const perfectRate = recent.filter(h => h.tasks.length > 0 && h.tasks.every(t => t.done)).length / recent.length;
  const streak = calcStreak(history);
  const streakBonus = Math.min(streak * 2, 20);
  return Math.min(100, Math.round(completionRate * 50 + perfectRate * 30 + streakBonus));
}

function calcStreak(history) {
  let streak = 0;
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
  for (const day of sorted) {
    const d = day.tasks.filter(t => t.done).length;
    if (d === day.tasks.length && d > 0) streak++;
    else break;
  }
  return streak;
}

export function getScoreLabel(score) {
  if (score >= 90) return "Elite Operator";
  if (score >= 75) return "On Fire";
  if (score >= 60) return "Locked In";
  if (score >= 45) return "Building Momentum";
  if (score >= 30) return "Getting There";
  return "Just Starting";
}

export default function PowerScore({ history }) {
  const score = calcPowerScore(history);
  const label = getScoreLabel(score);
  const r = 20, circ = Math.round(2 * Math.PI * r);
  const offset = Math.round(circ * (1 - score / 100));

  return (
    <div className="power-score-bar">
      <div className="power-score-left">
        <div className="power-score-label">Power Score</div>
        <div className="power-score-value">{score}</div>
        <div className="power-score-sub">{label}</div>
      </div>
      <div className="power-score-ring">
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(201,168,76,0.15)" strokeWidth="4" />
          <circle cx="26" cy="26" r={r} fill="none" stroke="#C9A84C" strokeWidth="4"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 26 26)" />
        </svg>
      </div>
    </div>
  );
}
