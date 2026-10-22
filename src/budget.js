// Cálculos de presupuesto y comida (design.md §5).
// Funciones puras: reciben el estado y devuelven valores calculados; no guardan nada.

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const CURRENCY_SYMBOLS = { CRC: '₡', USD: '$' };

// Glosario "Hoy": fecha local del dispositivo en formato YYYY-MM-DD (no UTC).
export function getToday(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// REQ-001, REQ-026: Días Totales = (fin − inicio) + 1.
// Las fechas se leen en UTC para que un cambio de horario no altere la cuenta.
export function getTotalDays(trip) {
  const [startYear, startMonth, startDay] = trip.startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = trip.endDate.split('-').map(Number);
  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);
  return Math.round((end - start) / MS_PER_DAY) + 1;
}

// REQ-004, REQ-041: la categoría Comida se reconoce sin distinguir mayúsculas ni espacios.
export function isFoodCategory(category) {
  return category.name.trim().toLowerCase() === 'comida';
}

// REQ-004: Presupuesto Total Comida. Devuelve null si no existe la categoría Comida.
export function getFoodBudget(categories) {
  const food = categories.find(isFoodCategory);
  return food ? food.amount : null;
}

// REQ-035, REQ-036: Acumulado del Día = gastos on-trip de Comida con fecha de hoy.
export function getDailySpent(state, today) {
  const food = state.categories.find(isFoodCategory);
  if (!food) return 0;
  return state.expenses
    .filter((expense) => expense.type === 'on-trip'
      && expense.categoryId === food.id
      && expense.date === today)
    .reduce((sum, expense) => sum + expense.amount, 0);
}

// REQ-004, REQ-007, REQ-031, REQ-034 a REQ-037: DailyFoodLimit.
// availableToday = (foodBudget / totalDays) − dailySpent, sin arrastre entre días.
// Devuelve null si no hay viaje o no existe la categoría Comida (REQ-041).
export function calculateDailyFoodLimit(state, today) {
  if (!state.trip) return null;
  const foodBudget = getFoodBudget(state.categories);
  if (foodBudget === null) return null;

  const limit = foodBudget / getTotalDays(state.trip);
  const dailySpent = getDailySpent(state, today);
  const availableToday = limit - dailySpent;
  return { limit, dailySpent, availableToday, isOverLimit: availableToday < 0 };
}

// REQ-005, REQ-006, REQ-030: GlobalBudget. Todo gasto (previo o durante) resta del total.
// Devuelve null si aún no hay viaje.
export function getGlobalBudget(state) {
  if (!state.trip) return null;
  const total = state.trip.globalBudget.total;
  const spent = state.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  return { total, spent, available: total - spent, percentUsed: (spent / total) * 100 };
}

// REQ-003, REQ-027: monto del presupuesto total que falta asignar a categorías.
// Devuelve null si aún no hay viaje.
export function getUnassignedAmount(state) {
  if (!state.trip) return null;
  const assigned = state.categories.reduce((sum, category) => sum + category.amount, 0);
  return state.trip.globalBudget.total - assigned;
}

// REQ-037, REQ-045: redondea a 2 decimales solo al mostrar y antepone ₡ o $.
// Formato del wireframe: miles con espacio, decimales con coma solo si hay centavos
// y signo "−" antes del símbolo (ej. "−₡2 000", "$10", "₡1 250,50").
export function formatMoney(n, currency) {
  const rounded = Math.round(Math.abs(n) * 100) / 100;
  const [integerPart, decimalPart] = rounded.toFixed(2).split('.');
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const decimals = decimalPart === '00' ? '' : `,${decimalPart}`;
  const sign = n < 0 && rounded !== 0 ? '−' : '';
  return `${sign}${CURRENCY_SYMBOLS[currency]}${grouped}${decimals}`;
}

// REQ-047: vista convertida. Solo cambia lo que se muestra; el monto guardado no se toca.
// ₡ → $: ÷ exchangeRate; $ → ₡: × exchangeRate. Sin tipo de cambio se muestra en la moneda del viaje.
export function toDisplayMoney(n, trip, showConverted) {
  if (!showConverted || !trip.exchangeRate) return formatMoney(n, trip.currency);
  return trip.currency === 'CRC'
    ? formatMoney(n / trip.exchangeRate, 'USD')
    : formatMoney(n * trip.exchangeRate, 'CRC');
}
