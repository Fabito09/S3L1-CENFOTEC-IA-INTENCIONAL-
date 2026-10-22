// Lista de gastos (wireframe 5): filtro, total gastado, editar y eliminar con confirmación.
// REQ-029, REQ-030, REQ-047

import { el, icon, CategoryBadge, formatDate } from './dom.js';
import { getGlobalBudget, isFoodCategory, toDisplayMoney } from '../budget.js';
import { setExpenseFilter, setPendingDelete } from '../store.js';
import { openExpenseForm } from './ExpenseForm.js';

const FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'pre-trip', label: 'Previos' },
  { value: 'on-trip', label: 'Durante' },
];

const SECTIONS = [
  { type: 'pre-trip', title: 'Previos al viaje', empty: 'No hay gastos previos.' },
  { type: 'on-trip', title: 'Durante el viaje', empty: 'No hay gastos durante el viaje.' },
];

function ExpenseFilter(currentFilter) {
  return el('div', { className: 'pill-toggle spaced', role: 'group', 'aria-label': 'Filtrar gastos' },
    FILTER_OPTIONS.map((option) => el('button', {
      type: 'button',
      'aria-pressed': String(currentFilter === option.value),
      onClick: () => setExpenseFilter(option.value),
    }, option.label)));
}

function ExpenseItem(state, expense) {
  const { trip, categories, ui } = state;
  const category = categories.find((candidate) => candidate.id === expense.categoryId);
  const name = category?.name ?? 'Sin categoría';

  return el('div', { className: 'list-item' },
    el('button', {
      type: 'button',
      className: 'list-item-main',
      title: 'Tocar para editar',
      onClick: () => openExpenseForm(trip, expense),
    },
    CategoryBadge(name, Boolean(category) && isFoodCategory(category)),
    el('span', { className: 'grow' },
      name,
      el('span', { className: 'note block' }, formatDate(expense.date))),
    el('span', { className: 'amount' }, toDisplayMoney(expense.amount, trip, ui.showConverted))),
    // REQ-029: eliminar siempre pasa por ConfirmDialog.
    el('button', {
      type: 'button',
      className: 'trash-button',
      'aria-label': `Eliminar gasto de ${name} del ${formatDate(expense.date)}`,
      onClick: () => setPendingDelete({ kind: 'expense', id: expense.id }),
    }, icon('trash', 16)));
}

function ExpenseSection(state, section) {
  // Más recientes primero.
  const expenses = state.expenses
    .filter((expense) => expense.type === section.type)
    .sort((a, b) => b.date.localeCompare(a.date));

  return el('section', {},
    el('h2', { className: 'section-title' }, section.title),
    expenses.length === 0
      ? el('p', { className: 'hint' }, section.empty)
      : el('div', { className: 'card list-card section-card' }, expenses.map((expense) => ExpenseItem(state, expense))));
}

export function ExpenseList(state) {
  const { trip, ui } = state;
  const filter = ui.expenseFilter;
  const money = (n) => toDisplayMoney(n, trip, ui.showConverted);
  // REQ-030: gastado y disponible se calculan; al eliminar un gasto su monto vuelve al disponible.
  const budget = getGlobalBudget(state);
  const visibleSections = SECTIONS.filter((section) => filter === 'all' || filter === section.type);

  return el('div', {},
    el('div', { className: 'row' },
      el('span', { className: 'hint' }, 'Total gastado'),
      el('span', { className: 'total-amount' }, money(budget.spent))),
    el('div', { className: 'row' },
      el('span', { className: 'hint' }, 'Disponible del presupuesto'),
      el('span', { className: budget.available < 0 ? 'amount alert-text' : 'amount' }, money(budget.available))),
    el('button', { type: 'button', className: 'btn btn-primary spaced', onClick: () => openExpenseForm(trip) }, '+ Registrar gasto'),
    ExpenseFilter(filter),
    state.expenses.length === 0
      ? el('div', { className: 'card' }, el('p', { className: 'hint' }, 'Todavía no registraste gastos.'))
      : visibleSections.map((section) => ExpenseSection(state, section)));
}
