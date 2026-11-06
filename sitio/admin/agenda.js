const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fecha = d => d ? new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${d}T12:00:00Z`)) : '';
const estados = { solicitada: 'Por confirmar', confirmada: 'Confirmada', realizada: 'Seguimiento pendiente', cerrada: 'Cerrada', cancelada: 'Cancelada', ausente: 'No estaba' };
const sumar = (d, n) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

export function agendaPanel(root, api, status, activo) {
  let data, vista = 'pendientes', cargando = false;
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
    const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${v.direccion}, ${v.sector}, Chile`)}`;
    return `<details class="editor-group visita" data-visita="${esc(v.id)}"><summary><span><b>${esc(v.nombre)}</b><span class="visita-sub">${esc(v.equipo)} · ${fecha(v.dia)}${v.hora ? ` a las ${esc(v.hora)}` : ''}</span></span><span class="visita-estado">${estados[v.estado]}</span></summary><dl class="visita-datos"><dt>Problema</dt><dd>${esc(v.problema)}</dd><dt>Dirección</dt><dd>${esc(v.direccion)}, ${esc(v.sector)}${v.referencia ? `<br>${esc(v.referencia)}` : ''}</dd><dt>Teléfono</dt><dd><a href="tel:${esc(v.telefono)}">${esc(v.telefono)}</a></dd>${v.realizada ? `<dt>Realizada</dt><dd>${fecha(v.realizada)}</dd><dt>Seguimiento</dt><dd>${fecha(v.seguimiento)}${v.seguimiento <= data.hoy && v.estado === 'realizada' ? ' (toca llamar)' : ''}</dd>` : ''}${v.nota ? `<dt>Trabajo realizado</dt><dd>${esc(v.nota)}</dd>` : ''}${v.resultado ? `<dt>Resultado del llamado</dt><dd>${esc(v.resultado)}</dd>` : ''}</dl><div class="security-actions"><a class="editor-action" href="tel:${esc(v.telefono)}">Llamar</a><a class="editor-action" href="${esc(mapa)}" target="_blank" rel="noopener noreferrer">Ver mapa</a></div>${abierta ? `<fieldset class="visita-coordinar"><legend>Después de hablar con el cliente</legend><div class="field-grid">${campo('dia', 'Día acordado', v.dia, 'date', 'required')}${campo('hora', 'Hora acordada (opcional)', v.hora, 'time')}</div>${accion('confirmar', v.estado === 'confirmada' ? 'Guardar coordinación' : 'Confirmar visita')}</fieldset><label class="admin-field">Trabajo realizado (opcional)<textarea name="nota" rows="3" maxlength="500"></textarea></label><div class="security-actions">${accion('realizada', 'Marcar realizada')}${accion('ausente', 'No estaba')}${accion('cancelar', 'Cancelar visita')}</div>` : ''}${v.estado === 'realizada' ? `<label class="admin-field">¿Cómo quedó el equipo?<textarea name="resultado" rows="3" maxlength="500"></textarea></label>${accion('cerrar', 'Llamado realizado y cerrar')}` : ''}<div class="visita-borrar">${accion('eliminar', 'Borrar datos de esta visita', 'danger')}</div></details>`;
  }
  function render() {
    if (!activo() || !data) return;
    const visitas = data.visitas.filter(filtros[vista][1]);
    root.innerHTML = `<p class="editor-note">${data.correo ? 'Avisos por correo habilitados.' : 'Los avisos por correo todavía no están habilitados. Las solicitudes quedan guardadas aquí; revisa el panel hasta activar el correo.'} ${data.config.activa ? 'La agenda en línea está activa.' : 'La agenda en línea está desactivada.'}</p><div class="agenda-toolbar"><div class="agenda-filtros" role="group" aria-label="Filtrar visitas">${Object.entries(filtros).map(([key, [label, filter]]) => `<button type="button" class="editor-action" data-vista="${key}" aria-pressed="${vista === key}">${label} (${data.visitas.filter(filter).length})</button>`).join('')}</div><button type="button" class="editor-action" data-agenda-refresh>Actualizar</button></div>${visitas.length ? visitas.map(tarjeta).join('') : '<div class="empty-editor"><h2>Sin visitas en esta vista.</h2><p>Las solicitudes y los seguimientos aparecerán aquí.</p></div>'}<details class="editor-group agenda-config"><summary>Disponibilidad y avisos</summary><p>El cliente pide un día, no una hora ni un cupo confirmado. Vicente coordina la hora por teléfono.</p><label class="admin-field check"><input type="checkbox" name="activa" ${data.config.activa ? 'checked' : ''}>Activar solicitudes en línea</label><label class="admin-field">Días bloqueados<textarea name="bloqueados" rows="4" aria-describedby="bloqueados-ayuda">${esc(data.config.bloqueados.join('\n'))}</textarea><span id="bloqueados-ayuda" class="help">Una fecha por línea, con formato AAAA-MM-DD. No cancela visitas ya confirmadas.</span></label>${campo('seguimiento', 'Días después de la visita para llamar', data.config.seguimiento, 'number', 'min="1" max="90" required')}<p class="help">Por defecto son 14 días. Cambiarlo solo afecta las próximas visitas que marques realizadas.</p><button type="button" class="editor-action" data-agenda-config>Guardar disponibilidad</button></details>`;
  }
  async function load() {
    if (cargando) return;
    cargando = true;
    try { data = await api('visitas'); render(); }
    catch (error) { status(error.message, true); }
    finally { cargando = false; }
  }
  root.addEventListener('click', async event => {
    if (!activo()) return;
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.vista) { vista = button.dataset.vista; render(); return; }
    if (button.hasAttribute('data-agenda-refresh')) { await load(); return; }
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
    const visita = action && data.visitas.find(v => v.id === group.dataset.visita);
    const input = config ? { revision: data.config.revision, activa: group.querySelector('[name="activa"]').checked, bloqueados: value('bloqueados').split(/\s+/).filter(Boolean), seguimiento: Number(value('seguimiento')) }
      : { id: visita.id, expectedUpdated: visita.actualizada, accion: action, dia: value('dia'), hora: value('hora'), nota: value('nota'), resultado: value('resultado') };
    button.disabled = true;
    try {
      data = await api(config ? 'agenda' : 'visitas', { method: 'PUT', body: JSON.stringify(input) });
      render(); status(data.warning || (config ? 'Disponibilidad guardada.' : 'Visita actualizada.'), !!data.warning);
    } catch (error) { status(error.message, true); }
    finally { button.disabled = false; }
  });
  return { load };
}
