// Arranque de NomadPulse: loadState → subscribe(render) → primer render → recordatorio.

import { initState, subscribe, getState, setReminderVisible } from './store.js';
import { getToday } from './budget.js';
import { shouldShowReminder, scheduleMorningNotification } from './reminder.js';
import { App } from './components/App.js';

const appElement = document.getElementById('app');

function render(state) {
  appElement.replaceChildren(App(state));
}

// REQ-018, REQ-019
initState();
subscribe(render);
render(getState());

// REQ-008, REQ-009
if (!getState().ui.loadError && shouldShowReminder(getToday(), getState().trip)) setReminderVisible(true);
scheduleMorningNotification();
