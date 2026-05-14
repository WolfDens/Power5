import { useState } from "react";

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

function calcComponents(history) {
  if (history.length === 0) return { completionPts: 0, perfectPts: 0, streakPts: 0, streak: 0, completionRate: 0, perfectRate: 0 };
  const recent = history.slice(0, 14);
  const completionRate = recent.reduce((s, h) => {
    return s + (h.tasks.length > 0 ? h.tasks.filter(t => t.done).length / h.tasks.length : 0);
  }, 0) / recent.length;
  const perfectRate = recent.filter(h => h.tasks.length > 0 && h.tasks.every(t => t.done)).length / recent.length;
  const streak = calcStreak(history);
  const streakBonus = Math.min(streak * 2, 20);
  return {
    completionPts: Math.round(completionRate * 50),
    perfectPts: Math.round(perfectRate * 30),
    streakPts: streakBonus,
    streak,
    completionRate: Math.round(completionRate * 100),
    perfectRate: Math.round(perfectRate * 100),
  };
}

const TIERS = [
  { min: 0,  max: 29,  label: "Starting",     short: "Starting" },
  { min: 30, max: 44,  label: "Getting There", short: "Getting There" },
  { min: 45, max: 59,  label: "Building",      short: "Building" },
  { min: 60, max: 74,  label: "Locked In",     short: "Locked In" },
  { min: 75, max: 89,  label: "On Fire",       short: "On Fire" },
  { min: 90, max: 100, label: "Elite",         short: "Elite" },
];

function getTier(score) {
  return TIERS.find(t => score >= t.min && score <= t.max) || TIERS[0];
}

export default function PowerScore({ history }) {
  const [expanded, setExpanded] = useState(false);
  const score = calcPowerScore(history);
  const tier = getTier(score);
  const hasData = history.length > 0;
  const comp = calcComponents(history);

  return (
    <div className="ps-card">
      <div className="ps-header">
        <div className="ps-title-group">
          <div className="ps-label">POWER SCORE</div>
          <div className="ps-score">{score}</div>
        </div>
        <div className="ps-tier-badge">{tier.label}</div>
      </div>

      <div className="ps-scale">
        <div className="ps-track">
          <div className="ps-fill" style={{ width: `${score}%` }} />
          <div className="ps-marker" style={{ left: `${Math.min(score, 98)}%` }} />
        </div>
        <div className="ps-tier-labels">
          {TIERS.map(t => (
            <div key={t.label} className={`ps-tier-tick${score >= t.min ? " active" : ""}`} style={{ left: `${t.min}%` }} />
          ))}
        </div>
      </div>

      <div className="ps-tier-row">
        {TIERS.map(t => (
          <div key={t.label} className={`ps-tier-seg${score >= t.min && score <= t.max ? " current" : score > t.max ? " passed" : ""}`}>
            {t.short}
          </div>
        ))}
      </div>

      {!hasData && <div className="ps-empty">Complete your first day to start tracking</div>}

      {/* Expandable breakdown */}
      <button className="ps-expand-btn" onClick={() => setExpanded(e => !e)}>
        <span>How is this calculated?</span>
        <i className={`ti ti-chevron-${expanded ? "up" : "down"}`} aria-hidden="true" />
      </button>

      {expanded && (
        <div className="ps-detail">
          <div className="ps-detail-intro">
            Your score is calculated from the last 14 days across three factors:
          </div>

          <div className="ps-factor">
            <div className="ps-factor-header">
              <span className="ps-factor-label">Completion Rate</span>
              <span className="ps-factor-pts">{comp.completionPts} / 50 pts</span>
            </div>
            <div className="ps-factor-bar-track">
              <div className="ps-factor-bar" style={{ width: `${(comp.completionPts / 50) * 100}%` }} />
            </div>
            <div className="ps-factor-desc">
              Average % of tasks finished per day → {comp.completionRate}% avg × 50 = {comp.completionPts} pts
            </div>
          </div>

          <div className="ps-factor">
            <div className="ps-factor-header">
              <span className="ps-factor-label">Perfect Days</span>
              <span className="ps-factor-pts">{comp.perfectPts} / 30 pts</span>
            </div>
            <div className="ps-factor-bar-track">
              <div className="ps-factor-bar" style={{ width: `${(comp.perfectPts / 30) * 100}%` }} />
            </div>
            <div className="ps-factor-desc">
              Days where all 5 tasks were completed → {comp.perfectRate}% of days × 30 = {comp.perfectPts} pts
            </div>
          </div>

          <div className="ps-factor">
            <div className="ps-factor-header">
              <span className="ps-factor-label">Streak Bonus</span>
              <span className="ps-factor-pts">{comp.streakPts} / 20 pts</span>
            </div>
            <div className="ps-factor-bar-track">
              <div className="ps-factor-bar" style={{ width: `${(comp.streakPts / 20) * 100}%` }} />
            </div>
            <div className="ps-factor-desc">
              {comp.streak} consecutive perfect day{comp.streak !== 1 ? "s" : ""} × 2 pts each, capped at 20
            </div>
          </div>

          <div className="ps-tier-breakdown">
            <div className="ps-tier-breakdown-title">Tier thresholds</div>
            <div className="ps-tier-list">
              {TIERS.map(t => (
                <div key={t.label} className={`ps-tier-list-item${score >= t.min && score <= t.max ? " current" : ""}`}>
                  <span className="ps-tier-list-range">{t.min}–{t.max}</span>
                  <span className="ps-tier-list-label">{t.label}</span>
                  {score >= t.min && score <= t.max && <span className="ps-tier-list-you">← you</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
