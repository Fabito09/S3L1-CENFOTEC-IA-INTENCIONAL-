// Reglas de validación (design.md §5).
// validateAmount y validateRequired devuelven el mensaje de error o null si el valor es válido.
// Los validadores de entidades devuelven { campo: mensaje }; un objeto vacío significa válido.

import { formatMoney, getUnassignedAmount } from './budget.js';

const CURRENCIES = ['CRC', 'USD'];
const EXPENSE_TYPES = ['pre-trip', 'on-trip'];
const TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

// Fechas YYYY-MM-DD: la comparación de texto respeta el orden de calendario.
function isInRange(date, startDate, endDate) {
  return date >= startDate && date <= endDate;
}

// REQ-012, REQ-015: rechaza campos vacíos (solo espacios cuenta como vacío).
export function validateRequired(value) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return 'Este campo es obligatorio.';
  }
  return null;
}

// REQ-011: rechaza montos vacíos, no numéricos, negativos o en cero.
export function validateAmount(value) {
  if (validateRequired(value)) return 'El monto es obligatorio.';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'El monto debe ser un número.';
  if (amount <= 0) return 'El monto debe ser mayor a cero.';
  return null;
}

// REQ-001, REQ-013, REQ-024, REQ-045, REQ-048: datos del viaje.
// data tiene la forma de Trip (data-contract.json) sin id.
export function validateTrip(data) {
  const errors = {};
  if (validateRequired(data.name)) errors.name = 'El nombre del viaje es obligatorio.';
  if (validateRequired(data.startDate)) errors.startDate = 'La fecha de inicio es obligatoria.';
  if (validateRequired(data.endDate)) errors.endDate = 'La fecha de fin es obligatoria.';
  if (!errors.startDate && !errors.endDate && data.endDate < data.startDate) {
    errors.endDate = 'La fecha de fin no puede ser anterior a la de inicio.';
  }
  if (!CURRENCIES.includes(data.currency)) errors.currency = 'Elegí la moneda del viaje (₡ o $).';

  const totalError = validateAmount(data.globalBudget?.total);
  if (totalError) errors.total = totalError;

  const hasExchangeRate = !validateRequired(data.exchangeRate);
  if (hasExchangeRate && validateAmount(data.exchangeRate)) {
    errors.exchangeRate = 'El tipo de cambio debe ser un número mayor a cero.';
  }
  return errors;
}

// REQ-002, REQ-003: nombre único (sin mayúsculas ni espacios) y sin exceder el presupuesto total.
// data.id viene solo al editar; la categoría editada no se compara consigo misma.
export function validateCategory(data, state) {
  const errors = {};
  const others = state.categories.filter((category) => category.id !== data.id);

  if (validateRequired(data.name)) {
    errors.name = 'El nombre de la categoría es obligatorio.';
  } else {
    const normalizedName = data.name.trim().toLowerCase();
    if (others.some((category) => category.name.trim().toLowerCase() === normalizedName)) {
      errors.name = 'Ya existe una categoría con ese nombre.';
    }
  }

  const amountError = validateAmount(data.amount);
  if (amountError) {
    errors.amount = amountError;
  } else if (!state.trip) {
    errors.amount = 'Primero creá el viaje.';
  } else {
    const current = state.categories.find((category) => category.id === data.id);
    const available = getUnassignedAmount(state) + (current ? current.amount : 0);
    if (Number(data.amount) > available) {
      errors.amount = `Supera el presupuesto total. Disponible para asignar: ${formatMoney(available, state.trip.currency)}.`;
    }
  }
  return errors;
}

// REQ-011 a REQ-015, REQ-044: monto, categoría y fecha del gasto.
// pre-trip: fecha anterior al inicio. on-trip: fecha dentro del viaje.
// No revisa el presupuesto: excederlo solo alerta (REQ-023).
export function validateExpense(data, state) {
  const errors = {};
  if (!EXPENSE_TYPES.includes(data.type)) errors.type = 'Elegí si el gasto es previo o durante el viaje.';

  const amountError = validateAmount(data.amount);
  if (amountError) errors.amount = amountError;

  if (!state.categories.some((category) => category.id === data.categoryId)) {
    errors.categoryId = 'Elegí una categoría.';
  }

  const { trip } = state;
  if (validateRequired(data.date)) {
    errors.date = 'La fecha es obligatoria.';
  } else if (!trip) {
    errors.date = 'Primero creá el viaje.';
  } else if (data.type === 'pre-trip' && data.date >= trip.startDate) {
    errors.date = 'Un gasto previo debe tener fecha anterior al inicio del viaje.';
  } else if (data.type === 'on-trip' && !isInRange(data.date, trip.startDate, trip.endDate)) {
    errors.date = 'La fecha debe estar dentro del rango del viaje.';
  }
  return errors;
}

// REQ-010, REQ-042: descripción obligatoria, fecha dentro del viaje y hora opcional HH:MM.
export function validateItineraryItem(data, trip) {
  const errors = {};
  if (validateRequired(data.description)) errors.description = 'La descripción es obligatoria.';

  if (validateRequired(data.date)) {
    errors.date = 'La fecha es obligatoria.';
  } else if (!trip) {
    errors.date = 'Primero creá el viaje.';
  } else if (!isInRange(data.date, trip.startDate, trip.endDate)) {
    errors.date = 'La fecha debe estar dentro del rango del viaje.';
  }

  if (!validateRequired(data.time) && !TIME_PATTERN.test(data.time)) {
    errors.time = 'La hora debe tener el formato HH:MM.';
  }
  return errors;
}

// REQ-025, REQ-044: registros que quedarían inválidos con las nuevas fechas del viaje.
// Gastos on-trip y actividades fuera del rango; gastos pre-trip que ya no quedan antes del inicio.
export function findRecordsOutsideRange(state, startDate, endDate) {
  const expenses = state.expenses.filter((expense) => (expense.type === 'pre-trip'
    ? expense.date >= startDate
    : !isInRange(expense.date, startDate, endDate)));
  const itinerary = state.itinerary.filter((item) => !isInRange(item.date, startDate, endDate));
  return { expenses, itinerary };
}
