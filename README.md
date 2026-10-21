# NomadPulse Travel Assistant

App web para planear viajes y controlar el presupuesto, con un límite diario de comida. Funciona solo en el navegador y guarda todo en LocalStorage.

**Laboratorio S3L1:** Diseño Técnico e Inyección de Memoria Semántica (Universidad CENFOTEC).
**Idea principal:** primero se definen las reglas, después el diseño y al final el código (Semana 4).

## Proceso paso a paso

**Antes (Semana 2):** se escribieron las reglas de la app.
- `docs/requirements.md`: qué debe hacer la app, regla por regla (REQ-001 a REQ-043).
- `docs/data-contract.json`: cómo se guardan los datos.
- `docs/wireframe.png`: cómo se ven las pantallas.

**Paso 1: Memoria semántica (`CLAUDE.md`).**
Archivo que la IA lee siempre antes de trabajar. Le dice:
- Qué nombres usar: `Trip`, `GlobalBudget`, `Category`, `Expense`, `DailyFoodLimit`, `ItineraryItem`.
- Qué reglas no puede romper: guardar todo en LocalStorage, rechazar montos ≤ 0 o vacíos, y calcular la comida del día con `(Total Comida / Días Totales) − Acumulado del Día`.

**Paso 2: Diseño técnico (`docs/design.md`).**
Con todo lo anterior, la IA propuso cómo construir la app:
- Las pantallas y componentes, según el wireframe.
- Los módulos y dónde vive cada dato (estado global o LocalStorage).
- Un diagrama Mermaid del flujo de datos.
- Una tabla que dice qué parte del diseño cumple cada REQ.

**Paso 3: Auditoría y poda.**
Se revisó el diseño de la IA en dos rondas:
- **Poda:** se quitaron piezas innecesarias (`router.js`, `eventBus.js` y `models/`) para dejarlo simple.
- **Mapeo:** se aseguró que las reglas críticas tengan su propia función: `calculateDailyFoodLimit` para la comida y `validateAmount` para los montos.

**Cierre: retrospectiva (`retrospective.md`).**
Respuestas a las 3 preguntas de reflexión del laboratorio.

## Estructura

```
/
├── CLAUDE.md               # Paso 1: memoria semántica
├── docs/
│   ├── requirements.md     # Reglas en formato EARS
│   ├── data-contract.json  # Contrato de datos
│   ├── wireframe.png       # Bocetos de pantallas
│   └── design.md           # Pasos 2 y 3: diseño técnico auditado
├── README.md               # Este resumen
└── retrospective.md        # Preguntas de reflexión
```
