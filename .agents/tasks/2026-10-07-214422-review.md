# To-Do List Life Dashboard — Enhancement Pass

This change adds five features to an existing vanilla-JS dashboard: a Pomodoro settings panel with presets and custom input, an SVG progress ring for the timer, four distinct timer visual states, a task progress summary with a progress bar, per-task status labels, an enhanced completed-task style, a sort control with seven options, and the full set of five challenge items (light/dark mode, custom name, change Pomodoro time, prevent duplicate tasks, sort tasks). All work is delivered in three files — `index.html`, `css/style.css`, `js/script.js` — with no external dependencies and full localStorage persistence across all six keys.

**Watch for:**
- `#modal-overlay` is shown/hidden via `style.display` directly, but the CSS contains a `.open` class rule that is never applied — dead code that will mislead future readers (confirmed).
- The first `#timer-display` CSS rule (`font-size: 3rem; margin: 1rem 0`) is never removed; the later rule overrides it via cascade, leaving a stale declaration that obscures the intended sizing (confirmed).

**Verdict**: APPROVED

---

## High-level view

The timer enhancement is structurally sound. The settings panel is toggled with the `hidden` attribute, presets use event delegation, and `setTimerDuration` guards against changing the duration mid-run. `resetTimer` reads `state.timerDuration` rather than a hardcoded value. The four state classes (`timer-idle`, `timer-running`, `timer-paused`, `timer-finished`) are mutually exclusive, applied via a single `applyTimerState()` helper that removes all four before adding the new one.

The SVG ring uses a `stroke-dasharray` of `339.3` in CSS, consistent with the JS constant `RING_CIRCUMFERENCE = 2 * Math.PI * 54 ≈ 339.29`. `updateProgressRing` computes offset as `circumference * (1 - progress)`, so the ring starts full and depletes as time elapses.

The modal mechanism has a confirmed inconsistency: `showModal` sets `overlay.style.display = 'flex'` directly; `hideModal` sets `style.display = 'none'`. The CSS rule `#modal-overlay.open { display: flex }` is never used. The runtime behavior is correct because inline styles beat class rules, but the `.open` class is dead code.

The task section adds the progress summary, sort dropdown, and per-task status labels without touching the underlying CRUD logic. `getSortedTasks` operates on a spread copy of `state.tasks`, so no sort operation mutates the stored array. Duplicate prevention covers both `addTask` and `editTask` with case-insensitive normalization. All six localStorage keys are defined in the `KEYS` constant, read in `loadState` with fallbacks, and the sort order is validated against a whitelist; timer duration is clamped to 1–120.

---

<details>
<summary>Issues (2)</summary>

1. **Dead `.open` CSS class** — `#modal-overlay.open { display: flex }` is never applied by JS (which uses `style.display` directly). Remove it to avoid future confusion about how the modal is opened.

2. **Stale `#timer-display` rule** — The original `#timer-display { font-size: 3rem; margin: 1rem 0 }` at line 180 of `style.css` is superseded by the later rule at line 639 (`font-size: 2.2rem; margin: 0`) via cascade. Remove the earlier rule to make the intended sizing unambiguous.

</details>

---

<details>
<summary>Details</summary>

## Modal open/close mechanism mismatch

`showModal` writes `overlay.style.display = 'flex'` as an inline style; `hideModal` writes `overlay.style.display = 'none'`. The CSS file contains `#modal-overlay.open { display: flex }` which is never toggled by JS. Inline styles win over class-based styles, so the modal works correctly at runtime, but any developer reading the CSS would reasonably assume the modal is opened by adding the `.open` class — and would be wrong. Confidence: confirmed.

## Stale `#timer-display` rule in CSS

Two `#timer-display` rules exist at different positions in `style.css`. The first (line 180) declares `font-size: 3rem` and `margin: 1rem 0`. The second (line 639) declares `font-size: 2.2rem`, `margin: 0`, and adds `position: relative; z-index: 1` for ring overlay positioning. Both share identical specificity, so the later rule wins. The earlier font-size and margin declarations are effectively dead and will confuse anyone trying to understand the timer's sizing. Confidence: confirmed.

</details>

---

<details>
<summary>File map</summary>

- `index.html` — restructured timer card with settings panel + SVG ring; added task progress and sort row elements
- `css/style.css` — appended timer card header, settings panel, SVG ring, timer state classes, disabled button, task progress, sort row, and task status label styles
- `js/script.js` — added `timerDuration`/`sortOrder` to state and KEYS; added `applyTimerState`, `updateProgressRing`, `updateTimerButtons`, `toggleSettingsPanel`, `highlightActivePreset`, `setTimerDuration`, `getSortedTasks`; updated `startTimer`, `stopTimer`, `resetTimer`, `tickTimer`, `renderTasks`, `attachEventListeners`, and `DOMContentLoaded` init

Full diff: `git diff main` from project root.

</details>
