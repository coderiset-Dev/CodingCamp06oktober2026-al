/* ============================================================
   SECTION 1: STATE & CONSTANTS
   ============================================================ */

const KEYS = {
  username: 'dashboard_username',
  theme:    'dashboard_theme',
  tasks:    'dashboard_tasks',
  links:    'dashboard_links'
};

let state = {
  username:      '',
  theme:         'light',
  tasks:         [],  // [{id, text, done}]
  links:         [],  // [{id, name, url}]
  timerSeconds:  25 * 60,
  timerRunning:  false,
  timerInterval: null
};

/* ============================================================
   SECTION 2: LOCALSTORAGE HELPERS
   ============================================================ */

function loadState() {
  state.username = localStorage.getItem(KEYS.username) || '';
  state.theme    = localStorage.getItem(KEYS.theme)    || 'light';

  try {
    const rawTasks = localStorage.getItem(KEYS.tasks);
    state.tasks = rawTasks ? JSON.parse(rawTasks) : [];
  } catch (e) {
    state.tasks = [];
  }

  try {
    const rawLinks = localStorage.getItem(KEYS.links);
    state.links = rawLinks ? JSON.parse(rawLinks) : [];
  } catch (e) {
    state.links = [];
  }
}

function saveUsername(name) {
  localStorage.setItem(KEYS.username, name);
}

function saveTasks() {
  localStorage.setItem(KEYS.tasks, JSON.stringify(state.tasks));
}

function saveLinks() {
  localStorage.setItem(KEYS.links, JSON.stringify(state.links));
}

function saveTheme(theme) {
  localStorage.setItem(KEYS.theme, theme);
}

/* ============================================================
   SECTION 3: CLOCK & GREETING
   ============================================================ */

function getGreeting(hour) {
  if (hour >= 5  && hour <= 11) return 'Good Morning';
  if (hour >= 12 && hour <= 16) return 'Good Afternoon';
  if (hour >= 17 && hour <= 20) return 'Good Evening';
  return 'Good Night';
}

function updateClock() {
  const now  = new Date();
  const hh   = String(now.getHours()).padStart(2, '0');
  const mm   = String(now.getMinutes()).padStart(2, '0');
  const ss   = String(now.getSeconds()).padStart(2, '0');
  const hour = now.getHours();

  const clockEl = document.getElementById('clock');
  if (clockEl) clockEl.innerHTML = `${hh}:${mm}:${ss}`;

  const dateEl = document.getElementById('date-display');
  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year:    'numeric',
      month:   'long',
      day:     'numeric'
    });
  }

  const greetingEl = document.getElementById('greeting-text');
  if (greetingEl) {
    const displayName = state.username || 'Friend';
    greetingEl.innerHTML =
      `${getGreeting(hour)}, ` +
      `<span class="name-row">` +
        `<span id="username-display">${escapeHtml(displayName)}</span>` +
        `<button class="edit-name-btn" id="edit-name-btn" aria-label="Edit name">✏️</button>` +
      `</span>!`;

    // Re-attach edit-name-btn listener each tick (element is recreated)
    const editBtn = document.getElementById('edit-name-btn');
    if (editBtn) {
      editBtn.addEventListener('click', openNameModal);
    }
  }
}

/* ============================================================
   SECTION 4: FOCUS TIMER
   ============================================================ */

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  const display = document.getElementById('timer-display');
  if (display) display.textContent = formatTime(state.timerSeconds);
}

function startTimer() {
  if (state.timerRunning || state.timerSeconds <= 0) return;
  state.timerRunning  = true;
  state.timerInterval = setInterval(tickTimer, 1000);
}

function stopTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
  state.timerRunning  = false;
}

function resetTimer() {
  stopTimer();
  state.timerSeconds = 25 * 60;
  renderTimer();
  const timesUp = document.getElementById('times-up');
  if (timesUp) timesUp.style.display = 'none';
}

function tickTimer() {
  state.timerSeconds -= 1;
  if (state.timerSeconds <= 0) {
    state.timerSeconds = 0;
    stopTimer();
    renderTimer();
    const timesUp = document.getElementById('times-up');
    if (timesUp) timesUp.style.display = 'block';
  } else {
    renderTimer();
  }
}

/* ============================================================
   SECTION 5: TO-DO LIST
   ============================================================ */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

function renderTasks() {
  const list = document.getElementById('task-list');
  if (!list) return;
  list.innerHTML = '';

  state.tasks.forEach(task => {
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

    // Task text span (view mode)
    const textSpan = document.createElement('span');
    textSpan.className   = 'task-text';
    textSpan.textContent = task.text;

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
        // Save
        editTask(task.id, editInput.value);
      } else {
        // Enter edit mode
        textSpan.style.display  = 'none';
        editInput.style.display = '';
        editBtn.textContent     = '💾';
        editBtn.setAttribute('aria-label', 'Save task');
        editInput.focus();
        editInput.select();
      }
    });

    // Allow Enter key to save
    editInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        editTask(task.id, editInput.value);
      }
      if (e.key === 'Escape') {
        renderTasks(); // cancel
      }
    });

    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    item.appendChild(checkbox);
    item.appendChild(textSpan);
    item.appendChild(editInput);
    item.appendChild(editBtn);
    item.appendChild(deleteBtn);

    list.appendChild(item);
  });
}

function showTaskError(msg) {
  const errEl = document.getElementById('task-error');
  if (!errEl) return;
  errEl.textContent = msg;
  clearTimeout(errEl._timeout);
  errEl._timeout = setTimeout(() => { errEl.textContent = ''; }, 3000);
}

function isDuplicateTask(text, excludeId = null) {
  const normalized = text.trim().toLowerCase();
  return state.tasks.some(t =>
    t.id !== excludeId && t.text.toLowerCase() === normalized
  );
}

function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  if (isDuplicateTask(trimmed)) {
    showTaskError('⚠️ Task already exists. No duplicates allowed.');
    return;
  }

  state.tasks.push({ id: Date.now(), text: trimmed, done: false });
  saveTasks();
  renderTasks();
}

function editTask(id, newText) {
  const trimmed = newText.trim();
  if (!trimmed) return;

  if (isDuplicateTask(trimmed, id)) {
    showTaskError('⚠️ Task already exists. No duplicates allowed.');
    return;
  }

  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  task.text = trimmed;
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

/* ============================================================
   SECTION 6: QUICK LINKS
   ============================================================ */

function renderLinks() {
  const list = document.getElementById('links-list');
  if (!list) return;
  list.innerHTML = '';

  state.links.forEach(link => {
    const wrapper = document.createElement('div');
    wrapper.className = 'link-btn-wrapper';

    const btn = document.createElement('button');
    btn.className   = 'link-btn';
    btn.textContent = link.name;
    btn.setAttribute('aria-label', `Open ${link.name}`);
    btn.addEventListener('click', () => window.open(link.url, '_blank', 'noopener,noreferrer'));

    const delBtn = document.createElement('button');
    delBtn.className   = 'link-delete-btn';
    delBtn.dataset.id  = link.id;
    delBtn.textContent = '×';
    delBtn.setAttribute('aria-label', `Delete ${link.name}`);
    delBtn.addEventListener('click', () => deleteLink(link.id));

    wrapper.appendChild(btn);
    wrapper.appendChild(delBtn);
    list.appendChild(wrapper);
  });
}

function showLinkError(msg) {
  const errEl = document.getElementById('link-error');
  if (!errEl) return;
  errEl.textContent = msg;
  clearTimeout(errEl._timeout);
  errEl._timeout = setTimeout(() => { errEl.textContent = ''; }, 3000);
}

function addLink(name, url) {
  const trimmedName = name.trim();
  const trimmedUrl  = url.trim();

  if (!trimmedName || !trimmedUrl) {
    showLinkError('⚠️ Both name and URL are required.');
    return;
  }

  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    showLinkError('⚠️ URL must start with http:// or https://');
    return;
  }

  state.links.push({ id: Date.now(), name: trimmedName, url: trimmedUrl });
  saveLinks();
  renderLinks();

  // Clear inputs
  const nameInput = document.getElementById('link-name-input');
  const urlInput  = document.getElementById('link-url-input');
  if (nameInput) nameInput.value = '';
  if (urlInput)  urlInput.value  = '';
}

function deleteLink(id) {
  state.links = state.links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
}

/* ============================================================
   SECTION 7: THEME
   ============================================================ */

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  saveTheme(state.theme);
  applyTheme(state.theme);
}

/* ============================================================
   SECTION 8: CUSTOM NAME / MODAL
   ============================================================ */

function showModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.style.display = 'flex';

  const input = document.getElementById('modal-name-input');
  if (input) {
    input.value = state.username;
    // Slight delay to ensure display:flex is rendered before focus
    setTimeout(() => input.focus(), 50);
  }
}

function hideModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.style.display = 'none';
}

function saveName() {
  const input   = document.getElementById('modal-name-input');
  if (!input) return;
  const trimmed = input.value.trim();
  if (!trimmed) return;

  state.username = trimmed;
  saveUsername(trimmed);
  hideModal();
  updateClock();
}

function openNameModal() {
  showModal();
}

/* ============================================================
   SECTION 9: EVENT LISTENERS
   ============================================================ */

function attachEventListeners() {
  // Theme toggle
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Add task — button
  const addTaskBtn = document.getElementById('add-task-btn');
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', () => {
      const input = document.getElementById('task-input');
      if (!input) return;
      addTask(input.value);
      input.value = '';
    });
  }

  // Add task — Enter key
  const taskInput = document.getElementById('task-input');
  if (taskInput) {
    taskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        addTask(taskInput.value);
        taskInput.value = '';
      }
    });
    // Clear error on typing
    taskInput.addEventListener('input', () => {
      const errEl = document.getElementById('task-error');
      if (errEl) errEl.textContent = '';
    });
  }

  // Timer buttons
  const startBtn = document.getElementById('start-btn');
  const stopBtn  = document.getElementById('stop-btn');
  const resetBtn = document.getElementById('reset-btn');
  if (startBtn) startBtn.addEventListener('click', startTimer);
  if (stopBtn)  stopBtn.addEventListener('click', stopTimer);
  if (resetBtn) resetBtn.addEventListener('click', resetTimer);

  // Add link
  const addLinkBtn = document.getElementById('add-link-btn');
  if (addLinkBtn) {
    addLinkBtn.addEventListener('click', () => {
      const nameInput = document.getElementById('link-name-input');
      const urlInput  = document.getElementById('link-url-input');
      if (!nameInput || !urlInput) return;
      addLink(nameInput.value, urlInput.value);
    });
  }

  // Clear link error on input
  const linkNameInput = document.getElementById('link-name-input');
  const linkUrlInput  = document.getElementById('link-url-input');
  [linkNameInput, linkUrlInput].forEach(el => {
    if (el) {
      el.addEventListener('input', () => {
        const errEl = document.getElementById('link-error');
        if (errEl) errEl.textContent = '';
      });
    }
  });

  // Add link — Enter on URL field
  if (linkUrlInput) {
    linkUrlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const nameInput = document.getElementById('link-name-input');
        if (nameInput) addLink(nameInput.value, linkUrlInput.value);
      }
    });
  }

  // Modal — save button
  const modalSaveBtn = document.getElementById('modal-save-btn');
  if (modalSaveBtn) modalSaveBtn.addEventListener('click', saveName);

  // Modal — Enter key
  const modalInput = document.getElementById('modal-name-input');
  if (modalInput) {
    modalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveName();
    });
  }

  // Modal — close on overlay click (outside the box)
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay && state.username) {
        // Only close if a name is already set (otherwise user must provide one)
        hideModal();
      }
    });
  }
}

/* ============================================================
   SECTION 10: INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  loadState();

  // Apply theme BEFORE render to prevent flicker
  applyTheme(state.theme);

  // Show name modal if no username is saved
  if (!state.username) {
    showModal();
  }

  // Start clock
  updateClock();
  setInterval(updateClock, 1000);

  // Render components
  renderTimer();
  renderTasks();
  renderLinks();

  // Attach all event listeners
  attachEventListeners();
});
