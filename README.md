# NomadPulse Travel Assistant

App web para planear un viaje y controlar su presupuesto, con un **límite diario de comida** que se recalcula con cada gasto. Funciona solo en el navegador y guarda todo en LocalStorage, sin servidor ni base de datos.

**Laboratorios:** S3L1 (Diseño Técnico y Memoria Semántica) y S3L2 (Re-ingeniería Intencional, Spec-Driven Coding), Universidad CENFOTEC.

## Cómo ejecutar

Requisito: [Node.js](https://nodejs.org/) 22 o superior (se probó con Node 24).

```bash
# 1. Levantar la app (desde la raíz del repositorio)
npx serve src

# 2. Abrir en el navegador
#    http://localhost:3000
```

> La app usa módulos de JavaScript (`type="module"`), por eso necesita un servidor local. Si se abre `src/index.html` con doble clic, el navegador bloquea los módulos y la página se queda en "Cargando NomadPulse…". También sirve la extensión **Live Server** de VS Code apuntando a `src/`.

## Cómo correr las pruebas

```bash
node --test tests/*.test.js
```

Son 30 pruebas, sin librerías, con el runner que trae Node. Cada prueba lleva en su nombre el `REQ-XXX` que verifica: fórmula de comida, sin arrastre entre días, rechazo de montos negativos, fechas de gastos previos, vista convertida ₡ ⇄ $ y orden del itinerario.

## Verificación del negocio (las 3 pruebas del cliente)

Para la demo, creá un viaje **cuyas fechas incluyan el día de hoy**; si no, Inicio muestra "Tu viaje aún no inicia" y no aparece el disponible de comida (REQ-040).

| Prueba | Cómo hacerla | Qué debe pasar |
|---|---|---|
| **Persistencia** | Crear viaje, categorías y gastos; presionar **F5** | No se pierde nada |
| **Restricción semántica** | Gastos → + Registrar gasto → monto **−500** | "⚠ El monto debe ser mayor a cero." y no se guarda |
| **Lógica dinámica** | Categoría Comida ₡50 000, viaje de 5 días; registrar Comida ₡7 000 hoy | Inicio muestra **₡3 000** = (₡50 000 ÷ 5 días) − ₡7 000 |

El resultado de la prueba de estrés completa está en `tasks.md` (T5.1).

## Estructura

```
/
├── CLAUDE.md               # Memoria semántica: lenguaje ubicuo, invariantes y reglas para la IA
├── docs/
│   ├── requirements.md     # Requerimientos en sintaxis EARS (REQ-001 a REQ-048)
│   ├── data-contract.json  # Contrato de datos (JSON Schema) de lo que se guarda
│   ├── design.md           # Diseño técnico: módulos, funciones y mapeo REQ → código
│   ├── wireframe.png       # Bocetos de las 6 pantallas (fuente: wireframe.html)
│   ├── wireframe.html
│   ├── retrospectiva.md    # Retrospectiva individual del S3L2
│   └── retrospectiva-s3l1.md  # Retrospectiva del S3L1 (entregada antes; versión original en el tag s3l1-entrega)
├── tasks.md                # Plan de implementación por fases (todas las tareas en [x])
├── src/                    # Código de la app
│   ├── index.html, styles.css, main.js
│   ├── budget.js           # Cálculos: comida diaria, presupuesto, formato de montos
│   ├── validation.js       # Validaciones: montos, fechas, nombres
│   ├── storage.js          # LocalStorage (no sobrescribe datos dañados)
│   ├── store.js            # Estado global y acciones: validar → modificar → guardar → avisar
│   ├── reminder.js         # Recordatorio diario y aviso de las 08:00
│   └── components/         # Pantallas (una por wireframe) y ayudantes de interfaz
├── tests/                  # Pruebas con node --test
└── README.md
```

## Cómo se construyó

1. **Reglas primero (Semana 2):** `requirements.md`, `data-contract.json` y el wireframe.
2. **S3L1:** memoria semántica (`CLAUDE.md`) y diseño técnico (`design.md`), auditado en dos rondas.
3. **S3L2, Paso 1:** auditoría y armonización de los artefactos (moneda por viaje, vista convertida, fecha de gastos previos, categoría Comida, orden del itinerario).
4. **S3L2, Paso 2:** plan `tasks.md` y `CLAUDE.md` actualizado.
5. **S3L2, Paso 3:** ejecución tarea por tarea, con revisión y un commit por tarea, bajo la regla de *Unchanged Behavior*.
6. **S3L2, Paso 4:** prueba de estrés de las 3 reglas del cliente (T5.1).
