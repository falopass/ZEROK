import { defaults, validateContent } from './content.js';
import { MAX_CONTENT_BYTES } from '../sitio/js/limites.js';
import { hoy, ahoraChile, sumar, esFecha, parseHora, disponibles, horasOcupadas, construirOferta, validarReserva, equipos, telefono, correoActivo, limpiar, avisoReserva, avisoSeguimiento } from './agenda.js';

const enc = new TextEncoder();
const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const random = () => hex(crypto.getRandomValues(new Uint8Array(32)));
const digest = async text => hex(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(text))));
const equal = (a, b) => { let difference = a.length ^ b.length; for (let i = 0; i < Math.max(a.length, b.length); i++) difference |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0); return difference === 0; };
const passwordOK = value => typeof value === 'string' && value.length >= 12 && value.length <= 200;
const cookie = (value, age = 43200) => `__Host-zerok=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
const COLUMNAS = ['id', 'creada', 'actualizada', 'estado', 'dia', 'hora', 'nombre', 'telefono', 'direccion', 'sector', 'referencia', 'equipo', 'problema', 'nota', 'realizada', 'seguimiento', 'resultado'];
export const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra } });

async function derive(password, salt) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  // Web Crypto in Workers supports up to 100000 PBKDF2 iterations.
  return hex(new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100000 }, key, 256)));
}

export async function body(request, max = MAX_CONTENT_BYTES * 2) {
  // Allow indentation in exported backups; validateContent limits the normalized document.
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw Object.assign(new Error('Se requiere JSON.'), { status: 415 });
  const reader = request.body?.getReader();
  if (!reader) throw Object.assign(new Error('Falta el contenido.'), { status: 400 });
  const chunks = [];
  let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      throw Object.assign(new Error('La solicitud supera el tamaño permitido.'), { status: 413 });
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const input = JSON.parse(new TextDecoder().decode(bytes));
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Object.assign(new Error('Se requiere un objeto JSON.'), { status: 400 });
  return input;
}

// A single Durable Object serializes setup, login attempts, sessions and edits.
// KV is the public read model; durable storage keeps the canonical document and revision.
export class Admin {
  constructor(ctx, env) {
    this.ctx = ctx; this.env = env;
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS visitas (${COLUMNAS.map(c => `${c} TEXT NOT NULL${c === 'id' ? ' PRIMARY KEY' : " DEFAULT ''"}`).join(', ')})`);
    ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS avisos (id TEXT PRIMARY KEY, visita TEXT NOT NULL, tipo TEXT NOT NULL, dia TEXT NOT NULL, intentos INTEGER NOT NULL DEFAULT 0, proximo INTEGER NOT NULL DEFAULT 0, enviada TEXT NOT NULL DEFAULT '')");
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS avisos_pendientes ON avisos (enviada, proximo)');
  }

  sql(query, ...values) { return this.ctx.storage.sql.exec(query, ...values).toArray(); }
  async config() {
    const raw = await this.ctx.storage.get('agenda');
    const config = { activa: false, bloqueados: [], horasBloqueadas: {}, mismoDia: true, seguimiento: 14, revision: 'inicial', ...raw };
    config.activa = config.activa === true && !!await this.ctx.storage.get('credentials');
    config.horasBloqueadas = config.horasBloqueadas && typeof config.horasBloqueadas === 'object' && !Array.isArray(config.horasBloqueadas) ? config.horasBloqueadas : {};
    config.mismoDia = config.mismoDia !== false;
    return config;
  }
  async agenda() {
    // Aggregate queue counts only; the panel never reads message bodies here.
    const pendientes = this.sql("SELECT COUNT(*) AS n FROM avisos WHERE enviada = ''")[0].n;
    const reintentos = this.sql("SELECT COUNT(*) AS n FROM avisos WHERE enviada = '' AND intentos > 0")[0].n;
    const correoPorVisita = {};
    for (const a of this.sql("SELECT visita, enviada, intentos FROM avisos WHERE tipo = 'reserva'")) correoPorVisita[a.visita] = { enviada: a.enviada, intentos: a.intentos };
    const visitas = this.sql("SELECT * FROM visitas ORDER BY dia, CASE WHEN hora = '' THEN '99:99' ELSE hora END, creada").map(v => ({ ...v, correoAviso: correoPorVisita[v.id] || null }));
    return { visitas, hoy: hoy(), config: await this.config(), general: await this.general(), correo: correoActivo(this.env), avisos: { pendientes, reintentos } };
  }

  async general() {
    const stored = await this.ctx.storage.get('content');
    if (stored?.data?.general) return stored.data.general;
    const kv = await this.env.CONTENIDO?.get('contenido', 'json');
    return kv?.data?.general || defaults.general;
  }

  // Routes under /interno/ are only reachable from the Worker, which forwards nothing but /admin/api/ from outside.
  async interno(path, request) {
    const config = await this.config();
    if (path === '/interno/dias' && request.method === 'GET') {
      if (!config.activa) return json({ dias: [], ocupadas: {} });
      const general = await this.general();
      const ahora = ahoraChile();
      const opts = { mismoDia: !!config.mismoDia, general, ahora };
      const dias = disponibles(config.bloqueados, opts);
      const filas = this.sql("SELECT dia, hora FROM visitas WHERE estado IN ('solicitada', 'confirmada') AND hora != '' AND dia >= ?", ahora.dia);
      const porDia = {};
      for (const f of filas) (porDia[f.dia] ||= []).push(f.hora);
      const ocupadas = {};
      for (const d of dias) {
        const activasDia = [...(porDia[d] || []), ...(config.horasBloqueadas[d] || [])];
        const tomadas = horasOcupadas(d, activasDia, general, opts);
        if (tomadas.length) ocupadas[d] = tomadas;
      }
      return json({ dias, ocupadas, mismoDia: !!config.mismoDia, ahora });
    }
    if (path === '/interno/reserva' && request.method === 'POST') {
      if (!config.activa) return json({ error: 'La agenda en línea no está disponible. Llámanos para agendar tu visita.' }, 403);
      const input = await body(request, 8000);
      const now = Date.now();
      const key = `reserva:${await digest(request.headers.get('x-zerok-ip') || 'local')}`;
      let rate = await this.ctx.storage.get(key);
      if (!rate || rate.expires <= now) rate = { count: 0, expires: now + 3600000 };
      const recientes = this.sql('SELECT COUNT(*) AS n FROM visitas WHERE creada > ?', new Date(now - 86400000).toISOString())[0].n;
      if (rate.count >= 5 || recientes >= 40) return json({ error: 'Recibimos muchas solicitudes seguidas. Llámanos para agendar tu visita.' }, 429);
      const general = await this.general();
      const ahora = ahoraChile();
      const opts = { mismoDia: !!config.mismoDia, general, ahora };
      const dias = disponibles(config.bloqueados, opts);
      const activas = d => [
        ...this.sql("SELECT hora FROM visitas WHERE dia = ? AND estado IN ('solicitada', 'confirmada') AND hora != ''", d).map(r => r.hora),
        ...(config.horasBloqueadas[d] || [])
      ];
      const ocupadas = {};
      if (esFecha(input.dia) && dias.includes(input.dia)) {
        const tomadas = horasOcupadas(input.dia, activas(input.dia), general, opts);
        if (tomadas.length) ocupadas[input.dia] = tomadas;
      }
      const oferta = construirOferta(dias, ocupadas, general, opts);
      const { error, errores, visita } = validarReserva(input, oferta);
      if (error) {
        const yaTomada = errores[0]?.campo === 'hora' && (ocupadas[visita.dia] || []).includes(visita.hora);
        const diaLleno = errores[0]?.campo === 'dia' && dias.includes(visita.dia) && !oferta.libres.includes(visita.dia);
        return json({ error, campo: errores[0]?.campo || '' }, yaTomada || diaLleno ? 409 : 400);
      }
      const creada = new Date(now).toISOString();
      const record = { ...Object.fromEntries(COLUMNAS.map(c => [c, ''])), ...visita, id: crypto.randomUUID(), creada, actualizada: creada, estado: 'solicitada' };
      let conflicto = false;
      this.ctx.storage.transactionSync(() => {
        if (horasOcupadas(record.dia, activas(record.dia), general, opts).includes(record.hora)) {
          conflicto = true;
          return;
        }
        this.sql(`INSERT INTO visitas (${COLUMNAS.join(', ')}) VALUES (${COLUMNAS.map(() => '?').join(', ')})`, ...COLUMNAS.map(c => record[c]));
        this.encolar(record.id, 'reserva', record.dia);
      });
      if (conflicto) return json({ error: 'Esa hora ya fue tomada para ese día. Elige otra disponible.', campo: 'hora' }, 409);
      rate.count++;
      await this.ctx.storage.put(key, rate);
      await this.ctx.storage.setAlarm(now + 3600000);
      // The queued notice leaves right away; the 15-minute cron only catches failures.
      this.ctx.waitUntil(this.procesarAvisos());
      return json({ dia: record.dia, hora: record.hora }, 201);
    }
    return json({ error: 'Ruta no encontrada.' }, 404);
  }

  encolar(visita, tipo, dia) {
    this.sql('INSERT OR IGNORE INTO avisos (id, visita, tipo, dia) VALUES (?, ?, ?, ?)', `${tipo}:${visita}:${dia}`, visita, tipo, dia);
  }

  async procesarAvisos() {
    const hoyChile = hoy();
    const horaChile = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Santiago', hour: '2-digit', hourCycle: 'h23' }).format(new Date()));
    this.ctx.storage.transactionSync(() => {
      this.sql('DELETE FROM visitas WHERE actualizada < ?', new Date(Date.now() - 365 * 86400000).toISOString());
      this.sql("DELETE FROM avisos WHERE NOT EXISTS (SELECT 1 FROM visitas WHERE visitas.id = avisos.visita) OR (tipo = 'reserva' AND enviada = '' AND EXISTS (SELECT 1 FROM visitas WHERE visitas.id = avisos.visita AND visitas.estado != 'solicitada')) OR (tipo = 'seguimiento' AND EXISTS (SELECT 1 FROM visitas WHERE visitas.id = avisos.visita AND visitas.estado != 'realizada'))");
      if (horaChile >= 9) {
        const pendientes = this.sql("SELECT id FROM visitas WHERE estado = 'realizada' AND seguimiento != '' AND seguimiento <= ?", hoyChile);
        for (const v of pendientes) {
          // One pending reminder per visit; failures survive the change of calendar day.
          if (!this.sql("SELECT id FROM avisos WHERE visita = ? AND tipo = 'seguimiento' AND (enviada = '' OR dia = ?) LIMIT 1", v.id, hoyChile).length) this.encolar(v.id, 'seguimiento', hoyChile);
        }
      }
    });
    if (!correoActivo(this.env)) return json({ ok: true, correo: false });
    for (let i = 0; i < 10; i++) {
      const aviso = this.sql("SELECT * FROM avisos WHERE enviada = '' AND proximo <= ? ORDER BY proximo, dia, id LIMIT 1", Date.now())[0];
      if (!aviso) break;
      const visita = this.sql('SELECT * FROM visitas WHERE id = ?', aviso.visita)[0];
      if (!visita || (aviso.tipo === 'seguimiento' && visita.estado !== 'realizada') || (aviso.tipo === 'reserva' && visita.estado !== 'solicitada')) { this.sql('DELETE FROM avisos WHERE id = ?', aviso.id); continue; }
      // Persist a lease before awaiting the provider, so concurrent cron invocations cannot claim it.
      this.sql('UPDATE avisos SET proximo = ?, intentos = intentos + 1 WHERE id = ?', Date.now() + 15 * 60000, aviso.id);
      try {
        if (aviso.tipo === 'reserva') await avisoReserva(this.env, { ...visita, dia: aviso.dia });
        else await avisoSeguimiento(this.env, [visita]);
        this.sql('UPDATE avisos SET enviada = ?, dia = ? WHERE id = ? AND intentos = ?', new Date().toISOString(), aviso.tipo === 'seguimiento' ? hoy() : aviso.dia, aviso.id, aviso.intentos + 1);
      } catch {
        const demora = Math.min(6 * 3600000, 15 * 60000 * 2 ** Math.min(aviso.intentos, 5));
        this.sql('UPDATE avisos SET proximo = ? WHERE id = ? AND intentos = ?', Date.now() + demora, aviso.id, aviso.intentos + 1);
      }
    }
    return json({ ok: true, correo: true });
  }

  choqueDe(dia, hora, excluirId = '') {
    const m = parseHora(hora);
    if (m === null) return null;
    const otras = this.sql("SELECT id, nombre, hora FROM visitas WHERE dia = ? AND id != ? AND estado IN ('solicitada', 'confirmada') AND hora != ''", dia, excluirId);
    return otras.find(o => {
      const s = parseHora(o.hora);
      return s !== null && m < s + 60 && s < m + 60;
    }) || null;
  }

  actualizar(input, config) {
    const v = this.sql('SELECT * FROM visitas WHERE id = ?', String(input.id ?? ''))[0];
    if (!v) return [404, 'Esta visita ya no existe. Recarga la agenda.'];
    if (input.expectedUpdated !== v.actualizada) return [409, 'La visita cambió en otra sesión. Recarga la agenda antes de modificarla.'];
    const abierta = ['solicitada', 'confirmada'].includes(v.estado);
    const set = cambios => {
      const keys = Object.keys(cambios);
      this.sql(`UPDATE visitas SET ${keys.map(k => `${k} = ?`).join(', ')}, actualizada = ? WHERE id = ?`, ...keys.map(k => cambios[k]), new Date(Math.max(Date.now(), Date.parse(v.actualizada) + 1)).toISOString(), v.id);
    };
    const hora = input.hora ?? '';
    if (input.accion === 'eliminar') {
      this.ctx.storage.transactionSync(() => { this.sql('DELETE FROM avisos WHERE visita = ?', v.id); this.sql('DELETE FROM visitas WHERE id = ?', v.id); });
      return;
    }
    if (input.accion === 'confirmar' && abierta) {
      if (!esFecha(input.dia) || input.dia < hoy() || config.bloqueados.includes(input.dia) || typeof hora !== 'string' || (hora !== '' && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hora))) return [400, 'Revisa el día y la hora de la visita.'];
      if (hora && !input.forzar) {
        const choque = this.choqueDe(input.dia, hora, v.id);
        if (choque) return [409, `Choque de horario: ya tienes una visita con ${choque.nombre} a las ${choque.hora} ese día.`, { choque: true }];
      }
      set({ estado: 'confirmada', dia: input.dia, hora }); return;
    }
    if (input.nota !== undefined && (typeof input.nota !== 'string' || input.nota.length > 500)) return [400, 'La nota admite hasta 500 caracteres.'];
    if (input.resultado !== undefined && (typeof input.resultado !== 'string' || input.resultado.length > 500)) return [400, 'El resultado admite hasta 500 caracteres.'];
    if (input.accion === 'reenviar' && v.estado === 'solicitada') {
      this.ctx.storage.transactionSync(() => {
        this.sql("DELETE FROM avisos WHERE visita = ? AND tipo = 'reserva'", v.id);
        this.encolar(v.id, 'reserva', v.dia);
      });
      this.ctx.waitUntil(this.procesarAvisos());
      return;
    }
    if (input.accion === 'realizada' && abierta) { const dia = hoy(); set({ estado: 'realizada', nota: limpiar(input.nota, 500), realizada: dia, seguimiento: sumar(dia, config.seguimiento) }); return; }
    if (['ausente', 'cancelar'].includes(input.accion) && abierta) { set({ estado: input.accion === 'ausente' ? 'ausente' : 'cancelada' }); return; }
    if (input.accion === 'cerrar' && v.estado === 'realizada') { set({ estado: 'cerrada', resultado: limpiar(input.resultado, 500) }); return; }
    return [409, 'Esta acción no corresponde al estado actual de la visita. Recarga la agenda.'];
  }

  async fetch(request) {
    // Provider I/O must not hold blockConcurrencyWhile's 30-second initialization lock.
    if (new URL(request.url).pathname === '/interno/cron' && request.method === 'POST') return this.procesarAvisos();
    return this.ctx.blockConcurrencyWhile(async () => {
      try { return await this.handle(request); }
      catch (error) {
        if (error instanceof SyntaxError) return json({ error: 'El JSON no es válido.' }, 400);
        if ([400, 413, 415].includes(error.status)) return json({ error: error.message }, error.status);
        return json({ error: 'No se pudo completar la operación. Inténtalo de nuevo.' }, 500);
      }
    });
  }

  async session(request) {
    const token = request.headers.get('cookie')?.match(/(?:^|;\s*)__Host-zerok=([a-f0-9]{64})(?:;|$)/)?.[1];
    if (!token) return null;
    const key = `session:${await digest(token)}`;
    const session = await this.ctx.storage.get(key);
    return session?.expires > Date.now() ? key : null;
  }

  async openSession() {
    const token = random();
    await this.ctx.storage.put(`session:${await digest(token)}`, { expires: Date.now() + 43200000 });
    await this.ctx.storage.setAlarm(Date.now() + 3600000);
    return json({ ok: true }, 200, { 'set-cookie': cookie(token) });
  }

  async handle(request) {
    const path = new URL(request.url).pathname;
    const method = request.method;
    if (path.startsWith('/interno/')) return this.interno(path, request);
    const credentials = await this.ctx.storage.get('credentials');
    if (path === '/admin/api/session' && method === 'GET') return json({ autenticado: !!await this.session(request), pendiente: !credentials, configurado: !!this.env.ADMIN_SETUP_TOKEN });
    if (['/admin/api/setup', '/admin/api/login'].includes(path) && method === 'POST') {
      if (!this.env.ADMIN_SETUP_TOKEN) return json({ error: 'El administrador debe configurar ADMIN_SETUP_TOKEN antes de habilitar el acceso.' }, 503);
      const ip = request.headers.get('cf-connecting-ip') || 'local';
      const key = `rate:${await digest(ip)}`;
      const now = Date.now();
      let rate = await this.ctx.storage.get(key);
      if (!rate || rate.expires <= now) rate = { count: 0, expires: now + 900000 };
      if (rate.count >= 5) return json({ error: 'Demasiados intentos. Vuelve a intentar en 15 minutos.' }, 429, { 'retry-after': String(Math.ceil((rate.expires - now) / 1000)) });
      const input = await body(request, 2000);
      if (!passwordOK(input.password)) return json({ error: 'La contraseña debe tener entre 12 y 200 caracteres.' }, 400);
      if (path.endsWith('/setup') && credentials) return json({ error: 'La cuenta ya está configurada. Inicia sesión.' }, 409);
      const valid = path.endsWith('/setup')
        ? typeof input.code === 'string' && input.code.length <= 200 && equal(await digest(input.code), await digest(this.env.ADMIN_SETUP_TOKEN))
        : !!credentials && equal(await derive(input.password, credentials.salt), credentials.hash);
      if (!valid) {
        rate.count++;
        await this.ctx.storage.put(key, rate);
        await this.ctx.storage.setAlarm(now + 3600000);
        return json({ error: 'Las credenciales no son correctas.' }, 401);
      }
      if (!credentials) {
        const salt = random();
        await this.ctx.storage.put('credentials', { salt, hash: await derive(input.password, salt) });
      }
      await this.ctx.storage.delete(key);
      return this.openSession();
    }
    const sessionKey = await this.session(request);
    if (!sessionKey) return json({ error: 'Tu sesión terminó. Inicia sesión para continuar.' }, 401);
    if (path === '/admin/api/logout' && method === 'POST') {
      await this.ctx.storage.delete(sessionKey);
      return json({ ok: true }, 200, { 'set-cookie': cookie('', 0) });
    }
    if (path === '/admin/api/password' && method === 'PUT') {
      const input = await body(request, 2000);
      if (!passwordOK(input.password) || typeof input.current !== 'string' || input.current.length > 200) return json({ error: 'Revisa las contraseñas. La nueva debe tener al menos 12 caracteres.' }, 400);
      if (!equal(await derive(input.current, credentials.salt), credentials.hash)) return json({ error: 'La contraseña actual no es correcta.' }, 401);
      const salt = random();
      await this.ctx.storage.put('credentials', { salt, hash: await derive(input.password, salt) });
      const sessions = await this.ctx.storage.list({ prefix: 'session:' });
      await this.ctx.storage.delete([...sessions.keys()]);
      return this.openSession();
    }
    if (path === '/admin/api/content') {
      let current = await this.ctx.storage.get('content');
      if (!current) current = await this.env.CONTENIDO.get('contenido', 'json') || { data: defaults, revision: 'inicial' };
      if (method === 'GET') return json(current);
      if (method === 'PUT') {
        const input = await body(request);
        if (input.revision !== current.revision) return json({ error: 'Hay una versión más reciente. Exporta tus cambios y vuelve a cargar antes de guardar.' }, 409);
        let data;
        try { data = validateContent(input.data); } catch (error) { return json({ error: error.message }, error.status === 413 ? 413 : 400); }
        const record = { data, revision: crypto.randomUUID(), updated: new Date().toISOString() };
        // Save durably first. If KV fails, the canonical edit is still recoverable.
        await this.ctx.storage.put({ content: record, previous: current });
        try { await this.env.CONTENIDO.put('contenido', JSON.stringify(record)); }
        catch { return json({ ...record, warning: 'Guardado en el panel. La publicación quedó pendiente; usa Publicar de nuevo.' }); }
        return json(record);
      }
    }
    if (path === '/admin/api/visitas' && ['GET', 'POST', 'PUT'].includes(method)) {
      const config = await this.config();
      if (method === 'PUT') {
        const failure = this.actualizar(await body(request, 4000), config);
        if (failure) return json({ error: failure[1], ...(failure[2] || {}) }, failure[0]);
      }
      if (method === 'POST') {
        const input = await body(request, 4000);
        const nombre = limpiar(input.nombre, 80).replace(/\s+/g, ' ');
        const dia = limpiar(input.dia, 10);
        const hora = limpiar(input.hora ?? '', 5);
        const equipo = equipos.includes(input.equipo) ? input.equipo : 'Otro equipo';
        const tel = telefono(input.telefono) || limpiar(input.telefono, 30);
        const direccion = limpiar(input.direccion, 150);
        const sector = limpiar(input.sector, 80);
        const referencia = limpiar(input.referencia, 150);
        const problema = limpiar(input.problema, 600);
        if (!nombre || !esFecha(dia) || dia < hoy()) return json({ error: 'Indica al menos el nombre del cliente y un día válido desde hoy.' }, 400);
        if (hora !== '' && parseHora(hora) === null) return json({ error: 'Revisa la hora de la visita.' }, 400);
        if (hora && !input.forzar) {
          const choque = this.choqueDe(dia, hora);
          if (choque) return json({ error: `Choque de horario: ya tienes una visita con ${choque.nombre} a las ${choque.hora} ese día.`, choque: true }, 409);
        }
        const now = new Date().toISOString();
        const record = { ...Object.fromEntries(COLUMNAS.map(c => [c, ''])), id: crypto.randomUUID(), creada: now, actualizada: now, estado: 'confirmada', dia, hora, nombre, telefono: tel, direccion, sector, referencia, equipo, problema };
        this.sql(`INSERT INTO visitas (${COLUMNAS.join(', ')}) VALUES (${COLUMNAS.map(() => '?').join(', ')})`, ...COLUMNAS.map(c => record[c]));
        return json(await this.agenda(), 201);
      }
      return json(await this.agenda());
    }
    if (path === '/admin/api/agenda' && method === 'PUT') {
      const input = await body(request, 8000);
      const config = await this.config();
      if (input.revision !== config.revision) return json({ error: 'La configuración cambió. Recarga la agenda antes de guardar.' }, 409);
      const seguimiento = input.seguimiento;
      const mismoDia = typeof input.mismoDia === 'boolean' ? input.mismoDia : config.mismoDia;
      const rawHoras = input.horasBloqueadas === undefined ? config.horasBloqueadas : input.horasBloqueadas;
      const horasValidas = rawHoras && typeof rawHoras === 'object' && !Array.isArray(rawHoras) && Object.keys(rawHoras).length <= 120
        && Object.entries(rawHoras).every(([d, hs]) => esFecha(d) && Array.isArray(hs) && hs.length <= 24 && hs.every(h => parseHora(h) !== null));
      if (typeof input.activa !== 'boolean' || !Array.isArray(input.bloqueados) || input.bloqueados.length > 120 || !input.bloqueados.every(esFecha) || !horasValidas || !Number.isInteger(seguimiento) || seguimiento < 1 || seguimiento > 90) return json({ error: 'Revisa los días bloqueados y los días para el llamado de seguimiento (entre 1 y 90).' }, 400);
      const activa = input.activa;
      if (activa && !await this.ctx.storage.get('credentials')) return json({ error: 'Configura el acceso antes de abrir la agenda.' }, 409);
      const inicio = hoy();
      const horasBloqueadas = {};
      for (const [d, hs] of Object.entries(rawHoras)) {
        if (d < inicio) continue;
        const limpias = [...new Set(hs)].sort();
        if (limpias.length) horasBloqueadas[d] = limpias;
      }
      await this.ctx.storage.put('agenda', { activa, bloqueados: [...new Set(input.bloqueados)].filter(d => d >= inicio).sort(), horasBloqueadas, mismoDia, seguimiento, revision: crypto.randomUUID() });
      // KV contains only the public switch, never visit or customer details.
      try { await this.env.CONTENIDO.put('agenda', JSON.stringify({ activa })); }
      catch { return json({ ...await this.agenda(), warning: 'Configuración guardada. Falta publicar el cambio de acceso público; vuelve a guardar.' }); }
      return json(await this.agenda());
    }
    if (path === '/admin/api/publish' && method === 'POST') {
      const record = await this.ctx.storage.get('content');
      if (!record) return json({ error: 'Primero guarda el contenido.' }, 400);
      await this.env.CONTENIDO.put('contenido', JSON.stringify(record));
      return json({ ok: true });
    }
    return json({ error: 'Ruta no encontrada.' }, 404);
  }

  async alarm() {
    for (const prefix of ['rate:', 'session:', 'reserva:']) {
      const entries = await this.ctx.storage.list({ prefix });
      const expired = [...entries].filter(([, value]) => value.expires <= Date.now()).map(([key]) => key);
      if (expired.length) await this.ctx.storage.delete(expired);
    }
    const active = await this.ctx.storage.list({ prefix: 'session:', limit: 1 });
    const rates = await this.ctx.storage.list({ prefix: 'rate:', limit: 1 });
    const reservas = await this.ctx.storage.list({ prefix: 'reserva:', limit: 1 });
    if (active.size || rates.size || reservas.size) await this.ctx.storage.setAlarm(Date.now() + 3600000);
  }
}
