// Estructura común: encabezado, CurrencyToggle, pantalla actual, BottomNav y ConfirmDialog (design.md §3).

import { el, icon, formatDate } from './dom.js';
import { ConfirmDialog } from './ConfirmDialog.js';
import { TripScreen } from './TripScreen.js';
import { CategoriesScreen } from './CategoriesScreen.js';
import { ExpenseForm } from './ExpenseForm.js';
import { ExpenseList } from './ExpenseList.js';
import { HomeScreen } from './HomeScreen.js';
import { toDisplayMoney } from '../budget.js';
import { deleteExpense, deleteTrip, resetData, setPendingDelete, setScreen, toggleConverted } from '../store.js';

// Orden de la barra inferior según el wireframe. hasAmounts: muestra el botón ₡ ⇄ $ (design.md §3).
// needsTrip: sin viaje se muestra NoTripNotice. render: cada pantalla se conecta aquí en su tarea (T3.2 a T3.7).
const SCREENS = [
  { id: 'home', label: 'Inicio', icon: 'home', title: 'Hoy', hasAmounts: true, needsTrip: true, render: HomeScreen },
  { id: 'expenses', label: 'Gastos', icon: 'wallet', title: 'Gastos', hasAmounts: true, needsTrip: true, render: ExpenseList },
  { id: 'itinerary', label: 'Itinerario', icon: 'calendar', title: 'Itinerario', hasAmounts: false, needsTrip: true, task: 'T3.7' },
  { id: 'categories', label: 'Categorías', icon: 'grid', title: 'Categorías', hasAmounts: true, needsTrip: true, render: CategoriesScreen },
  { id: 'trip', label: 'Viaje', icon: 'bag', title: 'Mi viaje', hasAmounts: true, needsTrip: false, render: TripScreen },
];

// Vistas dentro de una pestaña (no aparecen en la barra). Dibujan su propio encabezado.
const SUB_SCREENS = [
  { id: 'expense-form', parent: 'expenses', needsTrip: true, render: ExpenseForm },
];

function NoTripNotice() {
  return el('div', { className: 'card' },
    el('p', { className: 'hint' }, 'Todavía no hay un viaje. Crealo primero para usar esta pantalla.'),
    el('button', { type: 'button', className: 'btn btn-primary spaced', onClick: () => setScreen('trip') }, 'Crear mi viaje'));
}

function ScreenContent(state, screen) {
  if (screen.needsTrip && !state.trip) return NoTripNotice();
  return screen.render ? screen.render(state) : PendingScreen(screen);
}

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

function BottomNav(activeTab) {
  return el('nav', { className: 'bottom-nav', 'aria-label': 'Navegación principal' },
    el('div', { className: 'bottom-nav-inner' },
      SCREENS.map((screen) => el('button', {
        type: 'button',
        'aria-current': activeTab === screen.id ? 'page' : undefined,
        onClick: () => setScreen(screen.id),
      }, icon(screen.icon), screen.label))));
}

// Textos del ConfirmDialog según lo que se va a borrar; cada pantalla agrega su caso en su tarea.
function getConfirmProps(pendingDelete, state) {
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
  if (pendingDelete.kind === 'trip') {
    return {
      title: '¿Eliminar el viaje?',
      message: 'Se borrarán el viaje con todas sus categorías, gastos y actividades. No se puede deshacer.',
      confirmLabel: 'Eliminar',
      onConfirm: () => {
        setPendingDelete(null);
        deleteTrip();
      },
    };
  }
  if (pendingDelete.kind === 'expense') {
    const expense = state.expenses.find((candidate) => candidate.id === pendingDelete.id);
    if (!expense) return null;
    const categoryName = state.categories.find((category) => category.id === expense.categoryId)?.name ?? 'Sin categoría';
    const amount = toDisplayMoney(expense.amount, state.trip, state.ui.showConverted);
    return {
      title: '¿Eliminar este gasto?',
      message: `${categoryName} · ${formatDate(expense.date)} · ${amount}. El monto volverá a tu presupuesto disponible.`,
      confirmLabel: 'Eliminar',
      onConfirm: () => {
        setPendingDelete(null);
        deleteExpense(expense.id);
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
  const screen = [...SCREENS, ...SUB_SCREENS].find((candidate) => candidate.id === ui.currentScreen) ?? SCREENS[0];
  const confirmProps = ui.pendingDelete && getConfirmProps(ui.pendingDelete, state);

  const content = ui.loadError
    ? LoadErrorScreen(state)
    : el('main', {},
      !screen.parent && ScreenHeader(state, screen),
      ui.errors.converter && el('div', { className: 'alert-box', role: 'status' }, ui.errors.converter),
      ScreenContent(state, screen));

  return el('div', {},
    content,
    !ui.loadError && BottomNav(screen.parent ?? screen.id),
    confirmProps && ConfirmDialog({ ...confirmProps, onCancel: () => setPendingDelete(null) }));
}
