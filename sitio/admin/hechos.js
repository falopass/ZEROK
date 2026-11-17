// Trabajos hechos: registro privado del técnico, con resumen para el cliente por correo o WhatsApp.
const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const EQUIPOS = ['Refrigerador', 'Vitrina o conservador', 'Aire acondicionado', 'Aire acondicionado de auto', 'Lavadora o secadora', 'Calefón o calefacción', 'Equipo comercial', 'Otro equipo'];
const CAMPOS = ['nombre', 'telefono', 'correo', 'direccion', 'sector', 'equipo', 'fecha', 'descripcion', 'precio', 'garantia'];
const fecha = (dia, opciones) => new Intl.DateTimeFormat('es-CL', { ...opciones, timeZone: 'UTC' }).format(new Date(`${dia}T12:00:00Z`)).replace(/\./g, '');
const pesos = p => /^\d+$/.test(p) ? `$${Number(p).toLocaleString('es-CL')}` : '';

export function hechosPanel(root, api, status, activo, comprimir) {
  let data = null, form = null, q = '';
  const dialogo = document.body.appendChild(document.createElement('dialog'));
  dialogo.className = 'hecho-previa';
  const dirty = () => !!form?.tocado;
  const vacio = () => ({ id: '', nombre: '', telefono: '', correo: '', direccion: '', sector: '', equipo: EQUIPOS[0], fecha: data?.hoy || '', descripcion: '', precio: '', garantia: '', antes: [], despues: [], visita: '', tocado: false });

  const fotos = (lado, titulo) => `<div class="admin-field wide hecho-fotos" data-lado="${lado}"><span>${titulo}</span>
    <div class="hecho-fotos-grid">${form[lado].map((src, i) => `<figure><img src="${esc(src)}" alt="${esc(`${titulo} ${i + 1}`)}" width="120" height="120" loading="lazy"><button type="button" class="editor-action mini" data-quitar="${i}">Quitar</button></figure>`).join('')}
    ${form[lado].length < 3 ? `<label class="hecho-subir"><input type="file" accept="image/*" multiple data-subir="${lado}"><b aria-hidden="true">+</b>Agregar foto</label>` : ''}</div>
    <p class="upload-status" role="status"></p></div>`;
  const campo = (k, etiqueta, attrs, ancho = false) => `<label class="admin-field${ancho ? ' wide' : ''}">${etiqueta}<input name="hecho-${k}" value="${esc(form[k])}" ${attrs}></label>`;
  const formulario = () => `<section class="editor-group hecho-form" aria-label="${form.id ? 'Editar trabajo' : 'Registrar trabajo'}">
    <div class="agenda-nueva-head"><h2>${form.id ? 'Editar trabajo' : 'Registrar trabajo'}</h2><button type="button" class="editor-action mini" data-hecho-cerrar>Cerrar</button></div>
    <h3 class="hecho-paso mono">1. Cliente</h3>
    <div class="field-grid">
      ${campo('nombre', 'Nombre del cliente', 'type="text" maxlength="80" required autocomplete="off"')}
      ${campo('telefono', 'Teléfono', 'type="tel" inputmode="tel" maxlength="30" placeholder="9 1234 5678" autocomplete="off"')}
      <label class="admin-field wide">Correo (opcional)<input name="hecho-correo" value="${esc(form.correo)}" type="email" inputmode="email" maxlength="120" autocomplete="off" autocapitalize="none"><span class="help">Si lo escribes, puedes mandarle el resumen por correo. Si no, se lo mandas por WhatsApp.</span></label>
    </div>
    <h3 class="hecho-paso mono">2. Trabajo</h3>
    <div class="field-grid">
      <label class="admin-field">Equipo<select name="hecho-equipo">${EQUIPOS.map(e => `<option${e === form.equipo ? ' selected' : ''}>${esc(e)}</option>`).join('')}</select></label>
      ${campo('fecha', 'Fecha del trabajo', `type="date" max="${data.hoy}" required`)}
      ${campo('direccion', 'Dirección', 'type="text" maxlength="150" placeholder="Calle y número" autocomplete="off"', true)}
      ${campo('sector', 'Sector o comuna', 'type="text" maxlength="80" placeholder="Ej: Rahue, Centro" autocomplete="off"')}
      ${campo('precio', 'Valor cobrado (opcional)', 'type="text" inputmode="numeric" maxlength="11" placeholder="Ej: 45000" autocomplete="off"')}
      <label class="admin-field wide">Qué se hizo<textarea name="hecho-descripcion" rows="4" maxlength="1500" required placeholder="Ej: Cambio de motor ventilador y limpieza del condensador.">${esc(form.descripcion)}</textarea></label>
      <label class="admin-field wide">Garantía u observaciones (opcional)<textarea name="hecho-garantia" rows="2" maxlength="500">${esc(form.garantia)}</textarea></label>
    </div>
    <h3 class="hecho-paso mono">3. Fotos</h3>
    <div class="field-grid">${fotos('antes', 'Fotos de antes')}${fotos('despues', 'Fotos de después')}</div>
    <div class="agenda-nueva-pie">${form.id ? '<button type="button" class="editor-action danger" data-hecho-borrar>Borrar trabajo</button>' : ''}<button type="button" class="editor-action primaria" data-hecho-guardar>${form.correo ? 'Guardar y ver el correo' : 'Guardar trabajo'}</button></div>
  </section>`;

  const wsp = t => `https://wa.me/${/^\+56\d{9}$/.test(t.telefono) ? t.telefono.slice(1) : ''}?text=${encodeURIComponent(t.texto)}`;
  const tarjeta = t => `<article class="hecho" data-hecho="${esc(t.id)}">
    <span class="visita-talon mono"><b>${esc(fecha(t.fecha, { day: 'numeric' }))}</b><small>${esc(fecha(t.fecha, { month: 'short', year: '2-digit' }))}</small></span>
    <div class="visita-resumen">
      <strong class="visita-nombre">${esc(t.nombre)}</strong>
      <span class="visita-sub">${esc([t.equipo, t.sector].filter(Boolean).join(' · '))}${pesos(t.precio) ? ` · <b>${pesos(t.precio)}</b>` : ''}</span>
      <span class="hecho-texto">${esc(t.descripcion)}</span>
      ${t.antes.length + t.despues.length ? `<span class="hecho-minis">${[...t.antes, ...t.despues].map(src => `<img src="${esc(src)}" alt="" width="44" height="44" loading="lazy">`).join('')}</span>` : ''}
      <span class="visita-pie"><span class="visita-estado">${t.enviado ? `Correo enviado el ${esc(new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', timeZone: 'America/Santiago' }).format(new Date(t.enviado)).replace(/\./g, ''))}` : 'Sin enviar'}</span></span>
    </div>
    <div class="visita-acciones">
      <a class="editor-action" href="${esc(wsp(t))}" target="_blank" rel="noopener">WhatsApp</a>
      <button type="button" class="editor-action primaria" data-hecho-correo>${t.correo ? (t.enviado ? 'Reenviar correo' : 'Enviar correo') : 'Agregar correo'}</button>
      <button type="button" class="editor-action" data-hecho-editar>Editar</button>
    </div>
  </article>`;

  function render() {
    if (!activo() || !data) return;
    const n = q.trim().toLowerCase();
    const lista = data.trabajos.filter(t => !n || [t.nombre, t.telefono, t.direccion, t.sector, t.equipo, t.descripcion].join(' ').toLowerCase().includes(n));
    root.innerHTML = form ? formulario() : `<div class="agenda-toolbar"><input class="agenda-buscar" type="search" name="hecho-buscar" value="${esc(q)}" placeholder="Buscar cliente, equipo o dirección" aria-label="Buscar trabajos"><div class="agenda-tools"><button type="button" class="editor-action primaria" data-hecho-nuevo>+ Registrar trabajo</button></div></div>
      ${lista.length ? `<div class="hechos-lista">${lista.map(tarjeta).join('')}</div>` : `<div class="empty-editor"><h2>${data.trabajos.length ? 'Ningún trabajo coincide con la búsqueda.' : 'Aún no registras trabajos.'}</h2><p>Cuando termines un trabajo, regístralo aquí con sus fotos y mándale el resumen al cliente.</p></div>`}
      <p class="editor-note">Este registro es privado: no aparece en el sitio. Cada trabajo se borra solo después de un año sin cambios.</p>`;
  }
  async function load() {
    try { data = await api('trabajos'); render(); return true; }
    catch (error) { status(error.message, true); return false; }
  }
  const cerrar = () => { form = null; render(); scrollTo(0, 0); };

  async function previa(id) {
    const t = data.trabajos.find(x => x.id === id);
    if (!t) return;
    try {
      const { asunto, html, para } = await api(`trabajos?previa=${encodeURIComponent(id)}`);
      dialogo.dataset.id = id;
      dialogo.innerHTML = `<div class="hecho-previa-cab"><p><span class="mono">Para</span> ${esc(para)}</p><p><span class="mono">Asunto</span> ${esc(asunto)}</p></div><iframe sandbox title="Vista previa del correo"></iframe><p class="hecho-previa-nota" role="status">${data.correo ? (t.enviado ? 'Este correo ya se envió una vez.' : 'Así lo verá el cliente. También llega una copia a tu correo.') : 'El envío de correos a clientes se activa al publicar esta versión del sitio.'}</p><div class="hecho-previa-pie"><button type="button" class="editor-action" data-previa-cerrar>Cerrar</button><button type="button" class="editor-action primaria" data-previa-enviar${data.correo ? '' : ' disabled'}>${t.enviado ? 'Enviar de nuevo' : 'Enviar al cliente'}</button></div>`;
      dialogo.querySelector('iframe').srcdoc = html;
      dialogo.showModal();
    } catch (error) { status(error.message, true); }
  }
  dialogo.addEventListener('click', async event => {
    if (event.target.closest('[data-previa-cerrar]') || event.target === dialogo) return dialogo.close();
    const boton = event.target.closest('[data-previa-enviar]');
    if (!boton) return;
    boton.disabled = true; boton.textContent = 'Enviando...';
    try {
      data = await api('trabajos/enviar', { method: 'POST', body: JSON.stringify({ id: dialogo.dataset.id }) });
      dialogo.close(); render(); status('Correo enviado al cliente.');
    } catch (error) { boton.disabled = false; boton.textContent = 'Enviar al cliente'; dialogo.querySelector('.hecho-previa-nota').textContent = error.message; }
  });

  root.addEventListener('input', event => {
    const nombre = event.target.name || '';
    if (!activo() || !nombre.startsWith('hecho-')) return;
    if (nombre === 'hecho-buscar') {
      q = event.target.value; render();
      const buscador = root.querySelector('[name=hecho-buscar]'); buscador.focus(); buscador.setSelectionRange(q.length, q.length);
    } else if (form && CAMPOS.includes(nombre.slice(6))) { form[nombre.slice(6)] = event.target.value; form.tocado = true; }
  });
  root.addEventListener('change', async event => {
    const input = event.target;
    if (!activo() || !form || !input.dataset.subir) return;
    const lado = input.dataset.subir, aviso = input.closest('.hecho-fotos').querySelector('.upload-status');
    input.disabled = true; aviso.textContent = 'Preparando y subiendo las fotos...';
    try {
      // shortcut: una foto subida y luego descartada sin guardar queda en el almacenamiento; limpiar huérfanas si llega a pesar.
      for (const file of [...input.files].slice(0, 3 - form[lado].length)) {
        const { url } = await api('upload', { method: 'POST', body: await comprimir(file), headers: { 'content-type': 'image/webp' } });
        form[lado].push(url); form.tocado = true;
      }
      render();
    } catch (error) { aviso.textContent = error.message; input.disabled = false; }
  });
  root.addEventListener('click', async event => {
    if (!activo() || !data) return;
    const en = selector => event.target.closest(selector);
    const id = en('[data-hecho]')?.dataset.hecho;
    const t = data.trabajos.find(x => x.id === id);
    if (en('[data-hecho-nuevo]')) { form = vacio(); render(); root.querySelector('[name=hecho-nombre]').focus(); }
    else if (en('[data-hecho-cerrar]')) { if (!dirty() || confirm('¿Cerrar sin guardar este trabajo?')) cerrar(); }
    else if (en('[data-quitar]')) { form[en('.hecho-fotos').dataset.lado].splice(Number(en('[data-quitar]').dataset.quitar), 1); form.tocado = true; render(); }
    else if (en('[data-hecho-editar]') && t) { form = { ...vacio(), ...t, antes: [...t.antes], despues: [...t.despues], tocado: false }; render(); scrollTo(0, 0); }
    else if (en('[data-hecho-correo]') && t) { if (t.correo) previa(t.id); else { form = { ...vacio(), ...t, antes: [...t.antes], despues: [...t.despues], tocado: false }; render(); root.querySelector('[name=hecho-correo]').focus(); } }
    else if (en('[data-hecho-borrar]') && form?.id) {
      if (!confirm('¿Borrar este trabajo y sus fotos? No se puede deshacer.')) return;
      try { data = await api('trabajos', { method: 'PUT', body: JSON.stringify({ id: form.id, expectedUpdated: form.actualizado, accion: 'eliminar' }) }); status('Trabajo borrado.'); cerrar(); }
      catch (error) { status(error.message, true); }
    } else if (en('[data-hecho-guardar]')) {
      const boton = en('[data-hecho-guardar]');
      const falta = [...root.querySelectorAll('.hecho-form [required]')].find(el => !el.value.trim());
      if (falta) { falta.focus(); return status('Completa el nombre del cliente, la fecha y qué se hizo.', true); }
      boton.disabled = true;
      try {
        const cuerpo = { ...Object.fromEntries(CAMPOS.map(k => [k, form[k]])), antes: form.antes, despues: form.despues, visita: form.visita, ...(form.id ? { id: form.id, expectedUpdated: form.actualizado, accion: 'guardar' } : {}) };
        const res = await api('trabajos', { method: form.id ? 'PUT' : 'POST', body: JSON.stringify(cuerpo) });
        const conCorreo = !!form.correo.trim();
        data = res; status('Trabajo guardado.'); cerrar();
        if (conCorreo) previa(res.id);
      } catch (error) { boton.disabled = false; status(error.message, true); }
    }
  });

  // Abre el formulario con los datos de una visita realizada de la agenda.
  function nuevoDesde(v) {
    const abrir = () => { form = { ...vacio(), nombre: v.nombre, telefono: v.telefono, direccion: v.direccion, sector: v.sector, equipo: EQUIPOS.includes(v.equipo) ? v.equipo : 'Otro equipo', fecha: v.realizada || data.hoy, descripcion: v.nota || '', visita: v.id, tocado: true }; render(); scrollTo(0, 0); };
    if (data) abrir(); else load().then(ok => ok && abrir());
  }
  return { load, dirty, render, nuevoDesde };
}
