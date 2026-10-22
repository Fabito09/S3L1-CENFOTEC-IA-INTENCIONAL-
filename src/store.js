// Estado global y acciones (design.md §4 y §5).
// Cada acción de datos: validar → modificar → saveState() → avisar a los suscriptores.
// Las acciones devuelven los errores por campo; un objeto vacío significa que se guardó.

import { loadState, saveState } from './storage.js';
import { formatMoney, getUnassignedAmount } from './budget.js';
import {
  validateTrip,
  validateCategory,
  validateExpense,
  validateItineraryItem,
  findRecordsOutsideRange,
} from './validation.js';

function createEmptyUi() {
  return {
    currentScreen: 'home',
    selectedDay: null,
    expenseFilter: 'all',
    errors: {},
    pendingDelete: null,
    showConverted: false,
    loadError: null,
    showReminder: false,
  };
}

let state = {
  version: 1,
  trip: null,
  categories: [],
  expenses: [],
  itinerary: [],
  ui: createEmptyUi(),
};
const listeners = new Set();

// crypto.randomUUID solo existe en contextos seguros (https o localhost).
function createId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

function notify() {
  listeners.forEach((listener) => listener(state));
}

function setUi(changes) {
  state = { ...state, ui: { ...state.ui, ...changes } };
  notify();
}

function reject(errors) {
  setUi({ errors });
  return errors;
}

// REQ-017: aplica el cambio, guarda en LocalStorage y avisa.
// REQ-019: con datos dañados sin resolver no se modifica nada, para no sobrescribirlos.
function commit(changes) {
  if (state.ui.loadError) return reject({ general: state.ui.loadError });
  state = { ...state, ...changes };
  const saveError = saveState(state);
  return reject(saveError ? { general: saveError } : {});
}

// --- Estado y suscripción ---

export function getState() {
  return state;
}

// Devuelve una función para cancelar la suscripción.
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// REQ-018, REQ-019: carga los datos guardados al iniciar la app.
export function initState() {
  const { data, error } = loadState();
  state = { ...state, ...(data ?? {}), ui: { ...createEmptyUi(), loadError: error } };
  notify();
}

// REQ-019: "Empezar de cero" tras confirmar; recién aquí se sobrescriben los datos dañados.
export function resetData() {
  state = { ...state, ui: { ...state.ui, loadError: null } };
  return commit({ trip: null, categories: [], expenses: [], itinerary: [] });
}

// --- Viaje ---

// REQ-001, REQ-013, REQ-045, REQ-048: data tiene la forma de Trip sin id.
export function createTrip(data) {
  if (state.trip) return reject({ general: 'Ya existe un viaje. Editalo o eliminalo primero.' });
  const errors = validateTrip(data);
  if (hasErrors(errors)) return reject(errors);

  const trip = {
    id: createId(),
    name: data.name.trim(),
    startDate: data.startDate,
    endDate: data.endDate,
    currency: data.currency,
    globalBudget: { total: Number(data.globalBudget.total) },
  };
  if (data.exchangeRate !== undefined && data.exchangeRate !== '') {
    trip.exchangeRate = Number(data.exchangeRate);
  }
  return commit({ trip });
}

// REQ-024 a REQ-027, REQ-046, REQ-048: edita el viaje; la moneda nunca cambia.
// Un exchangeRate vacío lo quita (vuelve a no tener vista convertida).
export function updateTrip(changes) {
  const current = state.trip;
  if (!current) return reject({ general: 'Primero creá el viaje.' });
  const merged = {
    ...current,
    ...changes,
    globalBudget: { ...current.globalBudget, ...changes.globalBudget },
    currency: current.currency,
  };

  const errors = validateTrip(merged);
  if (hasErrors(errors)) return reject(errors);

  const affected = findRecordsOutsideRange(state, merged.startDate, merged.endDate);
  const affectedCount = affected.expenses.length + affected.itinerary.length;
  if (affectedCount > 0) {
    return reject({
      dates: `Hay ${affectedCount} registro(s) fuera de las nuevas fechas. Movelos o eliminalos primero.`,
      affectedRecords: affected,
    });
  }

  const trip = {
    ...merged,
    name: merged.name.trim(),
    globalBudget: { total: Number(merged.globalBudget.total) },
  };
  if (trip.exchangeRate === undefined || trip.exchangeRate === '') {
    delete trip.exchangeRate;
  } else {
    trip.exchangeRate = Number(trip.exchangeRate);
  }

  const unassigned = getUnassignedAmount({ ...state, trip });
  if (unassigned < 0) {
    return reject({
      total: `Es menor a lo asignado en categorías. Reducí ${formatMoney(-unassigned, trip.currency)} en las categorías.`,
    });
  }
  return commit({ trip });
}

// REQ-028: borra el viaje con sus categorías, gastos y actividades (la UI confirma antes).
export function deleteTrip() {
  return commit({ trip: null, categories: [], expenses: [], itinerary: [] });
}

// --- Categorías ---

// REQ-002, REQ-003
export function addCategory(data) {
  const errors = validateCategory(data, state);
  if (hasErrors(errors)) return reject(errors);

  const category = { id: createId(), name: data.name.trim(), amount: Number(data.amount) };
  return commit({ categories: [...state.categories, category] });
}

// REQ-002, REQ-003, REQ-004: el límite diario de comida se recalcula solo en budget.js.
export function updateCategory(id, data) {
  const errors = validateCategory({ ...data, id }, state);
  if (hasErrors(errors)) return reject(errors);

  const categories = state.categories.map((category) => (category.id === id
    ? { ...category, name: data.name.trim(), amount: Number(data.amount) }
    : category));
  return commit({ categories });
}

// REQ-016: no se borra una categoría con gastos; se indica cuántos tiene.
export function deleteCategory(id) {
  const expenseCount = state.expenses.filter((expense) => expense.categoryId === id).length;
  if (expenseCount > 0) {
    return reject({ category: `No se puede eliminar: tiene ${expenseCount} gasto(s) asociado(s).` });
  }
  return commit({ categories: state.categories.filter((category) => category.id !== id) });
}

// --- Gastos ---

function buildExpense(id, data) {
  return {
    id,
    type: data.type,
    amount: Number(data.amount),
    categoryId: data.categoryId,
    date: data.date,
  };
}

// REQ-005, REQ-006, REQ-011 a REQ-015, REQ-044. No revisa el presupuesto: solo alerta (REQ-023).
export function addExpense(data) {
  const errors = validateExpense(data, state);
  if (hasErrors(errors)) return reject(errors);
  return commit({ expenses: [...state.expenses, buildExpense(createId(), data)] });
}

// REQ-032, REQ-033: si los datos nuevos no son válidos, el gasto original queda igual.
export function updateExpense(id, data) {
  const errors = validateExpense(data, state);
  if (hasErrors(errors)) return reject(errors);

  const expenses = state.expenses.map((expense) => (expense.id === id ? buildExpense(id, data) : expense));
  return commit({ expenses });
}

// REQ-029, REQ-030: el monto vuelve al disponible porque los totales se calculan (la UI confirma antes).
export function deleteExpense(id) {
  return commit({ expenses: state.expenses.filter((expense) => expense.id !== id) });
}

// --- Itinerario (manual: nunca se generan actividades, REQ-020) ---

function buildItineraryItem(id, data) {
  const item = { id, date: data.date, description: data.description.trim() };
  if (data.time) item.time = data.time;
  return item;
}

// REQ-010: el orden del arreglo es el orden de ingreso (lo usa sortDayItems).
export function addItineraryItem(data) {
  const errors = validateItineraryItem(data, state.trip);
  if (hasErrors(errors)) return reject(errors);
  return commit({ itinerary: [...state.itinerary, buildItineraryItem(createId(), data)] });
}

// REQ-042: al editar conserva su posición de ingreso.
export function updateItineraryItem(id, data) {
  const errors = validateItineraryItem(data, state.trip);
  if (hasErrors(errors)) return reject(errors);

  const itinerary = state.itinerary.map((item) => (item.id === id ? buildItineraryItem(id, data) : item));
  return commit({ itinerary });
}

// REQ-043 (la UI confirma antes).
export function deleteItineraryItem(id) {
  return commit({ itinerary: state.itinerary.filter((item) => item.id !== id) });
}

// --- Interfaz (no se guarda en LocalStorage) ---

export function setScreen(currentScreen) {
  setUi({ currentScreen, errors: {} });
}

export function setSelectedDay(selectedDay) {
  setUi({ selectedDay });
}

// filter: 'all' | 'pre-trip' | 'on-trip'
export function setExpenseFilter(expenseFilter) {
  setUi({ expenseFilter });
}

// pendingDelete: { kind, id } mientras se muestra ConfirmDialog, o null al cerrarlo.
export function setPendingDelete(pendingDelete) {
  setUi({ pendingDelete });
}

export function clearErrors() {
  setUi({ errors: {} });
}

// REQ-008: muestra u oculta el ReminderBanner durante la sesión.
export function setReminderVisible(showReminder) {
  setUi({ showReminder });
}

// REQ-047: alterna la vista convertida; sin tipo de cambio avisa dónde ingresarlo.
export function toggleConverted() {
  if (!state.trip?.exchangeRate) {
    return reject({ converter: 'Ingresá el tipo de cambio en la pantalla del viaje para ver los montos convertidos.' });
  }
  setUi({ showConverted: !state.ui.showConverted, errors: {} });
  return {};
}
