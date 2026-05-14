import { useState, useEffect } from "react";

export default function ScoreboardScreen({ state, updateState }) {
  const [filter, setFilter] = useState("week");
  const [editingDate, setEditingDate] = useState(null);
  const [editDateVal, setEditDateVal] = useState("");
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Refresh scoreboard every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => setLastRefresh(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const hist = getFiltered(state.history || [], filter);
  const allHist = state.history || [];

  const totalTasks = hist.reduce((s, h) => s + h.tasks.length, 0);
  const doneTasks = hist.reduce((s, h) => s + h.tasks.filter(t => t.done).length, 0);
  const perfectDays = hist.filter(h => h.tasks.length > 0 && h.tasks.every(t => t.done)).length;
  const streak = calcStreak(allHist);
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Lifetime stats
  const lifetimeDone = allHist.reduce((s, h) => s + h.tasks.filter(t => t.done).length, 0);
  const lifetimePerfect = allHist.filter(h => h.tasks.length > 0 && h.tasks.every(t => t.done)).length;

  const dayBuckets = buildDayBuckets(hist);

  function startEditDate(h) {
    setEditingDate(h.date);
    setEditDateVal(h.date);
  }

  function saveEditDate(oldDate) {
    if (!editDateVal || editDateVal === oldDate) { setEditingDate(null); return; }
    const history = (state.history || []).map(h =>
      h.date === oldDate ? { ...h, date: editDateVal } : h
    );
    // Dedup — if new date already exists, merge (new overwrites old)
    const histMap = {};
    for (const h of history) histMap[h.date] = h;
    const merged = Object.values(histMap).sort((a, b) => b.date.localeCompare(a.date));
    updateState({ history: merged }, true);
    setEditingDate(null);
  }

  return (
    <div className="screen">
      {/* Lifetime banner */}
      <div className="lifetime-banner">
        <div className="lifetime-item">
          <div className="lifetime-val">{lifetimeDone}</div>
          <div className="lifetime-lbl">Lifetime tasks completed</div>
        </div>
        <div className="lifetime-divider" />
        <div className="lifetime-item">
          <div className="lifetime-val">{lifetimePerfect}</div>
          <div className="lifetime-lbl">Perfect days ever</div>
        </div>
        <div className="lifetime-divider" />
        <div className="lifetime-item">
          <div className="lifetime-val">{streak}</div>
          <div className="lifetime-lbl">Current streak</div>
        </div>
      </div>

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
          { val: allHist.length, lbl: "Days tracked" },
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

      <div className="section-label" style={{ marginTop: "1.5rem" }}>
        Recent days
        <span className="live-dot" title="Updates every 60s" />
      </div>
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
                  {editingDate === h.date ? (
                    <div className="date-edit-row">
                      <input type="date" className="date-input" value={editDateVal}
                        onChange={e => setEditDateVal(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveEditDate(h.date); if (e.key === "Escape") setEditingDate(null); }}
                        autoFocus />
                      <button className="icon-btn save-btn" onClick={() => saveEditDate(h.date)}><i className="ti ti-check" aria-hidden="true" /></button>
                      <button className="icon-btn cancel-btn" onClick={() => setEditingDate(null)}><i className="ti ti-x" aria-hidden="true" /></button>
                    </div>
                  ) : (
                    <div className="history-date" onClick={() => startEditDate(h)} title="Tap to edit date" style={{ cursor: "pointer" }}>
                      {new Date(h.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      <i className="ti ti-pencil" style={{ fontSize: 10, opacity: 0.35, marginLeft: 5 }} aria-hidden="true" />
                    </div>
                  )}
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
