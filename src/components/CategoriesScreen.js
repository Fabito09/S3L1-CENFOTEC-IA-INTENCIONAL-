// Pantalla Categorías (wireframe 2): repartir el presupuesto total.
// REQ-002, REQ-003, REQ-016, REQ-047

import { el, icon, InputField, CategoryBadge } from './dom.js';
import { getUnassignedAmount, isFoodCategory, toDisplayMoney } from '../budget.js';
import { addCategory, updateCategory, deleteCategory, clearErrors } from '../store.js';

// Colores de la barra: Comida en naranja; el resto alterna tonos de verde (wireframe 2).
const OTHER_COLORS = ['var(--primary)', '#4E8A6E', '#9BC2AC'];

// Borrador del formulario; editingId indica qué categoría se está editando (null = nueva).
let draft = null;

function createDraft(tripId, category = null) {
  return {
    tripId,
    editingId: category?.id ?? null,
    name: category?.name ?? '',
    amount: category ? String(category.amount) : '',
  };
}

// REQ-003: Total / Asignado / Por asignar y la barra de reparto.
function BudgetSummary(state) {
  const { trip, categories, ui } = state;
  const total = trip.globalBudget.total;
  const unassigned = getUnassignedAmount(state);
  const money = (n) => toDisplayMoney(n, trip, ui.showConverted);
  let otherIndex = 0;

  const segments = categories.map((category) => {
    const color = isFoodCategory(category) ? 'var(--accent)' : OTHER_COLORS[otherIndex++ % OTHER_COLORS.length];
    return el('span', { style: `width:${(category.amount / total) * 100}%;background:${color}`, title: category.name });
  });

  return el('div', { className: 'card' },
    el('div', { className: 'summary-grid summary-labels' },
      el('span', {}, 'Total'), el('span', {}, 'Asignado'), el('span', {}, 'Por asignar')),
    el('div', { className: 'summary-grid summary-values' },
      el('span', {}, money(total)),
      el('span', {}, money(total - unassigned)),
      el('span', { className: 'accent-text' }, money(unassigned))),
    el('div', { className: 'bar', role: 'img', 'aria-label': 'Reparto del presupuesto por categoría' }, segments));
}

// REQ-016: la papelera intenta borrar; si tiene gastos, el store lo bloquea e indica cuántos.
function CategoryList(state) {
  const { trip, categories, ui } = state;
  if (categories.length === 0) {
    return el('div', { className: 'card' },
      el('p', { className: 'hint' }, 'Todavía no hay categorías. Creá "Comida" para ver tu límite diario en Inicio.'));
  }

  return el('div', { className: 'card list-card' },
    categories.map((category) => el('div', { className: 'list-item' },
      el('button', {
        type: 'button',
        className: 'list-item-main',
        title: 'Tocar para editar',
        onClick: () => {
          draft = createDraft(trip.id, category);
          clearErrors();
        },
      },
      CategoryBadge(category.name, isFoodCategory(category)),
      el('span', { className: 'grow' }, category.name),
      el('span', { className: 'amount' }, toDisplayMoney(category.amount, trip, ui.showConverted))),
      el('button', {
        type: 'button',
        className: 'trash-button',
        'aria-label': `Eliminar ${category.name}`,
        onClick: () => {
          const errors = deleteCategory(category.id);
          if (Object.keys(errors).length === 0 && draft.editingId === category.id) draft = createDraft(trip.id);
        },
      }, icon('trash', 16)))));
}

function handleSubmit(event, tripId) {
  event.preventDefault();
  const data = { name: draft.name, amount: draft.amount.trim() };
  const errors = draft.editingId ? updateCategory(draft.editingId, data) : addCategory(data);
  if (Object.keys(errors).length === 0) {
    draft = createDraft(tripId);
    clearErrors();
  }
}

function CategoryForm(state) {
  const { trip, ui } = state;
  const isEditing = Boolean(draft.editingId);
  const symbol = trip.currency === 'CRC' ? '₡' : '$';
  const bindInput = (field) => (event) => { draft[field] = event.target.value; };

  return el('form', { className: 'card', noValidate: true, onSubmit: (event) => handleSubmit(event, trip.id) },
    el('h2', { className: 'card-title' }, isEditing ? 'Editar categoría' : 'Nueva categoría'),
    el('div', { className: 'two two-wide-first' },
      InputField({
        id: 'category-name',
        label: 'Nombre',
        value: draft.name,
        error: ui.errors.name,
        onInput: bindInput('name'),
        extra: { placeholder: 'Ej. Entradas' },
      }),
      InputField({
        id: 'category-amount',
        label: `Monto (${symbol})`,
        value: draft.amount,
        error: ui.errors.amount,
        type: 'number',
        onInput: bindInput('amount'),
        extra: { placeholder: '0', inputMode: 'decimal', step: 'any' },
      })),
    el('div', { className: 'form-actions' },
      el('button', { type: 'submit', className: 'btn btn-primary' }, isEditing ? 'Guardar cambios' : '+ Agregar categoría'),
      isEditing && el('button', {
        type: 'button',
        className: 'btn btn-ghost',
        onClick: () => {
          draft = createDraft(trip.id);
          clearErrors();
        },
      }, 'Cancelar')));
}

export function CategoriesScreen(state) {
  const { trip, ui } = state;
  const editedStillExists = !draft?.editingId || state.categories.some((category) => category.id === draft.editingId);
  if (!draft || draft.tripId !== trip.id || !editedStillExists) draft = createDraft(trip.id);

  return el('div', {},
    el('p', { className: 'hint' }, 'Repartí tu presupuesto total'),
    BudgetSummary(state),
    CategoryList(state),
    ui.errors.category && el('div', { className: 'alert-box', role: 'alert' }, `⚠ ${ui.errors.category}`),
    CategoryForm(state));
}
