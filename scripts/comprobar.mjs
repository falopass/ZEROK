// Comprobaciones del repo, sin dependencias (Node 22, módulos nativos):
// sintaxis de los .js/.mjs, JSON válido en sitio/, enlaces locales existentes
// y rayas largas (— y –) prohibidas en el texto visible.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const rel = p => relative(raiz, p);
const errores = [];

const archivos = (dir, exts) => {
  const salida = [];
  const pila = [dir];
  while (pila.length) {
    const actual = pila.pop();
    for (const e of readdirSync(actual, { withFileTypes: true })) {
      const p = join(actual, e.name);
      if (e.isDirectory()) pila.push(p);
      else if (exts.some(x => e.name.endsWith(x))) salida.push(p);
    }
  }
  return salida.sort();
};

// 1. Sintaxis de todo el JavaScript del repo.
const js = ['src', 'sitio/js', 'sitio/admin', 'scripts']
  .map(d => join(raiz, d))
  .filter(existsSync)
  .flatMap(d => archivos(d, ['.js', '.mjs']));
for (const f of js) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  } catch (e) {
    errores.push(`sintaxis JS: ${rel(f)}\n${String(e.stderr || e.message).trim()}`);
  }
}

// 2. JSON y webmanifest de sitio/ deben parsear.
const jsons = archivos(join(raiz, 'sitio'), ['.json', '.webmanifest']);
for (const f of jsons) {
  try {
    JSON.parse(readFileSync(f, 'utf8'));
  } catch (e) {
    errores.push(`JSON inválido: ${rel(f)}: ${e.message}`);
  }
}

// 3. href/src locales en los HTML estáticos deben existir bajo sitio/.
// Se ignoran las rutas que responde el worker en servidor.
const rutasWorker = new Set(['/', '/servicios/', '/agendar/', '/contacto/', '/privacidad/', '/creditos/', '/admin/']);
for (const html of ['sitio/index.html', 'sitio/admin/index.html']) {
  const texto = readFileSync(join(raiz, html), 'utf8');
  for (const m of texto.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    // Externos, anclas y esquemas (mailto:, tel:, data:) no son archivos locales.
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(m[1])) continue;
    // La plantilla pública se sirve en muchas rutas: una referencia relativa se
    // resolvería contra cada página, así que se exige ruta absoluta.
    if (!m[1].startsWith('/')) { errores.push(`enlace relativo en ${html}: ${m[1]} (usa una ruta que empiece con /)`); continue; }
    const p = m[1].split(/[?#]/)[0];
    if (rutasWorker.has(p) || p.startsWith('/agendar/') || p.startsWith('/media/')) continue;
    if (!existsSync(join(raiz, 'sitio', p))) errores.push(`enlace local sin archivo: ${html} -> ${m[1]}`);
  }
}

// 4. Rayas largas fuera del texto visible.
const rayas = /[\u2013\u2014]/;
readFileSync(join(raiz, 'sitio/contenido.json'), 'utf8')
  .split('\n')
  .forEach((l, i) => {
    if (rayas.test(l)) errores.push(`raya larga en sitio/contenido.json:${i + 1}`);
  });

// Recorre el código y entrega cada literal de cadena con su línea inicial,
// saltando comentarios y expresiones regulares.
function* cadenasJS(codigo) {
  let i = 0, linea = 1, prev = '';
  const trasRegex = p => !p || '(,=:[!&|?{};+-*%<>^~'.includes(p);
  while (i < codigo.length) {
    const c = codigo[i];
    if (c === '\n') { linea++; i++; continue; }
    if (c === '/' && codigo[i + 1] === '/') {
      while (i < codigo.length && codigo[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && codigo[i + 1] === '*') {
      i += 2;
      while (i < codigo.length && !(codigo[i] === '*' && codigo[i + 1] === '/')) {
        if (codigo[i] === '\n') linea++;
        i++;
      }
      i += 2; prev = 'x'; continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      const ini = linea, q = c;
      let texto = '';
      i++;
      while (i < codigo.length) {
        const d = codigo[i];
        if (d === '\\') {
          texto += d;
          if (i + 1 < codigo.length) { texto += codigo[i + 1]; if (codigo[i + 1] === '\n') linea++; }
          i += 2; continue;
        }
        if (d === q) { i++; break; }
        if (d === '\n') { linea++; if (q !== '`') break; }
        texto += d; i++;
      }
      yield { linea: ini, texto };
      prev = 'x'; continue;
    }
    if (c === '/' && trasRegex(prev)) {
      i++;
      while (i < codigo.length && codigo[i] !== '\n') {
        const d = codigo[i];
        if (d === '\\') { i += 2; continue; }
        if (d === '[') {
          while (i < codigo.length && codigo[i] !== ']') { if (codigo[i] === '\\') i++; i++; }
          i++; continue;
        }
        if (d === '/') { i++; break; }
        i++;
      }
      prev = 'x'; continue;
    }
    if (!/\s/.test(c)) prev = c;
    i++;
  }
}

// Texto de los HTML estáticos, sin comentarios, scripts ni estilos.
for (const html of ['sitio/index.html', 'sitio/admin/index.html']) {
  const limpio = readFileSync(join(raiz, html), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ''))
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, m => m.replace(/[^\n]/g, ''));
  limpio.split('\n').forEach((l, i) => {
    if (rayas.test(l)) errores.push(`raya larga en ${html}:${i + 1}`);
  });
}

for (const { linea, texto } of cadenasJS(readFileSync(join(raiz, 'src/render.js'), 'utf8'))) {
  if (rayas.test(texto)) errores.push(`raya larga en cadena de src/render.js:${linea}`);
}

if (errores.length) {
  console.error(errores.join('\n'));
  console.error(`\ncomprobar: ${errores.length} problema(s)`);
  process.exit(1);
}
console.log(`comprobar OK: ${js.length} archivos JS, ${jsons.length} JSON/manifest, enlaces locales y rayas largas`);
