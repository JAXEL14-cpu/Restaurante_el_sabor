export const ejemplos = [
  { texto: 'cuanto cuesta cual es el precio valor costo', intencion: 'precio' },
  { texto: 'quiero saber el importe que debo pagar', intencion: 'precio' },
  { texto: 'como se llama nombre del producto articulo', intencion: 'nombre' },
  { texto: 'dime el nombre o titulo del producto', intencion: 'nombre' },
  { texto: 'descripcion caracteristicas detalles del producto', intencion: 'descripcion' },
  { texto: 'explica para que sirve informacion del articulo', intencion: 'descripcion' },
];

const vacias = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'un', 'una', 'que', 'es', 'en', 'y', 'o', 'me', 'lo', 'al', 'por', 'se', 'su']);

function tokens(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((token) => token && !vacias.has(token));
}

function similitud(a, b) {
  const aa = new Set(a);
  const bb = new Set(b);
  if (!aa.size || !bb.size) return 0;
  let comunes = 0;
  for (const token of aa) if (bb.has(token)) comunes += 1;
  return comunes / Math.sqrt(aa.size * bb.size);
}

export function clasificar(pregunta) {
  const entrada = tokens(pregunta);
  const mejores = new Map();
  for (const ejemplo of ejemplos) {
    const valor = similitud(entrada, tokens(ejemplo.texto));
    mejores.set(ejemplo.intencion, Math.max(mejores.get(ejemplo.intencion) || 0, valor));
  }
  const ranking = [...mejores].sort((a, b) => b[1] - a[1]);
  const [intencion, puntuacion] = ranking[0] || [null, 0];
  const diferencia = puntuacion - (ranking[1]?.[1] || 0);
  // Umbrales para una demostración; no son probabilidades calibradas.
  return { intencion: puntuacion >= 0.2 && diferencia >= 0.08 ? intencion : null, puntuacion };
}
