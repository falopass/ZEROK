import { esc } from './content.js';

export const equipos = ['Refrigerador', 'Vitrina o conservador', 'Aire acondicionado', 'Aire acondicionado de auto', 'Lavadora o secadora', 'Calefón o calefacción', 'Equipo comercial', 'Otro equipo'];

// Symptoms describe what the customer observes, never a promised service.
export const sintomas = {
  Refrigerador: ['No enfría', 'Hace un ruido extraño', 'Gotea o se escarcha', 'No enciende', 'Mantención'],
  'Vitrina o conservador': ['No enfría bien', 'Se escarcha', 'Hace un ruido', 'No enciende', 'Mantención'],
  'Aire acondicionado': ['No enfría o no calienta', 'Gotea agua', 'Hace un ruido', 'Instalación', 'Mantención o limpieza', 'Desinstalación'],
  'Aire acondicionado de auto': ['No enfría', 'Fuga de gas', 'Hace un ruido', 'Revisión'],
  'Lavadora o secadora': ['No enciende', 'No desagua', 'No centrifuga o no seca', 'Ruido o vibración', 'Bota agua'],
  'Calefón o calefacción': ['No enciende', 'Se apaga', 'No calienta bien', 'Instalar termostato', 'Mantención'],
  'Equipo comercial': ['No enfría bien', 'Se escarcha', 'Hace un ruido', 'No enciende', 'Mantención'],
  // Sin síntomas predefinidos: quien elige «Otro equipo» escribe qué aparato es y qué le pasa.
  'Otro equipo': []
};

// Visits are scheduled by Chilean calendar day; the Worker clock runs in UTC.
export function ahoraChile(fechaRef = new Date()) {
  const partes = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(fechaRef).map(p => [p.type, p.value]));
  return { dia: `${partes.year}-${partes.month}-${partes.day}`, minutos: Number(partes.hour) * 60 + Number(partes.minute) };
}
export const hoy = () => ahoraChile().dia;
export const sumar = (dia, n) => new Date(Date.parse(`${dia}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
export const esFecha = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
export const etiqueta = (dia, opciones = { weekday: 'long', day: 'numeric', month: 'long' }) => new Intl.DateTimeFormat('es-CL', { ...opciones, timeZone: 'UTC' }).format(new Date(`${dia}T12:00:00Z`)).replace(/\./g, '');

export const parseHora = v => {
  if (typeof v !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v)) return null;
  const [h, m] = v.split(':').map(Number);
  return h * 60 + m;
};
export const formatHora = mins => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
export const rangoHora = hora => {
  const m = parseHora(hora);
  if (m === null || m + 60 > 1440) return '';
  return `${formatHora(m)} a ${formatHora(m + 60)}`;
};

// Generates consecutive 1-hour slots for a date according to confirmed opening/closing hours.
// On today's date (when enabled), enforces a lead time margin so urgent same-day bookings stay realistic.
export function bloquesDia(dia, general = {}, opciones = {}) {
  if (!esFecha(dia)) return [];
  const dow = new Date(`${dia}T12:00:00Z`).getUTCDay();
  if (dow === 0) return [];
  const confirmado = general?.horarioConfirmado && parseHora(general.abre) !== null && parseHora(general.cierra) !== null;
  const inicio = confirmado ? parseHora(general.abre) : 9 * 60;
  const cierreStr = confirmado ? (dow === 6 ? (general.cierraSabado || general.cierra) : general.cierra) : (dow === 6 ? '14:00' : '18:00');
  const fin = parseHora(cierreStr) ?? (dow === 6 ? 14 * 60 : 18 * 60);
  const { mismoDia = false, margenHoy = 120, ahora = null } = opciones;
  const minInicio = mismoDia && ahora && dia === ahora.dia ? ahora.minutos + margenHoy : -1;
  const bloques = [];
  for (let m = inicio; m + 60 <= fin; m += 60) {
    if (m < minInicio) continue;
    const hora = formatHora(m);
    const hasta = formatHora(m + 60);
    bloques.push({ hora, fin: hasta, label: `${hora} a ${hasta}` });
  }
  return bloques;
}

// Monday to Saturday for the next two weeks (optionally including today if slots with margin remain).
export function disponibles(bloqueados = [], opciones = {}) {
  const { mismoDia = false, general = {}, margenHoy = 120, ahora = ahoraChile() } = opciones;
  const inicio = ahora.dia;
  const total = mismoDia ? 15 : 14;
  const offset = mismoDia ? 0 : 1;
  return Array.from({ length: total }, (_, i) => sumar(inicio, i + offset)).filter(d => {
    if (new Date(`${d}T12:00:00Z`).getUTCDay() === 0 || bloqueados.includes(d)) return false;
    if (d === inicio) return bloquesDia(d, general, { mismoDia: true, margenHoy, ahora }).length > 0;
    return true;
  });
}

export function horasOcupadas(dia, horasActivas = [], general = {}, opciones = {}) {
  const bloques = bloquesDia(dia, general, opciones);
  const tomadas = new Set();
  for (const h of horasActivas) {
    const m = parseHora(h);
    if (m === null) continue;
    for (const b of bloques) {
      const s = parseHora(b.hora);
      if (m < s + 60 && s < m + 60) tomadas.add(b.hora);
    }
  }
  return [...tomadas];
}

export function construirOferta(dias = [], ocupadas = {}, general = {}, opciones = {}) {
  const horarios = {};
  const libres = [];
  for (const d of dias) {
    const tomadas = new Set(ocupadas[d] || []);
    const lista = bloquesDia(d, general, opciones).map(b => ({ ...b, ocupada: tomadas.has(b.hora) }));
    horarios[d] = lista;
    if (lista.some(b => !b.ocupada)) libres.push(d);
  }
  return { dias, libres, horarios };
}

export function utcDeChile(dia, hora) {
  const [y, m, d] = dia.split('-').map(Number);
  const [hh, mm] = hora.split(':').map(Number);
  const target = Date.UTC(y, m - 1, d, hh, mm, 0);
  const guess = target + 3 * 3600000;
  const partes = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date(guess)).map(p => [p.type, p.value]));
  const diff = target - Date.UTC(Number(partes.year), Number(partes.month) - 1, Number(partes.day), Number(partes.hour), Number(partes.minute), 0);
  return new Date(guess + diff);
}

const icsStamp = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const icsText = v => String(v || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
export function generarIcs({ dia, hora, titulo, descripcion = '', ubicacion = '', uid = '' }) {
  if (!esFecha(dia) || !rangoHora(hora)) return '';
  const inicio = utcDeChile(dia, hora);
  const fin = new Date(inicio.getTime() + 60 * 60000);
  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ZEROK//Agenda//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${icsText(uid || `${dia}-${hora}@zerok.cl`)}`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(inicio)}`,
    `DTEND:${icsStamp(fin)}`,
    `SUMMARY:${icsText(titulo)}`,
    ...(descripcion ? [`DESCRIPTION:${icsText(descripcion)}`] : []),
    ...(ubicacion ? [`LOCATION:${icsText(ubicacion)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR'
  ];
  return `${lineas.join('\r\n')}\r\n`;
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

export function validarReserva(input, oferta, opciones = equipos) {
  const limites = { equipo: 60, problema: 600, dia: 10, hora: 5, direccion: 150, sector: 80, referencia: 150, nombre: 80, telefono: 30 };
  if (Object.entries(limites).some(([k, max]) => input[k] !== undefined && (typeof input[k] !== 'string' || input[k].length > max))) return { error: 'Revisa los datos: hay un campo demasiado largo o con formato incorrecto.', errores: [] };
  const linea = (k, max) => limpiar(input[k], max).replace(/\s+/g, ' ');
  const visita = { equipo: linea('equipo', 60), problema: limpiar(input.problema, 600), dia: linea('dia', 10), hora: linea('hora', 5), direccion: linea('direccion', 150), sector: linea('sector', 80), referencia: linea('referencia', 150), nombre: linea('nombre', 80), telefono: telefono(input.telefono) };
  // Every missing or invalid field gets its own message, linked back to the input.
  const errores = [];
  if (!opciones.includes(visita.equipo)) errores.push({ campo: 'equipo', mensaje: 'Elige el equipo que necesitas revisar.' });
  if (!visita.problema) errores.push({ campo: 'problema', mensaje: 'Cuéntanos qué le pasa a tu equipo.' });
  else if (visita.equipo === 'Otro equipo' && visita.problema.length < 12) errores.push({ campo: 'problema', mensaje: 'Cuéntanos qué equipo es y qué le pasa.' });
  const dias = oferta?.dias || [];
  const libres = oferta?.libres || dias;
  const diaValido = dias.includes(visita.dia);
  if (!diaValido) errores.push({ campo: 'dia', mensaje: 'Elige uno de los días disponibles.' });
  else if (!libres.includes(visita.dia)) errores.push({ campo: 'dia', mensaje: 'Ese día ya no tiene horas disponibles. Elige otro día.' });
  if (!visita.hora) errores.push({ campo: 'hora', mensaje: 'Elige una hora disponible.' });
  else if (diaValido) {
    const slot = (oferta.horarios?.[visita.dia] || []).find(s => s.hora === visita.hora);
    if (!slot) errores.push({ campo: 'hora', mensaje: 'Elige una hora dentro del horario de atención de ese día.' });
    else if (slot.ocupada) errores.push({ campo: 'hora', mensaje: 'Esa hora ya fue tomada para ese día. Elige otra disponible.' });
  }
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

// Email layout: 600 px tables with inline styles, the only form Gmail, Outlook and Apple Mail render alike.
const C = { marino: '#042c56', tinta: '#0c2340', gris: '#4a5f75', fondo: '#eef3f5', linea: '#c6d4de', ambar: '#e09a1f', hielo: '#2381a9' };
const mono = `700 12px/1.3 'Courier New',monospace;letter-spacing:.1em;text-transform:uppercase`;
const boton = (href, texto, fondo, color = '#ffffff') => `<td style="padding:0 8px 8px 0"><a href="${esc(href)}" style="display:inline-block;background:${fondo};color:${color};font:700 15px/1 Arial,sans-serif;text-decoration:none;padding:14px 22px;border-radius:999px">${texto}</a></td>`;
function marco(env, { aviso, titulo, previa, cuerpo, pie = '' }) {
  const sitio = new URL('/', env.SITE_URL || 'https://zerok.cl').href;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(titulo)}</title></head>`
    + `<body style="margin:0;padding:0;background:${C.fondo}"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(previa)}</div>`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fondo}"><tr><td align="center" style="padding:24px 12px">`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:${C.tinta}">`
    + `<tr><td style="padding:18px 28px"><a href="${esc(sitio)}"><img src="${esc(new URL('/img/logo.png', sitio).href)}" width="64" height="64" alt="ZÉROK" style="display:block;border:0"></a></td></tr>`
    + `<tr><td style="padding:0;font-size:0;line-height:0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td height="5" style="background:${C.hielo}"></td><td height="5" style="background:#bd541c"></td><td height="5" style="background:#e4ac4b"></td></tr></table></td></tr>`
    + `<tr><td style="background:${C.marino};padding:26px 28px 28px;color:#ffffff"><p style="margin:0 0 10px;font:${mono};color:#9fc6d8">${esc(aviso)}</p><h1 style="margin:0;font:800 26px/1.2 Arial,Helvetica,sans-serif;color:#ffffff">${esc(titulo)}</h1></td></tr>`
    + `<tr><td style="padding:28px">${cuerpo}</td></tr>`
    + `<tr><td style="padding:18px 28px 24px;border-top:1px solid ${C.linea};font:13px/1.5 Arial,sans-serif;color:${C.gris}">${pie || `Aviso automático de la agenda de <a href="${esc(sitio)}" style="color:${C.gris}">zerok.cl</a>. Los datos del cliente son privados: úsalos solo para esta visita.`}</td></tr>`
    + `</table></td></tr></table></body></html>`;
}
const filas = datos => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${datos.map(([k, x]) => `<tr><td style="padding:12px 12px 12px 0;border-bottom:1px solid ${C.linea};width:32%;vertical-align:top;font:${mono};color:${C.gris}">${esc(k)}</td><td style="padding:12px 0;border-bottom:1px solid ${C.linea};vertical-align:top;font:16px/1.45 Arial,sans-serif;color:${C.tinta}">${x}</td></tr>`).join('')}</table>`;

async function enviar(env, subject, text, html) {
  if (!correoActivo(env)) throw new Error('Correo no habilitado.');
  await env.AVISOS.send({
    from: { email: 'avisos@zerok.cl', name: 'Avisos ZÉROK' },
    to: 'avisos@zerok.cl',
    subject: subject.replace(/\s+/g, ' ').slice(0, 200),
    text,
    html
  });
}

export async function avisoReserva(env, v) {
  // A request queued before its preferred day passed is labeled pending work, never "new".
  const atrasada = esFecha(v.dia) && v.dia < hoy();
  const wsp = /^\+56\d{9}$/.test(v.telefono || '') ? v.telefono.slice(1) : '';
  const recibida = esFecha((v.creada || '').slice(0, 10)) ? v.creada.slice(0, 10) : '';
  const bloque = rangoHora(v.hora);
  const datos = [[atrasada ? 'Día pedido (ya pasó)' : 'Día pedido', etiqueta(v.dia)], ...(bloque ? [['Horario pedido', bloque]] : []), ...(atrasada && recibida ? [['Recibida', etiqueta(recibida)]] : []), ['Nombre', v.nombre], ['Teléfono', telefonoVisible(v.telefono)], ['Dirección', `${v.direccion}, ${v.sector}`], ...(v.referencia ? [['Referencia', v.referencia]] : []), ['Equipo', v.equipo], ['Problema', v.problema]];
  const titulo = atrasada ? 'Solicitud pendiente de visita' : 'Nueva solicitud de visita';
  const text = `${titulo}\n\n${datos.map(([k, x]) => `${k}: ${x}`).join('\n')}\n\nLlamar: tel:${v.telefono}\n${wsp ? `WhatsApp: https://wa.me/${wsp}\n` : ''}Mapa: ${mapa(v)}\nConfirmar en el panel: ${panel(env)}\n`;
  const dia = etiqueta(v.dia);
  const cuerpo = `<p style="margin:0 0 6px;font:${mono};color:${C.gris}">${atrasada ? 'Día pedido, ya pasó' : 'Día y horario pedido'}</p>`
    + `<p style="margin:0 0 22px;font:800 26px/1.15 Arial,sans-serif;color:${C.marino}">${esc(dia.charAt(0).toUpperCase() + dia.slice(1))}${bloque ? `<br><span style="font-size:20px;color:${C.hielo}">${esc(bloque)}</span>` : ''}</p>`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fondo};border-left:5px solid ${C.ambar};margin:0 0 22px"><tr><td style="padding:18px 20px"><p style="margin:0 0 8px;font:${mono};color:${C.gris}">${esc(v.equipo)}</p><p style="margin:0;font:17px/1.5 Arial,sans-serif;color:${C.tinta}">${esc(v.problema).replace(/\n/g, '<br>')}</p></td></tr></table>`
    + filas([...(atrasada && recibida ? [['Recibida', esc(etiqueta(recibida))]] : []), ['Cliente', `<strong>${esc(v.nombre)}</strong>`], ['Teléfono', `<a href="tel:${esc(v.telefono)}" style="color:${C.tinta};font-weight:700">${esc(telefonoVisible(v.telefono))}</a>`], ['Dirección', `<a href="${esc(mapa(v))}" style="color:${C.tinta}">${esc(`${v.direccion}, ${v.sector}`)}</a>`], ...(v.referencia ? [['Referencia', esc(v.referencia)]] : [])])
    + `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 4px"><tr>${boton(`tel:${v.telefono}`, 'Llamar', C.ambar, C.tinta)}${wsp ? boton(`https://wa.me/${wsp}`, 'WhatsApp', '#1f7a45') : ''}${boton(mapa(v), 'Ver mapa', C.hielo)}${boton(panel(env), 'Abrir en el panel', C.marino)}</tr></table>`
    + `<p style="margin:18px 0 0;font:15px/1.5 Arial,sans-serif;color:${C.gris}">Cuando confirmes la visita con el cliente, <a href="${esc(panel(env))}" style="color:${C.marino};font-weight:700">márcala en el panel</a>.</p>`;
  const html = marco(env, { aviso: atrasada ? 'Solicitud pendiente' : 'Nueva solicitud', titulo: `${v.nombre} pide visita: ${v.equipo.toLowerCase()}`, previa: `${dia}${bloque ? ` (${bloque})` : ''} · ${v.sector} · ${v.problema.slice(0, 80)}`, cuerpo });
  const corto = etiqueta(v.dia, { weekday: 'short', day: 'numeric', month: 'short' });
  const cortoHora = bloque ? `${corto} (${bloque})` : corto;
  await enviar(env, atrasada ? `Solicitud pendiente: ${v.nombre}, ${v.equipo.toLowerCase()}, día pedido ${cortoHora}` : `Nueva visita: ${v.nombre}, ${v.equipo.toLowerCase()}, ${cortoHora}`, text, html);
}

export async function avisoSeguimiento(env, visitas) {
  const fila = v => `${v.nombre}, ${v.equipo.toLowerCase()}, visita realizada el ${etiqueta(v.realizada, { day: 'numeric', month: 'long' })}`;
  const text = `Llamados de seguimiento pendientes\n\n${visitas.map(v => `- ${fila(v)}\n  Teléfono: ${telefonoVisible(v.telefono)} (tel:${v.telefono})${v.nota ? `\n  Se hizo: ${v.nota}` : ''}`).join('\n\n')}\n\nCuando llames, márcalo en el panel: ${panel(env)}\n`;
  const cuerpo = filas(visitas.map(v => [etiqueta(v.realizada, { day: 'numeric', month: 'short' }), `<strong>${esc(v.nombre)}</strong>, ${esc(v.equipo.toLowerCase())}<br><a href="tel:${esc(v.telefono)}" style="color:${C.tinta};font-weight:700">${esc(telefonoVisible(v.telefono))}</a>${v.nota ? `<br><span style="color:${C.gris}">Se hizo: ${esc(v.nota)}</span>` : ''}`]))
    + `<p style="margin:22px 0 0;font:15px/1.5 Arial,sans-serif;color:${C.gris}">Cuando llames, <a href="${esc(panel(env))}" style="color:${C.marino};font-weight:700">márcalo en el panel</a>.</p>`;
  const html = marco(env, { aviso: 'Seguimiento', titulo: 'Llamados de seguimiento pendientes', previa: visitas.map(v => v.nombre).join(', '), cuerpo });
  await enviar(env, visitas.length === 1 ? `Hoy toca llamar a ${visitas[0].nombre}` : `Hoy toca llamar a ${visitas.length} clientes`, text, html);
}

// Resumen de un trabajo hecho: el mismo contenido sirve para el correo, su vista previa y el texto de WhatsApp.
export const correoClientes = env => env.AVISOS_HABILITADOS === 'true' && typeof env.CLIENTES?.send === 'function';
export const precioVisible = p => /^\d+$/.test(p) ? `$${Number(p).toLocaleString('es-CL')}` : '';
export function resumenTrabajo(env, t, general = {}) {
  const sitio = env.SITE_URL || 'https://zerok.cl';
  const abs = src => new URL(src, sitio).href;
  const fecha = etiqueta(t.fecha, { day: 'numeric', month: 'long', year: 'numeric' });
  const lugar = [t.direccion, t.sector].filter(Boolean).join(', ');
  const precio = precioVisible(t.precio);
  const fono = general.telefono || '';
  const wsp = /^\+56\d{9}$/.test(fono) ? `https://wa.me/${fono.slice(1)}` : '';
  const datos = [['Fecha', fecha], ...(lugar ? [['Lugar', lugar]] : []), ['Equipo', t.equipo], ...(precio ? [['Valor', precio]] : []), ...(t.garantia ? [['Garantía y observaciones', t.garantia]] : [])];
  const grupos = [['Antes', t.antes], ['Después', t.despues]].filter(([, fotos]) => fotos.length);
  const text = `Hola ${t.nombre}, este es el resumen del trabajo que hizo ZÉROK.\n\nTrabajo realizado:\n${t.descripcion}\n\n${datos.map(([k, x]) => `${k}: ${x}`).join('\n')}\n`
    + grupos.map(([k, fotos]) => `\nFotos de ${k.toLowerCase()}:\n${fotos.map(abs).join('\n')}\n`).join('')
    + `\nSi tienes dudas, escríbenos${fono ? ` o llama al ${telefonoVisible(fono)}` : ''}.\nZÉROK Refrigeración & Climatización Profesional\nEste resumen no es una boleta ni una factura.\n`;
  const foto = (src, k, i, n) => `<td width="${Math.floor(100 / n)}%" style="padding:0 6px 6px 0;vertical-align:top"><a href="${esc(abs(src))}"><img src="${esc(abs(src))}" width="${Math.floor(510 / n)}" alt="${esc(`Foto de ${k.toLowerCase()} ${i + 1}`)}" style="display:block;width:100%;max-width:${Math.floor(510 / n)}px;height:auto;border:0;border-radius:10px"></a><a href="${esc(abs(src))}" style="font:13px/1.6 Arial,sans-serif;color:${C.gris}">Ver foto</a></td>`;
  const cuerpo = `<p style="margin:0 0 18px;font:17px/1.5 Arial,sans-serif;color:${C.tinta}">Hola ${esc(t.nombre)}, este es el resumen del trabajo que hicimos.</p>`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fondo};border-left:5px solid ${C.ambar};margin:0 0 22px"><tr><td style="padding:18px 20px"><p style="margin:0 0 8px;font:${mono};color:${C.gris}">Trabajo realizado</p><p style="margin:0;font:17px/1.5 Arial,sans-serif;color:${C.tinta}">${esc(t.descripcion).replace(/\n/g, '<br>')}</p></td></tr></table>`
    + filas(datos.map(([k, x]) => [k, k === 'Valor' ? `<strong>${esc(x)}</strong>` : esc(x).replace(/\n/g, '<br>')]))
    + grupos.map(([k, fotos]) => `<p style="margin:24px 0 10px;font:${mono};color:${C.gris}">${k}</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${fotos.map((src, i) => foto(src, k, i, fotos.length)).join('')}</tr></table>`).join('')
    + (fono ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 4px"><tr>${wsp ? boton(wsp, 'Escribir por WhatsApp', '#1f7a45') : ''}${boton(`tel:${fono}`, 'Llamar', C.ambar, C.tinta)}</tr></table>` : '');
  const html = marco(env, { aviso: 'Resumen de trabajo', titulo: `${t.equipo}: trabajo realizado`, previa: `${fecha}. ${t.descripcion.slice(0, 90)}`, cuerpo, pie: `Recibes este correo porque ZÉROK realizó un trabajo para ti y le diste tu dirección. Este resumen no es una boleta ni una factura. Si quieres que borremos tus datos, responde este correo.` });
  return { asunto: `Resumen de tu trabajo con ZÉROK, ${etiqueta(t.fecha, { day: 'numeric', month: 'long' })}`, text, html };
}
export async function enviarTrabajo(env, t, general) {
  if (!correoClientes(env)) throw new Error('Correo no habilitado.');
  const { asunto, text, html } = resumenTrabajo(env, t, general);
  // La copia oculta deja el respaldo en el buzón del técnico; las respuestas del cliente llegan al mismo buzón.
  await env.CLIENTES.send({ from: { email: 'avisos@zerok.cl', name: 'ZÉROK' }, to: t.correo, bcc: 'avisos@zerok.cl', replyTo: 'avisos@zerok.cl', subject: asunto, text, html });
}
