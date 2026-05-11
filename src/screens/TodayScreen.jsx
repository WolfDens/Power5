import { useState, useRef } from "react";

export default function TodayScreen({ state, updateState, digestReady }) {
  const [phase, setPhase] = useState("idle");
  const [manualInput, setManualInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [endDayOpen, setEndDayOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const dragItem = useRef(null);

  const hasTasks = state.tasks.length > 0;
  const rolledTasks = state.tasks.filter(t => t.rolled);
  const streak = calcStreak(state.history);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const rolled = state.tasks.filter(t => t.rolled);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualInput, rolledTasks: rolled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      const tasks = data.tasks.map(t => ({
        ...t,
        id: crypto.randomUUID(),
        done: false,
        rolled: false,
      }));

      updateState({ tasks, aiInsight: data.insight, dayGenerated: new Date().toISOString().slice(0, 10) }, true);
      setPhase("done");
    } catch (e) {
      setError(e.message);
      setPhase("idle");
    }
    setLoading(false);
  }

  function toggleTask(id) {
    if (state.dayLocked) return;
    updateState({ tasks: state.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) }, false);
  }

  function startEdit(task) {
    setEditingId(task.id);
    setEditValue(task.title);
  }

  function saveEdit(id) {
    if (!editValue.trim()) return;
    updateState({ tasks: state.tasks.map(t => t.id === id ? { ...t, title: editValue.trim() } : t) }, false);
    setEditingId(null);
  }

  function removeTask(id) {
    updateState({ tasks: state.tasks.filter(t => t.id !== id) }, false);
  }

  function addTask() {
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      source: "Manual",
      sourceIcon: "edit",
      priority: "med",
      done: false,
      rolled: false,
    };
    updateState({ tasks: [...state.tasks, newTask] }, false);
    setNewTaskTitle("");
    setAddingTask(false);
  }

  // Drag to reorder
  function onDragStart(idx) {
    dragItem.current = idx;
    setDragIdx(idx);
  }
  function onDragEnter(idx) {
    setDragOverIdx(idx);
  }
  function onDragEnd() {
    if (dragItem.current === null || dragOverIdx === null || dragItem.current === dragOverIdx) {
      setDragIdx(null);
      setDragOverIdx(null);
      dragItem.current = null;
      return;
    }
    const tasks = [...state.tasks];
    const dragged = tasks.splice(dragItem.current, 1)[0];
    tasks.splice(dragOverIdx, 0, dragged);
    updateState({ tasks }, false);
    setDragIdx(null);
    setDragOverIdx(null);
    dragItem.current = null;
  }

  function confirmEndDay() {
    const today = new Date().toISOString().slice(0, 10);
    const entry = {
      date: today,
      tasks: state.tasks.map(t => ({
        title: t.title, done: t.done,
        source: t.source, priority: t.priority, rolled: !!t.rolled,
      })),
    };
    const history = [entry, ...(state.history || []).filter(h => h.date !== today)];
    const incomplete = state.tasks.filter(t => !t.done);
    updateState({
      history,
      dayLocked: true,
      tasks: incomplete.map(t => ({ ...t, rolled: true })),
    }, true);
    setEndDayOpen(false);
    setPhase("idle");
  }

  const lockedDay = state.dayLocked ? state.history?.[0] : null;

  return (
    <div className="screen">
      {streak > 0 && (
        <div className="streak-bar">
          <i className="ti ti-flame" aria-hidden="true" />
          <span className="streak-count">{streak}-day streak</span>
          <span className="streak-sub"> — keep it going</span>
        </div>
      )}

      {/* Locked day view */}
      {state.dayLocked && lockedDay && (
        <>
          <div className="day-locked-banner">
            <i className="ti ti-lock" aria-hidden="true" />
            Day locked — {lockedDay.tasks.filter(t => t.done).length}/{lockedDay.tasks.length} complete
          </div>
          <div className="task-list">
            {lockedDay.tasks.map((t, i) => (
              <div key={i} className={`task-card locked${t.done ? " done" : ""}`}>
                <div className="task-num">{i + 1}</div>
                <div className={`task-check${t.done ? " checked" : ""}`}>
                  {t.done && <i className="ti ti-check" style={{ fontSize: 12, color: "#fff" }} aria-hidden="true" />}
                </div>
                <div className="task-body">
                  <div className="task-title">{t.title}</div>
                  <div className="task-meta">
                    <span className="source-tag">
                      <i className={`ti ti-${t.sourceIcon || "mail"}`} style={{ fontSize: 11 }} aria-hidden="true" />
                      {t.source}
                    </span>
                  </div>
                </div>
                <div className={`priority-dot p-${t.priority}`} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {!hasTasks && !state.dayLocked && phase === "idle" && (
        <div className="empty-state">
          <i className="ti ti-list-check" aria-hidden="true" />
          <p>Ready to build your Power 5</p>
          {digestReady && (
            <div className="digest-ready-pill">
              <i className="ti ti-bolt" aria-hidden="true" /> Cowork digest ready
            </div>
          )}
          <button className="btn-primary" onClick={() => setPhase("prompt")}>
            <i className="ti ti-sparkles" aria-hidden="true" /> Let's go
          </button>
        </div>
      )}

      {/* Has tasks, idle, unlocked */}
      {hasTasks && !state.dayLocked && phase === "idle" && (
        <>
          {rolledTasks.length > 0 && (
            <div className="rolled-notice">
              <i className="ti ti-refresh" aria-hidden="true" />
              {rolledTasks.length} task{rolledTasks.length > 1 ? "s" : ""} rolled from yesterday
            </div>
          )}
          {state.aiInsight && (
            <div className="ai-insight">
              <i className="ti ti-sparkles" style={{ fontSize: 13, marginRight: 6 }} aria-hidden="true" />
              {state.aiInsight}
            </div>
          )}

          {/* Editable task list */}
          <div className="task-list">
            {state.tasks.map((t, i) => (
              <div
                key={t.id}
                className={`task-card${t.done ? " done" : ""}${dragIdx === i ? " dragging" : ""}${dragOverIdx === i && dragIdx !== i ? " drag-over" : ""}`}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragEnter={() => onDragEnter(i)}
                onDragEnd={onDragEnd}
                onDragOver={e => e.preventDefault()}
              >
                <div className="drag-handle" aria-hidden="true">
                  <i className="ti ti-grip-vertical" />
                </div>
                <div className="task-num">{i + 1}</div>
                <div
                  className={`task-check${t.done ? " checked" : ""}`}
                  onClick={() => toggleTask(t.id)}
                >
                  {t.done && <i className="ti ti-check" style={{ fontSize: 12, color: "#fff" }} aria-hidden="true" />}
                </div>
                <div className="task-body">
                  {editingId === t.id ? (
                    <div className="edit-row">
                      <input
                        className="edit-input"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveEdit(t.id); if (e.key === "Escape") setEditingId(null); }}
                        autoFocus
                      />
                      <button className="icon-btn save-btn" onClick={() => saveEdit(t.id)}>
                        <i className="ti ti-check" aria-hidden="true" />
                      </button>
                      <button className="icon-btn cancel-btn" onClick={() => setEditingId(null)}>
                        <i className="ti ti-x" aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="task-title" onClick={() => toggleTask(t.id)}>{t.title}</div>
                      <div className="task-meta">
                        <span className="source-tag">
                          <i className={`ti ti-${t.sourceIcon || "mail"}`} style={{ fontSize: 11 }} aria-hidden="true" />
                          {t.source}
                        </span>
                        {t.rolled && <span className="rolled-tag">Rolled</span>}
                      </div>
                    </>
                  )}
                </div>
                {editingId !== t.id && (
                  <div className="task-actions">
                    <button className="icon-btn edit-btn" onClick={() => startEdit(t)} title="Edit">
                      <i className="ti ti-pencil" aria-hidden="true" />
                    </button>
                    <button className="icon-btn delete-btn" onClick={() => removeTask(t.id)} title="Remove">
                      <i className="ti ti-trash" aria-hidden="true" />
                    </button>
                  </div>
                )}
                <div className={`priority-dot p-${t.priority}`} />
              </div>
            ))}
          </div>

          {/* Add task row */}
          {state.tasks.length < 5 && (
            addingTask ? (
              <div className="add-task-row">
                <input
                  className="edit-input"
                  placeholder="Task title..."
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addTask(); if (e.key === "Escape") setAddingTask(false); }}
                  autoFocus
                />
                <button className="icon-btn save-btn" onClick={addTask}>
                  <i className="ti ti-check" aria-hidden="true" />
                </button>
                <button className="icon-btn cancel-btn" onClick={() => setAddingTask(false)}>
                  <i className="ti ti-x" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button className="add-task-btn" onClick={() => setAddingTask(true)}>
                <i className="ti ti-plus" aria-hidden="true" /> Add task
              </button>
            )
          )}

          <div className="action-row">
            <button className="btn-outline" onClick={() => setPhase("prompt")}>
              <i className="ti ti-sparkles" aria-hidden="true" /> Regenerate
            </button>
            <button className="btn-primary" onClick={() => setEndDayOpen(true)}>
              <i className="ti ti-moon" aria-hidden="true" /> End day
            </button>
          </div>
        </>
      )}

      {/* Prompt */}
      {phase === "prompt" && !loading && (
        <div className="prompt-card">
          {digestReady ? (
            <div className="digest-ready-banner">
              <i className="ti ti-bolt" aria-hidden="true" />
              <div>
                <div className="digest-ready-title">Cowork digest ready</div>
                <div className="digest-ready-sub">Your 4:30am email digest is loaded — no action needed.</div>
              </div>
            </div>
          ) : (
            <div className="no-digest-banner">
              <i className="ti ti-mail-off" aria-hidden="true" />
              <div>No digest today — generating from your priorities</div>
            </div>
          )}

          <div className="prompt-divider" />

          <div className="prompt-section-label">
            Anything else on your mind?
            <span className="optional-tag">optional</span>
          </div>
          <div className="prompt-hint">Treated as a signal, not a guarantee.</div>
          <textarea
            className="manual-input"
            placeholder="e.g. Need to call DJ about the permit, Charlotte lead needs an offer..."
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            rows={3}
          />
          <div className="prompt-actions">
            <button className="btn-ghost" onClick={() => setPhase("idle")}>Cancel</button>
            <button className="btn-primary" onClick={generate}>
              <i className="ti ti-sparkles" aria-hidden="true" /> Generate Power 5
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-card">
          <div className="loading-spinner" />
          <div className="loading-title">Building your Power 5...</div>
          <div className="loading-sub">
            {digestReady ? "Reading your Cowork digest..." : "Working from your priorities..."}
          </div>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <i className="ti ti-alert-triangle" aria-hidden="true" /> {error}
        </div>
      )}

      {endDayOpen && (
        <EndDayModal
          tasks={state.tasks}
          onConfirm={confirmEndDay}
          onCancel={() => setEndDayOpen(false)}
        />
      )}
    </div>
  );
}

function EndDayModal({ tasks, onConfirm, onCancel }) {
  const done = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const perfect = done === total && total > 0;
  const r = 28, circ = Math.round(2 * Math.PI * r);
  const offset = Math.round(circ * (1 - done / (total || 1)));
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>End your day</h3>
        <div className="end-summary">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
            <circle cx="36" cy="36" r={r} fill="none"
              stroke={perfect ? "#639922" : "#185FA5"}
              strokeWidth="5" strokeDasharray={circ} strokeDashoffset={offset}
              strokeLinecap="round" transform="rotate(-90 36 36)" />
            <text x="36" y="41" textAnchor="middle" fontSize="13" fontWeight="500" fill="var(--text-primary)">{pct}%</text>
          </svg>
          <div>
            <div className="summary-title">{done} of {total} completed</div>
            <div className="summary-sub">
              {perfect ? "Perfect day — locked." : `${total - done} task${total - done > 1 ? "s" : ""} roll to tomorrow.`}
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={onConfirm}>Confirm &amp; lock</button>
        </div>
      </div>
    </div>
  );
}

function calcStreak(history = []) {
  let streak = 0;
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
  for (const day of sorted) {
    const d = day.tasks.filter(t => t.done).length;
    if (d === day.tasks.length && d > 0) streak++;
    else break;
  }
  return streak;
}
