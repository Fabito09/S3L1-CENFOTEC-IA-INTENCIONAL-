// Ayudantes para construir la interfaz con DOM (sin innerHTML, así el texto del usuario nunca se interpreta como HTML).

const SVG_NS = 'http://www.w3.org/2000/svg';

// Íconos de docs/wireframe.html (trazo de 24×24).
const ICON_PATHS = {
  home: ['M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'],
  wallet: ['M6 6h12a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z', 'M3 10h18M16 14.5h2'],
  calendar: ['M6.5 5h11a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z', 'M3.5 10h17M8 3v4M16 3v4'],
  grid: [
    'M6 4h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    'M15 4h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    'M6 13h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2z',
    'M15 13h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2z',
  ],
  bag: ['M6.5 7h11a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3z', 'M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17'],
  trash: ['M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12'],
};

// el('button', { className: 'btn', onClick: fn }, 'Texto', otroNodo)
// Las props que empiezan con "on" se registran como eventos; el resto se asignan como atributo o propiedad.
export function el(tag, props = {}, ...children) {
  const element = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (key.startsWith('on')) {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key in element) {
      element[key] = value;
    } else {
      element.setAttribute(key, value === true ? '' : value);
    }
  });
  element.append(...children.flat().filter((child) => child !== null && child !== undefined && child !== false));
  return element;
}

// Mensaje de error debajo de un campo (wireframe: "⚠ ..."). Sin mensaje no dibuja nada.
export function FieldError(message) {
  return message ? el('p', { className: 'error-text', role: 'alert' }, `⚠ ${message}`) : null;
}

// YYYY-MM-DD → DD/MM/YYYY, como en el wireframe.
export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

export function icon(name, size = 22) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  ICON_PATHS[name].forEach((d) => {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  });
  return svg;
}
