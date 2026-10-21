# Diseño Técnico: NomadPulse Travel Assistant

**Versión:** 1.1 (Paso 3, auditada)
**Insumos:** `requirements.md`, `data-contract.json`, `wireframe.png`, `CLAUDE.md`

---

## 1. Decisiones de arquitectura

- **Tecnología:** SPA en HTML, CSS y JavaScript (módulos ES). Sin frameworks ni compilación.
- **Estado:** un único objeto global `state`: datos según `data-contract.json` + `ui` (no se guarda).
- **Persistencia:** solo LocalStorage. Sin red (REQ-022).
- **Flujo unidireccional:** UI → acción → validación → estado → guardado → render.
- **Derivados:** `totalDays`, `GlobalBudget` y `DailyFoodLimit` se calculan en cada render; no se guardan.

---

## 2. Estructura de módulos

```
src/
├── index.html
├── styles.css
├── main.js           # Arranque: loadState, subscribe(render), recordatorio
├── store.js          # Estado global, acciones y subscribe
├── storage.js        # loadState / saveState
├── validation.js     # Reglas de validación
├── budget.js         # Cálculos de presupuesto y comida
├── reminder.js       # Recordatorio diario y notificación
└── components/
    ├── App.js        # Shell + BottomNav
    ├── TripScreen.js
    ├── CategoriesScreen.js
    ├── HomeScreen.js
    ├── ExpenseForm.js
    ├── ExpenseList.js
    ├── ItineraryScreen.js
    └── ConfirmDialog.js
```

Los subcomponentes (`FoodTodayCard`, `DaySelector`, etc.) son funciones dentro del archivo de su pantalla.

---

## 3. Componentes de la interfaz (según `wireframe.png`)

| Pantalla | Componente | Subcomponentes |
|---|---|---|
| Todas | `App` | `BottomNav` |
| 1. Viaje | `TripScreen` | `FieldError`, `ConfirmDialog` |
| 2. Categorías | `CategoriesScreen` | `BudgetSummary`, `CategoryList`, `CategoryForm` |
| 3. Inicio | `HomeScreen` | `ReminderBanner`, `FoodTodayCard`, `OverLimitAlert`, `BudgetProgress` |
| 4. Registrar gasto | `ExpenseForm` | `ExpenseTypeToggle`, `CategoryPicker`, `FieldError` |
| 5. Lista de gastos | `ExpenseList` | `ExpenseFilter`, `ConfirmDialog` |
| 6. Itinerario | `ItineraryScreen` | `DaySelector`, `ItineraryList`, `ItineraryForm` |

---

## 4. Manejo de estado

| Dato | Dónde vive | Motivo |
|---|---|---|
| `trip`, `categories`, `expenses`, `itinerary` | Estado + LocalStorage (`nomadpulse.state`) | Datos del usuario. |
| Fecha del último recordatorio | LocalStorage (`nomadpulse.lastReminder`) | Recordatorio una vez al día. |
| `ui`: `currentScreen`, `selectedDay`, `expenseFilter`, `errors`, `pendingDelete` | Solo estado | Estado de interfaz. |
| `totalDays`, `GlobalBudget`, `DailyFoodLimit` | Se calculan | Evitar datos desactualizados. |

**`store.js`:** `getState()`, `subscribe(fn)` y acciones. Cada acción: validar → modificar → `saveState()` → avisar a los suscriptores.

---

## 5. Funciones clave

| Módulo | Función | Qué hace | REQ |
|---|---|---|---|
| `budget.js` | `getTotalDays(trip)` | (fin − inicio) + 1 | 001, 026 |
| | `getFoodBudget(categories)` | Monto de la categoría Comida | 004 |
| | `getDailySpent(state, today)` | Suma gastos `on-trip` de Comida de hoy | 035, 036 |
| | **`calculateDailyFoodLimit(state, today)`** | Devuelve `{ limit, dailySpent, availableToday, isOverLimit }` con `availableToday = (foodBudget / totalDays) − dailySpent` | 004, 007, 031, 034–037 |
| | `getGlobalBudget(state)` | `{ total, spent, available, percentUsed }` | 005, 006, 030 |
| | `getUnassignedAmount(state)` | Total − suma de categorías | 003, 027 |
| | `formatMoney(n)` | Redondea a 2 decimales solo al mostrar | 037 |
| `validation.js` | **`validateAmount(value)`** | Rechaza montos ≤ 0 o no numéricos | 011 |
| | `validateRequired(value)` | Rechaza campos vacíos | 012, 015 |
| | `validateTrip(data)` | Campos + fin ≥ inicio | 001, 013, 024 |
| | `validateCategory(data, state)` | Nombre único + no exceder total | 002, 003 |
| | `validateExpense(data, state)` | Monto, categoría, fecha en rango | 011–015 |
| | `validateItineraryItem(data, trip)` | Descripción + fecha en rango | 010, 042 |
| | `findRecordsOutsideRange(state, start, end)` | Lista gastos/actividades fuera del nuevo rango | 025 |
| `storage.js` | `saveState(state)` | Guarda tras cada cambio | 017 |
| | `loadState()` | Carga al iniciar; si está dañado, avisa y no sobrescribe | 018, 019 |
| `reminder.js` | `shouldShowReminder(today)` | Primera apertura del día dentro del viaje | 008 |
| | `scheduleMorningNotification()` | Notificación a las 08:00 solo con la app abierta y permiso concedido. Sin Service Worker. | 009 |

**Reglas de acciones en `store.js`:**
- `addExpense` / `updateExpense` nunca revisan el presupuesto: exceder solo alerta. (REQ-023)
- `deleteCategory` se bloquea si la categoría tiene gastos. (REQ-016)
- `updateTrip` usa `findRecordsOutsideRange` y `getUnassignedAmount`. (REQ-025, REQ-027)
- `deleteTrip` borra en cascada tras confirmar. (REQ-028)
- `deleteExpense` / `deleteItineraryItem` piden confirmación. (REQ-029, REQ-043)

---

## 6. Flujo de datos

```mermaid
flowchart LR
    UI[Componentes UI] -->|acción| Store[store.js]
    Store --> Val{validation.js}
    Val -->|inválido| Err[ui.errors]
    Err --> UI
    Val -->|válido| State[(Estado global)]
    State -->|saveState| LS[(LocalStorage)]
    LS -->|loadState al iniciar| State
    State -->|subscribe| Render[render]
    Render --> Budget[budget.js]
    Budget -->|valores calculados| UI
```

---

## 7. Mapeo de requerimientos

| REQ | Se cumple en |
|---|---|
| 001 | `TripScreen`, `validateTrip`, `getTotalDays` |
| 002, 003 | `CategoriesScreen`, `validateCategory`, `getUnassignedAmount` |
| 004 | `calculateDailyFoodLimit`, `getFoodBudget` |
| 005, 006 | `ExpenseForm`, `addExpense`, `getGlobalBudget` |
| 007, 031 | `OverLimitAlert` según `isOverLimit` |
| 008 | `ReminderBanner`, `shouldShowReminder` |
| 009 | `scheduleMorningNotification` |
| 010, 042, 043 | `ItineraryScreen`, `validateItineraryItem`, `ConfirmDialog` |
| 011 | **`validateAmount`** |
| 012, 015 | `validateRequired` |
| 013, 024 | `validateTrip` |
| 014 | `validateExpense` |
| 016 | `deleteCategory` |
| 017 | `saveState` |
| 018, 019 | `loadState` |
| 020, 021 | `ItineraryScreen`: sin sugerencias ni recomendaciones |
| 022 | `storage.js`: sin llamadas de red |
| 023 | `addExpense` / `updateExpense`: sin bloqueo por presupuesto |
| 025 | `findRecordsOutsideRange` |
| 026 | `getTotalDays` (se recalcula en cada render) |
| 027 | `updateTrip`, `getUnassignedAmount` |
| 028 | `deleteTrip`, `ConfirmDialog` |
| 029, 030 | `ExpenseList`, `ConfirmDialog`, `deleteExpense`, `getGlobalBudget` |
| 032, 033 | `updateExpense`, `validateExpense` |
| 034 a 037 | **`calculateDailyFoodLimit`**, `getDailySpent`, `formatMoney` |
| 038 a 041 | `FoodTodayCard` |

---

## 8. Historial de auditoría

| Versión | Cambio |
|---|---|
| 1.0 (Paso 2) | Primera propuesta de la IA. |
| 1.1 (Paso 3, Ronda 1) | Poda: se eliminan `router.js`, `eventBus.js` y `models/` (6 archivos). |
| 1.1 (Paso 3, Ronda 2) | Mapeo: funciones explícitas para reglas críticas (`calculateDailyFoodLimit`, `validateAmount`) y para REQ-009, REQ-023 y REQ-025; mapeo por REQ. |
