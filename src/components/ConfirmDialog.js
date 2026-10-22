// Diálogo de confirmación reutilizable (wireframe 5): hoja inferior sobre un fondo oscuro.
// REQ-019, REQ-028, REQ-029, REQ-043: nada se borra ni se sobrescribe sin confirmar.

import { el, icon } from './dom.js';

export function ConfirmDialog({ title, message, confirmLabel = 'Eliminar', onConfirm, onCancel }) {
  return el('div', { className: 'dialog-layer' },
    el('div', { className: 'overlay', onClick: onCancel }),
    el('div', { className: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      el('div', { className: 'sheet-handle' }),
      el('div', { className: 'icon-box icon-box-alert' }, icon('trash', 18)),
      el('h2', { className: 'sheet-title' }, title),
      el('p', { className: 'hint' }, message),
      el('div', { className: 'button-pair' },
        el('button', { type: 'button', className: 'btn btn-ghost', onClick: onCancel }, 'Cancelar'),
        el('button', { type: 'button', className: 'btn btn-solid-danger', onClick: onConfirm }, confirmLabel))));
}
