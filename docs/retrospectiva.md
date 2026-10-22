# Retrospectiva: Laboratorio S3L2 (Re-ingeniería Intencional)

## 1. Arquitectura Orientada a IA

**¿Cómo facilitó la organización de los archivos de contexto (CLAUDE.md, tasks.md, requirements.md) el trabajo del agente de IA al momento de generar, corregir o refactorizar el código?**

Cada archivo cumplió un papel distinto, y juntos le quitaron a la IA casi todas las decisiones que antes tomaba sola:

- **`CLAUDE.md` fijó el vocabulario y las reglas que no se negocian.** El código usa exactamente los nombres del lenguaje ubicuo (`Trip`, `GlobalBudget`, `DailyFoodLimit`, `Expense`) y los de funciones de `design.md` (`calculateDailyFoodLimit`, `validateAmount`). Las invariantes quedaron en el código tal cual: "alertar, no bloquear" es una regla de `addExpense`, y la fórmula de comida vive en una sola función.
- **`requirements.md` dio identificadores para rastrear todo.** Cada función tiene un comentario con su `REQ-XXX` y cada prueba lleva el REQ en su nombre. Por eso, cuando una prueba falla, se sabe de inmediato qué regla del negocio se rompió.
- **`tasks.md` convirtió el proyecto en 17 pasos chicos y verificables**, cada uno con su criterio de "Hecho cuando". Se avanzó de adentro hacia afuera: primero la lógica pura con pruebas, después el guardado y al final las pantallas. Cada tarea terminó en un commit propio, así que el historial de git se lee como el plan.
- **`design.md` evitó inventar estructura.** La IA sabía en qué archivo iba cada cosa. Cuando hizo falta algo que no estaba (el archivo `components/dom.js` y un parámetro extra en `shouldShowReminder`), lo dijo antes de seguir y se actualizó `design.md` para que el diseño siguiera coincidiendo con el código.

Lo más útil fue la regla "si algo no está en `requirements.md`, preguntar". Las decisiones que los documentos no cubrían, como el formato de los montos, los textos de error que no estaban en el wireframe o si borrar una categoría pide confirmación, aparecieron listadas al final de cada tarea para que yo las aprobara, en lugar de quedar escondidas en el código.

También aprendí que los archivos de contexto necesitan mantenimiento. El comando de pruebas escrito en `CLAUDE.md` (`node --test tests/`) no funcionaba en Node 24. Se detectó al correr las pruebas en T1.3 y se corrigió en `CLAUDE.md` y `tasks.md`.

## 2. Auditoría de Insumos

**¿Qué inconsistencias o vacíos descubriste al revisar y armonizar tu contrato de datos JSON con las especificaciones EARS antes de comenzar a programar?**

En el Paso 1 aparecieron estos vacíos entre el contrato, los requerimientos y el wireframe:

- **La moneda no existía.** El contrato no tenía campo de moneda, aunque la app maneja montos. Se agregó `currency` (`CRC` o `USD`), elegida al crear el viaje y fija después (REQ-045, REQ-046), porque ₡5 000 no equivale a $5 000 y cambiar solo el símbolo falsearía los datos. Para quien piensa en dólares se agregó una **vista convertida** con tipo de cambio manual (`exchangeRate`), que solo cambia lo que se muestra (REQ-047, REQ-048).
- **Los gastos previos no tenían regla de fecha.** El contrato validaba la fecha de los gastos "durante", pero no la de los "previos". Se definió que deben ser anteriores al inicio del viaje (REQ-044), y eso obligó a ajustar REQ-005, REQ-025 y REQ-032.
- **"Comida" era ambigua.** No se decía si "comida" o " COMIDA " cuentan como la categoría Comida. Se definió la comparación sin distinguir mayúsculas ni espacios, y la misma regla para nombres únicos (REQ-002, REQ-041).
- **El orden del itinerario estaba incompleto.** Faltaba decir dónde van las actividades sin hora. Se definió que van al final del día, en orden de ingreso (REQ-010).
- **`DailyFoodLimit` no estaba en el contrato.** Se agregó como objeto **calculado** (`limit`, `dailySpent`, `availableToday`, `isOverLimit`), aclarando que no se guarda. Así quedó documentada exactamente la forma que devuelve `calculateDailyFoodLimit`.

Al programar todavía salieron detalles menores que ningún documento cubría, como el formato de miles (`₡10 000`) o que el recordatorio necesita conocer las fechas del viaje. Pero fueron decisiones de presentación, no de negocio: las reglas importantes ya estaban cerradas antes de escribir código.

## 3. Mantenibilidad y Unchanged Behavior

**¿Qué diferencia notaste al solicitar correcciones bajo la regla de Unchanged Behavior frente a las modificaciones a ciegas realizadas en el primer laboratorio?**

En el primer laboratorio, cuando le pedía un cambio a la IA, muchas veces tenía que pedir lo mismo varias veces hasta que quedara bien. Como la petición no decía qué debía quedar igual, cada intento era una apuesta y había que volver a revisar el resultado completo.

En este laboratorio, cada cambio terminaba diciendo explícitamente **qué se mantuvo intacto**, y eso se puede comprobar en el historial de git:

- `budget.js` (cálculos), `validation.js` (validaciones) y `storage.js` (guardado) **no se volvieron a tocar después de la tarea que los creó**, aunque después se construyeron 7 pantallas encima.
- `store.js` se modificó una sola vez después de su tarea, en T4.1, y solo para agregar un dato de interfaz (`ui.showReminder`), sin tocar ninguna regla.
- Cuando una tarea de interfaz tocaba código compartido, por ejemplo al mover un ayudante a `dom.js` o al cambiar adónde vuelve el formulario de gastos, se volvían a correr las pruebas de las pantallas anteriores para confirmar que seguían igual.
- Las 30 pruebas de `node --test` funcionaron como red de seguridad: después de cada cambio se corrían y seguían en verde.

La diferencia principal es la **confianza**. Un ajuste visual no puede romper la fórmula de comida, porque la fórmula vive en un archivo que no se toca y tiene pruebas propias. Y si algo cambia, el mensaje de cada tarea dice exactamente qué y por qué.

## 4. Evaluación de Satisfacción (guion de 1 minuto)

1. **Estructura (10 s):** `CLAUDE.md` en la raíz, `docs/` con requisitos EARS, contrato, diseño, wireframe y esta retrospectiva; `tasks.md` con todas las tareas en `[x]`; código en `src/` y pruebas en `tests/`.
2. **Persistencia (15 s):** crear un viaje que incluya hoy, la categoría Comida y un gasto; presionar F5: todo sigue ahí.
3. **Restricción semántica (15 s):** registrar un gasto de −500: aparece "El monto debe ser mayor a cero." y no se guarda.
4. **Lógica dinámica (15 s):** con Comida ₡50 000 y 5 días, registrar Comida ₡7 000 hoy: Inicio muestra ₡3 000 con la fórmula `(₡50 000 ÷ 5 días) − ₡7 000`. Otro gasto de ₡5 000 lo deja en −₡2 000 con la alerta, sin bloquear.
5. **Cierre (5 s):** `node --test tests/*.test.js` → 30 de 30 en verde.
