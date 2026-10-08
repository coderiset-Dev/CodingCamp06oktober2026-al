# Implementation Plan — Dashboard Enhancement

## Codebase Snapshot (read before coding)

### Current `KEYS` object (js/script.js line 3–8)
```js
const KEYS = {
  username: 'dashboard_username',
  theme:    'dashboard_theme',
  tasks:    'dashboard_tasks',
  links:    'dashboard_links'
};
```

### Current `state` object (js/script.js line 10–18)
```js
let state = {
  username:      '',
  theme:         'light',
  tasks:         [],
  links:         [],
  timerSeconds:  25 * 60,
  timerRunning:  false,
  timerInterval: null
};
```

### Current `#timer-card` HTML (index.html)
```html
<section class="card" id="timer-card">
  <h2>🎯 Focus Timer</h2>
  <div id="timer-display">25:00</div>
  <p id="times-up" style="display:none;">Time's up! 🎉</p>
  <div class="timer-buttons">
    <button class="btn btn-primary" id="start-btn">▶ Start</button>
    <button class="btn btn-secondary" id="stop-btn">⏸ Stop</button>
    <button class="btn btn-secondary" id="reset-btn">↺ Reset</button>
  </div>
</section>
```

### Current `#todo-card` HTML (index.html)
```html
<section class="card" id="todo-card">
  <h2>✅ To-Do List</h2>
  <div class="todo-input-row">
    <input type="text" id="task-input" … />
    <button class="btn btn-primary" id="add-task-btn">Add</button>
  </div>
  <span class="error-msg" id="task-error" aria-live="polite"></span>
  <div id="task-list"></div>
</section>
```

### Modal overlay is already present at the top of `<body>` — do not add another.

---

## Step-by-step Implementation

---

- [ ] 1. **Add new localStorage keys and state properties** — `js/script.js`, Section 1 only.

  Add two new keys to the `KEYS` object:
  ```js
  timerDuration: 'dashboard_timer_duration',
  sortOrder:     'dashboard_sort'
  ```
  Add two new properties to the `state` object:
  ```js
  timerDuration: 25,   // integer, minutes
  sortOrder:     'default'
  ```
  Do NOT change any other existing keys or properties.

  Files: `js/script.js`
  Verify: Open `index.html` in a browser. Open DevTools Console. No errors on load.

---

- [ ] 2. **Extend `loadState()` to read the two new keys** — `js/script.js`, Section 2.

  Inside `loadState()`, after the existing `state.links` block, add:
  ```js
  // Timer duration
  const rawDuration = parseInt(localStorage.getItem(KEYS.timerDuration), 10);
  state.timerDuration = (!isNaN(rawDuration) && rawDuration >= 1 && rawDuration <= 120)
    ? rawDuration : 25;
  state.timerSeconds = state.timerDuration * 60;

  // Sort order
  const validSorts = ['default','newest','oldest','completed','incomplete','az','za'];
  const rawSort = localStorage.getItem(KEYS.sortOrder);
  state.sortOrder = validSorts.includes(rawSort) ? rawSort : 'default';
  ```

  Add two new helper functions immediately after `saveTheme()`:
  ```js
  function saveTimerDuration(minutes) {
    localStorage.setItem(KEYS.timerDuration, String(minutes));
  }

  function saveSortOrder(order) {
    localStorage.setItem(KEYS.sortOrder, order);
  }
  ```

  Files: `js/script.js`
  Verify: Set `dashboard_timer_duration=45` in DevTools Application → Local Storage, reload. Timer display should show `45:00`.

---

- [ ] 3. **Replace `#timer-card` HTML in `index.html`** — restructure the timer section.

  Replace the entire `<section class="card" id="timer-card">…</section>` block with:

  ```html
  <!-- Focus Timer Card -->
  <section class="card" id="timer-card">
    <!-- Card header row: title + settings toggle -->
    <div class="timer-card-header">
      <h2>🎯 Focus Timer</h2>
      <button class="btn btn-secondary timer-settings-btn" id="timer-settings-btn" aria-label="Timer settings" aria-expanded="false">⚙️ Settings</button>
    </div>

    <!-- Settings panel (hidden by default) -->
    <div id="timer-settings-panel" class="timer-settings-panel" hidden>
      <div class="preset-row">
        <button class="btn preset-btn" data-minutes="15">15 min</button>
        <button class="btn preset-btn" data-minutes="25">25 min</button>
        <button class="btn preset-btn" data-minutes="45">45 min</button>
        <button class="btn preset-btn" data-minutes="60">60 min</button>
      </div>
      <div class="custom-duration-row">
        <label for="custom-duration-input" class="custom-duration-label">Custom (min):</label>
        <input type="number" id="custom-duration-input" class="custom-duration-input" min="1" max="120" placeholder="1–120" aria-label="Custom duration in minutes" />
        <button class="btn btn-primary" id="apply-duration-btn">Apply</button>
      </div>
    </div>

    <!-- SVG progress ring + timer display -->
    <div class="timer-ring-wrap">
      <svg class="timer-ring" viewBox="0 0 120 120" aria-hidden="true">
        <circle class="ring-track" cx="60" cy="60" r="54" />
        <circle class="ring-progress" id="ring-progress" cx="60" cy="60" r="54" />
      </svg>
      <div id="timer-display">25:00</div>
    </div>

    <p id="times-up" style="display:none;">Time's up! 🎉</p>

    <div class="timer-buttons">
      <button class="btn btn-primary"   id="start-btn">▶ Start</button>
      <button class="btn btn-secondary" id="stop-btn">⏸ Stop</button>
      <button class="btn btn-secondary" id="reset-btn">↺ Reset</button>
    </div>
  </section>
  ```

  Files: `index.html`
  Verify: Page loads. Timer card renders with Settings button, timer display, and three buttons. No layout breaks.

---

- [ ] 4. **Add `#task-progress` and `#sort-row` to `#todo-card` in `index.html`**.

  Replace the `<span class="error-msg" id="task-error" …>` line and the `<div id="task-list">` line with:

  ```html
  <span class="error-msg" id="task-error" aria-live="polite"></span>

  <!-- Task progress summary -->
  <div id="task-progress" class="task-progress" aria-live="polite">
    <span id="task-progress-text">No tasks yet</span>
    <div class="progress-bar-wrap" id="progress-bar-wrap" style="display:none;">
      <div class="progress-bar-fill" id="progress-bar-fill"></div>
    </div>
  </div>

  <!-- Sort controls -->
  <div id="sort-row" class="sort-row">
    <label for="sort-select" class="sort-label">Sort:</label>
    <select id="sort-select" class="sort-select" aria-label="Sort tasks">
      <option value="default">Default</option>
      <option value="newest">Newest First</option>
      <option value="oldest">Oldest First</option>
      <option value="completed">Completed First</option>
      <option value="incomplete">Incomplete First</option>
      <option value="az">A–Z</option>
      <option value="za">Z–A</option>
    </select>
  </div>

  <div id="task-list"></div>
  ```

  Files: `index.html`
  Verify: Page loads. To-Do card shows the progress area and sort dropdown above the task list. No layout breaks.

---

- [ ] 5. **Add CSS for the timer settings panel, preset buttons, and settings toggle button** — APPEND to `css/style.css`.

  ```css
  /* ============================================================
     TIMER — CARD HEADER ROW
     ============================================================ */
  .timer-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .timer-card-header h2 {
    margin-bottom: 0; /* override .card h2 margin */
  }

  .timer-settings-btn {
    font-size: 0.875rem;
    padding: 0.3rem 0.75rem;
    min-height: 36px;
  }

  /* ============================================================
     TIMER — SETTINGS PANEL
     ============================================================ */
  .timer-settings-panel {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 0.875rem 1rem;
    margin-bottom: 1rem;
  }

  .preset-row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 0.75rem;
  }

  .preset-btn {
    background: var(--card-bg);
    color: var(--text-primary);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.35rem 0.8rem;
    min-height: 36px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s, color 0.2s;
  }

  .preset-btn:hover {
    background: var(--bg-secondary);
    border-color: var(--accent);
  }

  .preset-btn.active {
    background: var(--accent);
    color: #ffffff;
    border-color: var(--accent);
  }

  .custom-duration-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .custom-duration-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .custom-duration-input {
    flex: 1;
    min-width: 70px;
    max-width: 100px;
    padding: 0.4rem 0.6rem;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--card-bg);
    color: var(--text-primary);
    font-size: 0.9rem;
    min-height: 36px;
    outline: none;
    font-family: inherit;
    transition: border-color 0.2s;
  }

  .custom-duration-input:focus {
    border-color: var(--accent);
  }
  ```

  Files: `css/style.css`
  Verify: Open page. Click ⚙️ Settings button — panel should not show yet (JS not wired). The card header has title on the left and settings button on the right.

---

- [ ] 6. **Add CSS for the SVG progress ring** — APPEND to `css/style.css`.

  ```css
  /* ============================================================
     TIMER — SVG RING
     ============================================================ */
  .timer-ring-wrap {
    position: relative;
    width: 140px;
    height: 140px;
    margin: 0.5rem auto;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .timer-ring {
    position: absolute;
    top: 0;
    left: 0;
    width: 140px;
    height: 140px;
    transform: rotate(-90deg); /* start progress from top */
  }

  .ring-track {
    fill: none;
    stroke: var(--bg-secondary);
    stroke-width: 7;
  }

  .ring-progress {
    fill: none;
    stroke: var(--accent);
    stroke-width: 7;
    stroke-linecap: round;
    stroke-dasharray: 339.3;
    stroke-dashoffset: 0;
    transition: stroke-dashoffset 0.5s linear, stroke 0.3s;
  }

  #timer-display {
    position: relative; /* sits on top of SVG */
    z-index: 1;
    font-size: 2.2rem; /* slightly smaller to fit inside ring */
    font-weight: 700;
    text-align: center;
    color: var(--accent);
    letter-spacing: 2px;
    margin: 0; /* reset the old margin: 1rem 0 */
  }
  ```

  Note: The existing `#timer-display` rule in `style.css` sets `font-size: 3rem; margin: 1rem 0`. The new rule above, appended later in the file, overrides those two properties via cascade. Confirm the appended rule wins (it is later in the file, same specificity) — if needed add `!important` only on the two overriding properties.

  Files: `css/style.css`
  Verify: Timer display is centred inside the ring circle visually, even before JS wires the offset.

---

- [ ] 7. **Add CSS for timer states** — APPEND to `css/style.css`.

  ```css
  /* ============================================================
     TIMER — STATE CLASSES (applied to #timer-card)
     ============================================================ */

  /* Running: accent pulse glow on the display */
  #timer-card.timer-running #timer-display {
    color: var(--accent);
    animation: pulse-glow 1.8s ease-in-out infinite;
  }

  #timer-card.timer-running .ring-progress {
    stroke: var(--accent);
  }

  /* Paused: amber/muted */
  #timer-card.timer-paused #timer-display {
    color: #d97706;
    animation: none;
  }

  #timer-card.timer-paused .ring-progress {
    stroke: #d97706;
  }

  /* Finished: red/error */
  #timer-card.timer-finished #timer-display {
    color: var(--error);
    animation: none;
  }

  #timer-card.timer-finished .ring-progress {
    stroke: var(--error);
  }

  /* Idle: default accent, no animation */
  #timer-card.timer-idle #timer-display {
    color: var(--accent);
    animation: none;
  }

  /* Pulse glow keyframes */
  @keyframes pulse-glow {
    0%   { opacity: 1; }
    50%  { opacity: 0.65; }
    100% { opacity: 1; }
  }
  ```

  Files: `css/style.css`
  Verify: In DevTools, manually add class `timer-running` to `#timer-card`. Timer display should animate with a gentle pulse. Add `timer-paused` — display goes amber. Add `timer-finished` — display goes red.

---

- [ ] 8. **Add CSS for disabled button states** — APPEND to `css/style.css`.

  ```css
  /* ============================================================
     TIMER — DISABLED BUTTON STATES
     ============================================================ */
  .btn:disabled,
  .btn[disabled] {
    opacity: 0.45;
    cursor: not-allowed;
    pointer-events: none;
  }
  ```

  Files: `css/style.css`
  Verify: In DevTools, add `disabled` attribute to `#start-btn`. Button should appear faded and not clickable.

---

- [ ] 9. **Add CSS for task progress summary, sort row, and task status labels** — APPEND to `css/style.css`.

  ```css
  /* ============================================================
     TASK — PROGRESS SUMMARY
     ============================================================ */
  .task-progress {
    margin-bottom: 0.75rem;
  }

  #task-progress-text {
    display: block;
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-bottom: 0.4rem;
  }

  .progress-bar-wrap {
    height: 6px;
    background: var(--bg-secondary);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-bar-fill {
    height: 100%;
    background: #22c55e;
    border-radius: 3px;
    transition: width 0.35s ease;
  }

  /* ============================================================
     TASK — SORT ROW
     ============================================================ */
  .sort-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .sort-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .sort-select {
    flex: 1;
    max-width: 200px;
    padding: 0.35rem 0.6rem;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 0.875rem;
    min-height: 36px;
    cursor: pointer;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s;
  }

  .sort-select:focus {
    border-color: var(--accent);
  }

  /* ============================================================
     TASK — STATUS LABEL & ENHANCED DONE STATE
     ============================================================ */
  .task-text-wrap {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 0.1rem;
    min-width: 0;
  }

  .task-status {
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1;
  }

  .task-status.pending {
    color: var(--text-secondary);
  }

  .task-status.completed {
    color: #22c55e;
  }

  /* Enhanced done task: left accent border + muted look */
  .task-item.done {
    border-left: 3px solid #22c55e;
    padding-left: calc(0.5rem - 3px); /* compensate for border width */
    opacity: 0.72;
  }

  .task-item.done .task-text {
    text-decoration: line-through;
    color: var(--text-secondary);
  }
  ```

  Files: `css/style.css`
  Verify: Add a task, complete it. The completed task shows a green left border, reduced opacity, and strikethrough. The `○ Pending` / `✓ Completed` label is visible below the task text.

---

- [ ] 10. **Add `applyTimerState()`, `updateProgressRing()`, and `updateTimerButtons()` to `js/script.js`** — insert as new Section 4a after the existing Section 4.

  These are pure helpers with no side effects on existing code.

  ```js
  /* ============================================================
     SECTION 4a: TIMER HELPERS
     ============================================================ */

  const RING_CIRCUMFERENCE = 2 * Math.PI * 54; // ≈ 339.29

  function applyTimerState(stateName) {
    // stateName: 'idle' | 'running' | 'paused' | 'finished'
    const card = document.getElementById('timer-card');
    if (!card) return;
    card.classList.remove('timer-idle', 'timer-running', 'timer-paused', 'timer-finished');
    card.classList.add('timer-' + stateName);
  }

  function updateProgressRing() {
    const ring = document.getElementById('ring-progress');
    if (!ring) return;
    const total   = state.timerDuration * 60;
    const elapsed = total - state.timerSeconds;
    const progress = total > 0 ? elapsed / total : 0;
    const offset = RING_CIRCUMFERENCE * (1 - progress);
    ring.style.strokeDashoffset = offset;
  }

  function updateTimerButtons() {
    const startBtn = document.getElementById('start-btn');
    const stopBtn  = document.getElementById('stop-btn');
    if (startBtn) {
      startBtn.disabled = state.timerRunning || state.timerSeconds <= 0;
    }
    if (stopBtn) {
      stopBtn.disabled = !state.timerRunning;
    }
    // Reset is always enabled — no change needed
  }
  ```

  Files: `js/script.js`
  Verify: No console errors on load.

---

- [ ] 11. **Modify the four existing timer functions** — `startTimer`, `stopTimer`, `resetTimer`, `tickTimer` in Section 4 of `js/script.js`.

  **`startTimer`** — add state calls after existing guard:
  ```js
  function startTimer() {
    if (state.timerRunning || state.timerSeconds <= 0) return;
    state.timerRunning  = true;
    state.timerInterval = setInterval(tickTimer, 1000);
    applyTimerState('running');
    updateTimerButtons();
  }
  ```

  **`stopTimer`** — add state calls at end:
  ```js
  function stopTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    state.timerRunning  = false;
    applyTimerState('paused');
    updateTimerButtons();
  }
  ```

  **`resetTimer`** — use `state.timerDuration` instead of hardcoded `25 * 60`:
  ```js
  function resetTimer() {
    stopTimer();
    state.timerSeconds = state.timerDuration * 60;
    renderTimer();
    updateProgressRing();
    applyTimerState('idle');
    updateTimerButtons();
    const timesUp = document.getElementById('times-up');
    if (timesUp) timesUp.style.display = 'none';
  }
  ```

  Note: `stopTimer()` calls `applyTimerState('paused')`, but `resetTimer` immediately follows with `applyTimerState('idle')`, so the net result is correct (idle).

  **`tickTimer`** — add ring update and call `applyTimerState('finished')` on completion:
  ```js
  function tickTimer() {
    state.timerSeconds -= 1;
    if (state.timerSeconds <= 0) {
      state.timerSeconds = 0;
      stopTimer();           // sets paused state internally
      renderTimer();
      updateProgressRing();
      applyTimerState('finished');  // override to finished
      updateTimerButtons();
      const timesUp = document.getElementById('times-up');
      if (timesUp) timesUp.style.display = 'block';
    } else {
      renderTimer();
      updateProgressRing();
    }
  }
  ```

  Files: `js/script.js`
  Verify: Start timer — card gets `.timer-running` class. Stop — card gets `.timer-paused`. Reset — card gets `.timer-idle`. Start/Stop buttons are disabled appropriately at each state.

---

- [ ] 12. **Add timer settings panel functions** — `js/script.js`, after Section 4a.

  ```js
  /* ============================================================
     SECTION 4b: TIMER SETTINGS PANEL
     ============================================================ */

  function toggleSettingsPanel() {
    const panel = document.getElementById('timer-settings-panel');
    const btn   = document.getElementById('timer-settings-btn');
    if (!panel) return;
    const isHidden = panel.hidden;
    panel.hidden = !isHidden;
    if (btn) btn.setAttribute('aria-expanded', String(isHidden));
  }

  function highlightActivePreset(minutes) {
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.minutes) === minutes);
    });
  }

  function setTimerDuration(minutes) {
    const m = Math.min(120, Math.max(1, Math.round(minutes)));
    state.timerDuration = m;
    saveTimerDuration(m);
    highlightActivePreset(m);
    if (!state.timerRunning) {
      state.timerSeconds = m * 60;
      renderTimer();
      updateProgressRing();
      updateTimerButtons();
    }
  }
  ```

  Files: `js/script.js`
  Verify: No console errors. (Buttons wired in next step.)

---

- [ ] 13. **Add sort helper and update `renderTasks()`** — `js/script.js`, Section 5.

  Add `getSortedTasks()` helper immediately before `renderTasks()`:
  ```js
  function getSortedTasks() {
    const copy = [...state.tasks];
    switch (state.sortOrder) {
      case 'newest':    return copy.reverse();
      case 'oldest':    return copy; // insertion order = oldest first
      case 'completed': return copy.sort((a, b) => b.done - a.done);
      case 'incomplete':return copy.sort((a, b) => a.done - b.done);
      case 'az':        return copy.sort((a, b) => a.text.localeCompare(b.text));
      case 'za':        return copy.sort((a, b) => b.text.localeCompare(a.text));
      default:          return copy; // 'default' = insertion order
    }
  }
  ```

  Replace the entire `renderTasks()` function body with:
  ```js
  function renderTasks() {
    const list = document.getElementById('task-list');
    if (!list) return;
    list.innerHTML = '';

    // --- Progress summary ---
    const total     = state.tasks.length;
    const completed = state.tasks.filter(t => t.done).length;
    const remaining = total - completed;
    const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

    const progressText = document.getElementById('task-progress-text');
    const progressWrap = document.getElementById('progress-bar-wrap');
    const progressFill = document.getElementById('progress-bar-fill');

    if (progressText) {
      progressText.textContent = total === 0
        ? 'No tasks yet'
        : `${total} task${total !== 1 ? 's' : ''} · ${completed} completed · ${remaining} remaining`;
    }
    if (progressWrap) progressWrap.style.display = total > 0 ? '' : 'none';
    if (progressFill) progressFill.style.width   = pct + '%';

    // --- Sorted display copy (do NOT mutate state.tasks) ---
    const sorted = getSortedTasks();

    sorted.forEach(task => {
      const item = document.createElement('div');
      item.className = 'task-item' + (task.done ? ' done' : '');
      item.dataset.id = task.id;

      // Checkbox
      const checkbox = document.createElement('input');
      checkbox.type      = 'checkbox';
      checkbox.className = 'task-checkbox';
      checkbox.checked   = task.done;
      checkbox.setAttribute('aria-label', 'Mark task as done');
      checkbox.addEventListener('change', () => toggleTask(task.id));

      // Text+status wrapper
      const textWrap = document.createElement('div');
      textWrap.className = 'task-text-wrap';

      const textSpan = document.createElement('span');
      textSpan.className   = 'task-text';
      textSpan.textContent = task.text;

      const statusSpan = document.createElement('span');
      statusSpan.className   = 'task-status ' + (task.done ? 'completed' : 'pending');
      statusSpan.textContent = task.done ? '✓ Completed' : '○ Pending';

      textWrap.appendChild(textSpan);
      textWrap.appendChild(statusSpan);

      // Edit input (edit mode, hidden by default)
      const editInput = document.createElement('input');
      editInput.type      = 'text';
      editInput.className = 'task-edit-input';
      editInput.value     = task.text;
      editInput.maxLength = 200;
      editInput.setAttribute('aria-label', 'Edit task');
      editInput.style.display = 'none';

      // Edit/Save button
      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-secondary edit-task-btn';
      editBtn.dataset.id = task.id;
      editBtn.setAttribute('aria-label', 'Edit task');
      editBtn.textContent = '✏️';

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-danger delete-task-btn';
      deleteBtn.dataset.id = task.id;
      deleteBtn.setAttribute('aria-label', 'Delete task');
      deleteBtn.textContent = '🗑️';

      // Edit/Save toggle logic
      editBtn.addEventListener('click', () => {
        const isEditing = editInput.style.display !== 'none';
        if (isEditing) {
          editTask(task.id, editInput.value);
        } else {
          textWrap.style.display  = 'none';
          editInput.style.display = '';
          editBtn.textContent     = '💾';
          editBtn.setAttribute('aria-label', 'Save task');
          editInput.focus();
          editInput.select();
        }
      });

      editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter')  editTask(task.id, editInput.value);
        if (e.key === 'Escape') renderTasks();
      });

      deleteBtn.addEventListener('click', () => deleteTask(task.id));

      item.appendChild(checkbox);
      item.appendChild(textWrap);
      item.appendChild(editInput);
      item.appendChild(editBtn);
      item.appendChild(deleteBtn);

      list.appendChild(item);
    });
  }
  ```

  Files: `js/script.js`
  Verify: Reload page. Add 3 tasks, complete 1. Progress shows "3 tasks · 1 completed · 2 remaining" and progress bar fills ~33%. Each task shows `○ Pending` or `✓ Completed` below its text. Completed task has green left border.

---

- [ ] 14. **Wire all new event listeners in `attachEventListeners()`** — `js/script.js`, Section 9.

  Inside `attachEventListeners()`, after the existing timer buttons block, add:

  ```js
  // Settings toggle button
  const settingsBtn = document.getElementById('timer-settings-btn');
  if (settingsBtn) settingsBtn.addEventListener('click', toggleSettingsPanel);

  // Preset duration buttons (event delegation on settings panel)
  const settingsPanel = document.getElementById('timer-settings-panel');
  if (settingsPanel) {
    settingsPanel.addEventListener('click', (e) => {
      const preset = e.target.closest('.preset-btn');
      if (preset) {
        const minutes = parseInt(preset.dataset.minutes, 10);
        if (!isNaN(minutes)) setTimerDuration(minutes);
      }
    });
  }

  // Apply custom duration
  const applyDurationBtn = document.getElementById('apply-duration-btn');
  if (applyDurationBtn) {
    applyDurationBtn.addEventListener('click', () => {
      const input = document.getElementById('custom-duration-input');
      if (!input) return;
      const minutes = parseInt(input.value, 10);
      if (!isNaN(minutes) && minutes >= 1 && minutes <= 120) {
        setTimerDuration(minutes);
        input.value = '';
      }
    });
  }

  // Custom duration — Enter key
  const customDurationInput = document.getElementById('custom-duration-input');
  if (customDurationInput) {
    customDurationInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const minutes = parseInt(customDurationInput.value, 10);
        if (!isNaN(minutes) && minutes >= 1 && minutes <= 120) {
          setTimerDuration(minutes);
          customDurationInput.value = '';
        }
      }
    });
  }

  // Sort select change
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      state.sortOrder = sortSelect.value;
      saveSortOrder(state.sortOrder);
      renderTasks();
    });
  }
  ```

  Files: `js/script.js`
  Verify: Click ⚙️ Settings — panel toggles open/closed. Click a preset (e.g. 45 min) — timer updates to 45:00 and preset button gets highlighted. Change sort dropdown — task order changes without affecting stored data.

---

- [ ] 15. **Update `init` in Section 10 of `js/script.js`** — set sort select value, apply initial timer state, update timer buttons, and highlight active preset.

  In the `DOMContentLoaded` callback, after the `renderTimer()` call, add:

  ```js
  // Apply saved sort preference to select element
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = state.sortOrder;

  // Set initial timer state and button states
  applyTimerState('idle');
  updateTimerButtons();
  updateProgressRing();
  highlightActivePreset(state.timerDuration);
  ```

  Also update the `renderTimer()` call comment to note it uses `state.timerSeconds` (already set from `state.timerDuration * 60` in `loadState()`).

  Files: `js/script.js`
  Verify: Reload with `dashboard_timer_duration=45` in localStorage — timer shows 45:00, the 45 min preset button is highlighted, Start button is enabled, Stop button is disabled. Sort select shows the saved preference.

---

## Final Checklist

After all steps are complete, the implementer must verify each item manually:

| # | Check |
|---|-------|
| 1 | No console errors on load (fresh and with data) |
| 2 | Timer default is 25 min; saved duration is restored on reload |
| 3 | Settings panel opens/closes with ⚙️ Settings button |
| 4 | Presets (15, 25, 45, 60) update timer display; active preset highlighted |
| 5 | Custom duration (1–120) validates and applies |
| 6 | Duration changes disabled when timer is running |
| 7 | SVG ring depletes from full to empty as timer counts down |
| 8 | Ring resets (full) when Reset pressed |
| 9 | `.timer-idle` → `.timer-running` → `.timer-paused` → `.timer-finished` transitions correct |
| 10 | Pulse animation on running state |
| 11 | Start button disabled when running or at 0:00; Stop disabled when not running |
| 12 | Times-up message appears when timer finishes |
| 13 | `dashboard_timer_duration` persists in localStorage |
| 14 | Task progress summary accurate: count, completed, remaining, percentage bar |
| 15 | Progress bar hidden when 0 tasks |
| 16 | Each task shows `○ Pending` or `✓ Completed` status label |
| 17 | Completed task has green left border, reduced opacity, strikethrough |
| 18 | Sort options (7 options) change display order without mutating localStorage tasks array |
| 19 | `dashboard_sort` persists and is restored on reload |
| 20 | Challenge 1 (dark mode) — still works |
| 21 | Challenge 2 (custom name) — still works |
| 22 | Challenge 3 (change pomodoro time) — implemented ✓ |
| 23 | Challenge 4 (prevent duplicates) — still works |
| 24 | Challenge 5 (sort tasks) — implemented ✓ |
| 25 | Only one CSS file (`css/style.css`) and one JS file (`js/script.js`) |
| 26 | Responsive on mobile (≤768px) — timer ring and settings panel do not overflow |
| 27 | No duplicate function definitions; existing functions patched, not duplicated |
