// Arranque de NomadPulse: loadState → subscribe(render) → primer render.

import { initState, subscribe, getState } from './store.js';
import { App } from './components/App.js';

const appElement = document.getElementById('app');

function render(state) {
  appElement.replaceChildren(App(state));
}

// REQ-018, REQ-019
initState();
subscribe(render);
render(getState());
