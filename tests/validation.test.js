// Pruebas de las reglas críticas de validation.js (T1.3). Ejecutar con: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAmount,
  validateRequired,
  validateTrip,
  validateCategory,
  validateExpense,
  validateItineraryItem,
  findRecordsOutsideRange,
} from '../src/validation.js';

const trip = {
  id: 't1',
  name: 'Costa Rica',
  startDate: '2026-10-20',
  endDate: '2026-10-24',
  currency: 'CRC',
  globalBudget: { total: 500000 },
};

// Quedan ₡50 000 sin asignar.
const state = {
  version: 1,
  trip,
  categories: [
    { id: 'c1', name: 'Comida', amount: 50000 },
    { id: 'c2', name: 'Hospedaje', amount: 400000 },
  ],
  expenses: [],
  itinerary: [],
};

function expenseData(type, date, amount = 1000) {
  return { type, amount, categoryId: 'c1', date };
}

test('REQ-011, REQ-012: los montos -5, 0, "abc" y "" se rechazan', () => {
  assert.equal(validateAmount(-5), 'El monto debe ser mayor a cero.');
  assert.equal(validateAmount(0), 'El monto debe ser mayor a cero.');
  assert.equal(validateAmount('-500'), 'El monto debe ser mayor a cero.');
  assert.equal(validateAmount('abc'), 'El monto debe ser un número.');
  assert.equal(validateAmount(''), 'El monto es obligatorio.');
  assert.equal(validateAmount('   '), 'El monto es obligatorio.');
});

test('REQ-011: los montos positivos se aceptan, aunque vengan como texto del formulario', () => {
  assert.equal(validateAmount(1500), null);
  assert.equal(validateAmount('1500'), null);
  assert.equal(validateAmount(0.01), null);
});

test('REQ-012, REQ-015: campos vacíos o con solo espacios se rechazan', () => {
  assert.equal(validateRequired(''), 'Este campo es obligatorio.');
  assert.equal(validateRequired('  '), 'Este campo es obligatorio.');
  assert.equal(validateRequired(undefined), 'Este campo es obligatorio.');
  assert.equal(validateRequired('Comida'), null);
});

test('REQ-001: un viaje completo es válido', () => {
  assert.deepEqual(validateTrip(trip), {});
});

test('REQ-013, REQ-024: fecha de fin anterior a la de inicio se rechaza', () => {
  const errors = validateTrip({ ...trip, endDate: '2026-10-10' });
  assert.equal(errors.endDate, 'La fecha de fin no puede ser anterior a la de inicio.');
});

test('REQ-001, REQ-045, REQ-048: moneda inválida, presupuesto en cero y tipo de cambio en cero se rechazan', () => {
  const errors = validateTrip({ ...trip, currency: 'EUR', globalBudget: { total: 0 }, exchangeRate: 0 });
  assert.ok(errors.currency);
  assert.equal(errors.total, 'El monto debe ser mayor a cero.');
  assert.ok(errors.exchangeRate);
});

test('REQ-002: no se permiten dos categorías con el mismo nombre sin distinguir mayúsculas ni espacios', () => {
  const errors = validateCategory({ name: ' COMIDA ', amount: 100 }, state);
  assert.equal(errors.name, 'Ya existe una categoría con ese nombre.');

  // Al editar, la categoría no choca consigo misma.
  assert.deepEqual(validateCategory({ id: 'c1', name: 'comida', amount: 50000 }, state), {});
});

test('REQ-003: no deja asignar más de lo disponible e indica cuánto queda', () => {
  const errors = validateCategory({ name: 'Tours', amount: 60000 }, state);
  assert.match(errors.amount, /₡50 000/);
  assert.deepEqual(validateCategory({ name: 'Tours', amount: 50000 }, state), {});
});

test('REQ-044: gasto previo con fecha igual o posterior al inicio se rechaza', () => {
  assert.ok(validateExpense(expenseData('pre-trip', '2026-10-20'), state).date);
  assert.ok(validateExpense(expenseData('pre-trip', '2026-10-22'), state).date);
  assert.deepEqual(validateExpense(expenseData('pre-trip', '2026-10-19'), state), {});
});

test('REQ-014: gasto durante el viaje fuera del rango se rechaza', () => {
  assert.ok(validateExpense(expenseData('on-trip', '2026-10-19'), state).date);
  assert.ok(validateExpense(expenseData('on-trip', '2026-10-25'), state).date);
  assert.deepEqual(validateExpense(expenseData('on-trip', '2026-10-24'), state), {});
});

test('REQ-011, REQ-015: gasto negativo o sin categoría se rechaza', () => {
  const errors = validateExpense({ type: 'on-trip', amount: -500, categoryId: '', date: '2026-10-21' }, state);
  assert.equal(errors.amount, 'El monto debe ser mayor a cero.');
  assert.equal(errors.categoryId, 'Elegí una categoría.');
});

test('REQ-023: un gasto que supera el presupuesto se acepta (solo alerta)', () => {
  assert.deepEqual(validateExpense(expenseData('on-trip', '2026-10-21', 9999999), state), {});
});

test('REQ-010, REQ-042: actividad sin descripción, fuera del viaje o con hora inválida se rechaza', () => {
  const errors = validateItineraryItem({ date: '2026-10-30', description: ' ', time: '25:00' }, trip);
  assert.ok(errors.description);
  assert.ok(errors.date);
  assert.ok(errors.time);
  assert.deepEqual(validateItineraryItem({ date: '2026-10-21', description: 'Volcán Arenal' }, trip), {});
});

test('REQ-025, REQ-044: lista los registros que quedan fuera del nuevo rango', () => {
  const withRecords = {
    ...state,
    expenses: [
      { id: 'x1', type: 'pre-trip', amount: 1, categoryId: 'c1', date: '2026-10-18' },
      { id: 'x2', type: 'on-trip', amount: 1, categoryId: 'c1', date: '2026-10-24' },
      { id: 'x3', type: 'on-trip', amount: 1, categoryId: 'c1', date: '2026-10-20' },
    ],
    itinerary: [
      { id: 'i1', date: '2026-10-24', description: 'Playa' },
      { id: 'i2', date: '2026-10-21', description: 'Volcán' },
    ],
  };
  const affected = findRecordsOutsideRange(withRecords, '2026-10-18', '2026-10-22');
  assert.deepEqual(affected.expenses.map((record) => record.id), ['x1', 'x2']);
  assert.deepEqual(affected.itinerary.map((record) => record.id), ['i1']);
});
