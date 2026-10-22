// Prueba del orden de actividades del día (T3.7). Ejecutar con: node --test tests/*.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortDayItems } from '../src/components/ItineraryScreen.js';

test('REQ-010, REQ-042: con hora primero (por hora); sin hora al final, en orden de ingreso', () => {
  const items = [
    { id: 'a', date: '2026-10-17', description: 'Sin hora 1' },
    { id: 'b', date: '2026-10-17', description: 'Almuerzo', time: '13:00' },
    { id: 'c', date: '2026-10-17', description: 'Sin hora 2' },
    { id: 'd', date: '2026-10-17', description: 'Desayuno', time: '09:00' },
    { id: 'e', date: '2026-10-17', description: 'Sin hora 3', time: '' },
  ];
  assert.deepEqual(sortDayItems(items).map((item) => item.id), ['d', 'b', 'a', 'c', 'e']);
});

test('REQ-010: actividades a la misma hora conservan el orden de ingreso', () => {
  const items = [
    { id: 'x', date: '2026-10-17', description: 'Tour', time: '10:00' },
    { id: 'y', date: '2026-10-17', description: 'Café', time: '10:00' },
  ];
  assert.deepEqual(sortDayItems(items).map((item) => item.id), ['x', 'y']);
});
