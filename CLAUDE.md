# CLAUDE.md: NomadPulse Travel Assistant

App web de itinerarios y presupuesto de viajes. Solo navegador, sin servidor.

## Archivos de contexto

| Archivo | Para qué |
|---|---|
| `docs/requirements.md` | Fuente oficial de las reglas (EARS, REQ-001 a REQ-048). |
| `docs/data-contract.json` | Forma exacta de los datos guardados. |
| `docs/design.md` | Módulos, funciones y mapeo REQ → código. |
| `docs/wireframe.png` | Pantallas de referencia (se genera desde `docs/wireframe.html`). Paleta en `design.md` §3.1. |
| `tasks.md` | Plan de implementación: qué hacer y en qué orden. |

## Lenguaje Ubicuo

| Entidad | Significado |
|---|---|
| `Trip` | Viaje: nombre, fecha inicio, fecha fin, moneda (`CRC` o `USD`), tipo de cambio opcional y su `GlobalBudget`. |
| `GlobalBudget` | Presupuesto total del viaje. Gastado y disponible se calculan. |
| `Category` | Categoría de gasto con monto asignado. "Comida" se reconoce sin distinguir mayúsculas. |
| `Expense` | Gasto `pre-trip` (previo, fecha antes del inicio) u `on-trip` (durante, fecha dentro del viaje). |
| `DailyFoodLimit` | Límite diario de comida, acumulado y disponible de hoy. Se calcula, no se guarda. |
| `ItineraryItem` | Actividad del itinerario, ingresada a mano. |

## Invariantes del Negocio

1. **Persistencia:** todo se guarda en LocalStorage tras cada cambio. Sin servidores externos.
2. **Montos válidos:** rechazar montos negativos, en cero, no numéricos o campos vacíos.
3. **Comida diaria:** `availableToday = (foodBudget / totalDays) − dailySpent`, es decir, (Total Comida / Días Totales) − Acumulado del Día. Solo gastos `on-trip` de hoy; sin arrastre entre días.
4. **Alertar, no bloquear:** exceder el presupuesto avisa, pero permite registrar.
5. **Itinerario manual:** nunca generar ni recomendar actividades o destinos.
6. **Moneda fija:** cada viaje usa una sola moneda, elegida al crearlo. Los montos guardados nunca se convierten; la vista convertida (₡ ⇄ $) solo cambia lo que se muestra.

## Reglas para la IA

- Stack: HTML, CSS y JavaScript (módulos ES), sin frameworks. Código en `src/`; pruebas en `tests/` con `node --test`.
- Estado local + LocalStorage. Sin Redux, backend ni BD externa.
- Usar solo los nombres del Lenguaje Ubicuo y los de funciones de `design.md`.
- Cada función o componente indica su REQ-XXX en un comentario.
- Si algo no está en `requirements.md`, preguntar antes de decidir.

## Forma de trabajo

- **Seguir `tasks.md`:** una tarea a la vez y en orden. Al terminarla, marcarla `[x]`, mostrar qué cambió y esperar revisión antes de seguir.
- **Unchanged Behavior:** al corregir un error o ajustar la interfaz, mantener intacta la lógica de negocio que ya funciona (`budget.js`, `validation.js`, reglas del `store.js`). Cambiar solo lo que se pidió y decir qué quedó igual.
- **Verificar antes de cerrar:** correr `node --test tests/*.test.js` después de tocar lógica de negocio.
