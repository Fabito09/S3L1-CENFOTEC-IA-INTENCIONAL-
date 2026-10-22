// Registrar y editar gasto (wireframe 4).
// REQ-005, REQ-006, REQ-011 a REQ-015, REQ-032, REQ-033, REQ-044

import { el, FieldError, InputField, formatDate } from './dom.js';
import { getToday } from '../budget.js';
import { addExpense, updateExpense, setScreen } from '../store.js';

const TYPE_OPTIONS = [
  { value: 'pre-trip', label: 'Previo al viaje' },
  { value: 'on-trip', label: 'Durante el viaje' },
];

// Borrador del formulario; editingId es null al registrar un gasto nuevo.
let draft = null;

function createDraft(trip, expense = null) {
  if (expense) {
    return {
      editingId: expense.id,
      type: expense.type,
      amount: String(expense.amount),
      categoryId: expense.categoryId,
      date: expense.date,
    };
  }
  const today = getToday();
  const todayInTrip = trip && today >= trip.startDate && today <= trip.endDate;
  return { editingId: null, type: 'on-trip', amount: '', categoryId: '', date: todayInTrip ? today : '' };
}

// Abre el formulario vacío o con un gasto cargado para editarlo (lo usa ExpenseList).
export function openExpenseForm(trip, expense = null) {
  draft = createDraft(trip, expense);
  setScreen('expense-form');
}

function closeForm() {
  draft = null;
  setScreen('expenses');
}

// Selector de una opción entre varios botones; actualiza el borrador sin redibujar la pantalla.
function OptionButtons({ options, field, className, label }) {
  const buttons = options.map((option) => el('button', {
    type: 'button',
    'aria-pressed': String(draft[field] === option.value),
    onClick: () => {
      draft[field] = option.value;
      buttons.forEach((button, index) => {
        button.setAttribute('aria-pressed', String(options[index].value === draft[field]));
      });
    },
  }, option.label));
  return el('div', { className, role: 'group', 'aria-label': label }, buttons);
}

// REQ-015: categoría obligatoria.
function CategoryPicker(state) {
  const { categories, ui } = state;
  if (categories.length === 0) {
    return el('div', {},
      el('p', { className: 'hint' }, 'Todavía no hay categorías.'),
      el('button', { type: 'button', className: 'btn btn-ghost spaced', onClick: () => setScreen('categories') }, 'Crear categorías'));
  }
  return el('div', {},
    OptionButtons({
      options: categories.map((category) => ({ value: category.id, label: category.name })),
      field: 'categoryId',
      className: 'chip-grid',
      label: 'Categoría',
    }),
    FieldError(ui.errors.categoryId));
}

function handleSubmit(event) {
  event.preventDefault();
  const data = { type: draft.type, amount: draft.amount.trim(), categoryId: draft.categoryId, date: draft.date };
  const errors = draft.editingId ? updateExpense(draft.editingId, data) : addExpense(data);
  if (Object.keys(errors).length === 0) closeForm();
}

export function ExpenseForm(state) {
  const { trip, ui } = state;
  if (!draft) draft = createDraft(trip);
  const isEditing = Boolean(draft.editingId);
  const symbol = trip.currency === 'CRC' ? '₡' : '$';
  const bindInput = (field) => (event) => { draft[field] = event.target.value; };

  return el('form', { noValidate: true, onSubmit: handleSubmit },
    el('header', { className: 'form-header' },
      el('button', { type: 'button', className: 'back-button', 'aria-label': 'Volver a gastos', onClick: closeForm }, '‹'),
      el('div', {},
        el('h1', { className: 'title title-small' }, isEditing ? 'Editar gasto' : 'Registrar gasto'),
        el('p', { className: 'hint' }, 'Previo al viaje o durante el viaje'))),
    // REQ-005, REQ-006: el tipo define qué fechas son válidas.
    OptionButtons({ options: TYPE_OPTIONS, field: 'type', className: 'pill-toggle spaced', label: 'Tipo de gasto' }),
    FieldError(ui.errors.type),
    el('div', { className: 'card' },
      ui.errors.general && el('div', { className: 'alert-box' }, ui.errors.general),
      InputField({
        id: 'expense-amount',
        label: `Monto (en ${symbol}, moneda del viaje)`,
        value: draft.amount,
        error: ui.errors.amount,
        type: 'number',
        onInput: bindInput('amount'),
        extra: { className: ui.errors.amount ? 'input input-big error' : 'input input-big', placeholder: `${symbol} 0`, inputMode: 'decimal', step: 'any' },
      }),
      el('span', { className: 'field-label' }, 'Categoría'),
      CategoryPicker(state),
      InputField({
        id: 'expense-date',
        label: 'Fecha',
        value: draft.date,
        error: ui.errors.date,
        type: 'date',
        onInput: bindInput('date'),
      }),
      // REQ-014, REQ-044: rango válido según el tipo.
      el('p', { className: 'note' },
        `Durante: entre el ${formatDate(trip.startDate)} y el ${formatDate(trip.endDate)} · Previo: antes del ${formatDate(trip.startDate)}`)),
    el('div', { className: 'two two-wide-last spaced' },
      el('button', { type: 'button', className: 'btn btn-ghost', onClick: closeForm }, 'Cancelar'),
      el('button', { type: 'submit', className: 'btn btn-primary' }, isEditing ? 'Guardar cambios' : 'Guardar gasto')));
}
