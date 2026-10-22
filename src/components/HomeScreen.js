// Pantalla Inicio (wireframe 3): disponible de comida de hoy y presupuesto del viaje.
// REQ-007, REQ-031, REQ-034 a REQ-041, REQ-047

import { el, formatDate, formatMonth, formatWeekday } from './dom.js';
import {
  calculateDailyFoodLimit,
  getFoodBudget,
  getGlobalBudget,
  getToday,
  getTotalDays,
  toDisplayMoney,
} from '../budget.js';
import { setScreen } from '../store.js';
import { openExpenseForm } from './ExpenseForm.js';

// "sábado 17 de octubre" a partir de YYYY-MM-DD.
function describeDate(isoDate) {
  return `${formatWeekday(isoDate)} ${Number(isoDate.slice(8))} de ${formatMonth(isoDate)}`;
}

// REQ-040: fuera del rango del viaje no se muestra el disponible de hoy.
function TripStatusNotice(trip, today) {
  const message = today < trip.startDate
    ? `Tu viaje aún no inicia. Empieza el ${formatDate(trip.startDate)}; ese día vas a ver aquí tu disponible para comida.`
    : `Tu viaje ya finalizó el ${formatDate(trip.endDate)}.`;
  return el('div', { className: 'card' }, el('p', { className: 'hint' }, message));
}

// REQ-041: sin categoría Comida no hay límite diario.
function MissingFoodNotice() {
  return el('div', { className: 'card' },
    el('p', { className: 'hint' }, 'Creá la categoría "Comida" para ver cuánto podés gastar en comida cada día.'),
    el('button', { type: 'button', className: 'btn btn-ghost spaced', onClick: () => setScreen('categories') }, 'Ir a Categorías'));
}

// REQ-034 a REQ-039: los tres valores y la fórmula exacta; negativo en color de advertencia.
function FoodTodayCard(state, foodLimit, money) {
  const { limit, dailySpent, availableToday, isOverLimit } = foodLimit;
  const usedPercent = limit > 0 ? Math.min((dailySpent / limit) * 100, 100) : 100;
  const totalDays = getTotalDays(state.trip);

  return el('section', { className: 'hero', 'aria-label': 'Comida de hoy' },
    el('p', { className: 'hero-label' }, 'Disponible hoy para comida'),
    el('p', { className: isOverLimit ? 'big big-alert' : 'big' }, money(availableToday)),
    el('div', { className: 'bar hero-bar' }, el('span', { style: `width:${usedPercent}%;background:var(--accent)` })),
    el('div', { className: 'row hero-caption' }, el('span', {}, 'Acumulado del día'), el('span', {}, 'Límite diario')),
    el('div', { className: 'row hero-values' }, el('span', {}, money(dailySpent)), el('span', {}, money(limit))),
    el('p', { className: 'hero-formula' },
      `(${money(getFoodBudget(state.categories))} ÷ ${totalDays} ${totalDays === 1 ? 'día' : 'días'}) − ${money(dailySpent)}`));
}

// REQ-007: alerta sin bloquear; REQ-031: desaparece cuando el disponible vuelve a ≥ 0.
function OverLimitAlert() {
  return el('div', { className: 'alert-box alert-solid', role: 'alert' },
    el('strong', {}, 'Límite de comida superado'),
    el('p', {}, 'Superaste el límite de hoy. Podés seguir registrando gastos.'));
}

// REQ-005, REQ-006, REQ-030: avance del presupuesto total del viaje.
function BudgetProgress(state, money) {
  const { total, available, percentUsed } = getGlobalBudget(state);
  return el('div', { className: 'card' },
    el('div', { className: 'row' },
      el('strong', { className: 'card-title' }, 'Presupuesto del viaje'),
      el('span', { className: percentUsed > 100 ? 'percent-used alert-text' : 'percent-used' }, `${Math.round(percentUsed)} % usado`)),
    el('div', { className: 'bar spaced-small' },
      el('span', { style: `width:${Math.min(percentUsed, 100)}%;background:${percentUsed > 100 ? 'var(--alert)' : 'var(--primary)'}` })),
    el('p', { className: 'note' },
      'Disponible ',
      el('strong', { className: available < 0 ? 'alert-text' : 'strong-text' }, money(available)),
      ` de ${money(total)}`));
}

export function HomeScreen(state) {
  const { trip, ui } = state;
  const today = getToday();
  const money = (n) => toDisplayMoney(n, trip, ui.showConverted);
  const isTripDay = today >= trip.startDate && today <= trip.endDate;
  const foodLimit = calculateDailyFoodLimit(state, today);

  let foodSection;
  if (!isTripDay) foodSection = TripStatusNotice(trip, today);
  else if (!foodLimit) foodSection = MissingFoodNotice();
  else foodSection = FoodTodayCard(state, foodLimit, money);

  const dayText = isTripDay
    ? `Día ${getTotalDays({ startDate: trip.startDate, endDate: today })} de ${getTotalDays(trip)} · ${describeDate(today)}`
    : describeDate(today);

  return el('div', {},
    el('p', { className: 'hint' }, dayText),
    foodSection,
    isTripDay && foodLimit?.isOverLimit && OverLimitAlert(),
    BudgetProgress(state, money),
    el('button', { type: 'button', className: 'btn btn-primary spaced', onClick: () => openExpenseForm(trip, null, 'home') }, '+ Registrar gasto'));
}
