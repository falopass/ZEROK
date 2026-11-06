import { defaults, validateContent } from './content.js';
import { MAX_CONTENT_BYTES, CONTENT_SIZE_ERROR } from '../sitio/js/limites.js';

const enc = new TextEncoder();
const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const random = () => hex(crypto.getRandomValues(new Uint8Array(32)));
const digest = async text => hex(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(text))));
const equal = (a, b) => { let difference = a.length ^ b.length; for (let i = 0; i < Math.max(a.length, b.length); i++) difference |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0); return difference === 0; };
const passwordOK = value => typeof value === 'string' && value.length >= 12 && value.length <= 200;
const cookie = (value, age = 43200) => `__Host-zerok=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
export const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra } });

async function derive(password, salt) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  // Web Crypto in Workers supports up to 100000 PBKDF2 iterations.
  return hex(new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100000 }, key, 256)));
}

export async function body(request, max = MAX_CONTENT_BYTES + 1024) {
  // Reserve space for the revision and JSON envelope around the content document.
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
      throw Object.assign(new Error(max > MAX_CONTENT_BYTES ? CONTENT_SIZE_ERROR : 'La solicitud supera el tamaño permitido.'), { status: 413 });
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
  constructor(ctx, env) { this.ctx = ctx; this.env = env; }

  async fetch(request) {
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
    if (path === '/admin/api/publish' && method === 'POST') {
      const record = await this.ctx.storage.get('content');
      if (!record) return json({ error: 'Primero guarda el contenido.' }, 400);
      await this.env.CONTENIDO.put('contenido', JSON.stringify(record));
      return json({ ok: true });
    }
    return json({ error: 'Ruta no encontrada.' }, 404);
  }

  async alarm() {
    for (const prefix of ['rate:', 'session:']) {
      const entries = await this.ctx.storage.list({ prefix });
      const expired = [...entries].filter(([, value]) => value.expires <= Date.now()).map(([key]) => key);
      if (expired.length) await this.ctx.storage.delete(expired);
    }
    const active = await this.ctx.storage.list({ prefix: 'session:', limit: 1 });
    const rates = await this.ctx.storage.list({ prefix: 'rate:', limit: 1 });
    if (active.size || rates.size) await this.ctx.storage.setAlarm(Date.now() + 3600000);
  }
}
