import defaults from '../sitio/contenido.json';

export { defaults };
export const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const imagePath = value => typeof value === 'string' && /^\/(?:img|media)\/[a-zA-Z0-9/_-]+\.webp$/.test(value);
export const published = data => ({
  ...data,
  servicios: data.servicios.filter(s => s.visible),
  productos: data.productos.filter(p => p.visible),
  blog: data.blog.filter(p => p.publicado && p.fecha <= new Date().toISOString().slice(0, 10)).sort((a, b) => b.fecha.localeCompare(a.fecha))
});

export async function readContent(env) {
  const record = env.CONTENIDO && await env.CONTENIDO.get('contenido', 'json');
  return record?.data || defaults;
}

// Whitelist the complete document at the server boundary; HTML is never accepted.
export function validateContent(data) {
  const fail = text => { throw new Error(text); };
  const string = (v, max, label, required = false) => {
    if (typeof v !== 'string' || v.length > max || (required && !v.trim()) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)) fail(`Revisa ${label}.`);
    if (/[—–]/.test(v)) fail(`Usa guion simple en ${label}.`);
    return v.trim();
  };
  const bool = v => { if (typeof v !== 'boolean') fail('Revisa las opciones de visibilidad.'); return v; };
  const photo = v => { if (v !== '' && !imagePath(v)) fail('Usa una imagen subida desde el panel.'); return v; };
  const list = (v, max, fn) => { if (!Array.isArray(v) || v.length > max) fail('La lista supera el límite permitido.'); return v.map(fn); };
  const id = v => { if (typeof v !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v) || v.length > 100) fail('El identificador debe usar letras minúsculas, números y guiones.'); return v; };
  const unique = (items, key) => { if (new Set(items.map(p => p[key])).size !== items.length) fail('Hay identificadores repetidos.'); return items; };
  if (!data || typeof data !== 'object' || !data.general) fail('Contenido inválido.');
  const g = data.general;
  if (g.telefono !== defaults.general.telefono || g.whatsapp !== defaults.general.whatsapp || g.instagram !== defaults.general.instagram || g.telefonoVisible !== defaults.general.telefonoVisible) fail('Los contactos confirmados se cambian en el código.');
  const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (g.horarioConfirmado && (!time.test(g.abre) || !time.test(g.cierra) || g.abre >= g.cierra)) fail('Revisa el horario de apertura y cierre.');
  const general = {
    ...defaults.general,
    horarioConfirmado: bool(g.horarioConfirmado), abre: string(g.abre, 5, 'apertura'), cierra: string(g.cierra, 5, 'cierre'),
    cobertura: list(g.cobertura, 30, v => string(v, 80, 'sector', true)),
    bajada: string(g.bajada, 350, 'bajada', true), presentacion: string(g.presentacion, 2000, 'presentación', true),
    hero: photo(g.hero), heroReal: bool(g.heroReal), heroAlt: string(g.heroAlt, 200, 'descripción de portada', true),
    casaFoto: photo(g.casaFoto), negocioFoto: photo(g.negocioFoto), aviso: string(g.aviso, 250, 'aviso')
  };
  return {
    general,
    servicios: unique(list(data.servicios, 20, s => ({ id: id(s.id), titulo: string(s.titulo, 100, 'servicio', true), resumen: string(s.resumen, 1000, 'resumen', true), equipos: string(s.equipos, 250, 'equipos'), fallas: list(s.fallas, 12, v => string(v, 100, 'falla')), foto: photo(s.foto), visible: bool(s.visible) })), 'id'),
    productos: unique(list(data.productos, 100, p => {
      if (!Number.isSafeInteger(p.precio) || p.precio < 0 || p.precio > 999999999) fail('El precio debe ser un entero en pesos chilenos.');
      return { id: id(p.id), categoria: string(p.categoria, 60, 'categoría', true), nombre: string(p.nombre, 120, 'nombre', true), descripcion: string(p.descripcion, 500, 'descripción'), precio: p.precio, desde: bool(p.desde), foto: photo(p.foto), disponible: bool(p.disponible), destacado: bool(p.destacado), visible: bool(p.visible) };
    }), 'id'),
    trabajos: list(data.trabajos, 60, p => {
      if (p.fecha !== '' && !date(p.fecha)) fail('Revisa la fecha del trabajo.');
      return { foto: photo(p.foto) || fail('Cada trabajo necesita una foto real.'), texto: string(p.texto, 200, 'descripción de trabajo', true), fecha: p.fecha };
    }),
    faq: list(data.faq, 30, p => ({ pregunta: string(p.pregunta, 200, 'pregunta', true), respuesta: string(p.respuesta, 1500, 'respuesta', true) })),
    blog: unique(list(data.blog, 100, p => {
      if (!date(p.fecha)) fail('Revisa la fecha de la entrada.');
      return { slug: id(p.slug), titulo: string(p.titulo, 150, 'título', true), extracto: string(p.extracto, 350, 'extracto', true), cuerpo: string(p.cuerpo, 25000, 'artículo', true), foto: photo(p.foto), fecha: p.fecha, servicio: string(p.servicio, 100, 'servicio relacionado'), publicado: bool(p.publicado) };
    }), 'slug')
  };
}
