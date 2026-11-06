import { esc } from './content.js';

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
  const d = String(v ?? '').replace(/\D/g, '');
  if (d.length === 9) return `+56${d}`;
  if (d.length === 11 && d.startsWith('56')) return `+${d}`;
  return '';
}
export const telefonoVisible = t => /^\+569\d{8}$/.test(t) ? `+56 9 ${t.slice(4, 8)} ${t.slice(8)}` : t;

export function validarReserva(input, dias, equipos) {
  const linea = (k, max) => limpiar(input[k], max).replace(/\s+/g, ' ');
  const visita = { equipo: linea('equipo', 60), problema: limpiar(input.problema, 600), dia: linea('dia', 10), direccion: linea('direccion', 150), sector: linea('sector', 80), referencia: linea('referencia', 150), nombre: linea('nombre', 80), telefono: telefono(input.telefono) };
  const error = !equipos.includes(visita.equipo) ? 'Elige el equipo que necesitas revisar.'
    : !visita.problema ? 'Cuéntanos qué le pasa a tu equipo.'
    : !dias.includes(visita.dia) ? 'Elige uno de los días disponibles.'
    : !visita.direccion || !visita.sector ? 'Indica la dirección y el sector donde está el equipo.'
    : !visita.nombre ? 'Escribe tu nombre.'
    : !visita.telefono ? 'Revisa tu teléfono. Usa 9 dígitos, por ejemplo 9 1234 5678.'
    : input.consentimiento !== 'si' ? 'Para agendar necesitamos tu autorización para guardar estos datos.' : '';
  return { error, visita };
}

// Email needs the send_email binding (AVISOS) and the AVISOS_DESTINO secret; see README.
export const correoActivo = env => !!(env.AVISOS && env.AVISOS_DESTINO);
const mapa = v => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${v.direccion}, ${v.sector}, Región de Los Lagos, Chile`)}`;
const panel = env => new URL('/admin/', env.SITE_URL || 'https://zerok.cl').href;

async function enviar(env, subject, text, html) {
  if (!correoActivo(env)) return;
  await env.AVISOS.send({
    from: { email: env.AVISOS_REMITENTE || 'avisos@zerok.cl', name: 'Avisos ZÉROK' },
    to: env.AVISOS_DESTINO,
    subject: subject.replace(/\s+/g, ' ').slice(0, 200),
    text,
    html: `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#0c2340">${html}</div>`
  });
}

export async function avisoReserva(env, v) {
  const datos = [['Día preferido', etiqueta(v.dia)], ['Nombre', v.nombre], ['Teléfono', telefonoVisible(v.telefono)], ['Dirección', `${v.direccion}, ${v.sector}`], ...(v.referencia ? [['Referencia', v.referencia]] : []), ['Equipo', v.equipo], ['Problema', v.problema]];
  const text = `Nueva solicitud de visita\n\n${datos.map(([k, x]) => `${k}: ${x}`).join('\n')}\n\nLlamar: tel:${v.telefono}\nMapa: ${mapa(v)}\nConfirmar en el panel: ${panel(env)}\n`;
  const html = `<h1 style="font-size:20px">Nueva solicitud de visita</h1><table cellpadding="6" style="border-collapse:collapse">${datos.map(([k, x]) => `<tr><th align="left" valign="top">${esc(k)}</th><td>${esc(x).replace(/\n/g, '<br>')}</td></tr>`).join('')}</table><p><a href="tel:${v.telefono}">Llamar a ${esc(v.nombre)}</a></p><p><a href="${esc(mapa(v))}">Ver la dirección en el mapa</a></p><p><a href="${esc(panel(env))}">Confirmar en el panel</a></p>`;
  await enviar(env, `Nueva visita: ${v.nombre}, ${v.equipo.toLowerCase()}, ${etiqueta(v.dia, { weekday: 'short', day: 'numeric', month: 'short' })}`, text, html);
}

export async function avisoSeguimiento(env, visitas) {
  const fila = v => `${v.nombre}, ${v.equipo.toLowerCase()}, visita realizada el ${etiqueta(v.realizada, { day: 'numeric', month: 'long' })}`;
  const text = `Llamados de seguimiento pendientes\n\n${visitas.map(v => `- ${fila(v)}\n  Teléfono: ${telefonoVisible(v.telefono)} (tel:${v.telefono})${v.nota ? `\n  Se hizo: ${v.nota}` : ''}`).join('\n\n')}\n\nCuando llames, márcalo en el panel: ${panel(env)}\n`;
  const html = `<h1 style="font-size:20px">Llamados de seguimiento pendientes</h1>${visitas.map(v => `<p><strong>${esc(fila(v))}</strong><br><a href="tel:${v.telefono}">Llamar al ${esc(telefonoVisible(v.telefono))}</a>${v.nota ? `<br>Se hizo: ${esc(v.nota)}` : ''}</p>`).join('')}<p><a href="${esc(panel(env))}">Marcar los llamados en el panel</a></p>`;
  await enviar(env, visitas.length === 1 ? `Hoy toca llamar a ${visitas[0].nombre}` : `Hoy toca llamar a ${visitas.length} clientes`, text, html);
}
