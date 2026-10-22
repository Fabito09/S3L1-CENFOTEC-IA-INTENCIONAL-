// Arranque de NomadPulse: loadState → subscribe(render) → primer render.

import { initState, subscribe, getState } from './store.js';

const appElement = document.getElementById('app');

// Vista provisional hasta T3.1, donde render pasa a dibujar App con sus pantallas.
function render(state) {
  const message = document.createElement('p');
  message.className = 'loading';
  if (state.ui.loadError) {
    message.textContent = state.ui.loadError;
  } else if (state.trip) {
    message.textContent = `Viaje cargado: ${state.trip.name} · ${state.categories.length} categorías · ${state.expenses.length} gastos · ${state.itinerary.length} actividades`;
  } else {
    message.textContent = 'Todavía no hay un viaje guardado.';
  }
  appElement.replaceChildren(message);
}

// REQ-018, REQ-019
initState();
subscribe(render);
render(getState());
