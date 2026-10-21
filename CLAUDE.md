# CLAUDE.md: NomadPulse Travel Assistant

App web de itinerarios y presupuesto de viajes. Solo navegador, sin servidor.
Fuente oficial: `docs/requirements.md` (EARS). Datos: `docs/data-contract.json`.

## Lenguaje Ubicuo

| Entidad | Significado |
|---|---|
| `Trip` | Viaje: nombre, fecha inicio, fecha fin. |
| `GlobalBudget` | Presupuesto total y disponible. |
| `Category` | Categoría de gasto con monto asignado. |
| `Expense` | Gasto `pre-trip` (previo) u `on-trip` (durante). |
| `DailyFoodLimit` | Límite diario de comida y disponible de hoy. |
| `ItineraryItem` | Actividad del itinerario, ingresada a mano. |

## Invariantes del Dominio

1. **Persistencia:** todo se guarda en LocalStorage tras cada cambio. Sin servidores externos.
2. **Validación:** rechazar montos ≤ 0, no numéricos o campos vacíos.
3. **Comida diaria:** `availableToday = (foodBudget / totalDays) − dailySpent`. Solo gastos `on-trip` de hoy; sin arrastre entre días.
4. **Alertar, no bloquear:** exceder el presupuesto avisa, pero permite registrar.
5. **Itinerario manual:** nunca generar ni recomendar actividades o destinos.

## Reglas para la IA

- Stack: HTML, CSS y JavaScript (módulos ES), sin frameworks.
- Estado local + LocalStorage. Sin Redux, backend ni BD externa.
- Usar solo los nombres del Lenguaje Ubicuo.
- Cada función o componente indica su REQ-XXX.
- Si algo no está en `requirements.md`, preguntar antes de decidir.
