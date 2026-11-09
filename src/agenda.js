import { esc } from './content.js';

export const equipos = ['Refrigerador', 'Vitrina o conservador', 'Aire acondicionado', 'Aire acondicionado de auto', 'Lavadora o secadora', 'Calefón o calefacción', 'Equipo comercial'];

// Symptoms describe what the customer observes, never a promised service.
export const sintomas = {
  Refrigerador: ['No enfría', 'Hace un ruido extraño', 'Gotea o se escarcha', 'No enciende', 'Mantención'],
  'Vitrina o conservador': ['No enfría bien', 'Se escarcha', 'Hace un ruido', 'No enciende', 'Mantención'],
  'Aire acondicionado': ['No enfría o no calienta', 'Gotea agua', 'Hace un ruido', 'Instalación', 'Mantención o limpieza', 'Desinstalación'],
  'Aire acondicionado de auto': ['No enfría', 'Fuga de gas', 'Hace un ruido', 'Revisión'],
  'Lavadora o secadora': ['No enciende', 'No desagua', 'No centrifuga o no seca', 'Ruido o vibración', 'Bota agua'],
  'Calefón o calefacción': ['No enciende', 'Se apaga', 'No calienta bien', 'Instalar termostato', 'Mantención'],
  'Equipo comercial': ['No enfría bien', 'Se escarcha', 'Hace un ruido', 'No enciende', 'Mantención']
};

// Visits are scheduled by Chilean calendar day; the Worker clock runs in UTC.
export const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const sumar = (dia, n) => new Date(Date.parse(`${dia}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
export const esFecha = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
export const etiqueta = (dia, opciones = { weekday: 'long', day: 'numeric', month: 'long' }) => new Intl.DateTimeFormat('es-CL', { ...opciones, timeZone: 'UTC' }).format(new Date(`${dia}T12:00:00Z`)).replace(/\./g, '');

// Monday to Saturday for the next two weeks, from tomorrow on: urgent visits are handled by phone.
export function disponibles(bloqueados = []) {
  const inicio = hoy();
  return Array.from({ length: 14 }, (_, i) => sumar(inicio, i + 1)).filter(d => new Date(`${d}T12:00:00Z`).getUTCDay() !== 0 && !bloqueados.includes(d));
}

export const limpiar = (v, max) => typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, max) : '';
export function telefono(v) {
  if (typeof v !== 'string' || v.length > 30 || !/^\+?[\d\s()-]+$/.test(v)) return '';
  const d = v.replace(/\D/g, '');
  if (d.length === 9 && /^[2-9]/.test(d)) return `+56${d}`;
  if (d.length === 11 && /^56[2-9]/.test(d)) return `+${d}`;
  return '';
}
export const telefonoVisible = t => /^\+569\d{8}$/.test(t) ? `+56 9 ${t.slice(4, 8)} ${t.slice(8)}` : t;

export function validarReserva(input, dias, opciones = equipos) {
  const limites = { equipo: 60, problema: 600, dia: 10, direccion: 150, sector: 80, referencia: 150, nombre: 80, telefono: 30 };
  if (Object.entries(limites).some(([k, max]) => input[k] !== undefined && (typeof input[k] !== 'string' || input[k].length > max))) return { error: 'Revisa los datos: hay un campo demasiado largo o con formato incorrecto.', errores: [] };
  const linea = (k, max) => limpiar(input[k], max).replace(/\s+/g, ' ');
  const visita = { equipo: linea('equipo', 60), problema: limpiar(input.problema, 600), dia: linea('dia', 10), direccion: linea('direccion', 150), sector: linea('sector', 80), referencia: linea('referencia', 150), nombre: linea('nombre', 80), telefono: telefono(input.telefono) };
  // Every missing or invalid field gets its own message, linked back to the input.
  const errores = [];
  if (!opciones.includes(visita.equipo)) errores.push({ campo: 'equipo', mensaje: 'Elige el equipo que necesitas revisar.' });
  if (!visita.problema) errores.push({ campo: 'problema', mensaje: 'Cuéntanos qué le pasa a tu equipo.' });
  if (!dias.includes(visita.dia)) errores.push({ campo: 'dia', mensaje: 'Elige uno de los días disponibles.' });
  if (!visita.direccion) errores.push({ campo: 'direccion', mensaje: 'Indica la dirección donde está el equipo.' });
  if (!visita.sector) errores.push({ campo: 'sector', mensaje: 'Indica el sector o comuna donde está el equipo.' });
  if (!visita.nombre) errores.push({ campo: 'nombre', mensaje: 'Escribe tu nombre.' });
  if (!visita.telefono) errores.push({ campo: 'telefono', mensaje: 'Revisa tu teléfono. Usa 9 dígitos, por ejemplo 9 1234 5678.' });
  if (input.consentimiento !== 'si') errores.push({ campo: 'consentimiento', mensaje: 'Para agendar necesitamos tu autorización para guardar estos datos.' });
  return { error: errores[0]?.mensaje || '', errores, visita };
}

// The alias forwards privately; enabling delivery is a separate, explicit deployment choice.
export const correoActivo = env => env.AVISOS_HABILITADOS === 'true' && typeof env.AVISOS?.send === 'function';
const mapa = v => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${v.direccion}, ${v.sector}, Región de Los Lagos, Chile`)}`;
const panel = env => new URL('/admin/', env.SITE_URL || 'https://zerok.cl').href;

async function enviar(env, subject, text, html) {
  if (!correoActivo(env)) throw new Error('Correo no habilitado.');
  await env.AVISOS.send({
    from: { email: 'avisos@zerok.cl', name: 'Avisos ZÉROK' },
    to: 'avisos@zerok.cl',
    subject: subject.replace(/\s+/g, ' ').slice(0, 200),
    text,
    html: `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#0c2340">${html}</div>`
  });
}

export async function avisoReserva(env, v) {
  // A request queued before its preferred day passed is labeled pending work, never "new".
  const atrasada = esFecha(v.dia) && v.dia < hoy();
  const wsp = /^\+56\d{9}$/.test(v.telefono || '') ? v.telefono.slice(1) : '';
  const recibida = esFecha((v.creada || '').slice(0, 10)) ? v.creada.slice(0, 10) : '';
  const datos = [[atrasada ? 'Día pedido (ya pasó)' : 'Día preferido', etiqueta(v.dia)], ...(atrasada && recibida ? [['Recibida', etiqueta(recibida)]] : []), ['Nombre', v.nombre], ['Teléfono', telefonoVisible(v.telefono)], ['Dirección', `${v.direccion}, ${v.sector}`], ...(v.referencia ? [['Referencia', v.referencia]] : []), ['Equipo', v.equipo], ['Problema', v.problema]];
  const titulo = atrasada ? 'Solicitud pendiente de visita' : 'Nueva solicitud de visita';
  const text = `${titulo}\n\n${datos.map(([k, x]) => `${k}: ${x}`).join('\n')}\n\nLlamar: tel:${v.telefono}\n${wsp ? `WhatsApp: https://wa.me/${wsp}\n` : ''}Mapa: ${mapa(v)}\nConfirmar en el panel: ${panel(env)}\n`;
  const html = `<h1 style="font-size:20px">${titulo}</h1><table cellpadding="6" style="border-collapse:collapse">${datos.map(([k, x]) => `<tr><th align="left" valign="top">${esc(k)}</th><td>${esc(x).replace(/\n/g, '<br>')}</td></tr>`).join('')}</table><p><a href="tel:${v.telefono}">Llamar a ${esc(v.nombre)}</a>${wsp ? ` · <a href="https://wa.me/${wsp}">Escribir por WhatsApp</a>` : ''}</p><p><a href="${esc(mapa(v))}">Ver la dirección en el mapa</a></p><p><a href="${esc(panel(env))}">Confirmar en el panel</a></p>`;
  const corto = etiqueta(v.dia, { weekday: 'short', day: 'numeric', month: 'short' });
  await enviar(env, atrasada ? `Solicitud pendiente: ${v.nombre}, ${v.equipo.toLowerCase()}, día pedido ${corto}` : `Nueva visita: ${v.nombre}, ${v.equipo.toLowerCase()}, ${corto}`, text, html);
}

export async function avisoSeguimiento(env, visitas) {
  const fila = v => `${v.nombre}, ${v.equipo.toLowerCase()}, visita realizada el ${etiqueta(v.realizada, { day: 'numeric', month: 'long' })}`;
  const text = `Llamados de seguimiento pendientes\n\n${visitas.map(v => `- ${fila(v)}\n  Teléfono: ${telefonoVisible(v.telefono)} (tel:${v.telefono})${v.nota ? `\n  Se hizo: ${v.nota}` : ''}`).join('\n\n')}\n\nCuando llames, márcalo en el panel: ${panel(env)}\n`;
  const html = `<h1 style="font-size:20px">Llamados de seguimiento pendientes</h1>${visitas.map(v => `<p><strong>${esc(fila(v))}</strong><br><a href="tel:${v.telefono}">Llamar al ${esc(telefonoVisible(v.telefono))}</a>${v.nota ? `<br>Se hizo: ${esc(v.nota)}` : ''}</p>`).join('')}<p><a href="${esc(panel(env))}">Marcar los llamados en el panel</a></p>`;
  await enviar(env, visitas.length === 1 ? `Hoy toca llamar a ${visitas[0].nombre}` : `Hoy toca llamar a ${visitas.length} clientes`, text, html);
}
