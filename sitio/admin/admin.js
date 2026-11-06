import { agendaPanel } from './agenda.js';
import { MAX_CONTENT_BYTES, CONTENT_SIZE_ERROR } from '../js/limites.js';

const $ = selector => document.querySelector(selector);
const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
let documentData, revision, section = 'general', dirty = false, setup = false, saving = false;
const visitas = agendaPanel($('#editor'), api, status, () => section === 'agenda');
const titles = { agenda: 'Agenda de visitas', general: 'Textos y cobertura', servicios: 'Servicios', productos: 'Precios y productos', trabajos: 'Trabajos y fotos', blog: 'Blog', faq: 'Preguntas frecuentes', seguridad: 'Seguridad y respaldo' };
const field = (key, label, type = 'text', options = {}) => ({ key, label, type, ...options });
const schemas = {
  general: [field('bajada', 'Bajada de la portada', 'textarea', { max: 350, required: true }), field('presentacion', 'Presentación', 'textarea', { max: 2000, required: true }), field('hero', 'Imagen de portada', 'image'), field('heroAlt', 'Descripción de la imagen', 'text', { max: 200, required: true }), field('heroReal', 'La portada es una foto real del cliente', 'checkbox'), field('cobertura', 'Sectores confirmados', 'lines', { help: 'Un sector por línea. No agregues sectores sin confirmar.' }), field('horarioConfirmado', 'El cliente confirmó este horario de lunes a sábado', 'checkbox'), field('abre', 'Apertura', 'time'), field('cierra', 'Cierre', 'time'), field('casaFoto', 'Foto del bloque En tu casa', 'image'), field('negocioFoto', 'Foto del bloque En tu negocio', 'image'), field('aviso', 'Aviso temporal', 'textarea', { max: 250, help: 'Déjalo vacío para ocultarlo.' })],
  servicios: [field('id', 'Identificador del enlace', 'text', { required: true, max: 100, help: 'Conserva este valor para mantener los enlaces existentes.' }), field('titulo', 'Título', 'text', { required: true, max: 100 }), field('resumen', 'Qué hacemos', 'textarea', { required: true, max: 1000 }), field('equipos', 'Equipos', 'text', { max: 250 }), field('fallas', 'Fallas confirmadas', 'lines', { help: 'Una falla por línea.' }), field('foto', 'Foto real del servicio', 'image'), field('visible', 'Visible en el sitio', 'checkbox')],
  productos: [field('id', 'Identificador', 'text', { required: true, max: 100 }), field('nombre', 'Nombre', 'text', { required: true, max: 120 }), field('categoria', 'Categoría', 'text', { required: true, max: 60 }), field('descripcion', 'Descripción', 'textarea', { max: 500 }), field('precio', 'Precio en pesos chilenos', 'number', { required: true }), field('foto', 'Foto del producto', 'image'), field('desde', 'Mostrar precio desde', 'checkbox'), field('disponible', 'Disponible', 'checkbox'), field('destacado', 'Destacado en Inicio', 'checkbox'), field('visible', 'Visible en el sitio', 'checkbox')],
  trabajos: [field('foto', 'Foto real del trabajo', 'image'), field('texto', 'Frase que acompaña la foto (por ejemplo: Acá estoy arreglando una vitrina de pasteles.)', 'text', { required: true, max: 200 }), field('fecha', 'Fecha', 'date')],
  blog: [field('slug', 'Dirección de la entrada', 'text', { required: true, max: 100, help: 'Minúsculas y guiones. Conserva el valor después de publicar.' }), field('titulo', 'Título', 'text', { required: true, max: 150 }), field('extracto', 'Extracto', 'textarea', { required: true, max: 350 }), field('cuerpo', 'Artículo', 'textarea', { required: true, max: 25000, help: 'Separa párrafos con una línea vacía. Para un subtítulo, empieza con ## seguido de un espacio. No se admite HTML.' }), field('foto', 'Imagen', 'image'), field('fecha', 'Fecha de publicación', 'date', { required: true }), field('servicio', 'Servicio relacionado', 'service'), field('publicado', 'Publicar: contenido revisado por el técnico', 'checkbox')],
  faq: [field('pregunta', 'Pregunta', 'text', { required: true, max: 200 }), field('respuesta', 'Respuesta confirmada por el cliente', 'textarea', { required: true, max: 1500 })]
};

async function api(path, options = {}) {
  const response = await fetch(`/admin/api/${path}`, { credentials: 'same-origin', ...options, headers: { ...(options.body && !(options.body instanceof Blob) ? { 'content-type': 'application/json' } : {}), ...options.headers } });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && path !== 'login' && path !== 'setup') {
      $('#access').hidden = false; $('#workspace').hidden = true;
      $('#login-status').textContent = 'Tu sesión terminó. Inicia sesión para recuperar tus cambios en esta pestaña.';
    }
    throw new Error(data.error || 'No se pudo completar la operación.');
  }
  return data;
}

function status(text, error = false) { $('#save-status').textContent = text; $('#save-status').classList.toggle('error', error); }
function changed() { dirty = true; status('Tienes cambios sin guardar.'); }
function itemAt(index) { return section === 'general' ? documentData.general : documentData[section][index]; }

function renderField(definition, item, index) {
  const f = definition;
  const value = item[f.key];
  const attributes = `data-key="${f.key}" data-index="${index}" data-type="${f.type}"`;
  const id = `field-${index}-${f.key}`;
  const attrs = `${f.required ? 'required ' : ''}${f.max ? `maxlength="${f.max}"` : ''}`;
  let input;
  if (f.type === 'checkbox') return `<label class="admin-field check"><input type="checkbox" ${attributes} ${value ? 'checked' : ''}>${f.label}</label>`;
  if (f.type === 'image') input = `<div class="image-control">${value ? `<img src="${esc(value)}" alt="Imagen seleccionada" width="240" height="160" loading="lazy">` : ''}<input type="file" id="${id}" accept="image/jpeg,image/png,image/webp" data-image-key="${f.key}" data-index="${index}" aria-label="${f.label}"><span class="help">JPG, PNG o WebP. Se convierte antes de subir, hasta 1600 px y 200 KB.</span><p class="upload-status" role="status"></p>${value ? `<button type="button" data-remove-image="${f.key}" data-index="${index}">Quitar imagen</button>` : ''}</div>`;
  else if (['textarea', 'lines'].includes(f.type)) input = `<textarea id="${id}" rows="${f.key === 'cuerpo' ? 16 : 4}" ${attributes} ${attrs}>${esc(f.type === 'lines' ? value.join('\n') : value)}</textarea>`;
  else if (f.type === 'service') input = `<select id="${id}" ${attributes}><option value="">Sin enlace</option>${documentData.servicios.map(s => `<option value="${esc(s.id)}"${value === s.id ? ' selected' : ''}>${esc(s.titulo)}</option>`).join('')}</select>`;
  else input = `<input id="${id}" type="${f.type}" ${attributes} value="${esc(value)}" ${attrs}${f.type === 'number' ? ' min="0" max="999999999" step="1"' : ''}>`;
  return `<div class="admin-field ${['textarea', 'lines', 'image'].includes(f.type) ? 'wide' : ''}"><label for="${id}">${f.label}</label>${input}${f.help ? `<span class="help">${f.help}</span>` : ''}</div>`;
}

function render() {
  $('#section-title').textContent = titles[section];
  document.querySelectorAll('[data-section]').forEach(button => {
    if (button.dataset.section === section) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  $('#save').hidden = ['seguridad', 'agenda'].includes(section);
  const editor = $('#editor');
  if (section === 'agenda') {
    editor.innerHTML = '<p role="status">Cargando agenda...</p>';
    visitas.load();
    return;
  }
  if (section === 'seguridad') {
    editor.innerHTML = `<section class="editor-group"><h2>Respaldo del contenido</h2><p>Descarga una copia con los cambios de esta pestaña. Guárdala antes de recargar si hay un conflicto de versiones.</p><div class="security-actions"><button class="editor-action" type="button" data-export>Descargar respaldo JSON</button><button class="editor-action" type="button" data-publish>Publicar de nuevo</button><button class="editor-action" type="button" data-reload>Cargar última versión</button></div></section><section class="editor-group"><h2>Cambiar contraseña</h2><div class="password-fields"><label class="admin-field">Contraseña actual<input type="password" name="current" autocomplete="current-password" maxlength="200"></label><label class="admin-field">Nueva contraseña<input type="password" name="new-password" autocomplete="new-password" minlength="12" maxlength="200"></label><label class="admin-field">Repite la nueva contraseña<input type="password" name="new-repeat" autocomplete="new-password" minlength="12" maxlength="200"></label><button class="button outline" type="button" data-password>Cambiar contraseña</button></div></section><p class="editor-note">No hay contador de visitas activado. El formulario de WhatsApp no guarda datos. La agenda de visitas sí almacena datos personales; puedes borrarlos desde Agenda.</p>`;
    return;
  }
  if (section === 'general') {
    editor.innerHTML = `<p class="editor-note">El horario y el estado abierto o cerrado se muestran solo al confirmar el horario. El teléfono y WhatsApp están fijados a los datos confirmados del negocio.</p><section class="editor-group"><div class="field-grid">${schemas.general.map(f => renderField(f, documentData.general, 0)).join('')}</div></section>`;
    return;
  }
  const items = documentData[section];
  const notes = { servicios: 'Los servicios aparecen en este orden. Sube una fotografía real para acompañar cada uno.', productos: 'Sin productos visibles, la página Precios permanece oculta. Los pedidos se coordinan por WhatsApp.', trabajos: 'Esta galería es solo para fotografías reales de trabajos del cliente. Nunca subas imágenes generadas como prueba de trabajo.', blog: 'Cada entrada empieza como borrador. Marca Publicar solo después de la revisión del técnico. Una fecha futura programa su aparición a partir de ese día UTC.', faq: 'Publica solo respuestas confirmadas por el cliente.' };
  editor.innerHTML = `<p class="editor-note">${notes[section]}</p>${!items.length ? `<div class="empty-editor"><h2>Aún no hay contenido.</h2><p>Agrega el primer elemento cuando tengas la información confirmada. Mientras tanto, este bloque no aparece en el sitio.</p></div>` : ''}${items.map((item, index) => `<details class="editor-group" ${items.length === 1 || !item.titulo && !item.nombre && !item.pregunta && !item.texto ? 'open' : ''}><summary>${esc(item.titulo || item.nombre || item.pregunta || item.texto || 'Nuevo elemento')}${section === 'blog' && !item.publicado ? ' (borrador)' : ''}</summary><div class="field-grid">${schemas[section].map(f => renderField(f, item, index)).join('')}</div><div class="row-tools"><button type="button" data-move="-1" data-index="${index}" ${index === 0 ? 'disabled' : ''}>Subir ↑</button><button type="button" data-move="1" data-index="${index}" ${index === items.length - 1 ? 'disabled' : ''}>Bajar ↓</button><button type="button" data-remove="${index}">Eliminar</button></div></details>`).join('')}<button class="editor-action" data-add type="button">Agregar elemento +</button>`;
}

async function load(preserve = false) {
  const record = await api('content');
  const conflict = preserve && dirty && documentData && revision !== record.revision;
  // Local edits keep their base revision: adopting the new one would bypass the conflict guard.
  if (!preserve || !dirty || !documentData) { documentData = record.data; revision = record.revision; dirty = false; }
  $('#access').hidden = true; $('#workspace').hidden = false;
  render();
  status(conflict ? 'Conservamos tus cambios, pero otra sesión publicó una versión más reciente. Descarga un respaldo en Seguridad y respaldo antes de cargar la última versión.' : dirty ? 'Recuperamos tus cambios de esta pestaña. Aún no están guardados.' : record.updated ? `Último guardado: ${new Date(record.updated).toLocaleString('es-CL')}.` : 'Contenido inicial. Todavía no hay cambios publicados desde el panel.', !!conflict);
}

$('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  const button = form.querySelector('button');
  if (setup && values.get('password') !== values.get('repeat')) { $('#login-status').textContent = 'Las contraseñas no coinciden.'; return; }
  button.disabled = true;
  $('#login-status').textContent = 'Verificando acceso...';
  try {
    await api(setup ? 'setup' : 'login', { method: 'POST', body: JSON.stringify({ password: values.get('password'), code: values.get('code') }) });
    form.reset(); setup = false;
    await load(true);
  } catch (error) { $('#login-status').textContent = error.message; $('#login-status').classList.add('error'); }
  finally { button.disabled = false; }
});

document.querySelectorAll('[data-section]').forEach(button => button.addEventListener('click', () => { section = button.dataset.section; render(); }));
$('#editor').addEventListener('submit', event => event.preventDefault());
$('#editor').addEventListener('input', event => {
  const input = event.target;
  if (!input.dataset.key) return;
  const value = input.dataset.type === 'checkbox' ? input.checked : input.dataset.type === 'number' ? Number(input.value) : input.dataset.type === 'lines' ? input.value.split('\n').map(s => s.trim()).filter(Boolean) : input.value;
  itemAt(Number(input.dataset.index))[input.dataset.key] = value;
  changed();
});

function newItem() {
  const id = `item-${crypto.randomUUID().slice(0, 8)}`;
  const today = new Date().toISOString().slice(0, 10);
  return {
    servicios: { id, titulo: '', resumen: '', equipos: '', fallas: [], foto: '', visible: false },
    productos: { id, categoria: '', nombre: '', descripcion: '', precio: 0, desde: false, foto: '', disponible: true, destacado: false, visible: false },
    trabajos: { foto: '', texto: '', fecha: today },
    blog: { slug: id, titulo: '', extracto: '', cuerpo: '', foto: '', fecha: today, servicio: '', publicado: false },
    faq: { pregunta: '', respuesta: '' }
  }[section];
}

$('#editor').addEventListener('click', async event => {
  if (section === 'agenda') return;
  const button = event.target.closest('button');
  if (!button) return;
  if (button.hasAttribute('data-add')) { documentData[section].push(newItem()); changed(); render(); }
  else if (button.hasAttribute('data-remove') && confirm('¿Eliminar este elemento? El cambio se publicará al guardar.')) { documentData[section].splice(Number(button.dataset.remove), 1); changed(); render(); }
  else if (button.hasAttribute('data-move')) {
    const index = Number(button.dataset.index), other = index + Number(button.dataset.move), items = documentData[section];
    if (other < 0 || other >= items.length) return;
    [items[index], items[other]] = [items[other], items[index]]; changed(); render();
  } else if (button.hasAttribute('data-remove-image')) { itemAt(Number(button.dataset.index))[button.dataset.removeImage] = ''; changed(); render(); }
  else if (button.hasAttribute('data-export')) {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ revision, data: documentData }, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `zerok-respaldo-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else if (button.hasAttribute('data-reload')) {
    if (dirty && !confirm('¿Descartar los cambios sin guardar y cargar la última versión?')) return;
    try { await load(); } catch (error) { status(error.message, true); }
  } else if (button.hasAttribute('data-publish')) {
    try { await api('publish', { method: 'POST' }); status('Contenido guardado publicado de nuevo. Puede tardar un minuto en aparecer.'); } catch (error) { status(error.message, true); }
  } else if (button.hasAttribute('data-password')) {
    const current = $('#editor [name=current]'), password = $('#editor [name=new-password]'), repeat = $('#editor [name=new-repeat]');
    if (!current.value || password.value.length < 12 || password.value !== repeat.value) { status('Revisa la contraseña actual y repite la nueva con al menos 12 caracteres.', true); return; }
    button.disabled = true;
    try { await api('password', { method: 'PUT', body: JSON.stringify({ current: current.value, password: password.value }) }); current.value = password.value = repeat.value = ''; status('Contraseña cambiada. Se cerraron las otras sesiones.'); } catch (error) { status(error.message, true); }
    finally { button.disabled = false; }
  }
});

$('#save').addEventListener('click', async () => {
  if (saving || !$('#editor').reportValidity()) return;
  const snapshot = JSON.stringify(documentData);
  if (new TextEncoder().encode(snapshot).byteLength > MAX_CONTENT_BYTES) { status(CONTENT_SIZE_ERROR, true); return; }
  saving = true; $('#save').disabled = true;
  status('Guardando y publicando...');
  try {
    const record = await api('content', { method: 'PUT', body: JSON.stringify({ data: JSON.parse(snapshot), revision }) });
    revision = record.revision;
    dirty = JSON.stringify(documentData) !== snapshot;
    status(record.warning || (dirty ? 'Guardado. Tienes nuevos cambios pendientes.' : 'Guardado y publicado. Los cambios pueden tardar un minuto en aparecer.'), !!record.warning);
  } catch (error) { status(error.message, true); }
  finally { saving = false; $('#save').disabled = false; }
});

async function compress(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 20000000) throw new Error('Elige un JPG, PNG o WebP de hasta 20 MB.');
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  try {
    for (const max of [1600, 1200, 960]) {
      const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [.82, .65, .48]) {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', quality));
        if (blob?.type === 'image/webp' && blob.size <= 200000) return blob;
      }
    }
    throw new Error('No se pudo reducir la imagen. Prueba con una foto de menor tamaño.');
  } finally { bitmap.close(); }
}

$('#editor').addEventListener('change', async event => {
  const input = event.target;
  if (!input.dataset.imageKey || !input.files[0]) return;
  const item = itemAt(Number(input.dataset.index));
  const key = input.dataset.imageKey;
  const label = input.closest('.image-control').querySelector('.upload-status');
  input.disabled = true; label.textContent = 'Preparando y subiendo la imagen...';
  try {
    const blob = await compress(input.files[0]);
    const result = await api('upload', { method: 'POST', body: blob, headers: { 'content-type': 'image/webp' } });
    item[key] = result.url;
    changed(); render();
  } catch (error) { label.textContent = error.message; }
  finally { input.disabled = false; }
});

$('#logout').addEventListener('click', async () => {
  if (dirty && !confirm('Tienes cambios sin guardar. ¿Cerrar la sesión y descartarlos?')) return;
  try { await api('logout', { method: 'POST' }); dirty = false; location.reload(); } catch (error) { status(error.message, true); }
});
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });

try {
  const state = await api('session');
  if (state.autenticado) { $('#login-form button').disabled = false; await load(); }
  else {
    setup = state.pendiente;
    $('#setup-code').hidden = !setup;
    $('#password-repeat').hidden = !setup;
    $('#login-form [name=code]').required = setup;
    $('#login-form [name=repeat]').required = setup;
    $('#login-form [name=password]').autocomplete = setup ? 'new-password' : 'current-password';
    $('#access-title').textContent = setup ? 'Configura tu acceso.' : 'Inicia sesión.';
    $('#access-intro').textContent = setup ? 'Usa el código de configuración del administrador y crea una contraseña de al menos 12 caracteres.' : 'Usa tu contraseña para editar el contenido de tu sitio.';
    $('#login-status').textContent = state.configurado ? '' : 'Falta configurar el acceso en el alojamiento. El administrador debe agregar ADMIN_SETUP_TOKEN.';
    $('#login-form button').disabled = !state.configurado;
  }
} catch (error) { $('#login-status').textContent = error.message; $('#login-status').classList.add('error'); }
