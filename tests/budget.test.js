// Pruebas de las reglas críticas de budget.js (T1.3). Ejecutar con: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getToday,
  getTotalDays,
  isFoodCategory,
  getFoodBudget,
  getDailySpent,
  calculateDailyFoodLimit,
  getGlobalBudget,
  getUnassignedAmount,
  formatMoney,
  toDisplayMoney,
} from '../src/budget.js';

const TODAY = '2026-10-21';
const YESTERDAY = '2026-10-20';

// Viaje de 5 días con ₡50 000 para Comida: límite diario de ₡10 000.
const trip = {
  id: 't1',
  name: 'Costa Rica',
  startDate: '2026-10-20',
  endDate: '2026-10-24',
  currency: 'CRC',
  exchangeRate: 500,
  globalBudget: { total: 500000 },
};
const food = { id: 'c1', name: 'Comida', amount: 50000 };
const lodging = { id: 'c2', name: 'Hospedaje', amount: 200000 };

function expense(id, type, amount, categoryId, date) {
  return { id, type, amount, categoryId, date };
}

function buildState(expenses) {
  return { version: 1, trip, categories: [food, lodging], expenses, itinerary: [] };
}

test('REQ-034: ₡50 000, 5 días y ₡7 000 gastados hoy dejan ₡3 000 disponibles', () => {
  const state = buildState([expense('e1', 'on-trip', 7000, 'c1', TODAY)]);
  assert.deepEqual(calculateDailyFoodLimit(state, TODAY), {
    limit: 10000,
    dailySpent: 7000,
    availableToday: 3000,
    isOverLimit: false,
  });
});

test('REQ-007, REQ-039: con ₡12 000 gastados hoy el disponible es −₡2 000 y se marca el exceso', () => {
  const state = buildState([
    expense('e1', 'on-trip', 7000, 'c1', TODAY),
    expense('e2', 'on-trip', 5000, 'c1', TODAY),
  ]);
  const result = calculateDailyFoodLimit(state, TODAY);
  assert.equal(result.availableToday, -2000);
  assert.equal(result.isOverLimit, true);
  assert.equal(formatMoney(result.availableToday, 'CRC'), '−₡2 000');
});

test('REQ-031: gastar exactamente el límite no marca exceso', () => {
  const state = buildState([expense('e1', 'on-trip', 10000, 'c1', TODAY)]);
  const result = calculateDailyFoodLimit(state, TODAY);
  assert.equal(result.availableToday, 0);
  assert.equal(result.isOverLimit, false);
});

test('REQ-035: sin arrastre, lo no gastado ayer no suma hoy y el exceso de ayer no resta', () => {
  const underYesterday = buildState([expense('e1', 'on-trip', 1000, 'c1', YESTERDAY)]);
  assert.equal(calculateDailyFoodLimit(underYesterday, TODAY).availableToday, 10000);

  const overYesterday = buildState([expense('e1', 'on-trip', 25000, 'c1', YESTERDAY)]);
  assert.equal(calculateDailyFoodLimit(overYesterday, TODAY).availableToday, 10000);
});

test('REQ-036: los gastos pre-trip y los de otras categorías no cuentan en el Acumulado del Día', () => {
  const state = buildState([
    expense('e1', 'pre-trip', 30000, 'c1', TODAY),
    expense('e2', 'on-trip', 8000, 'c2', TODAY),
    expense('e3', 'on-trip', 2000, 'c1', TODAY),
  ]);
  assert.equal(getDailySpent(state, TODAY), 2000);
});

test('REQ-041: sin categoría Comida no hay límite diario', () => {
  const state = { ...buildState([]), categories: [lodging] };
  assert.equal(getFoodBudget(state.categories), null);
  assert.equal(getDailySpent(state, TODAY), 0);
  assert.equal(calculateDailyFoodLimit(state, TODAY), null);
});

test('REQ-002, REQ-041: "comida" y " COMIDA " se reconocen como la categoría Comida', () => {
  assert.equal(isFoodCategory({ name: 'comida' }), true);
  assert.equal(isFoodCategory({ name: ' COMIDA ' }), true);
  assert.equal(isFoodCategory({ name: 'Comidas' }), false);
  assert.equal(getFoodBudget([lodging, { id: 'c3', name: ' COMIDA ', amount: 9000 }]), 9000);
});

test('REQ-001, REQ-026: Días Totales = (fin − inicio) + 1', () => {
  assert.equal(getTotalDays(trip), 5);
  assert.equal(getTotalDays({ startDate: '2026-11-01', endDate: '2026-11-01' }), 1);
  assert.equal(getTotalDays({ startDate: '2026-12-30', endDate: '2027-01-02' }), 4);
});

test('Glosario "Hoy": fecha local en formato YYYY-MM-DD', () => {
  assert.equal(getToday(new Date(2026, 0, 5, 23, 30)), '2026-01-05');
});

test('REQ-005, REQ-006, REQ-030: todo gasto resta del presupuesto total y al eliminarlo vuelve', () => {
  const withExpenses = buildState([
    expense('e1', 'pre-trip', 100000, 'c2', '2026-10-01'),
    expense('e2', 'on-trip', 7000, 'c1', TODAY),
  ]);
  assert.deepEqual(getGlobalBudget(withExpenses), {
    total: 500000,
    spent: 107000,
    available: 393000,
    percentUsed: 21.4,
  });

  const afterDelete = buildState([expense('e1', 'pre-trip', 100000, 'c2', '2026-10-01')]);
  assert.equal(getGlobalBudget(afterDelete).available, 400000);
});

test('REQ-003: monto por asignar = total − suma de categorías', () => {
  assert.equal(getUnassignedAmount(buildState([])), 250000);
});

test('REQ-037, REQ-045: redondeo a 2 decimales solo al mostrar, con el símbolo de la moneda', () => {
  assert.equal(formatMoney(1250.5, 'CRC'), '₡1 250,50');
  assert.equal(formatMoney(10, 'USD'), '$10');
  assert.equal(formatMoney(1234567.891, 'USD'), '$1 234 567,89');
  assert.equal(formatMoney(-0.001, 'USD'), '$0');

  // El cálculo conserva la precisión completa: 50 000 / 3 no se redondea.
  const threeDays = { ...buildState([]), trip: { ...trip, endDate: '2026-10-22' } };
  assert.equal(calculateDailyFoodLimit(threeDays, TODAY).limit, 50000 / 3);
});

test('REQ-047: ₡5 000 con tipo de cambio 500 se muestra como $10, sin cambiar el monto', () => {
  const amount = 5000;
  assert.equal(toDisplayMoney(amount, trip, true), '$10');
  assert.equal(toDisplayMoney(amount, trip, false), '₡5 000');
  assert.equal(toDisplayMoney(10, { ...trip, currency: 'USD' }, true), '₡5 000');
  assert.equal(amount, 5000);
});

test('REQ-047: sin tipo de cambio la vista convertida muestra la moneda del viaje', () => {
  const { exchangeRate, ...tripWithoutRate } = trip;
  assert.equal(toDisplayMoney(5000, tripWithoutRate, true), '₡5 000');
});
