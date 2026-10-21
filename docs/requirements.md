# Especificación de Requerimientos: NomadPulse Travel Assistant

**Versión:** 2.0 (final, auditada, Paso 3)
**Tipo de aplicación:** Aplicación web de itinerarios y control de presupuesto para viajes
**Uso:** Especificación oficial para el siguiente laboratorio

---

## 0. Glosario

| Término | Definición |
|---|---|
| Viaje | Registro con nombre, fecha de inicio, fecha de fin y presupuesto total. |
| Días Totales | Cantidad de días del viaje: (fecha de fin − fecha de inicio) + 1. |
| Categoría | Agrupación de gastos creada por el usuario (ej. Comida, Transporte, Hospedaje), con un monto asignado. |
| Gasto previo | Compra realizada antes del viaje (tiquetes aéreos, reservas de hospedaje, seguros). |
| Gasto durante el viaje | Consumo registrado en una fecha dentro del rango del viaje. |
| Presupuesto Total Comida | Monto asignado por el usuario a la categoría Comida. |
| Límite diario de comida | Presupuesto Total Comida / Días Totales. |
| Acumulado del Día | Suma de los gastos durante el viaje de la categoría Comida registrados con la fecha de hoy. No incluye gastos previos. |
| Disponible de hoy | (Presupuesto Total Comida / Días Totales) − Acumulado del Día. |
| Hoy | La fecha local del dispositivo del usuario. |

---

## 1. Gestión de Presupuestos: Global y Diario de Comidas (EARS)

### 1.1 Viaje, presupuesto y categorías

- **REQ-001:** WHEN el usuario crea un viaje, IF ingresó nombre, fecha de inicio, fecha de fin y un presupuesto total mayor a cero, THEN the system SHALL guardar el viaje y calcular los Días Totales.
- **REQ-002:** WHEN el usuario crea o renombra una categoría, IF el nombre no está vacío y no existe otra categoría con el mismo nombre, THEN the system SHALL guardar la categoría con su monto asignado.
- **REQ-003:** WHEN el usuario asigna o modifica el monto de una categoría, IF la suma de los montos de todas las categorías supera el presupuesto total, THEN the system SHALL rechazar el cambio y mostrar un mensaje indicando el monto disponible para asignar.
- **REQ-004:** WHEN el usuario define o modifica el monto de la categoría Comida, THEN the system SHALL calcular el límite diario de comida con la fórmula exacta: Límite diario de comida = Presupuesto Total Comida / Días Totales.

### 1.2 Registro de gastos

- **REQ-005:** WHEN el usuario registra un gasto previo, IF el monto es mayor a cero y tiene una categoría asignada, THEN the system SHALL restar el monto del presupuesto disponible total y del disponible de su categoría, marcándolo como "previo".
- **REQ-006:** WHEN el usuario registra un gasto durante el viaje, IF el monto es mayor a cero y la fecha está dentro del rango del viaje, THEN the system SHALL asociar el gasto a esa fecha, restarlo del presupuesto disponible total y del disponible de su categoría, y actualizar el Acumulado del Día.
- **REQ-007:** WHEN se recalcula el disponible de hoy, IF el disponible de hoy es menor a cero, THEN the system SHALL mostrar una alerta visual de advertencia sin bloquear el registro del gasto.

### 1.3 Cálculo del disponible diario de comida

- **REQ-034:** WHEN se registra, edita o elimina un gasto de comida, o cambia el Presupuesto Total Comida o los Días Totales, IF hoy está dentro del rango del viaje, THEN the system SHALL recalcular el disponible de hoy con la fórmula exacta: Disponible de hoy = (Presupuesto Total Comida / Días Totales) − Acumulado del Día.
- **REQ-035:** WHEN se calcula el disponible de hoy, THEN the system SHALL usar únicamente el Acumulado del Día de hoy, sin sumar el dinero no gastado de días anteriores ni restar excesos de días anteriores.
- **REQ-036:** WHEN se calcula el Acumulado del Día, THEN the system SHALL sumar solo los gastos durante el viaje de la categoría Comida con fecha de hoy, excluyendo los gastos previos.
- **REQ-037:** WHEN se realizan los cálculos, THEN the system SHALL operar con la precisión completa del número y redondear a 2 decimales únicamente al mostrar los montos en pantalla.
- **REQ-038:** WHEN el usuario ve la pantalla principal, IF hoy está dentro del rango del viaje, THEN the system SHALL mostrar tres valores: Límite diario de comida, Acumulado del Día y Disponible de hoy.
- **REQ-039:** WHEN el usuario ve la pantalla principal, IF el disponible de hoy es menor a cero, THEN the system SHALL mostrar el valor con signo negativo y en color de advertencia.
- **REQ-040:** WHEN el usuario ve la pantalla principal, IF hoy está fuera del rango del viaje, THEN the system SHALL ocultar el disponible de hoy y mostrar un mensaje indicando si el viaje aún no inicia o ya finalizó.
- **REQ-041:** WHEN el usuario ve la pantalla principal, IF no existe una categoría Comida, THEN the system SHALL ocultar el disponible de hoy y mostrar un mensaje invitando a crear la categoría Comida.

### 1.4 Recordatorio diario de saldo

- **REQ-008:** WHEN el usuario abre la aplicación por primera vez en un día que está dentro del rango del viaje, THEN the system SHALL mostrar un recordatorio con el disponible de hoy calculado según REQ-034.
- **REQ-009:** WHEN son las 08:00 (hora local) de un día dentro del rango del viaje, IF la aplicación está abierta y el usuario concedió permiso de notificaciones, THEN the system SHALL emitir una notificación del navegador con el disponible de hoy calculado según REQ-034.

---

## 2. Validaciones de Borde (EARS)

### 2.0 Validación de datos de entrada

- **REQ-011:** WHEN el usuario ingresa un monto, IF el monto es negativo, cero o no numérico, THEN the system SHALL rechazar el registro y mostrar un mensaje de error.
- **REQ-012:** WHEN el usuario guarda un viaje, gasto o actividad, IF algún campo de fecha obligatorio está vacío, THEN the system SHALL rechazar el registro y mostrar un mensaje de error.
- **REQ-013:** WHEN el usuario crea un viaje, IF la fecha de fin es anterior a la fecha de inicio, THEN the system SHALL rechazar el viaje y mostrar un mensaje de error.
- **REQ-014:** WHEN el usuario registra un gasto durante el viaje, IF la fecha está fuera del rango del viaje, THEN the system SHALL rechazar el gasto y mostrar un mensaje de error.
- **REQ-015:** WHEN el usuario registra un gasto, IF no seleccionó una categoría, THEN the system SHALL rechazar el registro y mostrar un mensaje de error.
- **REQ-016:** WHEN el usuario intenta eliminar una categoría, IF la categoría tiene gastos asociados, THEN the system SHALL bloquear la eliminación y mostrar un mensaje indicando cuántos gastos están asociados.

### 2.1 Edición de un viaje ya creado

- **REQ-024:** WHEN el usuario edita la fecha de inicio o de fin de un viaje, IF la nueva fecha de fin es anterior a la nueva fecha de inicio, THEN the system SHALL rechazar el cambio y mostrar un mensaje de error.
- **REQ-025:** WHEN el usuario edita la fecha de inicio o de fin de un viaje, IF existen gastos durante el viaje o actividades del itinerario con fechas fuera del nuevo rango, THEN the system SHALL bloquear el cambio y mostrar la lista de registros afectados para que el usuario los mueva o elimine primero.
- **REQ-026:** WHEN el usuario edita la fecha de inicio o de fin de un viaje, IF el cambio es válido, THEN the system SHALL recalcular los Días Totales y el límite diario de comida.
- **REQ-027:** WHEN el usuario edita el presupuesto total de un viaje, IF el nuevo monto es menor a la suma de los montos asignados a las categorías, THEN the system SHALL rechazar el cambio y mostrar la diferencia que debe reducir en las categorías.
- **REQ-028:** WHEN el usuario solicita eliminar un viaje, THEN the system SHALL pedir confirmación y, al confirmarse, eliminar el viaje junto con sus categorías, gastos y actividades.

### 2.2 Edición y eliminación de transacciones

- **REQ-029:** WHEN el usuario solicita eliminar un gasto, THEN the system SHALL pedir confirmación antes de eliminarlo.
- **REQ-030:** WHEN el usuario confirma la eliminación de un gasto, THEN the system SHALL eliminarlo, devolver su monto al disponible de su categoría y al presupuesto disponible total, y recalcular el Acumulado del Día de ese gasto.
- **REQ-031:** WHEN se recalcula el disponible de hoy, IF el disponible de hoy es mayor o igual a cero, THEN the system SHALL quitar la alerta visual de advertencia.
- **REQ-032:** WHEN el usuario edita el monto, la fecha o la categoría de un gasto, IF los nuevos datos cumplen las validaciones de REQ-011 a REQ-015, THEN the system SHALL revertir el efecto del gasto original y aplicar el efecto del gasto modificado, recalculando el acumulado de los días y categorías involucrados.
- **REQ-033:** WHEN el usuario edita un gasto, IF los nuevos datos no cumplen las validaciones, THEN the system SHALL rechazar el cambio y conservar el gasto original sin modificaciones.

---

## 3. Persistencia de Datos Local (EARS)

- **REQ-017:** WHEN ocurre cualquier cambio en viajes, categorías, gastos o itinerario, THEN the system SHALL persistir el estado completo en LocalStorage.
- **REQ-018:** WHEN el usuario abre la aplicación, IF existen datos guardados en LocalStorage, THEN the system SHALL cargarlos y mostrar el estado más reciente.
- **REQ-019:** WHEN el usuario abre la aplicación, IF los datos guardados no se pueden leer, THEN the system SHALL mostrar un mensaje de error y no sobrescribir los datos existentes hasta que el usuario lo confirme.

---

## 4. Restricciones de Diseño (Unchanged Behavior)

- **REQ-020:** WHEN el usuario gestiona su itinerario, THEN the system SHALL NOT generar, sugerir ni completar actividades de forma automática.
- **REQ-021:** WHEN el usuario navega por cualquier pantalla, THEN the system SHALL NOT recomendar destinos, actividades ni comercios.
- **REQ-022:** WHEN el sistema guarda o carga información, THEN the system SHALL NOT enviar datos a servidores externos.
- **REQ-023:** WHEN el usuario supera el presupuesto de una categoría o el presupuesto total, THEN the system SHALL NOT impedir el registro de nuevos gastos.

---

## 5. Gestión Manual del Itinerario (EARS)

- **REQ-010:** WHEN el usuario agrega una actividad al itinerario, IF la fecha está dentro del rango del viaje y la descripción no está vacía, THEN the system SHALL guardar la actividad en el día correspondiente, ordenada por hora cuando el usuario la indique y, sin hora, en el orden en que fue ingresada.
- **REQ-042:** WHEN el usuario edita una actividad del itinerario, IF la fecha está dentro del rango del viaje y la descripción no está vacía, THEN the system SHALL guardar los cambios y reordenar las actividades del día afectado.
- **REQ-043:** WHEN el usuario solicita eliminar una actividad del itinerario, THEN the system SHALL pedir confirmación y, al confirmarse, eliminarla del día correspondiente.

---

## 6. Trazabilidad con el Requerimiento del Cliente

| Requerimiento del cliente | Requerimientos que lo cubren |
|---|---|
| 1. Gestión manual de itinerarios (sin generación automática ni recomendaciones) | REQ-010, REQ-042, REQ-043, REQ-020, REQ-021 |
| 2. Presupuesto total y categorías personalizadas | REQ-001 a REQ-004, REQ-016, REQ-027 |
| 3a. Gastos previos al viaje | REQ-005, REQ-036 |
| 3b. Gastos durante el viaje | REQ-006, REQ-007, REQ-029 a REQ-034 |
| 4. Recordatorio diario de saldo | REQ-008, REQ-009, REQ-034 a REQ-041 |
| Persistencia local (requisito del laboratorio) | REQ-017 a REQ-019, REQ-022 |

---

## 7. Historial de Auditoría

| Versión | Cambio |
|---|---|
| 1.0 (Paso 1) | Primera versión generada por la IA con el Prompt de Especificación (REQ-001 a REQ-023). |
| 1.1 (Paso 2, Ronda 1) | Casos de borde: edición de fechas y presupuesto del viaje, eliminación del viaje, edición y eliminación de gastos (REQ-024 a REQ-033). |
| 1.2 (Paso 2, Ronda 2) | Rigor matemático y UI: fórmula exacta del disponible de hoy y lo que muestra la pantalla (REQ-034 a REQ-041); ajuste de REQ-004, REQ-007, REQ-008 y REQ-009. |
| 2.0 (Paso 3) | Consolidación y revisión final: REQ-006 ahora resta del presupuesto total (consistencia con REQ-005 y REQ-030); REQ-031 alineado a la fórmula; REQ-002 cubre renombrar; REQ-010 sin suponer hora obligatoria; edición y eliminación de actividades (REQ-042, REQ-043); itinerario movido a su propia sección. |

> Los IDs no se renumeran entre versiones para mantener la trazabilidad: un mismo REQ siempre se refiere a la misma regla.

---

## 8. Pregunta de Reflexión

**¿Qué tan diferente fue pedirle a la IA que redacte y ajuste las reglas del juego en lugar de pedirle directamente que escriba el código? ¿Sientes que ahora tienes más control sobre lo que la IA va a programar a continuación?**

Sí se sintió la diferencia. Normalmente, cuando le pido código directamente a la IA, ella toma muchas decisiones por su cuenta sin consultarme, y uno termina descubriendo después cosas que no quería. En cambio, al pedirle primero las reglas del juego, siento que tengo el dominio y el control de lo que va a hacer.

Durante las rondas de revisión aparecieron casos que nadie había definido, como qué pasa si el usuario borra un gasto o cambia las fechas del viaje, o cuál es la fórmula exacta del disponible diario de comida. Si le hubiera pedido el código de una vez, la IA habría decidido eso sola. Así, esas decisiones las tomé yo antes de que exista una sola línea de código.

Ahora el archivo requirements.md funciona como un plan o contrato: le dice a la IA exactamente qué hacer en el siguiente laboratorio sin desviarse del camino, y además me sirve para verificar si lo que programe cumple o no con cada requerimiento.
