# Retrospectiva: Laboratorio S3L1

## 1. Paso de Requerimientos a Diseño

**¿Qué decisiones técnicas (manejo de estado, división de componentes) tuvo que tomar la IA que no estaban escritas en el requirements.md?**

El `requirements.md` dice qué debe hacer el sistema, pero no cómo organizarlo. Para pasar al diseño, la IA tuvo que decidir varias cosas que no estaban escritas:

- **Un único estado global** (`state`) con los datos del contrato JSON, más una parte `ui` (pantalla actual, día seleccionado, errores) que no se guarda en LocalStorage.
- **Valores calculados en vez de guardados:** `totalDays`, `GlobalBudget` y `DailyFoodLimit` se recalculan en cada render. El contrato de datos ya decía que no se guardan; el diseño definió cuándo y dónde se calculan (`budget.js`, en cada render), para que nunca queden desactualizados cuando cambia una fecha o se borra un gasto.
- **Flujo en un solo sentido:** UI → acción → validación → estado → guardado → render.
- **División en módulos por responsabilidad:** `budget.js` para los cálculos, `validation.js` para las validaciones, `storage.js` para LocalStorage y `reminder.js` para el recordatorio, con una pantalla por cada vista del wireframe.
- **Detalles técnicos:** una clave extra en LocalStorage (`nomadpulse.lastReminder`) para mostrar el recordatorio solo una vez al día, un `ConfirmDialog` reutilizable para todas las eliminaciones y la notificación de las 08:00 sin Service Worker, porque REQ-009 solo la pide con la app abierta.

Lo bueno es que estas decisiones quedaron escritas en el `design.md` y las revisé antes de programar, en lugar de descubrirlas después en el código.

## 2. Memoria Semántica

**¿Cómo afectó tener el archivo CLAUDE.md a la hora de que la IA propusiera los nombres de las funciones y componentes en el design.md?**

Se notó bastante. Como `CLAUDE.md` define el lenguaje ubicuo, la IA usó esos mismos nombres en todo el diseño: `GlobalBudget`, `DailyFoodLimit`, `Expense`, `Trip`, y funciones como `calculateDailyFoodLimit` y `getGlobalBudget`. El `requirements.md` está escrito en español ("Viaje", "Gasto previo", "Límite diario de comida"), así que `CLAUDE.md` funcionó como puente: conecta esos términos con los nombres en inglés del código, que son los mismos del `data-contract.json`. Así no hay que adivinar si dos nombres distintos se refieren a lo mismo.

Además, la regla "cada función o componente indica su REQ-XXX" hizo que la tabla de funciones clave del `design.md` tenga una columna de REQ. Eso facilita revisar que cada requerimiento tenga quién lo cumpla. Las invariantes también se reflejan en el diseño: "alertar, no bloquear" es una regla explícita de `addExpense` / `updateExpense` en `store.js`, e "itinerario manual" aparece en el mapeo de `ItineraryScreen` (sin sugerencias ni recomendaciones).

## 3. Poda Arquitectónica

**¿Tuviste que simplificar alguna propuesta sobreestructurada de la IA para mantener el diseño simple y legible?**

Sí. La primera versión del diseño (1.0) traía piezas que no hacían falta para una app de este tamaño:

- un `router.js` para navegar entre pantallas,
- un `eventBus.js` para comunicar componentes,
- una carpeta `models/` para las entidades.

En total eran 6 archivos de más. Los eliminé en la Ronda 1 de la auditoría: la navegación se resuelve con `ui.currentScreen` en el estado, la comunicación con `subscribe` del `store.js`, y los datos ya están definidos en `data-contract.json`, así que no necesitan archivos aparte.

En la Ronda 2 pasó lo contrario: había que hacer más explícito, no más simple. Pedí que las reglas críticas tuvieran una función con nombre propio: `calculateDailyFoodLimit` para la fórmula de comida y `validateAmount` para rechazar montos negativos o en cero. También agregué funciones claras para REQ-009, REQ-023 y REQ-025, y una tabla de mapeo REQ por REQ.

El resultado es un diseño más corto, sin librerías externas, y donde cada regla importante tiene un lugar fácil de encontrar.
