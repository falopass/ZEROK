const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fecha = d => d ? new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${d}T12:00:00Z`)) : '';
const estados = { solicitada: 'Por confirmar', confirmada: 'Confirmada', realizada: 'Seguimiento pendiente', cerrada: 'Cerrada', cancelada: 'Cancelada', ausente: 'No estaba' };
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
  let data, vista = 'pendientes', cargando = false, configDirty = false;
  const filtros = {
    pendientes: ['Por confirmar', v => v.estado === 'solicitada'],
    hoy: ['Hoy', v => ['solicitada', 'confirmada'].includes(v.estado) && v.dia === data.hoy],
    semana: ['Próximos 7 días', v => ['solicitada', 'confirmada'].includes(v.estado) && v.dia >= data.hoy && v.dia <= sumar(data.hoy, 6)],
    seguimiento: ['Llamados', v => v.estado === 'realizada'],
    todas: ['Todas', () => true]
  };
  const campo = (name, label, value = '', type = 'text', attrs = '') => `<label class="admin-field">${label}<input name="${name}" type="${type}" value="${esc(value)}" ${attrs}></label>`;
  const accion = (a, text, cls = '') => `<button class="editor-action ${cls}" type="button" data-visita-accion="${a}">${text}</button>`;
  function tarjeta(v) {
    const abierta = ['solicitada', 'confirmada'].includes(v.estado);
    const pasada = abierta && v.dia < data.hoy;
    const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${v.direccion}, ${v.sector}, Chile`)}`;
    const wsp = /^\+56\d{9}$/.test(v.telefono) ? v.telefono.slice(1) : '';
    const saludo = `Hola ${v.nombre}, te escribo de ZÉROK por tu solicitud de visita del ${fecha(v.dia)} para tu ${v.equipo.toLowerCase()}.`;
    return `<details class="editor-group visita" data-visita="${esc(v.id)}"><summary><span><b>${esc(v.nombre)}</b><span class="visita-sub">${esc(v.equipo)} · ${fecha(v.dia)}${v.hora ? ` a las ${esc(v.hora)}` : ''} · ${hace(v.creada)}${pasada ? ' · <b class="visita-pasada">el día pedido ya pasó</b>' : ''}</span></span><span class="visita-estado estado-${esc(v.estado)}">${estados[v.estado]}</span></summary><dl class="visita-datos"><dt>Problema</dt><dd>${esc(v.problema)}</dd><dt>Dirección</dt><dd>${esc(v.direccion)}, ${esc(v.sector)}${v.referencia ? `<br>${esc(v.referencia)}` : ''}</dd><dt>Teléfono</dt><dd><a href="tel:${esc(v.telefono)}">${esc(telefonoVisible(v.telefono))}</a></dd>${v.realizada ? `<dt>Realizada</dt><dd>${fecha(v.realizada)}</dd><dt>Seguimiento</dt><dd>${fecha(v.seguimiento)}${v.seguimiento <= data.hoy && v.estado === 'realizada' ? ' (toca llamar)' : ''}</dd>` : ''}${v.nota ? `<dt>Trabajo realizado</dt><dd>${esc(v.nota)}</dd>` : ''}${v.resultado ? `<dt>Resultado del llamado</dt><dd>${esc(v.resultado)}</dd>` : ''}</dl><div class="visita-acciones"><a class="editor-action${v.estado === 'solicitada' ? ' primaria' : ''}" href="tel:${esc(v.telefono)}">Llamar</a>${wsp ? `<a class="editor-action" href="https://wa.me/${wsp}?text=${encodeURIComponent(saludo)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : ''}<a class="editor-action" href="${esc(mapa)}" target="_blank" rel="noopener noreferrer">Ver mapa</a><button class="editor-action" type="button" data-copiar="${esc(`${v.direccion}, ${v.sector}`)}">Copiar dirección</button></div>${abierta ? `<fieldset class="visita-coordinar"><legend>Después de hablar con el cliente</legend><div class="field-grid">${campo('dia', 'Día acordado', v.dia, 'date', `required min="${data.hoy}"`)}${campo('hora', 'Hora acordada (opcional)', v.hora, 'time')}</div>${accion('confirmar', v.estado === 'confirmada' ? 'Guardar coordinación' : 'Confirmar visita')}</fieldset><label class="admin-field">Trabajo realizado (opcional)<textarea name="nota" rows="3" maxlength="500"></textarea></label><div class="visita-decision">${accion('realizada', 'Marcar realizada')}${accion('ausente', 'No estaba')}${accion('cancelar', 'Cancelar visita')}</div>` : ''}${v.estado === 'realizada' ? `<label class="admin-field">¿Cómo quedó el equipo?<textarea name="resultado" rows="3" maxlength="500"></textarea></label>${accion('cerrar', 'Llamado realizado y cerrar')}` : ''}<div class="visita-borrar">${accion('eliminar', 'Borrar datos de esta visita', 'danger')}</div></details>`;
  }
  function render() {
    if (!activo() || !data) return;
    configDirty = false;
    const abiertas = new Set([...root.querySelectorAll('[data-visita][open]')].map(d => d.dataset.visita));
    const configAbierta = !!root.querySelector('.agenda-config[open]');
    // Stable key of the focused control so a DOM rebuild can return it to the same place.
    const foco = (() => {
      const el = document.activeElement;
      if (!el || !root.contains(el)) return null;
      const clave = el.dataset.visitaAccion ? `[data-visita-accion="${el.dataset.visitaAccion}"]`
        : el.dataset.vista ? `[data-vista="${el.dataset.vista}"]`
        : el.hasAttribute('data-agenda-refresh') ? '[data-agenda-refresh]'
        : el.hasAttribute('data-agenda-config') ? '[data-agenda-config]'
        : el.hasAttribute('data-copiar') ? '[data-copiar]'
        : el.name ? `[name="${el.name}"]`
        : el.tagName === 'SUMMARY' ? 'summary'
        : el.tagName === 'A' ? (el.getAttribute('href').startsWith('tel:') ? 'a[href^="tel:"]' : el.href.includes('wa.me') ? 'a[href*="wa.me"]' : 'a[href*="maps"]')
        : null;
      if (!clave) return null;
      const card = el.closest('[data-visita]');
      if (card) return `[data-visita="${CSS.escape(card.dataset.visita)}"] ${clave}`;
      if (el.closest('.agenda-config')) return `.agenda-config ${clave}`;
      return clave;
    })();
    const visitas = data.visitas.filter(filtros[vista][1]);
    const pendientes = data.avisos?.pendientes || 0;
    const reintentos = data.avisos?.reintentos || 0;
    const avisos = data.correo
      ? `Avisos por correo activos${pendientes ? ` · ${pendientes} pendiente${pendientes === 1 ? '' : 's'} de envío` : ''}${reintentos ? ` · ${reintentos} reintentando tras un fallo` : ''}.`
      : 'Correo desactivado hasta conectar zerok.cl: revisa esta pantalla.';
    root.innerHTML = `<p class="agenda-aviso">${avisos} ${data.config.activa ? 'Solicitudes en línea activas.' : 'Solicitudes en línea desactivadas.'}</p><div class="agenda-toolbar"><div class="agenda-filtros" role="group" aria-label="Filtrar visitas">${Object.entries(filtros).map(([key, [label, filter]]) => `<button type="button" class="editor-action" data-vista="${key}" aria-pressed="${vista === key}">${label} (${data.visitas.filter(filter).length})</button>`).join('')}</div><button type="button" class="editor-action" data-agenda-refresh>Actualizar</button></div>${visitas.length ? visitas.map(tarjeta).join('') : '<div class="empty-editor"><h2>Sin visitas en esta vista.</h2><p>Las solicitudes y los seguimientos aparecerán aquí.</p></div>'}<details class="editor-group agenda-config"><summary>Disponibilidad y avisos</summary><p>El cliente pide un día, no una hora ni un cupo confirmado. ZÉROK coordina la hora por teléfono.</p><label class="admin-field check"><input type="checkbox" name="activa" ${data.config.activa ? 'checked' : ''}>Activar solicitudes en línea</label><label class="admin-field">Días bloqueados<textarea name="bloqueados" rows="4" aria-describedby="bloqueados-ayuda">${esc(data.config.bloqueados.join('\n'))}</textarea><span id="bloqueados-ayuda" class="help">Una fecha por línea, con formato AAAA-MM-DD. No cancela visitas ya confirmadas.</span></label>${campo('seguimiento', 'Días después de la visita para llamar', data.config.seguimiento, 'number', 'min="1" max="90" required')}<p class="help">Por defecto son 14 días. Cambiarlo solo afecta las próximas visitas que marques realizadas.</p><button type="button" class="editor-action" data-agenda-config>Guardar disponibilidad</button></details>`;
    for (const id of abiertas) root.querySelector(`[data-visita="${CSS.escape(id)}"]`)?.setAttribute('open', '');
    if (configAbierta) root.querySelector('.agenda-config')?.setAttribute('open', '');
    if (foco) (root.querySelector(foco) || root.querySelector('[data-agenda-refresh]'))?.focus();
  }
  async function load() {
    if (cargando) return true;
    if (!autorizado()) return false;
    cargando = true;
    try {
      const reciente = await api('visitas');
      if (!autorizado()) return false;
      avisar(reciente.visitas.filter(v => v.estado === 'solicitada').length);
      // Edits typed while the request was in flight keep the displayed snapshot and DOM;
      // expectedUpdated must stay the one the user sees, so a stale base returns a 409, not a silent overwrite.
      if (activo() && dirty()) return true;
      data = reciente;
      render();
      return true;
    } catch (error) {
      status(error.message, true);
      // Without a first snapshot the region would stay on "Cargando agenda..." forever.
      if (!data) root.innerHTML = `<div class="empty-editor"><h2>No se pudo cargar la agenda.</h2><p>${esc(error.message)}</p><button class="editor-action" type="button" data-agenda-refresh>Reintentar</button></div>`;
      return false;
    }
    finally { cargando = false; }
  }
  // True while a card or the availability form has typed edits that a refresh must not wipe.
  const dirty = () => configDirty || !!root.querySelector('[data-visita][data-dirty]');
  // Drops the typed-edit markers. Runs only after the user confirms discarding them.
  const discard = () => { configDirty = false; root.querySelectorAll('[data-visita][data-dirty]').forEach(card => delete card.dataset.dirty); };
  root.addEventListener('input', event => {
    const card = event.target.closest('[data-visita]');
    if (card) card.dataset.dirty = '1';
    else if (event.target.closest('.agenda-config')) configDirty = true;
  });
  root.addEventListener('click', async event => {
    if (!activo()) return;
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.vista) {
      if (dirty() && !confirm('Tienes cambios sin guardar en la agenda. ¿Cambiar de vista y descartarlos?')) return;
      vista = button.dataset.vista; discard(); render(); return;
    }
    if (button.hasAttribute('data-agenda-refresh')) {
      if (dirty() && !confirm('Tienes cambios sin guardar en la agenda. ¿Actualizar y descartarlos?')) return;
      discard(); await load(); return;
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
    const pendientes = config ? !!root.querySelector('[data-visita][data-dirty]')
      : configDirty || [...root.querySelectorAll('[data-visita][data-dirty]')].some(card => card !== group);
    if (pendientes && !confirm('Hay cambios sin guardar en otra parte de la agenda. Al guardar este cambio se descartarán. ¿Seguir?')) return;
    const visita = action && data.visitas.find(v => v.id === group.dataset.visita);
    const input = config ? { revision: data.config.revision, activa: group.querySelector('[name="activa"]').checked, bloqueados: value('bloqueados').split(/\s+/).filter(Boolean), seguimiento: Number(value('seguimiento')) }
      : { id: visita.id, expectedUpdated: visita.actualizada, accion: action, dia: value('dia'), hora: value('hora'), nota: value('nota'), resultado: value('resultado') };
    button.disabled = true;
    try {
      const respuesta = await api(config ? 'agenda' : 'visitas', { method: 'PUT', body: JSON.stringify(input) });
      // If the session ended mid-request the DOM still shows the old snapshot: keep it paired.
      if (!autorizado()) return;
      data = respuesta;
      avisar(data.visitas.filter(v => v.estado === 'solicitada').length);
      render(); status(data.warning || (config ? 'Disponibilidad guardada.' : 'Visita actualizada.'), !!data.warning);
    } catch (error) { status(error.message, true); }
    finally { button.disabled = false; }
  });
  return { load, dirty, discard };
}
