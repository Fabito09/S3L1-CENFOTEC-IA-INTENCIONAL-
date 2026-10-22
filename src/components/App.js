// Estructura común: encabezado, CurrencyToggle, pantalla actual, BottomNav y ConfirmDialog (design.md §3).

import { el, icon } from './dom.js';
import { ConfirmDialog } from './ConfirmDialog.js';
import { resetData, setPendingDelete, setScreen, toggleConverted } from '../store.js';

// Orden de la barra inferior según el wireframe. hasAmounts: muestra el botón ₡ ⇄ $ (design.md §3).
// render: cada pantalla se conecta aquí en su tarea (T3.2 a T3.7).
const SCREENS = [
  { id: 'home', label: 'Inicio', icon: 'home', title: 'Hoy', hasAmounts: true, task: 'T3.6' },
  { id: 'expenses', label: 'Gastos', icon: 'wallet', title: 'Gastos', hasAmounts: true, task: 'T3.4 y T3.5' },
  { id: 'itinerary', label: 'Itinerario', icon: 'calendar', title: 'Itinerario', hasAmounts: false, task: 'T3.7' },
  { id: 'categories', label: 'Categorías', icon: 'grid', title: 'Categorías', hasAmounts: true, task: 'T3.3' },
  { id: 'trip', label: 'Viaje', icon: 'bag', title: 'Mi viaje', hasAmounts: true, task: 'T3.2' },
];

// Aviso provisional para las pantallas que aún no se construyen.
function PendingScreen(screen) {
  return el('div', { className: 'card' },
    el('p', { className: 'hint' }, `Esta pantalla se construye en ${screen.task}.`));
}

// REQ-047: alterna la vista convertida ₡ ⇄ $; sin tipo de cambio, el store deja el aviso en ui.errors.converter.
function CurrencyToggle(state) {
  return el('button', {
    type: 'button',
    className: 'chip-toggle',
    'aria-pressed': String(state.ui.showConverted),
    title: 'Ver los montos en la otra moneda',
    onClick: toggleConverted,
  }, '₡ ⇄ $');
}

function ScreenHeader(state, screen) {
  const eyebrow = screen.id === 'home' && state.trip ? state.trip.name : 'NomadPulse';
  return el('header', { className: 'row' },
    el('div', {},
      el('div', { className: 'eyebrow' }, eyebrow),
      el('h1', { className: 'title' }, screen.title)),
    screen.hasAmounts && CurrencyToggle(state));
}

function BottomNav(state) {
  return el('nav', { className: 'bottom-nav', 'aria-label': 'Navegación principal' },
    el('div', { className: 'bottom-nav-inner' },
      SCREENS.map((screen) => el('button', {
        type: 'button',
        'aria-current': state.ui.currentScreen === screen.id ? 'page' : undefined,
        onClick: () => setScreen(screen.id),
      }, icon(screen.icon), screen.label))));
}

// Textos del ConfirmDialog según lo que se va a borrar; cada pantalla agrega su caso en su tarea.
function getConfirmProps(pendingDelete) {
  if (pendingDelete.kind === 'reset') {
    return {
      title: '¿Empezar de cero?',
      message: 'Se borrarán los datos guardados en este navegador y no se podrán recuperar.',
      confirmLabel: 'Empezar de cero',
      onConfirm: () => {
        setPendingDelete(null);
        resetData();
      },
    };
  }
  return null;
}

// REQ-019: con datos dañados solo se muestra el error y la opción de empezar de cero.
function LoadErrorScreen(state) {
  return el('main', {},
    el('div', { className: 'eyebrow' }, 'NomadPulse'),
    el('h1', { className: 'title' }, 'No se pudieron leer tus datos'),
    el('div', { className: 'alert-box' }, state.ui.loadError),
    el('p', { className: 'hint spaced' },
      'Tus datos siguen guardados sin cambios. Si empezás de cero, se borran y la app queda vacía.'),
    el('button', {
      type: 'button',
      className: 'btn btn-danger spaced',
      onClick: () => setPendingDelete({ kind: 'reset' }),
    }, 'Empezar de cero'));
}

export function App(state) {
  const { ui } = state;
  const screen = SCREENS.find((candidate) => candidate.id === ui.currentScreen) ?? SCREENS[0];
  const confirmProps = ui.pendingDelete && getConfirmProps(ui.pendingDelete);

  const content = ui.loadError
    ? LoadErrorScreen(state)
    : el('main', {},
      ScreenHeader(state, screen),
      ui.errors.converter && el('div', { className: 'alert-box', role: 'status' }, ui.errors.converter),
      screen.render ? screen.render(state) : PendingScreen(screen));

  return el('div', {},
    content,
    !ui.loadError && BottomNav(state),
    confirmProps && ConfirmDialog({ ...confirmProps, onCancel: () => setPendingDelete(null) }));
}
