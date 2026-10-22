// Guardado en LocalStorage (design.md §5). Sin llamadas de red (REQ-022).
// Solo se guardan los datos de data-contract.json; ui y los valores calculados no se guardan.

const STORAGE_KEY = 'nomadpulse.state';
const DATA_VERSION = 1;

function createEmptyData() {
  return { version: DATA_VERSION, trip: null, categories: [], expenses: [], itinerary: [] };
}

// Revisión mínima de la forma de data-contract.json para detectar datos dañados.
function hasValidShape(data) {
  return data !== null
    && typeof data === 'object'
    && data.version === DATA_VERSION
    && (data.trip === null || typeof data.trip === 'object')
    && Array.isArray(data.categories)
    && Array.isArray(data.expenses)
    && Array.isArray(data.itinerary);
}

// REQ-017: guarda el estado completo tras cada cambio.
// Devuelve null si se guardó, o un mensaje de error si LocalStorage no lo permitió.
export function saveState(state) {
  const { version, trip, categories, expenses, itinerary } = state;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version, trip, categories, expenses, itinerary }));
    return null;
  } catch {
    return 'No se pudieron guardar los datos en este navegador.';
  }
}

// REQ-018, REQ-019: carga al iniciar. Devuelve { data, error }.
// Sin datos guardados: datos vacíos. Datos dañados: data = null y un mensaje de error;
// nunca escribe en LocalStorage, así los datos originales siguen ahí hasta que el usuario confirme.
export function loadState() {
  let saved;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    return { data: null, error: 'No se pudo leer el almacenamiento de este navegador.' };
  }
  if (saved === null) return { data: createEmptyData(), error: null };

  try {
    const data = JSON.parse(saved);
    if (hasValidShape(data)) return { data, error: null };
  } catch {
    // JSON inválido: se trata igual que una forma inválida.
  }
  return { data: null, error: 'Los datos guardados están dañados y no se pudieron leer.' };
}
