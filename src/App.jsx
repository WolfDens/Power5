import { useState, useEffect, useCallback, useRef } from "react";
import TodayScreen from "./screens/TodayScreen";
import ScoreboardScreen from "./screens/ScoreboardScreen";
import HabitsScreen from "./screens/HabitsScreen";
import PowerScore from "./components/PowerScore";
import MorningQuote from "./components/MorningQuote";
import Confetti from "./components/Confetti";
import SetupScreen from "./screens/SetupScreen";
import { getNYDateStr, getMsUntilNYMidnight, formatNYDate } from "./utils/time";

function rollTasks(s, targetDate) {
  const day = targetDate || getNYDateStr();
  if (s.dayGenerated === day) return s;
  const incomplete = (s.tasks || []).filter(t => !t.done);
  return {
    ...s,
    tasks: incomplete.map(t => ({ ...t, rolled: true })),
    dayGenerated: day,
    dayLocked: false,
    aiInsight: null,
  };
}

function defaultState() {
  return { tasks: [], history: [], dayGenerated: null, dayLocked: false, aiInsight: null, hopper: [] };
}

function mergeStates(local, remote) {
  const histMap = {};
  for (const h of (local.history || [])) histMap[h.date] = h;
  for (const h of (remote.history || [])) histMap[h.date] = h;
  const history = Object.values(histMap).sort((a, b) => b.date.localeCompare(a.date));
  const useRemote = (remote.dayGenerated || "") >= (local.dayGenerated || "");
  const base = useRemote ? remote : local;
  const hopperMap = {};
  for (const h of (local.hopper || [])) hopperMap[h.id] = h;
  for (const h of (remote.hopper || [])) hopperMap[h.id] = h;
  return { ...base, history, hopper: Object.values(hopperMap) };
}

export default function App() {
  const [screen, setScreen] = useState("today");
  const [syncStatus, setSyncStatus] = useState("idle");
  const [digestReady, setDigestReady] = useState(false);
  const [currentDate, setCurrentDate] = useState(getNYDateStr());
  const [confetti, setConfetti] = useState(false);
  const [hasKey, setHasKey] = useState(() => !!localStorage.getItem("power5_api_key"));
  const pushTimer = useRef(null);
  const autoEndTimer = useRef(null);

  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem("p5state");
      if (raw) return rollTasks(JSON.parse(raw));
    } catch (e) {}
    return defaultState();
  });

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

    fetch("/api/digest-status")
      .then(r => r.json())
      .then(({ available }) => setDigestReady(available))
      .catch(() => {});
  }, []);

  // Auto end day at 11:59pm EST
  useEffect(() => {
    const ms = getMsUntilNYMidnight();
    if (ms > 0) {
      autoEndTimer.current = setTimeout(() => {
        setState(prev => {
          if (prev.dayLocked) return prev;
          const today = getNYDateStr();
          const entry = {
            date: today,
            tasks: prev.tasks.map(t => ({
              title: t.title, done: t.done, source: t.source,
              priority: t.priority, rolled: !!t.rolled,
            })),
            autoEnded: true,
          };
          const history = [entry, ...(prev.history || []).filter(h => h.date !== today)];
          const incomplete = prev.tasks.filter(t => !t.done);
          const next = {
            ...prev, history, dayLocked: true,
            tasks: incomplete.map(t => ({ ...t, rolled: true })),
          };
          localStorage.setItem("p5state", JSON.stringify(next));
          fetch("/api/state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: next }),
          }).catch(() => {});
          return next;
        });
      }, ms);
    }
    return () => { if (autoEndTimer.current) clearTimeout(autoEndTimer.current); };
  }, []);

  function schedulePush(nextState) {
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      setSyncStatus("syncing");
      fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: nextState }),
      })
        .then(() => { setSyncStatus("synced"); setTimeout(() => setSyncStatus("idle"), 2000); })
        .catch(() => setSyncStatus("idle"));
    }, 1500);
  }

  const updateState = useCallback((patch, immediate = false) => {
    setState(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem("p5state", JSON.stringify(next));

      if (patch.dayLocked && next.history?.[0]) {
        const day = next.history[0];
        if (day.tasks.length > 0 && day.tasks.every(t => t.done) && !day.autoEnded) {
          setTimeout(() => setConfetti(true), 300);
          setTimeout(() => setConfetti(false), 4000);
        }
      }

      if (immediate) {
        setSyncStatus("syncing");
        fetch("/api/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: next }),
        })
          .then(() => { setSyncStatus("synced"); setTimeout(() => setSyncStatus("idle"), 2000); })
          .catch(() => setSyncStatus("idle"));
      } else {
        schedulePush(next);
      }
      return next;
    });
  }, []);

  function handleDateChange(newDate) {
    setCurrentDate(newDate);
    setState(prev => {
      const next = rollTasks(prev, newDate);
      next.dayGenerated = newDate;
      localStorage.setItem("p5state", JSON.stringify(next));
      fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: next }),
      }).catch(() => {});
      return next;
    });
  }

  if (!hasKey) return <SetupScreen onComplete={() => setHasKey(true)} />;

  const dateLabel = formatNYDate(currentDate);

  return (
    <div className="app">
      <Confetti active={confetti} />
      <header className="header">
        <div className="logo">
          <div className="logo-wordmark">POWER<span>5</span></div>
          <DateEditor dateLabel={dateLabel} currentDate={currentDate} onDateChange={handleDateChange} />
        </div>
        <div className="header-right">
          {syncStatus === "syncing" && <span className="sync-pill syncing"><i className="ti ti-refresh" aria-hidden="true" /> Syncing</span>}
          {syncStatus === "synced" && <span className="sync-pill synced"><i className="ti ti-cloud-check" aria-hidden="true" /> Synced</span>}
          <nav className="nav-tabs">
            {["today", "scoreboard", "habits"].map(s => (
              <button key={s} className={`nav-tab${screen === s ? " active" : ""}`} onClick={() => setScreen(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {screen === "today" && (
        <>
          <PowerScore history={state.history || []} />
          <TodayScreen state={state} updateState={updateState} digestReady={digestReady} currentDate={currentDate} />
          <MorningQuote />
        </>
      )}
      {screen === "scoreboard" && <ScoreboardScreen state={state} updateState={updateState} />}
      {screen === "habits" && <HabitsScreen state={state} />}
    </div>
  );
}

function DateEditor({ dateLabel, currentDate, onDateChange }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(currentDate);
  function save() { if (val) onDateChange(val); setEditing(false); }
  if (editing) {
    return (
      <div className="date-edit-row">
        <input type="date" className="date-input" value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }} autoFocus />
        <button className="icon-btn save-btn" onClick={save}><i className="ti ti-check" aria-hidden="true" /></button>
        <button className="icon-btn cancel-btn" onClick={() => setEditing(false)}><i className="ti ti-x" aria-hidden="true" /></button>
      </div>
    );
  }
  return (
    <div className="date-sub" onClick={() => setEditing(true)} title="Tap to correct date">
      {dateLabel} <i className="ti ti-pencil" style={{ fontSize: 9, opacity: 0.3 }} aria-hidden="true" />
    </div>
  );
}
