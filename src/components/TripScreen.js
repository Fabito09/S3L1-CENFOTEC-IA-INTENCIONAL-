// Pantalla Viaje (wireframe 1): crear y editar el viaje.
// REQ-001, REQ-013, REQ-024 a REQ-028, REQ-045, REQ-046, REQ-048

import { el, FieldError, formatDate } from './dom.js';
import { getTotalDays } from '../budget.js';
import { createTrip, updateTrip, setPendingDelete, setScreen, clearErrors } from '../store.js';

const CURRENCY_OPTIONS = [
  { value: 'CRC', label: '₡ Colones' },
  { value: 'USD', label: '$ Dólares' },
];

// Borrador del formulario: sobrevive a los re-render (por ejemplo, al mostrar un error).
// Se vuelve a armar desde el estado cuando cambia el viaje guardado o después de guardar.
let draft = null;
let savedMessage = '';

function createDraft(trip) {
  return {
    tripId: trip?.id ?? null,
    name: trip?.name ?? '',
    startDate: trip?.startDate ?? '',
    endDate: trip?.endDate ?? '',
    currency: trip?.currency ?? 'CRC',
    total: trip ? String(trip.globalBudget.total) : '',
    exchangeRate: trip?.exchangeRate ? String(trip.exchangeRate) : '',
  };
}

// REQ-001, REQ-026: Días Totales en vivo; "—" mientras las fechas no sean válidas.
function describeTotalDays() {
  if (!draft.startDate || !draft.endDate || draft.endDate < draft.startDate) return '—';
  return String(getTotalDays(draft));
}

function TextField({ label, field, errors, errorKey = field, type = 'text', extra = {}, onInput }) {
  const message = errors[errorKey];
  return el('div', {},
    el('label', { className: 'field-label', htmlFor: `trip-${field}` }, label),
    el('input', {
      id: `trip-${field}`,
      className: message ? 'input error' : 'input',
      type,
      value: draft[field],
      onInput: (event) => {
        draft[field] = event.target.value;
        if (onInput) onInput();
      },
      ...extra,
    }),
    FieldError(message));
}

// REQ-045, REQ-046: la moneda se elige solo al crear; al editar se muestra como solo lectura.
function CurrencyPicker(isEditing, errors) {
  const buttons = CURRENCY_OPTIONS.map((option) => el('button', {
    type: 'button',
    disabled: isEditing,
    'aria-pressed': String(draft.currency === option.value),
    onClick: () => {
      draft.currency = option.value;
      buttons.forEach((button, index) => {
        button.setAttribute('aria-pressed', String(CURRENCY_OPTIONS[index].value === draft.currency));
      });
    },
  }, option.label));

  return el('div', {},
    el('span', { className: 'field-label' }, 'Moneda del viaje'),
    el('div', { className: isEditing ? 'pill-toggle readonly' : 'pill-toggle', role: 'group', 'aria-label': 'Moneda del viaje' }, buttons),
    el('p', { className: 'note' }, 'Se elige al crear el viaje y no se puede cambiar después.'),
    FieldError(errors.currency));
}

// REQ-025: registros que bloquean el cambio de fechas.
function AffectedRecords(state, affected) {
  const categoryName = (id) => state.categories.find((category) => category.id === id)?.name ?? '';
  const items = [
    ...affected.expenses.map((expense) => `Gasto ${expense.type === 'pre-trip' ? 'previo' : 'durante'} · ${categoryName(expense.categoryId)} · ${formatDate(expense.date)}`),
    ...affected.itinerary.map((item) => `Actividad · ${item.description} · ${formatDate(item.date)}`),
  ];
  return el('ul', { className: 'affected-list' }, items.map((text) => el('li', {}, text)));
}

function handleSubmit(event, isEditing) {
  event.preventDefault();
  const data = {
    name: draft.name,
    startDate: draft.startDate,
    endDate: draft.endDate,
    exchangeRate: draft.exchangeRate.trim(),
    globalBudget: { total: draft.total.trim() },
  };

  if (isEditing) {
    const errors = updateTrip(data);
    if (Object.keys(errors).length === 0) {
      draft = null;
      savedMessage = 'Cambios guardados.';
      clearErrors();
    }
    return;
  }

  const errors = createTrip({ ...data, currency: draft.currency });
  if (Object.keys(errors).length === 0) setScreen('categories');
}

export function TripScreen(state) {
  const { trip, ui } = state;
  const { errors } = ui;
  if (!draft || draft.tripId !== (trip?.id ?? null)) draft = createDraft(trip);
  const isEditing = Boolean(trip);
  // El aviso de guardado se muestra en un solo render.
  const statusMessage = savedMessage;
  savedMessage = '';

  const totalDaysValue = el('div', { className: 'days-value' }, describeTotalDays());
  const updateTotalDays = () => { totalDaysValue.textContent = describeTotalDays(); };

  return el('div', {},
    el('p', { className: 'hint' }, isEditing ? 'Editá los datos de tu viaje' : 'Creá tu viaje para empezar'),
    el('form', { className: 'card', noValidate: true, onSubmit: (event) => handleSubmit(event, isEditing) },
      errors.general && el('div', { className: 'alert-box' }, errors.general),
      TextField({ label: 'Nombre del viaje', field: 'name', errors, extra: { placeholder: 'Ej. Viaje de octubre' } }),
      el('div', { className: 'two' },
        TextField({ label: 'Fecha de inicio', field: 'startDate', errors, type: 'date', onInput: updateTotalDays }),
        TextField({ label: 'Fecha de fin', field: 'endDate', errors, type: 'date', onInput: updateTotalDays })),
      errors.dates && el('div', { className: 'alert-box' },
        el('p', {}, `⚠ ${errors.dates}`),
        AffectedRecords(state, errors.affectedRecords)),
      CurrencyPicker(isEditing, errors),
      el('div', { className: 'two' },
        TextField({ label: 'Presupuesto total', field: 'total', errors, type: 'number', extra: { inputMode: 'decimal', step: 'any' } }),
        TextField({ label: 'Tipo de cambio (₡ por $1)', field: 'exchangeRate', errors, type: 'number', extra: { inputMode: 'decimal', step: 'any', placeholder: 'Opcional' } })),
      el('p', { className: 'note' }, 'El tipo de cambio es opcional y solo sirve para ver los montos convertidos con el botón ₡ ⇄ $.'),
      el('div', { className: 'days-box row' },
        el('div', {},
          el('div', { className: 'days-label' }, 'Días totales'),
          el('p', { className: 'note' }, 'Se calculan con las fechas')),
        totalDaysValue),
      el('div', { className: 'form-actions' },
        el('button', { type: 'submit', className: 'btn btn-primary' }, isEditing ? 'Guardar cambios' : 'Guardar viaje'),
        statusMessage && el('p', { className: 'success-text', role: 'status' }, statusMessage),
        isEditing && el('button', {
          type: 'button',
          className: 'btn btn-danger',
          onClick: () => setPendingDelete({ kind: 'trip' }),
        }, 'Eliminar viaje'))));
}
