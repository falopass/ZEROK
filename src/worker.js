import { Admin, json } from './admin.js';
import { readContent, published } from './content.js';
import { header, footer, page, structured, agendar, agendaLista } from './render.js';
import { equipos, limpiar } from './agenda.js';

export { Admin };

const policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests";
function secure(response, privatePage = false) {
  const headers = new Headers(response.headers);
  headers.set('content-security-policy', policy);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('strict-transport-security', 'max-age=31536000');
  if (privatePage) {
    headers.set('cache-control', 'no-store');
    headers.set('referrer-policy', 'same-origin');
    headers.set('x-robots-tag', 'noindex, nofollow');
  }
  return new Response(response.body, { status: response.status, headers });
}

async function upload(request, env) {
  if (!env.MEDIA) return json({ error: 'El almacenamiento de imágenes aún no está configurado.' }, 503);
  if (request.headers.get('content-type') !== 'image/webp') return json({ error: 'Sube una imagen WebP.' }, 415);
  const chunks = [];
  let size = 0;
  const reader = request.body?.getReader();
  if (!reader) return json({ error: 'Falta la imagen.' }, 400);
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 200000) { await reader.cancel(); return json({ error: 'La imagen debe pesar menos de 200 KB.' }, 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const ascii = (start, end) => new TextDecoder().decode(bytes.slice(start, end));
  if (size < 20 || ascii(0, 4) !== 'RIFF' || ascii(8, 12) !== 'WEBP') return json({ error: 'El archivo no es una imagen WebP válida.' }, 400);
  const key = `${crypto.randomUUID()}.webp`;
  await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: 'image/webp' } });
  return json({ url: `/media/${key}` }, 201);
}

const objeto = env => env.ADMIN.get(env.ADMIN.idFromName('zerok-admin'));
const interno = (env, path, init) => objeto(env).fetch(new Request(`https://zerok.internal/interno/${path}`, init));
const dias = async env => (await (await interno(env, 'dias')).json()).dias;

async function leer(request, max) {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  return new TextDecoder().decode(await new Blob(chunks).arrayBuffer());
}

// A human form submit always gets the styled page back, never bare text or JSON.
async function reservar(request, env, url, data) {
  const oferta = await dias(env);
  const pagina = (v, error, status) => render(request, env, url, data, '/agendar/', agendar(data, oferta, v, error, status));
  const origin = request.headers.get('origin');
  if (origin !== url.origin) return pagina({}, 'No se pudo comprobar el origen del formulario. Vuelve a intentarlo desde esta página.', 403);
  if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) return pagina({}, 'El formulario no se pudo leer. Vuelve a intentarlo.', 415);
  const raw = await leer(request, 8000);
  if (raw === null) return pagina({}, 'La solicitud es demasiado grande. Acorta los campos y vuelve a intentarlo.', 413);
  const input = Object.fromEntries(new URLSearchParams(raw));
  // Honeypot: bots that fill the hidden field see the usual confirmation and nothing is stored.
  if (input.empresa) return Response.redirect(new URL('/agendar/listo/', url), 303);
  const response = await interno(env, 'reserva', { method: 'POST', headers: { 'content-type': 'application/json', 'x-zerok-ip': request.headers.get('cf-connecting-ip') || 'local' }, body: JSON.stringify(input) });
  const result = await response.json();
  if (response.ok) {
    return Response.redirect(new URL(`/agendar/listo/?dia=${result.dia}`, url), 303);
  }
  return pagina(input, result.error || 'No pudimos registrar tu solicitud. Revisa los datos o llámanos para agendar.', response.status);
}

// Stateless handoff: the selector posts equipo/problema/sector here and the agenda page is
// rendered with them prefilled. Nothing is stored and free text never enters a URL.
async function preparar(request, env, url, data) {
  const oferta = data.agenda && env.ADMIN ? await dias(env) : [];
  const pagina = (v = {}, error = '', status) => render(request, env, url, data, '/agendar/', agendar(data, oferta, v, error, status));
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  if (origin ? origin !== url.origin : fetchSite === 'cross-site') return pagina({}, 'No se pudo comprobar el origen del formulario. Vuelve a intentarlo desde esta página.', 403);
  if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) return pagina({}, 'El formulario no se pudo leer. Vuelve a intentarlo.', 415);
  const raw = await leer(request, 4000);
  if (raw === null) return pagina({}, 'La solicitud es demasiado grande. Acorta los campos y vuelve a intentarlo.', 413);
  const input = Object.fromEntries(new URLSearchParams(raw));
  const v = {};
  if (equipos.includes(input.equipo)) v.equipo = input.equipo;
  if (limpiar(input.problema, 600)) v.problema = limpiar(input.problema, 600);
  if (limpiar(input.sector, 80)) v.sector = limpiar(input.sector, 80);
  return pagina(v);
}

async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const admin = () => objeto(env);
  if (/^\/interno(?:\/|$)/.test(path)) return json({ error: 'Ruta no encontrada.' }, 404);
  if (path.startsWith('/admin/api/')) {
    if (!env.ADMIN || !env.CONTENIDO) return json({ error: 'Falta configurar el almacenamiento del panel.' }, 503);
    if (!['GET', 'POST', 'PUT'].includes(request.method)) return json({ error: 'Método no permitido.' }, 405);
    if (request.method !== 'GET' && request.headers.get('origin') !== url.origin) return json({ error: 'Origen no permitido.' }, 403);
    if (path === '/admin/api/upload' && request.method === 'POST') {
      const response = await admin().fetch(new Request(new URL('/admin/api/session', url), { headers: request.headers }));
      if (!(await response.json()).autenticado) return json({ error: 'Inicia sesión para subir imágenes.' }, 401);
      return upload(request, env);
    }
    return admin().fetch(request);
  }
  if (path === '/agendar/' && request.method === 'POST') {
    const data = await siteData(env);
    if (data.agenda && env.ADMIN) return reservar(request, env, url, data);
    return render(request, env, url, data, '/agendar/', agendar(data, [], {}, '', 403));
  }
  if (path === '/agendar/preparar/') {
    const data = await siteData(env);
    if (request.method === 'POST') return preparar(request, env, url, data);
    return Response.redirect(new URL(`/agendar/${url.search}`, url), 303);
  }
  if (!['GET', 'HEAD'].includes(request.method)) return new Response('Método no permitido.', { status: 405, headers: { allow: 'GET, HEAD' } });
  if (path.startsWith('/media/')) {
    if (!/^\/media\/[a-f0-9-]{36}\.webp$/.test(path) || !env.MEDIA) return new Response('No encontrado.', { status: 404 });
    const object = await env.MEDIA.get(path.slice(7));
    if (!object) return new Response('No encontrado.', { status: 404 });
    return new Response(request.method === 'HEAD' ? null : object.body, { headers: { 'content-type': 'image/webp', 'cache-control': 'public, max-age=31536000, immutable', etag: object.httpEtag } });
  }
  if (path === '/admin') return Response.redirect(new URL('/admin/', url), 308);
  if (path.startsWith('/admin/')) return env.ASSETS.fetch(path === '/admin/' ? new URL('/admin/index.html', url) : request);
  if (/^\/(css|js|fonts|img)\//.test(path)) return env.ASSETS.fetch(request);
  const data = await siteData(env);
  const origin = env.SITE_URL || url.origin;
  const indexing = env.PUBLIC_INDEXING === 'true' && url.origin === new URL(origin).origin;
  if (path === '/robots.txt') return new Response(indexing ? `User-agent: *\nDisallow: /admin/\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n', { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-cache' } });
  if (path === '/sitemap.xml') {
    const paths = ['/', '/servicios/', ...(data.agenda ? ['/agendar/'] : []), '/contacto/', ...(data.productos.length ? ['/precios/'] : []), ...(data.blog.length ? ['/blog/', ...data.blog.map(p => `/blog/${p.slug}/`)] : [])];
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p => `<url><loc>${new URL(p, origin).href}</loc></url>`).join('')}</urlset>`, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'no-cache' } });
  }
  if (path === '/index.html') return Response.redirect(new URL('/', url), 308);
  if (path !== '/' && !path.includes('.') && !path.endsWith('/')) return Response.redirect(new URL(`${path}/${url.search}`, url), 308);
  // Only the equipment enum may arrive by GET; free text never travels in the URL.
  const equipo = url.searchParams.get('equipo');
  const prefill = equipos.includes(equipo) ? { equipo } : {};
  const rendered = path === '/agendar/' && data.agenda ? agendar(data, await dias(env), prefill)
    : path === '/agendar/listo/' && data.agenda ? agendaLista(data, url.searchParams.get('dia'))
    : page(data, path);
  return render(request, env, url, data, path, rendered);
}

async function siteData(env) {
  const [content, agenda] = await Promise.all([readContent(env), env.CONTENIDO?.get('agenda', 'json')]);
  return { ...published(content), agenda: agenda?.activa === true && !!env.ADMIN };
}

async function render(request, env, url, data, path, rendered) {
  const origin = env.SITE_URL || url.origin;
  const indexing = env.PUBLIC_INDEXING === 'true' && url.origin === new URL(origin).origin && !rendered.noindex;
  const canonical = new URL(path, origin).href;
  const template = await env.ASSETS.fetch(new URL('/index.html', url));
  const replace = html => ({ element(element) { element.setInnerContent(html, { html: true }); } });
  const attribute = (name, value) => ({ element(element) { element.setAttribute(name, value); } });
  let transform = new HTMLRewriter()
    .on('title', { element(element) { element.setInnerContent(rendered.title); } })
    .on('meta[name="description"]', attribute('content', rendered.description))
    .on('meta[name="robots"]', attribute('content', indexing && !rendered.status ? 'index, follow' : 'noindex, nofollow'))
    .on('link[rel="canonical"]', attribute('href', canonical))
    .on('meta[property="og:title"]', attribute('content', rendered.title))
    .on('meta[property="og:description"]', attribute('content', rendered.description))
    .on('meta[property="og:url"]', attribute('content', canonical))
    .on('meta[property="og:type"]', attribute('content', rendered.post ? 'article' : 'website'))
    .on('meta[property="og:image"]', attribute('content', new URL(rendered.post?.foto || data.general.hero || '/img/refrigeracion.webp', origin).href))
    .on('#header', replace(header(data, path)))
    .on('#contenido', replace(rendered.html))
    .on('#footer', replace(footer(data)))
    .on('#structured-data', replace(structured(data, rendered, canonical)));
  if (path === '/') transform = transform.on('head', { element(element) { element.append(`<link rel="preload" as="image" href="${data.general.hero}">`, { html: true }); } });
  const response = transform.transform(template);
  const headers = new Headers(response.headers);
  headers.set('cache-control', 'no-cache');
  headers.delete('etag');
  if (!indexing || rendered.status) headers.set('x-robots-tag', 'noindex, nofollow');
  return new Response(request.method === 'HEAD' ? null : response.body, { status: rendered.status || 200, headers });
}

export default {
  async fetch(request, env) {
    let response;
    try { response = await handle(request, env); }
    catch { response = json({ error: 'El sitio no está disponible en este momento. Vuelve a intentarlo en unos minutos.' }, 503); }
    return secure(response, new URL(request.url).pathname.startsWith('/admin/') || new URL(request.url).pathname.startsWith('/agendar/') || !['GET', 'HEAD'].includes(request.method));
  },

  // Retry durable notifications every fifteen minutes; the object applies Chilean reminder days.
  async scheduled(controller, env) {
    if (!env.ADMIN) return;
    const response = await interno(env, 'cron', { method: 'POST' });
    if (!response.ok) throw new Error('No se pudo procesar la cola de avisos.');
  }
};
