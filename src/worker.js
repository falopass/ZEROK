import { Admin, json } from './admin.js';
import { readContent, published } from './content.js';
import { header, footer, page, structured } from './render.js';

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

async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const admin = () => env.ADMIN.get(env.ADMIN.idFromName('zerok-admin'));
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
  const data = published(await readContent(env));
  const origin = env.SITE_URL || url.origin;
  const indexing = env.PUBLIC_INDEXING === 'true' && url.origin === new URL(origin).origin;
  if (path === '/robots.txt') return new Response(indexing ? `User-agent: *\nDisallow: /admin/\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n', { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-cache' } });
  if (path === '/sitemap.xml') {
    const paths = ['/', '/servicios/', '/contacto/', ...(data.productos.length ? ['/precios/'] : []), ...(data.blog.length ? ['/blog/', ...data.blog.map(p => `/blog/${p.slug}/`)] : [])];
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p => `<url><loc>${new URL(p, origin).href}</loc></url>`).join('')}</urlset>`, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'no-cache' } });
  }
  if (path === '/index.html') return Response.redirect(new URL('/', url), 308);
  if (path !== '/' && !path.includes('.') && !path.endsWith('/')) return Response.redirect(new URL(`${path}/${url.search}`, url), 308);
  const rendered = page(data, path);
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
    return secure(response, new URL(request.url).pathname.startsWith('/admin/'));
  }
};
