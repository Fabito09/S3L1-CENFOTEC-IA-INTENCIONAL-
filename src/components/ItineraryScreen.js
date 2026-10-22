// Pantalla Itinerario (wireframe 6): actividades ingresadas a mano, día por día.
// REQ-010, REQ-020, REQ-021, REQ-042, REQ-043
// Nunca genera, sugiere ni completa actividades (REQ-020, REQ-021).

import { el, icon, InputField, formatDate, formatMonth, formatWeekday } from './dom.js';
import { getToday, getTotalDays } from '../budget.js';
import { addItineraryItem, updateItineraryItem, setSelectedDay, setPendingDelete, clearErrors } from '../store.js';

// Borrador del formulario; editingId es null al agregar una actividad nueva.
let draft = null;

function createDraft(tripId, date, item = null) {
  return {
    tripId,
    editingId: item?.id ?? null,
    description: item?.description ?? '',
    date: item?.date ?? date,
    time: item?.time ?? '',
  };
}

// REQ-010, REQ-042: con hora primero (por hora); sin hora al final, en orden de ingreso.
// El arreglo del estado ya está en orden de ingreso y sort es estable.
export function sortDayItems(items) {
  const withTime = items.filter((item) => item.time).sort((a, b) => a.time.localeCompare(b.time));
  const withoutTime = items.filter((item) => !item.time);
  return [...withTime, ...withoutTime];
}

// Todas las fechas del viaje, de inicio a fin.
function getTripDays(trip) {
  const [year, month, day] = trip.startDate.split('-').map(Number);
  return Array.from({ length: getTotalDays(trip) }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1, day + index));
    return date.toISOString().slice(0, 10);
  });
}

// "15 – 19 de octubre, 2026", o con fechas completas si cambia el mes o el año.
function describeRange(trip) {
  const { startDate, endDate } = trip;
  if (startDate.slice(0, 7) !== endDate.slice(0, 7)) return `${formatDate(startDate)} – ${formatDate(endDate)}`;
  return `${Number(startDate.slice(8))} – ${Number(endDate.slice(8))} de ${formatMonth(startDate)}, ${startDate.slice(0, 4)}`;
}

function DaySelector(days, selectedDay) {
  return el('div', { className: 'day-selector', role: 'group', 'aria-label': 'Día del viaje' },
    days.map((date) => el('button', {
      type: 'button',
      className: 'day',
      'aria-pressed': String(date === selectedDay),
      onClick: () => {
        if (!draft.editingId) draft.date = date;
        setSelectedDay(date);
      },
    },
    el('small', {}, formatWeekday(date, 'short')),
    el('strong', {}, Number(date.slice(8))))));
}

function ItineraryList(state, days, selectedDay) {
  const dayItems = sortDayItems(state.itinerary.filter((item) => item.date === selectedDay));
  const dayNumber = days.indexOf(selectedDay) + 1;

  return el('div', { className: 'card' },
    el('h2', { className: 'card-title' }, `Día ${dayNumber} · ${formatWeekday(selectedDay)} ${Number(selectedDay.slice(8))}`),
    dayItems.length === 0
      ? el('p', { className: 'hint spaced-small' }, 'No hay actividades para este día.')
      : dayItems.map((item) => el('div', { className: 'list-item' },
        el('button', {
          type: 'button',
          className: 'list-item-main',
          title: 'Tocar para editar',
          onClick: () => {
            draft = createDraft(state.trip.id, item.date, item);
            clearErrors();
          },
        },
        item.time
          ? el('strong', { className: 'item-time' }, item.time)
          : el('span', { className: 'item-time note' }, 'Sin hora'),
        el('span', { className: item.time ? 'dot' : 'dot dot-empty', 'aria-hidden': 'true' }),
        el('span', { className: 'grow' }, item.description)),
        // REQ-043: eliminar siempre pasa por ConfirmDialog.
        el('button', {
          type: 'button',
          className: 'trash-button',
          'aria-label': `Eliminar actividad ${item.description}`,
          onClick: () => setPendingDelete({ kind: 'itinerary', id: item.id }),
        }, icon('trash', 16)))),
    el('p', { className: 'note' }, 'Tocá una actividad para editarla. Las que no tienen hora van al final.'));
}

function handleSubmit(event, tripId) {
  event.preventDefault();
  const data = { description: draft.description, date: draft.date, time: draft.time };
  const errors = draft.editingId ? updateItineraryItem(draft.editingId, data) : addItineraryItem(data);
  if (Object.keys(errors).length === 0) {
    const savedDate = draft.date;
    draft = createDraft(tripId, savedDate);
    setSelectedDay(savedDate);
  }
}

function ItineraryForm(state, selectedDay) {
  const { trip, ui } = state;
  const isEditing = Boolean(draft.editingId);
  const bindInput = (field) => (event) => { draft[field] = event.target.value; };

  return el('form', { className: 'card', noValidate: true, onSubmit: (event) => handleSubmit(event, trip.id) },
    el('h2', { className: 'card-title' }, isEditing ? 'Editar actividad' : 'Nueva actividad'),
    InputField({
      id: 'itinerary-description',
      label: 'Descripción',
      value: draft.description,
      error: ui.errors.description,
      onInput: bindInput('description'),
      // REQ-020: sin autocompletado del navegador.
      extra: { placeholder: 'Escribí la actividad', autocomplete: 'off' },
    }),
    el('div', { className: 'two' },
      InputField({
        id: 'itinerary-date',
        label: 'Fecha',
        value: draft.date,
        error: ui.errors.date,
        type: 'date',
        onInput: bindInput('date'),
        extra: { min: trip.startDate, max: trip.endDate },
      }),
      InputField({
        id: 'itinerary-time',
        label: 'Hora (opcional)',
        value: draft.time,
        error: ui.errors.time,
        type: 'time',
        onInput: bindInput('time'),
      })),
    el('div', { className: 'form-actions' },
      el('button', { type: 'submit', className: 'btn btn-primary' }, isEditing ? 'Guardar cambios' : '+ Agregar actividad'),
      isEditing && el('button', {
        type: 'button',
        className: 'btn btn-ghost',
        onClick: () => {
          draft = createDraft(trip.id, selectedDay);
          clearErrors();
        },
      }, 'Cancelar')));
}

export function ItineraryScreen(state) {
  const { trip, ui } = state;
  const days = getTripDays(trip);
  const today = getToday();
  const defaultDay = days.includes(today) ? today : days[0];
  const selectedDay = days.includes(ui.selectedDay) ? ui.selectedDay : defaultDay;

  const editedStillExists = !draft?.editingId || state.itinerary.some((item) => item.id === draft.editingId);
  if (!draft || draft.tripId !== trip.id || !editedStillExists) draft = createDraft(trip.id, selectedDay);

  return el('div', {},
    el('p', { className: 'hint' }, describeRange(trip)),
    DaySelector(days, selectedDay),
    ItineraryList(state, days, selectedDay),
    ItineraryForm(state, selectedDay));
}
