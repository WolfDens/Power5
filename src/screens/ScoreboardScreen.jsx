import { useState } from "react";

export default function ScoreboardScreen({ state }) {
  const [filter, setFilter] = useState("week");
  const hist = getFiltered(state.history || [], filter);

  const totalTasks = hist.reduce((s, h) => s + h.tasks.length, 0);
  const doneTasks = hist.reduce((s, h) => s + h.tasks.filter(t => t.done).length, 0);
  const perfectDays = hist.filter(h => h.tasks.length > 0 && h.tasks.every(t => t.done)).length;
  const streak = calcStreak(state.history || []);
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const dayBuckets = buildDayBuckets(hist);

  return (
    <div className="screen">
      <div className="filter-row">
        {["week", "month", "year", "all"].map(f => (
          <button key={f} className={`filter-btn${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All time" : "This " + f}
          </button>
        ))}
      </div>

      <div className="metric-grid">
        {[
          { val: doneTasks, lbl: "Tasks done" },
          { val: pct + "%", lbl: "Completion" },
          { val: perfectDays, lbl: "Perfect days" },
          { val: streak, lbl: "Streak" },
        ].map(m => (
          <div className="metric-card" key={m.lbl}>
            <div className="metric-val">{m.val}</div>
            <div className="metric-lbl">{m.lbl}</div>
          </div>
        ))}
      </div>

      <div className="section-label">Completion by day of week</div>
      <div className="bar-chart">
        {dayBuckets.map(b => (
          <div className="bar-row" key={b.label}>
            <div className="bar-label">{b.label}</div>
            <div className="bar-track"><div className="bar-fill" style={{ width: b.pct + "%" }} /></div>
            <div className="bar-pct">{b.total > 0 ? b.pct + "%" : "—"}</div>
          </div>
        ))}
      </div>

      <div className="section-label" style={{ marginTop: "1.5rem" }}>Recent days</div>
      {hist.length === 0 ? (
        <div className="empty-state small">
          <i className="ti ti-history" aria-hidden="true" />
          <p>No history yet</p>
        </div>
      ) : (
        <div className="history-list">
          {hist.slice(0, 14).map(h => {
            const d = h.tasks.filter(t => t.done).length;
            const tot = h.tasks.length;
            const perfect = d === tot && tot > 0;
            return (
              <div className="history-day" key={h.date}>
                <div className="history-header">
                  <div className="history-date">
                    {new Date(h.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </div>
                  <div className="history-score">
                    <div className="score-dot" style={{ background: perfect ? "#639922" : d > 0 ? "#185FA5" : "#888780" }} />
                    <span>{d}/{tot}{perfect ? " — perfect" : ""}</span>
                  </div>
                </div>
                <div className="history-chips">
                  {h.tasks.map((t, i) => (
                    <span key={i} className={`chip${t.done ? " chip-done" : ""}`}>
                      {t.title.length > 30 ? t.title.slice(0, 30) + "…" : t.title}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getFiltered(history, f) {
  const now = Date.now();
  const ms = { week: 7, month: 30, year: 365 };
  return history.filter(h => {
    if (f === "all") return true;
    return now - new Date(h.date + "T12:00:00").getTime() <= ms[f] * 86400000;
  });
}

function buildDayBuckets(hist) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const map = {};
  days.forEach(d => (map[d] = { done: 0, total: 0 }));
  hist.forEach(h => {
    const dow = new Date(h.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
    if (map[dow]) {
      map[dow].done += h.tasks.filter(t => t.done).length;
      map[dow].total += h.tasks.length;
    }
  });
  return days.map(d => ({
    label: d,
    pct: map[d].total > 0 ? Math.round((map[d].done / map[d].total) * 100) : 0,
    total: map[d].total,
  }));
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
