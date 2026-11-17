const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const EQUIPOS = ['Refrigerador', 'Vitrina o conservador', 'Aire acondicionado', 'Aire acondicionado de auto', 'Lavadora o secadora', 'Calefón o calefacción', 'Equipo comercial', 'Otro equipo'];
const fecha = d => d ? new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${d}T12:00:00Z`)) : '';
const fechaLarga = d => d ? new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${d}T12:00:00Z`)).replace(/\./g, '') : '';
const parseHora = v => {
  if (typeof v !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v)) return null;
  const [h, m] = v.split(':').map(Number);
  return h * 60 + m;
};
const formatHora = mins => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
const rangoHora = h => {
  const m = parseHora(h);
  if (m === null || m + 60 > 1440) return '';
  return `${formatHora(m)} a ${formatHora(m + 60)}`;
};
const bloquesDiaLocal = (dia, general = {}) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia || '')) return [];
  const dow = new Date(`${dia}T12:00:00Z`).getUTCDay();
  if (dow === 0) return [];
  const confirmado = general?.horarioConfirmado && parseHora(general.abre) !== null && parseHora(general.cierra) !== null;
  const inicio = confirmado ? parseHora(general.abre) : 9 * 60;
  const cierreStr = confirmado ? (dow === 6 ? (general.cierraSabado || general.cierra) : general.cierra) : (dow === 6 ? '14:00' : '18:00');
  const fin = parseHora(cierreStr) ?? (dow === 6 ? 14 * 60 : 18 * 60);
  const bloques = [];
  for (let m = inicio; m + 60 <= fin; m += 60) {
    const hora = formatHora(m);
    const hasta = formatHora(m + 60);
    bloques.push({ hora, fin: hasta, label: `${hora} a ${hasta}` });
  }
  return bloques;
};
const utcDeChile = (dia, hora) => {
  const [y, m, d] = dia.split('-').map(Number);
  const [hh, mm] = hora.split(':').map(Number);
  const target = Date.UTC(y, m - 1, d, hh, mm, 0);
  const guess = target + 3 * 3600000;
  const partes = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date(guess)).map(p => [p.type, p.value]));
  const diff = target - Date.UTC(Number(partes.year), Number(partes.month) - 1, Number(partes.day), Number(partes.hour), Number(partes.minute), 0);
  return new Date(guess + diff);
};
const icsStamp = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const icsText = v => String(v || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
const generarIcsCliente = v => {
  if (!v?.dia || !rangoHora(v.hora)) return '';
  const inicio = utcDeChile(v.dia, v.hora);
  const fin = new Date(inicio.getTime() + 60 * 60000);
  const desc = [
    `Equipo: ${v.equipo}`,
    v.telefono ? `Teléfono: ${telefonoVisible(v.telefono)}` : '',
    v.problema ? `Problema: ${v.problema}` : '',
    v.referencia ? `Referencia: ${v.referencia}` : ''
  ].filter(Boolean).join('\n');
  const ubicacion = [v.direccion, v.sector, 'Osorno'].filter(Boolean).join(', ');
  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ZEROK//Admin Agenda//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${icsText(`${v.id}@zerok.cl`)}`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(inicio)}`,
    `DTEND:${icsStamp(fin)}`,
    `SUMMARY:${icsText(`Visita ZÉROK: ${v.nombre} (${v.equipo})`)}`,
    ...(desc ? [`DESCRIPTION:${icsText(desc)}`] : []),
    ...(ubicacion ? [`LOCATION:${icsText(ubicacion)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR'
  ];
  return `${lineas.join('\r\n')}\r\n`;
};

const ico = d => `<svg class="ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICO = {
  fono: ico('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
  chat: ico('<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"/>'),
  mapa: ico('<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>')
};
const estados = { solicitada: 'Por confirmar', confirmada: 'Confirmada', realizada: 'Llamar luego', cerrada: 'Cerrada', cancelada: 'Cancelada', ausente: 'No estaba' };
const sumar = (d, n) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const telefonoVisible = t => /^\+569\d{8}$/.test(t) ? `+56 9 ${t.slice(4, 8)} ${t.slice(8)}` : t;
const hace = iso => {
  const min = Math.floor((Date.now() - Date.parse(iso)) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
};

export function agendaPanel(root, api, status, activo, avisar = () => {}, autorizado = () => true) {
  const esEscritorio = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
  let data, vista = 'pendientes', cargando = false, configDirty = false, nuevaDirty = false, busqueda = '', mesCursor = null, diaSel = null, mesBloq = null;
  let calAbierto = esEscritorio();
  let nuevaAbierta = false, nuevaDiaDef = '';

  const filtros = {
    pendientes: ['Por confirmar', v => v.estado === 'solicitada'],
    hoy: ['Hoy', v => ['solicitada', 'confirmada'].includes(v.estado) && v.dia === data.hoy],
    semana: ['7 días', v => ['solicitada', 'confirmada'].includes(v.estado) && v.dia >= data.hoy && v.dia <= sumar(data.hoy, 6)],
    seguimiento: ['Llamados', v => v.estado === 'realizada'],
    todas: ['Todas', () => true]
  };
  const campo = (name, label, value = '', type = 'text', attrs = '') => `<label class="admin-field">${label}<input name="${name}" type="${type}" value="${esc(value)}" ${attrs}></label>`;
  const accion = (a, text, cls = '') => `<button class="editor-action ${cls}" type="button" data-visita-accion="${a}">${text}</button>`;

  const activasEnDia = dia => data.visitas.filter(v => v.dia === dia && ['solicitada', 'confirmada'].includes(v.estado));
  const visitaEnBloque = (dia, hora) => {
    const s = parseHora(hora);
    if (s === null) return null;
    return activasEnDia(dia).find(v => {
      const m = parseHora(v.hora);
      return m !== null && m < s + 60 && s < m + 60;
    }) || null;
  };
  const siguienteBloque = (dia, hora) => {
    const m = parseHora(hora);
    if (m === null) return '';
    const sig = formatHora(m + 60);
    return bloquesDiaLocal(dia, data.general).some(b => b.hora === sig) ? sig : '';
  };
  const opcionesBloqueSelect = (dia, seleccionada = '') => {
    const bloques = bloquesDiaLocal(dia, data.general);
    const bloqueadas = new Set(data.config.horasBloqueadas?.[dia] || []);
    return `<option value="">Sin hora fija</option>${bloques.map(b => {
      const ocup = visitaEnBloque(dia, b.hora);
      const bloq = bloqueadas.has(b.hora);
      const extra = ocup ? ` (ocupada: ${ocup.nombre})` : bloq ? ' (bloqueada)' : '';
      return `<option value="${b.hora}"${seleccionada === b.hora ? ' selected' : ''}>${esc(b.label + extra)}</option>`;
    }).join('')}`;
  };
  const datalistBloques = (dia, id) => {
    const bloques = bloquesDiaLocal(dia, data.general);
    return `<datalist id="${esc(id)}">${bloques.map(b => `<option value="${b.hora}">${esc(b.label)}</option>`).join('')}</datalist>`;
  };

  function tarjeta(v) {
    const abierta = ['solicitada', 'confirmada'].includes(v.estado);
    const pasada = abierta && v.dia < data.hoy;
    const bloque = rangoHora(v.hora);
    const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${v.direccion}, ${v.sector}, Chile`)}`;
    const wsp = /^\+56\d{9}$/.test(v.telefono) ? v.telefono.slice(1) : '';
    const saludo = `Hola ${v.nombre}, te escribo de ZÉROK por tu solicitud de visita del ${fecha(v.dia)}${bloque ? ` de ${bloque}` : ''} para tu ${v.equipo.toLowerCase()}.`;
    const sigHora = abierta && bloque ? siguienteBloque(v.dia, v.hora) : '';
    const sigBloqueada = sigHora && (data.config.horasBloqueadas?.[v.dia] || []).includes(sigHora);
    const dirTexto = [v.direccion, v.sector].filter(Boolean).join(', ');
    const [desde, hasta] = bloque ? bloque.split(' a ') : [];
    const abrir = { solicitada: 'Confirmar o cambiar la hora', confirmada: 'Marcar realizada o cambiar', realizada: 'Registrar el llamado' }[v.estado] || 'Ver detalle';

    return `<details class="visita visita-${esc(v.estado)}" data-visita="${esc(v.id)}">
      <summary>
        <span class="visita-talon mono">${bloque ? `<b>${desde}</b><span>a ${hasta}</span>` : '<span>Sin hora</span>'}</span>
        <span class="visita-resumen">
          <b class="visita-nombre">${esc(v.nombre)}</b>
          <span class="visita-sub">${esc([v.equipo, v.sector].filter(Boolean).join(' · '))}</span>
          ${v.direccion ? `<span class="visita-dir">${esc(v.direccion)}</span>` : ''}
          <span class="visita-pie"><span class="visita-estado estado-${esc(v.estado)}">${estados[v.estado]}</span>${pasada ? '<b class="visita-pasada">Atrasada</b>' : `<span>Ingresada ${hace(v.creada)}</span>`}</span>
        </span>
        <span class="visita-acciones">
          ${v.telefono ? `<a class="editor-action${v.estado === 'solicitada' ? ' primaria' : ''}" href="tel:${esc(v.telefono)}">${ICO.fono}Llamar</a>` : ''}
          ${wsp ? `<a class="editor-action" href="https://wa.me/${wsp}?text=${encodeURIComponent(saludo)}" target="_blank" rel="noopener noreferrer">${ICO.chat}WhatsApp</a>` : ''}
          ${dirTexto ? `<a class="editor-action" href="${esc(mapa)}" target="_blank" rel="noopener noreferrer">${ICO.mapa}Mapa</a>` : ''}
        </span>
        <span class="visita-abrir">${abrir}</span>
      </summary>
      <div class="visita-detalle">
      <div class="visita-secundarias">
        ${dirTexto ? `<button class="editor-action mini" type="button" data-copiar="${esc(dirTexto)}">Copiar dirección</button>` : ''}
        ${bloque ? `<button class="editor-action mini" type="button" data-visita-ics="${esc(v.id)}">Calendario (.ics)</button>` : ''}
        ${sigHora ? `<button class="editor-action mini${sigBloqueada ? ' activa' : ''}" type="button" data-toggle-hora="${esc(`${v.dia}|${sigHora}`)}">${sigBloqueada ? `Liberar ${rangoHora(sigHora)}` : `Bloquear ${rangoHora(sigHora)}`}</button>` : ''}
        ${v.estado === 'solicitada' && data.correo ? accion('reenviar', 'Reenviar correo', 'mini') : ''}
      </div>
      <dl class="visita-datos">
        ${bloque ? `<dt>Horario</dt><dd>${esc(bloque)}</dd>` : ''}
        ${v.problema ? `<dt>Problema</dt><dd>${esc(v.problema)}</dd>` : ''}
        ${dirTexto ? `<dt>Dirección</dt><dd>${esc(dirTexto)}${v.referencia ? `<br>${esc(v.referencia)}` : ''}</dd>` : ''}
        ${v.telefono ? `<dt>Teléfono</dt><dd><a href="tel:${esc(v.telefono)}">${esc(telefonoVisible(v.telefono))}</a></dd>` : ''}
        ${v.correoAviso ? `<dt>Aviso correo</dt><dd>${v.correoAviso.enviada ? `enviado ${hace(v.correoAviso.enviada)}` : v.correoAviso.intentos ? 'reintentando tras un fallo' : 'pendiente de envío'}</dd>` : ''}
        ${v.realizada ? `<dt>Realizada</dt><dd>${fecha(v.realizada)}</dd><dt>Seguimiento</dt><dd>${fecha(v.seguimiento)}${v.seguimiento <= data.hoy && v.estado === 'realizada' ? ' (toca llamar)' : ''}</dd>` : ''}
        ${v.nota ? `<dt>Trabajo</dt><dd>${esc(v.nota)}</dd>` : ''}
        ${v.resultado ? `<dt>Resultado</dt><dd>${esc(v.resultado)}</dd>` : ''}
      </dl>
      ${abierta ? `<fieldset class="visita-coordinar"><legend>Coordinar día y hora</legend><div class="field-grid">${campo('dia', 'Día acordado', v.dia, 'date', `required min="${data.hoy}"`)}${campo('hora', 'Hora acordada (opcional)', v.hora, 'time', `list="horas-${esc(v.id)}"`)}${datalistBloques(v.dia, `horas-${v.id}`)}</div>${accion('confirmar', v.estado === 'confirmada' ? 'Guardar coordinación' : 'Confirmar visita')}</fieldset><label class="admin-field">Trabajo realizado (opcional)<textarea name="nota" rows="2" maxlength="500"></textarea></label><div class="visita-decision">${accion('realizada', 'Marcar realizada')}${accion('ausente', 'No estaba')}${accion('cancelar', 'Cancelar visita')}</div>` : ''}
      ${v.estado === 'realizada' ? `<label class="admin-field">¿Cómo quedó el equipo?<textarea name="resultado" rows="2" maxlength="500"></textarea></label>${accion('cerrar', 'Llamado realizado y cerrar')}` : ''}
      <div class="visita-borrar">${accion('eliminar', 'Borrar datos de esta visita', 'danger')}</div>
      </div>
    </details>`;
  }

  function formularioNueva() {
    if (!nuevaAbierta) return '';
    const diaIni = nuevaDiaDef && nuevaDiaDef >= data.hoy ? nuevaDiaDef : (diaSel && diaSel >= data.hoy ? diaSel : data.hoy);
    return `<section class="editor-group agenda-nueva" aria-label="Nueva visita manual">
      <div class="agenda-nueva-head">
        <h2>Agendar visita manual</h2>
        <button type="button" class="editor-action mini" data-nueva-cerrar>Cerrar</button>
      </div>
      <div class="field-grid">
        <label class="admin-field">Nombre del cliente<input name="nueva-nombre" type="text" maxlength="80" required placeholder="Ej: Juan Pérez"></label>
        <label class="admin-field">Teléfono<input name="nueva-telefono" type="tel" maxlength="30" placeholder="9 1234 5678"></label>
        <label class="admin-field">Día<input name="nueva-dia" type="date" min="${data.hoy}" value="${esc(diaIni)}" required></label>
        <label class="admin-field">Bloque horario (1 hora)<select name="nueva-hora">${opcionesBloqueSelect(diaIni)}</select></label>
        <label class="admin-field">Equipo<select name="nueva-equipo">${EQUIPOS.map(e => `<option value="${esc(e)}">${esc(e)}</option>`).join('')}</select></label>
        <label class="admin-field">Sector o comuna<input name="nueva-sector" type="text" maxlength="80" placeholder="Ej: Rahue, Centro"></label>
        <label class="admin-field wide">Dirección<input name="nueva-direccion" type="text" maxlength="150" placeholder="Calle y número"></label>
        <label class="admin-field wide">Referencia (opcional)<input name="nueva-referencia" type="text" maxlength="150"></label>
        <label class="admin-field wide">Problema o nota (opcional)<textarea name="nueva-problema" rows="2" maxlength="600"></textarea></label>
      </div>
      <div class="agenda-nueva-pie">
        <button type="button" class="editor-action primaria" data-visita-crear>Guardar visita confirmada</button>
      </div>
    </section>`;
  }

  function inspectorDia() {
    if (!diaSel) return '';
    const bloques = bloquesDiaLocal(diaSel, data.general);
    const bloqueadas = new Set(data.config.horasBloqueadas?.[diaSel] || []);
    const diaCerrado = (data.config.bloqueados || []).includes(diaSel);
    const pasado = diaSel < data.hoy;
    const sinHora = activasEnDia(diaSel).filter(v => !rangoHora(v.hora));

    return `<div class="agenda-dia-detalle">
      <div class="dia-detalle-head">
        <div>
          <h3>${esc(fechaLarga(diaSel))}</h3>
          <p class="help">${diaCerrado ? 'Día completo marcado como cerrado.' : `${bloques.length} bloques en horario de atención.`}</p>
        </div>
        <div class="dia-detalle-btns">
          ${!pasado ? `<button type="button" class="editor-action mini primaria" data-agendar-dia="${diaSel}">+ Agendar aquí</button>` : ''}
          <button type="button" class="editor-action mini" data-dia-limpiar>Ver todas</button>
        </div>
      </div>
      ${bloques.length ? `<div class="dia-bloques">${bloques.map(b => {
        const ocup = visitaEnBloque(diaSel, b.hora);
        const bloq = bloqueadas.has(b.hora);
        if (ocup) {
          return `<div class="dia-bloque ocupado"><span class="mono">${esc(b.label)}</span><button type="button" class="dia-bloque-visita" data-visita-abrir="${esc(ocup.id)}"><b>${esc(ocup.nombre)}</b> · ${esc(estados[ocup.estado])}</button></div>`;
        }
        return `<div class="dia-bloque${bloq ? ' bloqueado' : ''}"><span class="mono">${esc(b.label)}</span><span class="dia-bloque-estado">${bloq ? 'Bloqueada' : 'Disponible'}</span>${pasado ? '' : `<button type="button" class="editor-action mini" data-toggle-hora="${esc(`${diaSel}|${b.hora}`)}">${bloq ? 'Liberar' : 'Bloquear'}</button>`}</div>`;
      }).join('')}</div>` : '<p class="help">No hay atención programada para este día.</p>'}
      ${sinHora.length ? `<p class="help dia-sin-hora">Además hay ${sinHora.length} visita${sinHora.length === 1 ? '' : 's'} sin hora fija en este día.</p>` : ''}
    </div>`;
  }

  function render() {
    if (!activo() || !data) return;
    configDirty = false;
    nuevaDirty = false;
    const abiertas = new Set([...root.querySelectorAll('[data-visita][open]')].map(d => d.dataset.visita));
    const configAbierta = !!root.querySelector('.agenda-config[open]');
    const foco = (() => {
      const el = document.activeElement;
      if (!el || !root.contains(el)) return null;
      const clave = el.dataset.visitaAccion ? `[data-visita-accion="${el.dataset.visitaAccion}"]`
        : el.dataset.vista ? `[data-vista="${el.dataset.vista}"]`
        : el.dataset.dia ? `[data-dia="${el.dataset.dia}"]`
        : el.dataset.toggleHora ? `[data-toggle-hora="${CSS.escape(el.dataset.toggleHora)}"]`
        : el.hasAttribute('data-agenda-refresh') ? '[data-agenda-refresh]'
        : el.hasAttribute('data-agenda-config') ? '[data-agenda-config]'
        : el.hasAttribute('data-nueva-toggle') ? '[data-nueva-toggle]'
        : el.hasAttribute('data-copiar') ? '[data-copiar]'
        : el.name ? `[name="${el.name}"]`
        : el.tagName === 'SUMMARY' ? 'summary'
        : el.tagName === 'A' ? (el.getAttribute('href').startsWith('tel:') ? 'a[href^="tel:"]' : el.href.includes('wa.me') ? 'a[href*="wa.me"]' : 'a[href*="maps"]')
        : null;
      if (!clave) return null;
      const card = el.closest('[data-visita]');
      if (card) return `[data-visita="${CSS.escape(card.dataset.visita)}"] ${clave}`;
      if (el.closest('.agenda-config')) return `.agenda-config ${clave}`;
      if (el.closest('.agenda-nueva')) return `.agenda-nueva ${clave}`;
      return clave;
    })();
    const texto = busqueda.trim().toLowerCase();
    const coincide = v => !texto || [v.nombre, v.telefono, v.direccion, v.sector, v.equipo, v.problema].join(' ').toLowerCase().includes(texto);
    const visitas = data.visitas.filter(filtros[vista][1]).filter(coincide).filter(v => !diaSel || v.dia === diaSel);
    const pendientes = data.avisos?.pendientes || 0;
    const reintentos = data.avisos?.reintentos || 0;
    const avisos = data.correo
      ? `Avisos por correo activos${pendientes ? ` · ${pendientes} pendiente${pendientes === 1 ? '' : 's'} de envío` : ''}${reintentos ? ` · ${reintentos} reintentando tras un fallo` : ''}.`
      : 'Correo desactivado hasta conectar zerok.cl: revisa esta pantalla.';
    const totalBloqHoras = Object.values(data.config.horasBloqueadas || {}).reduce((acc, hs) => acc + hs.length, 0);

    const relativo = dia => dia === data.hoy ? 'Hoy' : dia === sumar(data.hoy, 1) ? 'Mañana' : '';
    let lista = '', previo = '';
    for (const v of visitas) {
      if (v.dia !== previo) {
        const n = visitas.filter(x => x.dia === v.dia).length;
        lista += `<h2 class="agenda-dia">${relativo(v.dia) ? `<b>${relativo(v.dia)}</b>` : ''}<span>${esc(fechaLarga(v.dia))}</span><span class="agenda-dia-n mono">${n} visita${n === 1 ? '' : 's'}</span></h2>`;
        previo = v.dia;
      }
      lista += tarjeta(v);
    }

    root.innerHTML = `<div class="agenda-principal"><div class="agenda-toolbar"><div class="agenda-filtros" role="group" aria-label="Filtrar visitas">${Object.entries(filtros).map(([key, [label, filter]]) => `<button type="button" class="filtro" data-vista="${key}" aria-pressed="${vista === key}"><b class="mono">${data.visitas.filter(filter).length}</b><span>${label}</span></button>`).join('')}</div><div class="agenda-tools"><input class="agenda-busqueda" type="search" name="busqueda" placeholder="Buscar cliente, fono o dirección" value="${esc(busqueda)}" aria-label="Buscar visita"><button type="button" class="editor-action primaria" data-nueva-toggle aria-expanded="${nuevaAbierta}">+ Nueva visita</button><button type="button" class="editor-action" data-agenda-refresh>Actualizar</button><button type="button" class="editor-action" data-agenda-csv>CSV</button></div></div>${formularioNueva()}${lista || '<div class="empty-editor"><h2>Sin visitas en esta vista.</h2><p>Las solicitudes y los seguimientos aparecerán aquí.</p></div>'}</div><aside class="agenda-lateral" aria-label="Calendario y disponibilidad">${calendario()}<details class="editor-group agenda-config"><summary>Disponibilidad y avisos</summary><p>El cliente elige un día y un bloque de 1 hora disponible según el horario de atención; ese bloque queda ocupado hasta que canceles o cierres la visita.</p><label class="admin-field check"><input type="checkbox" name="activa" ${data.config.activa ? 'checked' : ''}>Activar solicitudes en línea</label><label class="admin-field check"><input type="checkbox" name="mismoDia" ${data.config.mismoDia ? 'checked' : ''}>Permitir agendar para el mismo día (con 2 horas de margen)</label><input type="hidden" name="bloqueados" value="${esc(data.config.bloqueados.join(' '))}"><div class="admin-field">Días que no atiendes${calendarioBloqueo()}<span class="help">Toca un día para bloquearlo o liberarlo; tachado significa cerrado. Para bloquear solo horas sueltas, toca el día en el calendario de arriba.${totalBloqHoras ? ` Actualmente tienes ${totalBloqHoras} bloque${totalBloqHoras === 1 ? '' : 's'} horario${totalBloqHoras === 1 ? '' : 's'} bloqueado${totalBloqHoras === 1 ? '' : 's'} manualmente.` : ''}</span></div>${campo('seguimiento', 'Días después de la visita para llamar', data.config.seguimiento, 'number', 'min="1" max="90" required')}<p class="help">Por defecto son 14 días. Cambiarlo solo afecta las próximas visitas que marques realizadas.</p><button type="button" class="editor-action" data-agenda-config>Guardar disponibilidad</button></details><p class="agenda-aviso${data.config.activa ? ' activa' : ''}">${data.config.activa ? 'Solicitudes en línea activas.' : 'Solicitudes en línea desactivadas.'} ${avisos}</p></aside>`;

    for (const id of abiertas) root.querySelector(`[data-visita="${CSS.escape(id)}"]`)?.setAttribute('open', '');
    if (configAbierta) root.querySelector('.agenda-config')?.setAttribute('open', '');
    if (foco) (root.querySelector(foco) || root.querySelector('[data-agenda-refresh]'))?.focus();
  }

  const mesHtml = (mes, marcar) => {
    const [anio, mesNum] = mes.split('-').map(Number);
    const total = new Date(Date.UTC(anio, mesNum, 0)).getUTCDate();
    const inicio = (new Date(Date.UTC(anio, mesNum - 1, 1)).getUTCDay() + 6) % 7;
    const dias = [];
    for (let i = 0; i < inicio; i++) dias.push('<span></span>');
    for (let d = 1; d <= total; d++) dias.push(marcar(`${mes}-${String(d).padStart(2, '0')}`));
    return `<div class="cal-head"><button type="button" class="editor-action" data-cal-mes="-1" aria-label="Mes anterior">‹</button><b class="cal-mes">${new Date(`${mes}-15T12:00:00Z`).toLocaleDateString('es-CL', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</b><button type="button" class="editor-action" data-cal-mes="1" aria-label="Mes siguiente">›</button></div><div class="cal-semana"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div><div class="cal-grid">${dias.join('')}</div>`;
  };
  const visitasPorDia = mes => {
    const porDia = {};
    for (const v of data.visitas) {
      if (!v.dia.startsWith(mes)) continue;
      const c = porDia[v.dia] ||= { solicitada: 0, confirmada: 0, realizada: 0, otras: 0 };
      if (c[v.estado] !== undefined) c[v.estado]++; else c.otras++;
    }
    return porDia;
  };
  const puntosDe = c => c ? `<span class="cal-puntos">${['solicitada', 'confirmada', 'realizada', 'otras'].map(e => c[e] ? `<i class="punto-${e}">${c[e]}</i>` : '').join('')}</span>` : '';

  function calendario() {
    const porDia = visitasPorDia(mesCursor);
    const bloqueados = new Set(data.config.bloqueados);
    return `<details class="agenda-cal-panel" ${calAbierto ? 'open' : ''}>
      <summary>
        <span class="cal-panel-titulo">Calendario y horarios</span>
        <span class="cal-panel-resumen mono">${diaSel ? `Viendo ${fecha(diaSel)}` : 'Elegir un día'}</span>
      </summary>
      <div class="agenda-calendario">${mesHtml(mesCursor, dia => {
        const c = porDia[dia];
        const tieneBloqHora = (data.config.horasBloqueadas?.[dia] || []).length > 0;
        return `<button type="button" class="cal-dia${dia === diaSel ? ' sel' : ''}${dia === data.hoy ? ' hoy' : ''}${dia < data.hoy ? ' pasado' : ''}${bloqueados.has(dia) ? ' bloqueado' : ''}${tieneBloqHora ? ' parches' : ''}" data-dia="${dia}">${Number(dia.slice(8))}${puntosDe(c)}</button>`;
      })}${inspectorDia()}</div>
    </details>`;
  }

  function calendarioBloqueo() {
    const porDia = visitasPorDia(mesBloq);
    const bloqueados = new Set((root.querySelector('[name="bloqueados"]')?.value || data.config.bloqueados.join(' ')).split(/\s+/).filter(Boolean));
    return `<div class="agenda-calendario bloq-cal">${mesHtml(mesBloq, dia => {
      const c = porDia[dia];
      return `<button type="button" class="cal-dia${bloqueados.has(dia) ? ' bloqueado' : ''}${dia === data.hoy ? ' hoy' : ''}${dia < data.hoy ? ' pasado' : ''}" data-bloq-dia="${dia}"${dia < data.hoy ? ' disabled' : ''}>${Number(dia.slice(8))}${puntosDe(c)}</button>`;
    }).replace(/data-cal-mes/g, 'data-bloq-mes')}</div>`;
  }

  async function load() {
    if (cargando) return true;
    if (!autorizado()) return false;
    cargando = true;
    try {
      const reciente = await api('visitas');
      if (!autorizado()) return false;
      avisar(reciente.visitas.filter(v => v.estado === 'solicitada').length);
      if (activo() && dirty()) return true;
      data = reciente;
      mesCursor ||= data.hoy.slice(0, 7);
      mesBloq ||= mesCursor;
      render();
      return true;
    } catch (error) {
      status(error.message, true);
      if (!data) root.innerHTML = `<div class="empty-editor"><h2>No se pudo cargar la agenda.</h2><p>${esc(error.message)}</p><button class="editor-action" type="button" data-agenda-refresh>Reintentar</button></div>`;
      return false;
    }
    finally { cargando = false; }
  }

  const dirty = () => configDirty || nuevaDirty || !!root.querySelector('[data-visita][data-dirty]');
  const discard = () => {
    configDirty = false;
    nuevaDirty = false;
    root.querySelectorAll('[data-visita][data-dirty]').forEach(card => delete card.dataset.dirty);
  };

  async function guardarHorasBloqueadas(horasBloqueadas, mensajeOk, button) {
    if (dirty() && !confirm('Hay cambios sin guardar en otra parte de la agenda. Al guardar este cambio se descartarán. ¿Seguir?')) return;
    if (button) button.disabled = true;
    try {
      const respuesta = await api('agenda', {
        method: 'PUT',
        body: JSON.stringify({
          revision: data.config.revision,
          activa: data.config.activa,
          bloqueados: data.config.bloqueados,
          horasBloqueadas,
          mismoDia: data.config.mismoDia,
          seguimiento: data.config.seguimiento
        })
      });
      if (!autorizado()) return;
      data = respuesta;
      avisar(data.visitas.filter(v => v.estado === 'solicitada').length);
      render();
      status(data.warning || mensajeOk, !!data.warning);
    } catch (error) {
      status(error.message, true);
    } finally {
      if (button) button.disabled = false;
    }
  }

  root.addEventListener('toggle', event => {
    if (event.target.classList?.contains('agenda-cal-panel')) {
      calAbierto = event.target.open;
    }
  }, true);

  root.addEventListener('input', event => {
    const card = event.target.closest('[data-visita]');
    if (card) {
      card.dataset.dirty = '1';
      if (event.target.name === 'dia' && event.target.closest('.visita-coordinar')) {
        const dl = card.querySelector('datalist');
        if (dl) dl.innerHTML = bloquesDiaLocal(event.target.value, data.general).map(b => `<option value="${b.hora}">${esc(b.label)}</option>`).join('');
      }
      return;
    }
    if (event.target.closest('.agenda-nueva')) {
      nuevaDirty = true;
      if (event.target.name === 'nueva-dia') {
        const select = root.querySelector('.agenda-nueva [name="nueva-hora"]');
        if (select) select.innerHTML = opcionesBloqueSelect(event.target.value, select.value);
      }
      return;
    }
    if (event.target.name === 'busqueda') {
      busqueda = event.target.value;
      const texto = busqueda.trim().toLowerCase();
      let visibles = 0;
      root.querySelectorAll('[data-visita]').forEach(cardEl => {
        const v = data.visitas.find(x => x.id === cardEl.dataset.visita);
        const ok = v && (!texto || [v.nombre, v.telefono, v.direccion, v.sector, v.equipo, v.problema].join(' ').toLowerCase().includes(texto));
        cardEl.hidden = !ok;
        if (ok) visibles++;
      });
      let nota = root.querySelector('.busqueda-vacia');
      if (!visibles && root.querySelector('[data-visita]')) {
        if (!nota) { nota = document.createElement('p'); nota.className = 'help busqueda-vacia'; nota.textContent = 'Sin visitas que coincidan con la búsqueda.'; root.querySelector('.agenda-toolbar').after(nota); }
      } else nota?.remove();
      return;
    }
    if (event.target.closest('.agenda-config')) configDirty = true;
  });

  root.addEventListener('click', async event => {
    if (!activo()) return;
    const button = event.target.closest('button');
    if (!button) return;

    if (button.dataset.vista) {
      if (dirty() && !confirm('Tienes cambios sin guardar en la agenda. ¿Cambiar de vista y descartarlos?')) return;
      vista = button.dataset.vista; discard(); render(); return;
    }
    if (button.dataset.calMes) {
      if (dirty() && !confirm('Tienes cambios sin guardar en la agenda. ¿Cambiar de mes y descartarlos?')) return;
      const [a, m] = mesCursor.split('-').map(Number);
      mesCursor = new Date(Date.UTC(a, m - 1 + Number(button.dataset.calMes), 1)).toISOString().slice(0, 7);
      render(); return;
    }
    if (button.dataset.dia) {
      if (dirty() && !confirm('Tienes cambios sin guardar en la agenda. ¿Ver un día y descartarlos?')) return;
      diaSel = diaSel === button.dataset.dia ? null : button.dataset.dia;
      calAbierto = true;
      discard(); render(); return;
    }
    if (button.hasAttribute('data-dia-limpiar')) { diaSel = null; render(); return; }
    if (button.dataset.visitaAbrir) {
      const id = button.dataset.visitaAbrir;
      if (dirty() && !confirm('Tienes cambios sin guardar en la agenda. ¿Abrir esa visita y descartarlos?')) return;
      vista = 'todas';
      busqueda = '';
      discard();
      render();
      const target = root.querySelector(`[data-visita="${CSS.escape(id)}"]`);
      if (target) {
        target.setAttribute('open', '');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.querySelector('summary')?.focus();
      }
      return;
    }
    if (button.dataset.toggleHora) {
      const [dia, hora] = button.dataset.toggleHora.split('|');
      const actuales = data.config.horasBloqueadas || {};
      const copia = Object.fromEntries(Object.entries(actuales).map(([d, hs]) => [d, [...hs]]));
      const set = new Set(copia[dia] || []);
      const bloqueando = !set.has(hora);
      if (bloqueando) set.add(hora); else set.delete(hora);
      if (set.size) copia[dia] = [...set].sort(); else delete copia[dia];
      await guardarHorasBloqueadas(copia, `${rangoHora(hora)} del ${fecha(dia)} ${bloqueando ? 'bloqueada' : 'liberada'}.`, button);
      return;
    }
    if (button.hasAttribute('data-nueva-toggle')) {
      if (dirty() && !confirm('Tienes cambios sin guardar en la agenda. Al continuar se descartarán. ¿Seguir?')) return;
      nuevaAbierta = !nuevaAbierta;
      nuevaDiaDef = '';
      discard();
      render();
      if (nuevaAbierta) root.querySelector('.agenda-nueva [name="nueva-nombre"]')?.focus();
      return;
    }
    if (button.hasAttribute('data-nueva-cerrar')) {
      if (dirty() && !confirm('Tienes cambios sin guardar en la agenda. Al cerrar el formulario se descartarán. ¿Seguir?')) return;
      nuevaAbierta = false;
      nuevaDiaDef = '';
      discard();
      render();
      return;
    }
    if (button.dataset.agendarDia) {
      if (dirty() && !confirm('Tienes cambios sin guardar en la agenda. Al cambiar se descartarán. ¿Seguir?')) return;
      nuevaDiaDef = button.dataset.agendarDia;
      nuevaAbierta = true;
      discard();
      render();
      root.querySelector('.agenda-nueva [name="nueva-nombre"]')?.focus();
      return;
    }
    if (button.hasAttribute('data-visita-crear')) {
      const box = root.querySelector('.agenda-nueva');
      if (!box) return;
      for (const input of box.querySelectorAll('input, select, textarea')) if (!input.reportValidity()) return;
      if ((configDirty || !!root.querySelector('[data-visita][data-dirty]')) && !confirm('Hay cambios sin guardar en otra parte de la agenda. Al guardar esta visita se descartarán. ¿Seguir?')) return;
      const val = n => box.querySelector(`[name="nueva-${n}"]`)?.value || '';
      const payload = {
        nombre: val('nombre'),
        telefono: val('telefono'),
        dia: val('dia'),
        hora: val('hora'),
        equipo: val('equipo'),
        sector: val('sector'),
        direccion: val('direccion'),
        referencia: val('referencia'),
        problema: val('problema')
      };
      button.disabled = true;
      try {
        let respuesta;
        try {
          respuesta = await api('visitas', { method: 'POST', body: JSON.stringify(payload) });
        } catch (error) {
          if (error.choque && confirm(`${error.message}\n\n¿Guardar de todas formas?`)) {
            respuesta = await api('visitas', { method: 'POST', body: JSON.stringify({ ...payload, forzar: true }) });
          } else {
            throw error;
          }
        }
        if (!autorizado()) return;
        data = respuesta;
        nuevaAbierta = false;
        nuevaDirty = false;
        nuevaDiaDef = '';
        if (vista === 'pendientes') vista = payload.dia === data.hoy ? 'hoy' : 'todas';
        avisar(data.visitas.filter(v => v.estado === 'solicitada').length);
        render();
        status('Visita agendada y confirmada.');
      } catch (error) {
        status(error.message, true);
      } finally {
        button.disabled = false;
      }
      return;
    }
    if (button.dataset.visitaIcs) {
      const v = data.visitas.find(x => x.id === button.dataset.visitaIcs);
      const ics = generarIcsCliente(v);
      if (!ics) return;
      const enlace = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = enlace;
      a.download = `visita-${v.dia}-${v.hora.replace(':', '')}.ics`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(enlace), 1000);
      return;
    }
    if (button.dataset.bloqMes) {
      const [a, m] = mesBloq.split('-').map(Number);
      mesBloq = new Date(Date.UTC(a, m - 1 + Number(button.dataset.bloqMes), 1)).toISOString().slice(0, 7);
      const tmp = document.createElement('div');
      tmp.innerHTML = calendarioBloqueo();
      root.querySelector('.bloq-cal').replaceWith(tmp.firstElementChild);
      return;
    }
    if (button.dataset.bloqDia) {
      const oculto = root.querySelector('[name="bloqueados"]');
      const set = new Set(oculto.value.split(/\s+/).filter(Boolean));
      set.has(button.dataset.bloqDia) ? set.delete(button.dataset.bloqDia) : set.add(button.dataset.bloqDia);
      oculto.value = [...set].sort().join(' ');
      button.classList.toggle('bloqueado');
      configDirty = true;
      return;
    }
    if (button.hasAttribute('data-agenda-refresh')) {
      if (dirty() && !confirm('Tienes cambios sin guardar en la agenda. ¿Actualizar y descartarlos?')) return;
      discard(); await load(); return;
    }
    if (button.hasAttribute('data-agenda-csv')) {
      const celda = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const columnas = ['nombre', 'telefono', 'dia', 'hora', 'horario', 'estado', 'equipo', 'problema', 'direccion', 'sector', 'referencia', 'nota', 'resultado', 'creada'];
      const csv = [columnas.join(','), ...data.visitas.map(v => columnas.map(c => celda(c === 'estado' ? estados[v.estado] || v.estado : c === 'horario' ? rangoHora(v.hora) : v[c])).join(','))].join('\n');
      const enlace = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = enlace; a.download = `zerok-agenda-${data.hoy}.csv`; a.click();
      setTimeout(() => URL.revokeObjectURL(enlace), 1000);
      return;
    }
    if (button.hasAttribute('data-copiar')) {
      const texto = button.dataset.copiar;
      const aviso = ok => { button.textContent = ok ? 'Dirección copiada' : 'No se pudo copiar'; setTimeout(() => { button.textContent = 'Copiar dirección'; }, 1800); };
      try { await navigator.clipboard.writeText(texto); aviso(true); }
      catch {
        const area = document.createElement('textarea');
        area.value = texto;
        area.style.cssText = 'position:fixed;opacity:0';
        document.body.append(area);
        area.select();
        try { aviso(document.execCommand('copy')); } catch { aviso(false); }
        area.remove();
      }
      return;
    }

    const action = button.dataset.visitaAccion;
    const config = button.hasAttribute('data-agenda-config');
    if (!action && !config) return;
    const group = button.closest(config ? '.agenda-config' : '[data-visita]');
    const value = name => group.querySelector(`[name="${name}"]`)?.value || '';
    if (config || action === 'confirmar') {
      for (const input of group.querySelectorAll(config ? 'input,textarea' : '.visita-coordinar input')) if (!input.reportValidity()) return;
    }
    if (action === 'eliminar' && !confirm('¿Borrar definitivamente esta visita y sus datos personales? No se puede deshacer.')) return;
    if (action === 'realizada' && !confirm(`¿La visita ya se realizó? Se programará el llamado para dentro de ${data.config.seguimiento} días.`)) return;
    if (action === 'cancelar' && !confirm('¿Cancelar esta visita? Coordina el cambio con el cliente por teléfono.')) return;
    const pendientes = config ? (nuevaDirty || !!root.querySelector('[data-visita][data-dirty]'))
      : configDirty || nuevaDirty || [...root.querySelectorAll('[data-visita][data-dirty]')].some(card => card !== group);
    if (pendientes && !confirm('Hay cambios sin guardar en otra parte de la agenda. Al guardar este cambio se descartarán. ¿Seguir?')) return;
    const visita = action && data.visitas.find(v => v.id === group.dataset.visita);
    const input = config
      ? { revision: data.config.revision, activa: group.querySelector('[name="activa"]').checked, mismoDia: group.querySelector('[name="mismoDia"]').checked, bloqueados: value('bloqueados').split(/\s+/).filter(Boolean), horasBloqueadas: data.config.horasBloqueadas || {}, seguimiento: Number(value('seguimiento')) }
      : { id: visita.id, expectedUpdated: visita.actualizada, accion: action, dia: value('dia'), hora: value('hora'), nota: value('nota'), resultado: value('resultado') };

    button.disabled = true;
    try {
      let respuesta;
      try {
        respuesta = await api(config ? 'agenda' : 'visitas', { method: 'PUT', body: JSON.stringify(input) });
      } catch (error) {
        if (!config && error.choque && confirm(`${error.message}\n\n¿Confirmar de todas formas?`)) {
          respuesta = await api('visitas', { method: 'PUT', body: JSON.stringify({ ...input, forzar: true }) });
        } else {
          throw error;
        }
      }
      if (!autorizado()) return;
      data = respuesta;
      avisar(data.visitas.filter(v => v.estado === 'solicitada').length);
      render(); status(data.warning || (config ? 'Disponibilidad guardada.' : 'Visita actualizada.'), !!data.warning);
    } catch (error) { status(error.message, true); }
    finally { button.disabled = false; }
  });
  return { load, dirty, discard };
}
