# Plan de creación — Sitio web ZÉROK

Cliente: **ZÉROK Refrigeración & Climatización Profesional** (Osorno, Los Lagos).
Plan contratado: **$29.990/mes** + $29.990 de activación, sin permanencia. Incluye hosting y dominio,
5 páginas, blog integrado, diseño editorial a medida, SEO local (Google Business Profile),
responsive mobile-first. Plazo comprometido: **10 días hábiles**.
Fecha del plan: 05-11-2026. Repo: https://github.com/falopass/ZEROK.

**Decisiones cerradas (05-11-2026):** dominio **zerok.cl** · trato de **tú** · precios se cargan
después (la página Precios queda oculta del menú y con `noindex` hasta tener ítems).
**Sistema visual completo (paleta, tipografía, motion, componentes, composición): `DISENO.md`.**

> Regla de contenido: solo se publica lo que el cliente entregó o confirma. Lo que falta se **oculta**,
> no se rellena con placeholders, cifras, reseñas ni fotos de stock presentadas como propias.

---

## 1. Lectura del encargo

- **Qué vende:** visitas técnicas a domicilio (hogar y negocio) para refrigeración, aire acondicionado,
  línea blanca, calefones/calefacción y equipos comerciales. Atención en Osorno y sectores de Los Lagos.
- **Quién compra:** (a) dueños de casa con una falla urgente (refrigerador que no enfría, calefón,
  lavadora); (b) negocios con vitrinas, conservadores, máquinas cecineras y de panadería, donde una falla
  es plata perdida por hora.
- **Qué tiene que lograr el sitio:** que la persona con la falla llegue desde Google y **escriba por
  WhatsApp en menos de 30 segundos**, con el equipo y el síntoma ya escritos en el mensaje.
- **Lo que el cliente quiere después:** imágenes, productos, precios y contacto por WhatsApp. Por eso el
  panel de edición (precios, productos, fotos, blog) se construye **desde el día 1**: después solo se
  carga contenido, sin rehacer el sitio.
- **Fuera del plan:** pago en línea (Flow/MercadoPago), carrito, agenda con reservas, cuentas de
  cliente. Si los pide, es un adicional aparte.

### Ambigüedad del plan
La tarjeta dice «5 páginas» y también «Hasta 5 secciones». Se interpreta como **5 páginas** (cada una
con varios bloques). El blog cuenta como una página, independiente de cuántas entradas tenga.

---

## 2. Arquitectura del sitio (5 páginas)

| # | Página | URL | Objetivo | Búsqueda principal (local) |
|---|--------|-----|----------|----------------------------|
| 1 | Inicio | `/` | Convertir a WhatsApp/llamada | servicio técnico refrigeración Osorno |
| 2 | Servicios | `/servicios/` | Detallar los 7 servicios, con ancla por servicio | reparación refrigeradores / aire acondicionado Osorno |
| 3 | Precios y productos | `/precios/` | Catálogo editable con precios en CLP y botón «Pedir por WhatsApp» | precio mantención aire acondicionado Osorno |
| 4 | Blog | `/blog/` + `/blog/<slug>/` | SEO de problemas reales («mi refrigerador no enfría») | consultas de fallas |
| 5 | Contacto y cobertura | `/contacto/` | Horario, sectores, WhatsApp, llamada, Instagram | técnico a domicilio Osorno |

Fuera del conteo: `/admin/` (panel del cliente), `/404.html`, `/privacidad/` (breve, solo si se activa
el contador de visitas o algún formulario).

**Navegación:** Servicios · Precios · Blog · Contacto · botón «WhatsApp».
Si al lanzamiento no hay precios cargados, «Precios» se oculta del menú y la página responde con
`noindex` hasta que tenga contenido (no se publica una página vacía).

---

## 3. Orden de cada página

### 3.1 Inicio (`/`) — orden móvil (390×844)

1. **Header fijo compacto**: wordmark ZÉROK · chip de estado «Abierto ahora · cierra 21:00» (calculado
   en hora de Chile con el horario confirmado) · botón WhatsApp. Menú hamburguesa en móvil.
2. **Hero**
   - H1: *ZÉROK Refrigeración & Climatización Profesional* (texto del cliente).
   - Bajada: *Servicio técnico especializado en refrigeración, climatización y línea blanca a domicilio
     en Osorno y la Región de Los Lagos.*
   - CTA primario: **Agendar visita** (WhatsApp) · CTA secundario: **Llamar**.
   - Imagen: foto real de un trabajo (de Instagram o enviada). Sin foto aún: imagen de atmósfera
     generada o hero tipográfico (ver `DISENO.md` §6.2), nunca stock presentado como trabajo.
   - Banda de datos **debajo** del hero (no dentro): «Lunes a sábado, 07:30 a 21:00» / «Vamos a tu
     casa o negocio» / «Osorno y sectores de Los Lagos».
3. **«¿Qué está fallando?»** — selector de equipo + síntoma (el bloque firma del sitio, ver §4.3).
   Arma un mensaje de WhatsApp listo: *«Hola ZÉROK, tengo un refrigerador que no enfría, en [sector].
   ¿Pueden agendar una visita?»*
4. **Servicios** — 7 tarjetas tipo ficha técnica, cada una con enlace a su ancla en `/servicios/`.
5. **Hogar y negocio** — dos columnas: equipos del hogar vs. equipos comerciales (vitrinas,
   conservadores, máquinas cecineras y de panadería). El segmento comercial vale más y merece su bloque.
6. **Presentación** — párrafo del cliente (corregido, ver §6).
7. **Cómo trabajamos** — pasos: escribes → agendamos → visita y diagnóstico → reparación.
   *Solo se publica el paso «presupuesto antes de reparar» si el cliente confirma que así trabaja.*
8. **Precios destacados** — 3 a 6 ítems del catálogo marcados «destacado». Oculto si no hay.
9. **Trabajos recientes** — galería editable desde el panel. Oculta hasta que haya fotos.
10. **Cobertura y horario** — lista de sectores confirmados + mapa centrado en Osorno (sin dirección
    exacta: es un negocio a domicilio).
11. **Del blog** — últimas 3 entradas. Oculto con menos de 1 entrada.
12. **Preguntas frecuentes** — solo con respuestas confirmadas por el cliente (ver §9).
13. **CTA final** + footer (nombre, teléfono, WhatsApp, Instagram, horario, cobertura, enlaces).

**Barra inferior fija en móvil:** `WhatsApp` | `Llamar`, 56 px de alto, con `padding-bottom` en el body
para que nunca tape texto. En escritorio se reemplaza por el botón del header.

### 3.2 Servicios (`/servicios/`)

Intro corta + índice de anclas. Un bloque por servicio, mismo esquema:
**qué hacemos · fallas que atendemos · equipos · botón WhatsApp con el servicio ya escrito.**

| Ancla | Servicio (texto del cliente) |
|-------|------------------------------|
| `#emergencias` | Servicio técnico general y de emergencia |
| `#refrigeradores-y-vitrinas` | Reparación y mantención de refrigeradores y vitrinas comerciales |
| `#aire-acondicionado` | Instalación, mantenimiento, reparación y desmantelamiento de aire acondicionado (splits, A/A portátiles, limpieza de conductos y reemplazo de filtros) |
| `#aire-acondicionado-automotriz` | Aire acondicionado para automóviles |
| `#lavadoras-y-secadoras` | Reparación y mantenimiento de lavadoras y secadoras |
| `#calefones-y-calefaccion` | Reparación y mantención de calefones y sistemas de calefacción (incluye instalación de termostatos) |
| `#equipos-comerciales` | Mantención de equipos comerciales (conservadores, máquinas cecineras y de panadería) |

Fallas ya nombradas por el cliente que sí se pueden usar: fugas de gas, cambio de motores, problemas de
enfriamiento, ruidos extraños. Cualquier otra falla, marca o equipo se agrega solo si el cliente la confirma.

### 3.3 Precios y productos (`/precios/`)

- Filtros por categoría (chips): Refrigeración · Aire acondicionado · Línea blanca · Calefacción ·
  Comercial · Repuestos/productos.
- Ítem: foto (opcional) · nombre · descripción corta · precio CLP (`$29.990`) · marca «desde» opcional ·
  nota («valor referencial, se confirma tras el diagnóstico» solo si el cliente lo pide) · botón
  **Pedir por WhatsApp** con el nombre del ítem en el mensaje.
- Disponible/agotado, visible/oculto y destacado se manejan desde el panel.
- Sin carrito ni pago: la venta se cierra por WhatsApp.

### 3.4 Blog (`/blog/` y `/blog/<slug>/`)

- Listado con tarjetas (título, fecha, extracto, foto opcional).
- Entrada: H1, fecha, cuerpo, CTA de WhatsApp al final relacionado con el tema, enlaces a servicios.
- Se renderiza **en el servidor** (HTML real, no armado por JavaScript) para que Google lo indexe.
- Entradas iniciales propuestas (borradores que el técnico revisa antes de publicar; nada técnico se
  publica sin su visto bueno):
  1. «Mi refrigerador no enfría: causas comunes y cuándo llamar al técnico».
  2. «Aire acondicionado para calefaccionar en Osorno: mantención antes del invierno» — en Osorno el split
     se usa mucho como bomba de calor; ángulo local fuerte (verificar con el cliente que lo atiende así).
  3. «Vitrinas y conservadores: señales de falla antes de perder mercadería».

### 3.5 Contacto y cobertura (`/contacto/`)

- WhatsApp, llamada, Instagram (`https://www.instagram.com/zerok_osorno/`, sin el parámetro de rastreo).
- Horario con el chip «abierto/cerrado».
- Sectores atendidos (lista confirmada por el cliente).
- Mini formulario (nombre, equipo, síntoma, sector) que **no guarda nada**: arma el mensaje y abre
  WhatsApp. Sin backend, sin datos personales almacenados.

---

## 4. Dirección de diseño

Definida en **`DISENO.md`** (fuente única; este resumen no la reemplaza). Revisión 2 (05-11-2026):
Diego pidió un sitio **vivo, realista y sin íconos genéricos**.
- Concepto «del calor de la falla al frío que vuelve»: base gris hielo, un solo acento ámbar
  `#E09A1F` para la acción, tonos térmicos solo dentro de las fotos. Tema claro/oscuro automático.
- Archivo variable + IBM Plex Mono. Radio único de 6 px. Diales: variación 7, motion 7, densidad 4.
- Cinco momentos firma: **lente térmica** en el hero que sigue al puntero o al dedo, **wordmark con
  escarcha**, **selector que escribe el mensaje** de WhatsApp en vivo, **servicios que se apilan** con
  el scroll y **recorrido del técnico** que se dibuja. GSAP + ScrollTrigger autoalojados.
- Equipos y servicios mostrados con **fotografía**, nunca con íconos. Fotos y videos reales del cliente
  primero; fotorrealistas generadas (solo manos y detalles, sin rostros ni marcas) para lo que falte,
  nunca presentadas como trabajos propios.
- Todo tiene versión con movimiento reducido y sin JS. Presupuesto de rendimiento en DISENO §11.

## 5. Arquitectura técnica (patrón del estudio)

Mismo patrón que `rancho-itahue` y `arco-pole-studio`, copiado y adaptado (sin tocar esos repos):

- **Cloudflare Workers + Static Assets**. HTML, CSS y JS vanilla, sin framework ni paso de build.
- **KV `CONTENIDO`**: textos, servicios, precios/productos, galería, FAQ, entradas del blog. El sitio
  trae `contenido.json` como valores por defecto; el Worker superpone lo que haya en KV.
- **R2 `zerok-media`**: fotos que sube el cliente desde el panel (se redimensionan a `.webp` en el
  navegador antes de subir, máx. 1600 px, ≤ 200 KB).
- **Render en servidor** con `HTMLRewriter`: precios, productos y blog llegan en el HTML (SEO).
- **Sitemap dinámico** (`/sitemap.xml`) que incluye las entradas publicadas del blog.
- **Panel `/admin/`**: misma auth que Rancho (código de configuración `ADMIN_SETUP_TOKEN` una vez,
  luego clave con PBKDF2 y cookie `HttpOnly`/`Secure`/`SameSite=Strict`). Pestañas:
  Textos · Servicios · Precios y productos · Trabajos (fotos) · Blog · Visitas.
- **Contador de visitas** propio en D1, agregado, sin IP ni cookies (como Rancho). Opcional.
- Sin formularios que guarden datos personales: todo contacto sale a WhatsApp.

### Estructura de carpetas

```
ZEROK/
├── AGENTS.md            reglas y datos reales del cliente
├── PLAN.md              este plan
├── material/            lo que entrega el cliente (logo, fotos originales) — fuera del deploy
├── wrangler.jsonc
└── sitio/
    ├── index.html
    ├── servicios/index.html
    ├── precios/index.html
    ├── blog/index.html          (plantilla de listado y de entrada)
    ├── contacto/index.html
    ├── admin/index.html, admin/admin.js
    ├── css/estilos.css
    ├── js/sitio.js, js/selector.js
    ├── fonts/  img/
    ├── contenido.json
    ├── robots.txt  404.html
    └── _worker.js
```

### Modelo de contenido (KV)

```jsonc
{
  "general": {
    "telefono": "+56977896895", "telefonoVisible": "+56 9 7789 6895",
    "whatsapp": "56977896895", "instagram": "https://www.instagram.com/zerok_osorno/",
    "horario": [{ "dias": "Lu-Sa", "abre": "07:30", "cierra": "21:00" }],
    "cobertura": ["Osorno"],                // se completa con lo que confirme el cliente
    "aviso": { "visible": false, "texto": "" }
  },
  "servicios": [{ "id": "", "titulo": "", "resumen": "", "fallas": [], "foto": "", "orden": 0, "visible": true }],
  "productos": [{ "id": "", "categoria": "", "nombre": "", "descripcion": "", "precio": 0,
                  "desde": false, "foto": "", "disponible": true, "destacado": false, "visible": true }],
  "trabajos":  [{ "foto": "", "texto": "", "fecha": "" }],
  "faq":       [{ "pregunta": "", "respuesta": "" }],
  "blog":      [{ "slug": "", "titulo": "", "extracto": "", "cuerpo": "", "foto": "",
                  "fecha": "", "publicado": false }]
}
```

### Despliegue
- Repo git en esta carpeta, remoto `https://github.com/falopass/ZEROK` (rama `main`).
- Deploy con GitHub Actions + `wrangler deploy` en cada push a la rama principal (patrón Arco).
- Primero en `zerok.<cuenta>.workers.dev` para revisión del cliente; luego dominio propio.
- Tras cada deploy se comprueba que la URL responde (HTTP 200). Sin suites de test, por pedido.

---

## 6. Contenido y copy

### Ajustes al texto entregado
- **Trato de tú** en todo el sitio (decidido el 05-11-2026). Textos base en `DISENO.md` §10.1.
- Párrafo corregido (tú):
  > En ZÉROK Refrigeración & Climatización Profesional nos especializamos en la reparación, revisión y
  > mantención a domicilio de refrigeradores, vitrinas comerciales y equipos de aire acondicionado en
  > Osorno. Solucionamos fallas como fugas de gas, cambio de motores, problemas de enfriamiento y ruidos
  > extraños. Servicio técnico rápido, transparente y confiable, directo en tu casa o negocio.
- «¡Agende su visita técnica hoy mismo!» pasa a ser el botón: **Agendar visita**.
- «Garantizamos…» se cambia por una afirmación sin promesa formal, salvo que el cliente defina una
  garantía concreta (plazo y alcance), que entonces se publica tal cual.
- «Fallas críticas» → «fallas», para no sonar a alarma.

### Datos de contacto normalizados
- Teléfono visible: `+56 9 7789 6895` · enlace `tel:+56977896895`.
- WhatsApp: `https://wa.me/56977896895` (con `?text=` según el contexto).
- Instagram sin parámetros de rastreo.
- Marca en pantalla: **ZÉROK** (con tilde). En dominio, slugs y archivos: `zerok`.

---

## 7. SEO local

### On-page
| Página | `<title>` propuesto |
|--------|---------------------|
| Inicio | Servicio técnico de refrigeración y aire acondicionado en Osorno \| ZÉROK |
| Servicios | Reparación de refrigeradores, aire acondicionado, lavadoras y calefones en Osorno \| ZÉROK |
| Precios | Precios de mantención y reparación en Osorno \| ZÉROK |
| Blog | Consejos de refrigeración y climatización \| Blog ZÉROK |
| Contacto | Contacto y cobertura: Osorno y Los Lagos \| ZÉROK |

- Una H1 por página; H2 por servicio en `/servicios/`.
- Meta descripción única por página (≤ 155 caracteres), con «Osorno» y «a domicilio».
- `canonical`, Open Graph e imagen para compartir (`og-zerok.jpg`, 1200×630) por página.
- Enlaces internos: cada entrada del blog enlaza al servicio relacionado y viceversa.

### Datos estructurados (JSON-LD)
- `HVACBusiness` (subtipo de `LocalBusiness`): `name`, `telephone`, `url`, `image`, `sameAs`
  (Instagram), `openingHoursSpecification` (Lu–Sa 07:30–21:00 una vez confirmado),
  `areaServed` (Osorno + sectores confirmados), `address` solo con `addressLocality: Osorno`,
  `addressRegion: Los Lagos`, `addressCountry: CL` (sin calle: negocio a domicilio).
- `hasOfferCatalog` con los 7 servicios.
- `BlogPosting` en cada entrada; `BreadcrumbList` en páginas internas.
- Sin `aggregateRating` ni reseñas hasta que existan reseñas reales en Google.
- `priceRange` solo si hay precios publicados.

### Google Business Profile
- Crear o reclamar el perfil como **negocio de área de servicio** (dirección oculta, áreas: Osorno y
  sectores confirmados).
- Categoría principal sugerida: reparación de refrigeradores; secundarias: reparación de aire
  acondicionado, contratista de aire acondicionado, reparación de electrodomésticos, reparación de
  lavadoras y secadoras. *Los nombres exactos se eligen en la interfaz de GBP.*
- Horario idéntico al del sitio; enlace al sitio y a WhatsApp; 10+ fotos reales de trabajos.
- Rutina sugerida al cliente: pedir reseña por WhatsApp al terminar cada trabajo (enlace corto de
  reseña de GBP) y publicar 1 foto o novedad por semana.
- Mismo nombre, teléfono y zona en sitio, GBP e Instagram (bio con enlace al sitio).

### Indexación
- Google Search Console y Bing Webmaster Tools con el dominio final; enviar `sitemap.xml`.
- `robots.txt` que bloquea `/admin/` y `/api/`.

---

## 8. Cronograma (10 días hábiles)

| Día | Bloque | Entregable |
|-----|--------|------------|
| 1 | Arranque | Material pedido al cliente (§9), dominio verificado y comprado, git init, repo GitHub |
| 2 | Dirección visual e imágenes | Home móvil con datos reales; prompts y generación de imágenes faltantes (manos y detalles), capa térmica del hero, textura de escarcha |
| 3–4 | Inicio + Servicios | Páginas 1 y 2 completas con los cinco momentos firma (lente térmica, escarcha, selector, servicios apilados, recorrido) |
| 5 | Precios + Contacto | Páginas 3 y 5, catálogo con render en servidor |
| 6 | Blog | Página 4, listado y plantilla de entrada, 1–3 borradores para revisión del técnico |
| 7 | Panel | `/admin/` con textos, servicios, precios/productos, fotos (R2) y blog |
| 8 | SEO | Metadatos, JSON-LD, OG, favicon/íconos, sitemap dinámico, robots, 404 |
| 9 | Revisión | Deploy en workers.dev, revisión del cliente, ajustes de copy y fotos |
| 10 | Producción | Dominio conectado, Search Console, GBP, entrega del panel con instrucciones cortas |

Cada bloque termina con commit + push + deploy (regla del estudio). Lo que cambie la URL pública o el
dominio se revisa antes en workers.dev.

---

## 9. Lo que hay que pedirle al cliente

Se envía por WhatsApp (lo hace Diego; ningún script escribe al cliente).

**Imprescindible para lanzar**
1. **Logo** en el mejor formato que tenga (PNG/SVG/PDF). Si no tiene, se usa un wordmark tipográfico
   «ZÉROK» y se ofrece logo como adicional.
2. **Horario exacto**: ¿cierra 21:00 o 21:30? ¿Qué días a cada hora? ¿Atiende emergencias fuera de
   horario o domingo? (No se publica «24/7» ni «emergencias» con horario sin confirmarlo.)
3. **Sectores y comunas** que atiende fuera de Osorno (lista concreta). Clave para SEO local.
4. **10 a 20 fotos reales** de trabajos (o permiso para usar las de Instagram en buena resolución).
5. **3 a 5 videos verticales de 10 a 15 s** grabados con el celular durante trabajos reales (manos,
   equipo abierto, manómetro, prueba final). Sin rostros de clientes ni direcciones visibles.
6. ¿Usa **cámara térmica** o termómetro infrarrojo para diagnosticar? (define si el copy lo nombra).

**Para completar el sitio**
7. ¿Cobra la **visita técnica/diagnóstico**? ¿Cuánto? ¿Se descuenta si se repara?
8. **Precios y productos** iniciales (si vende repuestos, equipos o planes de mantención).
9. **Medios de pago** que acepta (transferencia, débito, crédito, efectivo).
10. ¿Da **garantía** en las reparaciones? Plazo y qué cubre.
11. ¿Entrega **boleta o factura**? (relevante para clientes comerciales).
12. **Marcas** con las que trabaja o en que tiene experiencia (solo si son reales).
13. **Credenciales**: para trabajos en calefones a gas, ¿tiene registro de instalador SEC? Si no, el
    copy se limita a lo que pueda hacer legalmente y no se menciona certificación. *(Inferencia a
    verificar: en Chile la intervención en artefactos e instalaciones de gas exige instalador autorizado
    SEC; confirmar alcance con el cliente.)*
14. ¿Años de experiencia o historia del negocio? (opcional, solo dato real).
15. ¿Ya existe un **perfil de Google** del negocio? (para reclamarlo en vez de crear uno nuevo).

Dominio (zerok.cl) y trato (tú) ya están decididos.

---

## 10. Dominio y hosting

- Elegido por el cliente: **`zerok.cl`**. Disponibilidad **no verificada**: revisar en NIC Chile el
  día 1 y registrarlo. Si estuviera tomado, se vuelve a consultar al cliente.
- Hosting en Cloudflare (incluido en el plan). DNS del dominio en Cloudflare.
- Correo con el dominio: no incluido; si lo pide, se cotiza aparte o se usa reenvío.

---

## 11. Fase 2 (lo que el cliente quiere después)

Como el panel existe desde el día 7, la fase 2 es **cargar contenido**, no desarrollar:
- Subir fotos de trabajos → aparece «Trabajos recientes» en la home.
- Cargar precios y productos → aparece «Precios» en el menú y los destacados en la home.
- Escribir entradas de blog desde el panel.
- Activar un aviso superior (ej. «Mantención de splits antes del invierno»).

Adicionales posibles, fuera del plan de $29.990: pago en línea, agenda de visitas con horarios,
cotizador con fórmula, catálogo con stock, logo profesional.

---

## 12. Criterios de entrega (sin tests)

- Las 5 páginas publicadas en el dominio final, respondiendo HTTP 200.
- Todo dato visible sale de lo entregado o confirmado por el cliente; lo faltante está oculto.
- Todos los botones de contacto abren WhatsApp o llamada con el número correcto.
- Panel accesible solo con clave; el cliente puede editar precios, productos, fotos y blog.
- Search Console con sitemap enviado; GBP creado o reclamado (la verificación depende de Google).
- Sin suites de test, lint ni build local, por pedido explícito. La única comprobación es la respuesta
  HTTP de la URL publicada.
