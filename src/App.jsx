import { useState, useEffect, useCallback } from "react";
import TodayScreen from "./screens/TodayScreen";
import ScoreboardScreen from "./screens/ScoreboardScreen";
import HabitsScreen from "./screens/HabitsScreen";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function rollTasks(s) {
  const today = todayStr();
  if (s.dayGenerated === today) return s;
  const incomplete = (s.tasks || []).filter(t => !t.done);
  return {
    ...s,
    tasks: incomplete.map(t => ({ ...t, rolled: true })),
    dayGenerated: today,
    dayLocked: false,
    aiInsight: null,
  };
}

function defaultState() {
  return { tasks: [], history: [], dayGenerated: null, dayLocked: false, aiInsight: null };
}

export default function App() {
  const [screen, setScreen] = useState("today");
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem("p5state");
      if (raw) return rollTasks(JSON.parse(raw));
    } catch (e) {}
    return defaultState();
  });
  const [syncStatus, setSyncStatus] = useState("idle");
  const [digestReady, setDigestReady] = useState(false);

  // Load from KV on mount
  useEffect(() => {
    setSyncStatus("syncing");
    fetch("/api/state")
      .then(r => r.json())
      .then(({ data }) => {
        if (data) {
          const merged = mergeStates(state, data);
          const rolled = rollTasks(merged);
          setState(rolled);
          localStorage.setItem("p5state", JSON.stringify(rolled));
        }
        setSyncStatus("synced");
        setTimeout(() => setSyncStatus("idle"), 2000);
      })
      .catch(() => setSyncStatus("idle"));

    // Check if Cowork digest is ready
    fetch("/api/digest-status")
      .then(r => r.json())
      .then(({ available }) => setDigestReady(available))
      .catch(() => {});
  }, []);

  const updateState = useCallback((patch, sync = false) => {
    setState(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem("p5state", JSON.stringify(next));
      if (sync) {
        fetch("/api/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: next }),
        }).catch(() => {});
      }
      return next;
    });
  }, []);

  const today = todayStr();
  const dateLabel = new Date(today + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          Power<span className="logo-accent">5</span>
          <div className="date-sub">{dateLabel}</div>
        </div>
        <div className="header-right">
          {syncStatus === "syncing" && (
            <span className="sync-pill syncing">
              <i className="ti ti-refresh" aria-hidden="true" /> Syncing
            </span>
          )}
          {syncStatus === "synced" && (
            <span className="sync-pill synced">
              <i className="ti ti-cloud-check" aria-hidden="true" /> Synced
            </span>
          )}
          <nav className="nav-tabs">
            {["today", "scoreboard", "habits"].map(s => (
              <button
                key={s}
                className={`nav-tab${screen === s ? " active" : ""}`}
                onClick={() => setScreen(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {screen === "today" && (
        <TodayScreen
          state={state}
          updateState={updateState}
          digestReady={digestReady}
        />
      )}
      {screen === "scoreboard" && <ScoreboardScreen state={state} />}
      {screen === "habits" && <HabitsScreen state={state} />}
    </div>
  );
}

function mergeStates(local, remote) {
  const histMap = {};
  for (const h of (local.history || [])) histMap[h.date] = h;
  for (const h of (remote.history || [])) histMap[h.date] = h;
  const history = Object.values(histMap).sort((a, b) => b.date.localeCompare(a.date));
  const useRemote = (remote.dayGenerated || "") >= (local.dayGenerated || "");
  return { ...(useRemote ? remote : local), history };
}
