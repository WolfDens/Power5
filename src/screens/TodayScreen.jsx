import { useState } from "react";

function todayStr() { return new Date().toISOString().slice(0, 10); }

export default function TodayScreen({ state, updateState, digestReady: initialDigestReady, currentDate }) {
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
  const [hopperInput, setHopperInput] = useState("");
  const [digestReady, setDigestReady] = useState(initialDigestReady);
  const [checkingDigest, setCheckingDigest] = useState(false);
  const dragItem = { current: null };

  const hasTasks = state.tasks.length > 0;
  const rolledTasks = state.tasks.filter(t => t.rolled);
  const streak = calcStreak(state.history);
  const hopper = state.hopper || [];

  async function pullLatestDigest() {
    setCheckingDigest(true);
    try {
      const res = await fetch("/api/digest-status");
      const data = await res.json();
      setDigestReady(data.available);
      if (!data.available) setError("No digest found for today yet. Check back after 4:30am.");
      else setError(null);
    } catch (e) {
      setError("Could not check digest status.");
    }
    setCheckingDigest(false);
  }

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const rolled = state.tasks.filter(t => t.rolled);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualInput, rolledTasks: rolled, hopper, clientApiKey: localStorage.getItem("power5_api_key") || "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      const tasks = data.tasks.map(t => ({
        ...t, id: crypto.randomUUID(), done: false, rolled: false,
      }));
      updateState({ tasks, aiInsight: data.insight, dayGenerated: currentDate }, true);
      setPhase("done");
    } catch (e) {
      setError(e.message);
      setPhase("idle");
    }
    setLoading(false);
  }

  function toggleTask(id) {
    if (state.dayLocked) return;
    updateState({ tasks: state.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) });
  }

  function startEdit(task) { setEditingId(task.id); setEditValue(task.title); }
  function saveEdit(id) {
    if (!editValue.trim()) return;
    updateState({ tasks: state.tasks.map(t => t.id === id ? { ...t, title: editValue.trim() } : t) });
    setEditingId(null);
  }
  function removeTask(id) { updateState({ tasks: state.tasks.filter(t => t.id !== id) }); }

  function addTask() {
    if (!newTaskTitle.trim()) return;
    const newTask = { id: crypto.randomUUID(), title: newTaskTitle.trim(), source: "Manual", sourceIcon: "edit", priority: "med", done: false, rolled: false };
    updateState({ tasks: [...state.tasks, newTask] });
    setNewTaskTitle(""); setAddingTask(false);
  }

  function addToHopper() {
    if (!hopperInput.trim()) return;
    const item = { id: crypto.randomUUID(), text: hopperInput.trim(), addedAt: new Date().toISOString() };
    updateState({ hopper: [...hopper, item] }, false);
    setHopperInput("");
  }

  function removeFromHopper(id) {
    updateState({ hopper: hopper.filter(h => h.id !== id) }, false);
  }

  function onDragStart(idx) { dragItem.current = idx; setDragIdx(idx); }
  function onDragEnter(idx) { setDragOverIdx(idx); }
  function onDragEnd() {
    if (dragItem.current === null || dragOverIdx === null || dragItem.current === dragOverIdx) {
      setDragIdx(null); setDragOverIdx(null); dragItem.current = null; return;
    }
    const tasks = [...state.tasks];
    const dragged = tasks.splice(dragItem.current, 1)[0];
    tasks.splice(dragOverIdx, 0, dragged);
    updateState({ tasks });
    setDragIdx(null); setDragOverIdx(null); dragItem.current = null;
  }

  function confirmEndDay() {
    const today = currentDate || todayStr();
    const entry = {
      date: today,
      tasks: state.tasks.map(t => ({
        title: t.title, done: t.done, source: t.source,
        priority: t.priority, rolled: !!t.rolled,
      })),
      hopper: [...hopper],
    };
    const history = [entry, ...(state.history || []).filter(h => h.date !== today)];
    const incomplete = state.tasks.filter(t => !t.done);
    updateState({ history, dayLocked: true, tasks: incomplete.map(t => ({ ...t, rolled: true })) }, true);
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

      {/* Locked */}
      {state.dayLocked && lockedDay && (
        <>
          <div className="day-locked-banner">
            <i className="ti ti-lock" aria-hidden="true" />
            Day locked{lockedDay.autoEnded ? " (auto)" : ""} — {lockedDay.tasks.filter(t => t.done).length}/{lockedDay.tasks.length} complete
          </div>
          <TaskList tasks={lockedDay.tasks} onToggle={() => {}} locked={true}
            editingId={null} onEdit={() => {}} onSaveEdit={() => {}} onCancelEdit={() => {}} editValue=""
            onRemove={() => {}} dragIdx={null} dragOverIdx={null}
            onDragStart={() => {}} onDragEnter={() => {}} onDragEnd={() => {}} />
        </>
      )}

      {/* Empty */}
      {!hasTasks && !state.dayLocked && phase === "idle" && (
        <div className="empty-state">
          <i className="ti ti-list-check" aria-hidden="true" />
          <p>Ready to build your Power 5</p>
          {digestReady ? (
            <div className="digest-ready-pill"><i className="ti ti-bolt" aria-hidden="true" /> Cowork digest ready</div>
          ) : (
            <button className="pull-digest-btn" onClick={pullLatestDigest} disabled={checkingDigest}>
              <i className={`ti ${checkingDigest ? "ti-refresh" : "ti-download"}`} aria-hidden="true" />
              {checkingDigest ? "Checking..." : "Pull latest digest"}
            </button>
          )}
          <button className="btn-primary" style={{ marginTop: "1rem" }} onClick={() => setPhase("prompt")}>
            <i className="ti ti-sparkles" aria-hidden="true" /> Let's go
          </button>
        </div>
      )}

      {/* Has tasks, idle, unlocked */}
      {hasTasks && !state.dayLocked && phase === "idle" && (
        <>
          {rolledTasks.length > 0 && (
            <div className="rolled-notice"><i className="ti ti-refresh" aria-hidden="true" /> {rolledTasks.length} task{rolledTasks.length > 1 ? "s" : ""} rolled from yesterday</div>
          )}
          {!digestReady && (
            <button className="pull-digest-btn inline" onClick={pullLatestDigest} disabled={checkingDigest}>
              <i className={`ti ${checkingDigest ? "ti-refresh" : "ti-download"}`} aria-hidden="true" />
              {checkingDigest ? "Checking..." : "Pull latest digest"}
            </button>
          )}
          {digestReady && (
            <div className="digest-ready-pill small"><i className="ti ti-bolt" aria-hidden="true" /> Digest ready</div>
          )}
          {state.aiInsight && (
            <div className="ai-insight"><i className="ti ti-sparkles" style={{ fontSize: 13, marginRight: 6 }} aria-hidden="true" />{state.aiInsight}</div>
          )}
          <TaskList tasks={state.tasks} onToggle={toggleTask} locked={false}
            editingId={editingId} onEdit={startEdit} onSaveEdit={saveEdit}
            onCancelEdit={() => setEditingId(null)} editValue={editValue}
            setEditValue={setEditValue} onRemove={removeTask}
            dragIdx={dragIdx} dragOverIdx={dragOverIdx}
            onDragStart={onDragStart} onDragEnter={onDragEnter} onDragEnd={onDragEnd} />

          {state.tasks.length < 5 && (
            addingTask ? (
              <div className="add-task-row">
                <input className="edit-input" placeholder="Task title..." value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addTask(); if (e.key === "Escape") setAddingTask(false); }} autoFocus />
                <button className="icon-btn save-btn" onClick={addTask}><i className="ti ti-check" aria-hidden="true" /></button>
                <button className="icon-btn cancel-btn" onClick={() => setAddingTask(false)}><i className="ti ti-x" aria-hidden="true" /></button>
              </div>
            ) : (
              <button className="add-task-btn" onClick={() => setAddingTask(true)}>
                <i className="ti ti-plus" aria-hidden="true" /> Add task
              </button>
            )
          )}
          <div className="action-row">
            <button className="btn-outline" onClick={() => setPhase("prompt")}><i className="ti ti-sparkles" aria-hidden="true" /> Regenerate</button>
            <button className="btn-primary" onClick={() => setEndDayOpen(true)}><i className="ti ti-moon" aria-hidden="true" /> End day</button>
          </div>
        </>
      )}

      {/* Prompt */}
      {phase === "prompt" && !loading && (
        <div className="prompt-card">
          {digestReady ? (
            <div className="digest-ready-banner">
              <i className="ti ti-bolt" aria-hidden="true" />
              <div><div className="digest-ready-title">Cowork digest ready</div><div className="digest-ready-sub">Your 4:30am email digest is loaded.</div></div>
            </div>
          ) : (
            <div className="no-digest-banner">
              <i className="ti ti-mail-off" aria-hidden="true" />
              <div style={{ flex: 1 }}>No digest for today</div>
              <button className="pull-digest-btn-sm" onClick={pullLatestDigest} disabled={checkingDigest}>
                {checkingDigest ? "Checking..." : "Pull digest"}
              </button>
            </div>
          )}
          <div className="prompt-divider" />
          <div className="prompt-section-label">Anything else on your mind? <span className="optional-tag">optional</span></div>
          <div className="prompt-hint">Treated as a signal, not a guarantee.</div>
          <textarea className="manual-input" placeholder="e.g. Need to call DJ about the permit..." value={manualInput} onChange={e => setManualInput(e.target.value)} rows={2} />
          {hopper.length > 0 && (
            <div className="hopper-preview">
              <i className="ti ti-archive" style={{ fontSize: 12, marginRight: 5 }} aria-hidden="true" />
              {hopper.length} hopper item{hopper.length > 1 ? "s" : ""} will be considered if slots are available
            </div>
          )}
          <div className="prompt-actions">
            <button className="btn-ghost" onClick={() => setPhase("idle")}>Cancel</button>
            <button className="btn-primary" onClick={generate}><i className="ti ti-sparkles" aria-hidden="true" /> Generate Power 5</button>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-card">
          <div className="loading-spinner" />
          <div className="loading-title">Building your Power 5...</div>
          <div className="loading-sub">{digestReady ? "Reading your Cowork digest..." : "Working from your priorities..."}</div>
        </div>
      )}

      {phase === "done" && !state.dayLocked && (
        <>
          {state.aiInsight && <div className="ai-insight"><i className="ti ti-sparkles" style={{ fontSize: 13, marginRight: 6 }} aria-hidden="true" />{state.aiInsight}</div>}
          <TaskList tasks={state.tasks} onToggle={toggleTask} locked={false}
            editingId={editingId} onEdit={startEdit} onSaveEdit={saveEdit}
            onCancelEdit={() => setEditingId(null)} editValue={editValue}
            setEditValue={setEditValue} onRemove={removeTask}
            dragIdx={dragIdx} dragOverIdx={dragOverIdx}
            onDragStart={onDragStart} onDragEnter={onDragEnter} onDragEnd={onDragEnd} />
          <div className="action-row">
            <button className="btn-outline" onClick={() => setPhase("prompt")}><i className="ti ti-sparkles" aria-hidden="true" /> Regenerate</button>
            <button className="btn-primary" onClick={() => setEndDayOpen(true)}><i className="ti ti-moon" aria-hidden="true" /> End day</button>
          </div>
        </>
      )}

      {error && <div className="error-banner"><i className="ti ti-alert-triangle" aria-hidden="true" /> {error}</div>}

      {/* Hopper */}
      {!state.dayLocked && (
        <div className="hopper-section">
          <div className="hopper-header">
            <i className="ti ti-archive" aria-hidden="true" />
            <span>In the Hopper</span>
            <span className="hopper-count">{hopper.length}</span>
          </div>
          <div className="hopper-hint">Ideas for future tasks — pulled into your list when there's room</div>
          <div className="hopper-list">
            {hopper.map(h => (
              <div className="hopper-item" key={h.id}>
                <span>{h.text}</span>
                <button className="icon-btn delete-btn" onClick={() => removeFromHopper(h.id)}><i className="ti ti-x" aria-hidden="true" /></button>
              </div>
            ))}
          </div>
          <div className="hopper-input-row">
            <input className="edit-input" placeholder="Jot down an idea..." value={hopperInput}
              onChange={e => setHopperInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addToHopper(); }} />
            <button className="icon-btn save-btn" onClick={addToHopper} disabled={!hopperInput.trim()}>
              <i className="ti ti-plus" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {endDayOpen && <EndDayModal tasks={state.tasks} onConfirm={confirmEndDay} onCancel={() => setEndDayOpen(false)} />}
    </div>
  );
}

function TaskList({ tasks, onToggle, locked, editingId, onEdit, onSaveEdit, onCancelEdit, editValue, setEditValue, onRemove, dragIdx, dragOverIdx, onDragStart, onDragEnter, onDragEnd }) {
  return (
    <div className="task-list">
      {tasks.map((t, i) => (
        <div key={t.id || i}
          className={`task-card${t.done ? " done" : ""}${locked ? " locked" : ""}${dragIdx === i ? " dragging" : ""}${dragOverIdx === i && dragIdx !== i ? " drag-over" : ""}`}
          draggable={!locked} onDragStart={() => !locked && onDragStart(i)}
          onDragEnter={() => !locked && onDragEnter(i)} onDragEnd={onDragEnd}
          onDragOver={e => e.preventDefault()}>
          {!locked && <div className="drag-handle"><i className="ti ti-grip-vertical" /></div>}
          <div className="task-num">{i + 1}</div>
          <div className={`task-check${t.done ? " checked" : ""}`} onClick={() => !locked && onToggle(t.id)}>
            {t.done && <i className="ti ti-check" style={{ fontSize: 12, color: "#fff" }} aria-hidden="true" />}
          </div>
          <div className="task-body">
            {editingId === t.id ? (
              <div className="edit-row">
                <input className="edit-input" value={editValue} onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") onSaveEdit(t.id); if (e.key === "Escape") onCancelEdit(); }} autoFocus />
                <button className="icon-btn save-btn" onClick={() => onSaveEdit(t.id)}><i className="ti ti-check" aria-hidden="true" /></button>
                <button className="icon-btn cancel-btn" onClick={onCancelEdit}><i className="ti ti-x" aria-hidden="true" /></button>
              </div>
            ) : (
              <>
                <div className="task-title" onClick={() => !locked && onToggle(t.id)}>{t.title}</div>
                <div className="task-meta">
                  <span className="source-tag"><i className={`ti ti-${t.sourceIcon || "mail"}`} style={{ fontSize: 11 }} aria-hidden="true" />{t.source}</span>
                  {t.rolled && <span className="rolled-tag">Rolled</span>}
                  {t.source === "Hopper" && <span className="hopper-tag">Hopper</span>}
                </div>
              </>
            )}
          </div>
          {!locked && editingId !== t.id && (
            <div className="task-actions">
              <button className="icon-btn edit-btn" onClick={() => onEdit(t)}><i className="ti ti-pencil" aria-hidden="true" /></button>
              <button className="icon-btn delete-btn" onClick={() => onRemove(t.id)}><i className="ti ti-trash" aria-hidden="true" /></button>
            </div>
          )}
          <div className={`priority-dot p-${t.priority}`} />
        </div>
      ))}
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
            <circle cx="36" cy="36" r={r} fill="none" stroke={perfect ? "#639922" : "#185FA5"}
              strokeWidth="5" strokeDasharray={circ} strokeDashoffset={offset}
              strokeLinecap="round" transform="rotate(-90 36 36)" />
            <text x="36" y="41" textAnchor="middle" fontSize="13" fontWeight="500" fill="var(--text-primary)">{pct}%</text>
          </svg>
          <div>
            <div className="summary-title">{done} of {total} completed</div>
            <div className="summary-sub">{perfect ? "Perfect day — locked." : `${total - done} task${total - done > 1 ? "s" : ""} roll to tomorrow.`}</div>
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
