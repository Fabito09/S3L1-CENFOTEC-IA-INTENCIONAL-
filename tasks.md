# tasks.md: Plan de implementación de NomadPulse

**Insumos:** `docs/requirements.md` (v2.1), `docs/design.md` (v1.3), `docs/data-contract.json`, `docs/wireframe.png`, `CLAUDE.md`.
**Orden:** de adentro hacia afuera. Primero la lógica pura (cálculos y validaciones), después el estado y el guardado, al final las pantallas.

## Reglas de ejecución

1. **Una tarea a la vez**, en el orden de este archivo. Al terminar, marcarla con `[x]` y detenerse para revisar el diff.
2. **Hecho cuando:** cada tarea termina solo si se cumple su criterio de verificación.
3. **Unchanged Behavior:** al corregir un error o ajustar la interfaz, no tocar la lógica de las tareas ya terminadas (sobre todo `budget.js` y `validation.js`), salvo que la tarea lo pida. Al terminar, decir qué se mantuvo intacto.
4. **Trazabilidad:** cada función o componente lleva un comentario con su `REQ-XXX`.
5. Si algo no está en `requirements.md`, preguntar antes de decidir.

---

## Fase 0: Base del proyecto

- [x] **T0.1 Estructura y arranque**
  - **Archivos:** `src/index.html`, `src/styles.css`, `src/main.js` (vacío por ahora).
  - **Qué:** HTML con `<div id="app">` y `<script type="module" src="main.js">`. CSS base con la paleta "Tropical Costa Rica" de `design.md` §3.1 (variables `--bg`, `--primary`, `--accent`, `--alert`…), tarjetas redondeadas, botones tipo píldora y formato móvil.
  - **Hecho cuando:** `npx serve src` abre la página en el navegador sin errores en la consola.

## Fase 1: Lógica de negocio pura (sin interfaz)

- [x] **T1.1 Cálculos de presupuesto: `src/budget.js`**
  - **Funciones:** `getToday`, `getTotalDays`, `isFoodCategory`, `getFoodBudget`, `getDailySpent`, **`calculateDailyFoodLimit`**, `getGlobalBudget`, `getUnassignedAmount`, `formatMoney`, `toDisplayMoney`.
  - **REQ:** 001, 003, 004, 005, 006, 026, 027, 030, 034–037, 041, 045, 047.
  - **Hecho cuando:** pasa `tests/budget.test.js` (T1.3).

- [x] **T1.2 Validaciones: `src/validation.js`**
  - **Funciones:** **`validateAmount`**, `validateRequired`, `validateTrip`, `validateCategory`, `validateExpense`, `validateItineraryItem`, `findRecordsOutsideRange`.
  - **REQ:** 001, 002, 003, 010–015, 024, 025, 042, 044, 048.
  - **Hecho cuando:** pasa `tests/validation.test.js` (T1.3).

- [x] **T1.3 Pruebas de las reglas críticas: `tests/`**
  - **Archivos:** `tests/budget.test.js`, `tests/validation.test.js`. Usan el runner que trae Node (`node --test`), sin librerías.
  - **Casos mínimos:**
    - Comida: presupuesto ₡50 000, 5 días y ₡7 000 gastados hoy dan disponible ₡3 000; con ₡12 000 gastados da −₡2 000 y `isOverLimit = true`.
    - Sin arrastre: lo no gastado ayer no suma hoy (REQ-035).
    - Los gastos `pre-trip` no cuentan en el Acumulado del Día (REQ-036).
    - Montos `-5`, `0`, `"abc"` y `""` se rechazan (REQ-011, REQ-012).
    - Gasto previo con fecha igual o posterior al inicio se rechaza (REQ-044).
    - "comida" y " COMIDA " se reconocen como la categoría Comida (REQ-002, REQ-041).
    - `toDisplayMoney`: ₡5 000 con tipo de cambio 500 se muestra como $10 (REQ-047).
  - **Hecho cuando:** `node --test tests/*.test.js` termina en verde.

## Fase 2: Estado y persistencia

- [x] **T2.1 Guardado: `src/storage.js`**
  - **Funciones:** `saveState`, `loadState` (clave `nomadpulse.state`). Si los datos están dañados, devuelve un error y **no** sobrescribe.
  - **REQ:** 017, 018, 019, 022.
  - **Hecho cuando:** guardar, recargar con F5 y cargar devuelve el mismo estado; con un JSON dañado en LocalStorage, los datos originales siguen ahí.

- [x] **T2.2 Estado global y acciones: `src/store.js`**
  - **Funciones:** `getState`, `subscribe` y las acciones `createTrip`, `updateTrip`, `deleteTrip`, `addCategory`, `updateCategory`, `deleteCategory`, `addExpense`, `updateExpense`, `deleteExpense`, `addItineraryItem`, `updateItineraryItem`, `deleteItineraryItem`, más las acciones de `ui` (pantalla actual, día seleccionado, filtro, `showConverted`).
  - **Regla de cada acción:** validar → modificar → `saveState()` → avisar a los suscriptores.
  - **Reglas especiales:** `addExpense` y `updateExpense` no bloquean por presupuesto (REQ-023); `deleteCategory` se bloquea si hay gastos (REQ-016); `updateTrip` nunca cambia `currency` (REQ-046); `deleteTrip` borra en cascada (REQ-028).
  - **REQ:** 016, 017, 023, 025, 027, 028, 030, 032, 033, 046.
  - **Hecho cuando:** desde la consola del navegador se puede crear un viaje, una categoría y un gasto, y recargar sin perder nada.

- [x] **T2.3 Arranque: `src/main.js`**
  - **Qué:** `loadState` → `subscribe(render)` → primer render.
  - **Hecho cuando:** la app arranca con los datos guardados (o vacía si es la primera vez).

## Fase 3: Pantallas (en el orden del flujo del usuario)

- [x] **T3.1 Estructura común: `components/App.js`, `components/ConfirmDialog.js`**
  - **Qué:** `App` con `BottomNav` (Inicio, Gastos, Itinerario, Categorías, Viaje) y `CurrencyToggle`. `ConfirmDialog` reutilizable. Mensaje de datos dañados con opción "Empezar de cero".
  - **REQ:** 019, 047.
  - **Hecho cuando:** se navega entre las 5 pestañas, y el botón ₡ ⇄ $ muestra el aviso si no hay tipo de cambio.

- [ ] **T3.2 Pantalla Viaje: `components/TripScreen.js`** (wireframe 1)
  - **Qué:** crear y editar el viaje; `CurrencyPicker` (solo lectura al editar); campo "Tipo de cambio (₡ por $1)"; Días Totales calculados; lista de registros afectados al cambiar fechas; eliminar con confirmación.
  - **REQ:** 001, 013, 024–028, 045, 046, 048.
  - **Hecho cuando:** fin antes de inicio muestra el error del wireframe; al editar, la moneda no se puede cambiar.

- [ ] **T3.3 Pantalla Categorías: `components/CategoriesScreen.js`** (wireframe 2)
  - **Qué:** resumen Total / Asignado / Por asignar, lista y formulario de nueva categoría.
  - **REQ:** 002, 003, 016.
  - **Hecho cuando:** no deja asignar más que el total, y no deja borrar una categoría con gastos (muestra cuántos tiene).

- [ ] **T3.4 Registrar y editar gasto: `components/ExpenseForm.js`** (wireframe 4)
  - **Qué:** selector Previo / Durante, monto, categoría y fecha (con el rango válido debajo).
  - **REQ:** 005, 006, 011–015, 032, 033, 044.
  - **Hecho cuando:** un monto negativo o en cero muestra "El monto debe ser mayor a cero" y no se guarda.

- [ ] **T3.5 Lista de gastos: `components/ExpenseList.js`** (wireframe 5)
  - **Qué:** filtro Todos / Previos / Durante, total gastado, eliminar con confirmación y tocar un gasto para editarlo.
  - **REQ:** 029, 030.
  - **Hecho cuando:** al eliminar un gasto, el monto vuelve al disponible.

- [ ] **T3.6 Pantalla Inicio: `components/HomeScreen.js`** (wireframe 3)
  - **Qué:** `FoodTodayCard` (disponible, acumulado y límite), `OverLimitAlert` solo si el disponible es negativo, `BudgetProgress` del viaje, y los mensajes de "viaje no iniciado / finalizado" y "creá la categoría Comida".
  - **REQ:** 007, 031, 034–041.
  - **Hecho cuando:** al registrar un gasto de Comida hoy, el disponible se recalcula al volver a Inicio.

- [ ] **T3.7 Pantalla Itinerario: `components/ItineraryScreen.js`** (wireframe 6)
  - **Qué:** `DaySelector`, lista del día ordenada con `sortDayItems`, agregar, editar (tocar la actividad) y eliminar con confirmación. Sin sugerencias de ningún tipo.
  - **REQ:** 010, 020, 021, 042, 043.
  - **Hecho cuando:** las actividades sin hora aparecen al final del día, en orden de ingreso.

## Fase 4: Recordatorio diario

- [ ] **T4.1 Recordatorio: `src/reminder.js` y `ReminderBanner` en Inicio**
  - **Funciones:** `shouldShowReminder` (clave `nomadpulse.lastReminder`), `scheduleMorningNotification` (08:00, solo con la app abierta y con permiso; sin Service Worker).
  - **REQ:** 008, 009.
  - **Hecho cuando:** el banner aparece la primera vez que se abre la app en un día del viaje y no vuelve a salir ese mismo día.

## Fase 5: Verificación con el cliente y cierre

- [ ] **T5.1 Prueba de estrés del negocio** (las 3 que hará el profesor)
  1. **Persistencia:** crear datos, presionar F5 y comprobar que no se pierde nada.
  2. **Restricción semántica:** intentar registrar un gasto de `-500` y comprobar que se rechaza.
  3. **Lógica dinámica:** registrar un gasto de Comida hoy y comprobar que el disponible se recalcula con `(Total Comida / Días Totales) − Acumulado del Día`.
  - **Hecho cuando:** las 3 pasan y además `node --test tests/*.test.js` está en verde.

- [ ] **T5.2 Documentación de cierre**
  - **Archivos:** `README.md` (agregar cómo ejecutar la app y las pruebas) y `docs/retrospectiva.md` (las 3 preguntas de la guía S3L2).
  - **Hecho cuando:** la estructura del repo coincide con la que pide la guía S3L2.
