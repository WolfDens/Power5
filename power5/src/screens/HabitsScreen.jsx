export default function HabitsScreen({ state }) {
  const hist = state.history || [];
  const habits = analyzeHabits(hist);

  return (
    <div className="screen">
      <div className="ai-insight" style={{ marginBottom: "1.5rem" }}>
        <i className="ti ti-brain" style={{ fontSize: 13, marginRight: 6 }} aria-hidden="true" />
        <strong>Habit analysis</strong> — {hist.length} day{hist.length !== 1 ? "s" : ""} tracked
        {hist.length < 5 && " · complete more days for deeper insights"}
      </div>
      {habits.length === 0 ? (
        <div className="empty-state small">
          <i className="ti ti-chart-bar" aria-hidden="true" />
          <p>Complete 3+ days to see patterns</p>
        </div>
      ) : (
        <div className="habit-list">
          {habits.map((h, i) => (
            <div className="habit-card" key={i}>
              <div className={`habit-icon habit-${h.type}`}>
                <i className={`ti ${h.icon}`} aria-hidden="true" />
              </div>
              <div>
                <div className="habit-title">{h.title}</div>
                <div className="habit-desc">{h.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function analyzeHabits(hist) {
  if (hist.length === 0) return [];
  const habits = [];
  const allTasks = hist.flatMap(h => h.tasks);
  const perfectDays = hist.filter(h => h.tasks.length > 0 && h.tasks.every(t => t.done)).length;
  const perfectRate = Math.round((perfectDays / hist.length) * 100);

  if (perfectRate >= 70) {
    habits.push({ type: "good", icon: "ti-trophy", title: "Strong completion rate", desc: `You finish all 5 tasks ${perfectRate}% of days.` });
  } else if (perfectRate < 40 && hist.length >= 5) {
    habits.push({ type: "bad", icon: "ti-alert-triangle", title: "Perfect days are rare", desc: `Only ${perfectRate}% of days are full completions. Try making tasks more specific and achievable.` });
  }

  const rolled = allTasks.filter(t => t.rolled);
  if (rolled.length > 3) {
    const rollDone = Math.round((rolled.filter(t => t.done).length / rolled.length) * 100);
    if (rollDone < 50) {
      habits.push({ type: "bad", icon: "ti-refresh", title: "Rolled tasks often stall", desc: `${rolled.length} tasks have rolled over and only ${rollDone}% get completed. Consider breaking them down or dropping them.` });
    }
  }

  const leadTasks = allTasks.filter(t =>
    t.title.toLowerCase().includes("lead") ||
    t.title.toLowerCase().includes("resimpli") ||
    t.source === "RESimpli"
  );
  if (leadTasks.length >= 2) {
    const leadRate = Math.round((leadTasks.filter(t => t.done).length / leadTasks.length) * 100);
    if (leadRate >= 80) {
      habits.push({ type: "good", icon: "ti-home", title: "Consistent on lead follow-up", desc: `You close out lead tasks ${leadRate}% of the time. Your pipeline stays warm.` });
    } else {
      habits.push({ type: "bad", icon: "ti-home", title: "Lead tasks often skipped", desc: `Lead tasks only done ${leadRate}% of the time. These drive revenue — move them to position 1 or 2.` });
    }
  }

  const dowMap = {};
  hist.forEach(h => {
    const dow = new Date(h.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" });
    if (!dowMap[dow]) dowMap[dow] = { perfect: 0, total: 0 };
    dowMap[dow].total++;
    if (h.tasks.length > 0 && h.tasks.every(t => t.done)) dowMap[dow].perfect++;
  });
  const bestDay = Object.entries(dowMap).filter(([, v]) => v.total >= 2)
    .sort(([, a], [, b]) => b.perfect / b.total - a.perfect / a.total)[0];
  if (bestDay) {
    const [day, stats] = bestDay;
    const dayRate = Math.round((stats.perfect / stats.total) * 100);
    if (dayRate >= 60) {
      habits.push({ type: "good", icon: "ti-calendar", title: `${day}s are your best day`, desc: `You complete all 5 tasks ${dayRate}% of ${day}s. Front-load your hardest tasks that day.` });
    }
  }

  if (habits.length === 0) {
    habits.push({ type: "neutral", icon: "ti-clock", title: "Building baseline", desc: `${hist.length} days logged. Patterns emerge around day 7–10. Keep going.` });
  }
  return habits;
}
