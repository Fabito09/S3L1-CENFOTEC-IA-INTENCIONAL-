// Recordatorio diario (design.md §5). Sin Service Worker: solo funciona con la app abierta.

import { calculateDailyFoodLimit, formatMoney, getToday } from './budget.js';
import { getState } from './store.js';

const LAST_REMINDER_KEY = 'nomadpulse.lastReminder';
const NOTIFICATION_HOUR = 8;

let notificationTimer = null;

function isTripDay(trip, today) {
  return Boolean(trip) && today >= trip.startDate && today <= trip.endDate;
}

// REQ-008: true solo en la primera apertura del día dentro del viaje.
// Al devolver true deja registrado el día, así no vuelve a salir hasta mañana.
export function shouldShowReminder(today, trip) {
  if (!isTripDay(trip, today)) return false;
  try {
    if (localStorage.getItem(LAST_REMINDER_KEY) === today) return false;
    localStorage.setItem(LAST_REMINDER_KEY, today);
  } catch {
    return false;
  }
  return true;
}

function millisecondsUntilNextNotification(now = new Date()) {
  const next = new Date(now);
  next.setHours(NOTIFICATION_HOUR, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next - now;
}

// REQ-009: avisa el disponible de hoy calculado según REQ-034.
function notifyAvailableToday() {
  const state = getState();
  const today = getToday();
  const foodLimit = calculateDailyFoodLimit(state, today);
  if (!isTripDay(state.trip, today) || !foodLimit) return;

  const amount = formatMoney(foodLimit.availableToday, state.trip.currency);
  new Notification('NomadPulse', { body: `Hoy tenés ${amount} para comida.` });
}

// REQ-009: programa la notificación de las 08:00 (hora local) mientras la app esté abierta
// y el usuario haya concedido el permiso. Se reprograma sola para el día siguiente.
export function scheduleMorningNotification() {
  if (!('Notification' in globalThis) || Notification.permission !== 'granted') return;
  clearTimeout(notificationTimer);
  notificationTimer = setTimeout(() => {
    notifyAvailableToday();
    scheduleMorningNotification();
  }, millisecondsUntilNextNotification());
}
