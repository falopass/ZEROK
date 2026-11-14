# ZÉROK — contrato para agentes

## Qué es
Sitio del cliente **ZÉROK Refrigeración & Climatización Profesional** (servicio técnico a domicilio, Osorno). Todo el trabajo de este cliente vive en esta carpeta; nunca en otro repo. Estado: implementado y **desplegado en workers.dev**; dominio y avisos por correo pendientes.

## Stack y versiones
Cloudflare Workers + Static Assets. HTML/CSS/JS vanilla en `sitio/`, contenido editable en KV, fotos en R2, panel de administración en `/admin/` con acceso serializado en Durable Objects. Render en servidor. Patrón copiado de `rancho-itahue` sin tocar ese repo. Límites y configuración en `README.md`.

## Comandos
```
npm run check            # comprobaciones del repo: scripts/comprobar.mjs
npx wrangler deploy      # script "deploy" de package.json
npx wrangler dev         # no usado por decisión: no hay build ni dev local
```
`npm run check` valida sintaxis JS, JSON de sitio/, enlaces locales y rayas largas, sin dependencias. El workflow `.github/workflows/comprobar.yml` lo corre en cada PR y push a main, más `wrangler deploy --dry-run`. No hay `test`, `lint` ni `build` configurados. Es deliberado, no un olvido.

## Despliegue
Cloudflare, worker **`zerok`** (`wrangler.jsonc`). Comando: `wrangler deploy`. Remoto `github.com/falopass/ZEROK`, rama `main`. Tras cada deploy, la única comprobación exigida es HTTP 200.

## Mapa
- `sitio/` — HTML/CSS/JS estático
- `src/` — worker, KV, R2, Durable Objects
- `DISENO.md` — **leer antes de tocar cualquier página pública**: paleta, tipografía, motion, composición y copy
- `PLAN.md` — plan contratado y §9 de material del cliente
- `.agents/skills/design-taste-frontend` — biblioteca de criterio, no autoridad; la base es `frontend-base`

## Reglas que no se rompen
- El panel `/admin/` se diseña con `interface-design` y solo comparte tokens con el sitio público.
- **Las animaciones van y no se prohíben** (decisión de Diego, 05-11-2026). Manda `frontend-base`: la regla es variar entre clientes, no recortar.
- Trato de **tú** en todo el sitio. Sin rayas largas (— ni –) en texto visible.
- El WhatsApp del cliente no lo escribe ningún script.
- Mobile-first a 390×844, contraste AA, sin placeholders de contenido, fotos reales en `.webp`.
- Si un dato no está en la lista de abajo (precios, garantía, marcas, años, certificaciones, reseñas), no se escribe: se oculta o se pregunta a Diego.

## Datos reales del cliente (no inventar nada más)
- Nombre: **ZÉROK Refrigeración & Climatización Profesional**. En slugs y dominio: `zerok`.
- Dominio: **zerok.cl** (disponibilidad por verificar en NIC Chile).
- Zona: Osorno y sectores de la Región de Los Lagos. Negocio a domicilio: no se publica dirección exacta.
- Teléfono/WhatsApp: **+56 9 7789 6895** · `https://wa.me/56977896895` · `tel:+56977896895`.
- Instagram: `https://www.instagram.com/zerok_osorno/`.
- Horario: lunes a sábado 07:30–21:00 / 21:30 (pendiente confirmar cuál aplica).
- 7 servicios: técnico general y de emergencia; refrigeradores y vitrinas comerciales; aire acondicionado (instalación, mantención, reparación, desmantelamiento; splits, portátiles, conductos, filtros); A/A automotriz; lavadoras y secadoras; calefones y calefacción (incluye termostatos); equipos comerciales (conservadores, máquinas cecineras y de panadería).
- Fallas que el cliente nombra: fugas de gas, cambio de motores, problemas de enfriamiento, ruidos extraños.

## Plan contratado
$29.990/mes + $29.990 de activación, sin permanencia: hosting y dominio, 5 páginas, blog integrado, diseño editorial a medida, SEO local (Google Business Profile), mobile-first. Plazo: 10 días hábiles. Fuera de plan: pago en línea, carrito y agenda de reservas.

## Estado
- 05-11-2026: sitio y panel implementados en `sitio/` y `src/`, con render en servidor, contenido en KV, medios en R2 y acceso serializado en Durable Objects. Configuración y límites en `README.md`.
- Sin tests, lint ni build local. Revisión de código y sintaxis; falta observarlo en ejecución después del despliegue autorizado.
- 06-11-2026: primer deploy en https://zerok.ddiegosebastianbb.workers.dev con KV, R2 y Durable Object creados (HTTP 200 comprobado).
- 06-11-2026: revisión 3 de diseño (menos plano, más foto y motion; detalle en `DISENO.md`). Fotos de apoyo de Wikimedia Commons con créditos en `/creditos/` hasta que lleguen las del cliente.
- 06-11-2026: logo del cliente vectorizado y paleta recalibrada; primeras 3 fotos reales con su frase en «Trabajo real» (revisión 4 en `DISENO.md`).
- 06-11-2026: agenda de visitas implementada (`src/agenda.js`, pestaña en el panel y cron de avisos), incluida sin costo para el primer cliente. Inactiva hasta abrir el panel y activar «solicitudes en línea»; los avisos por correo esperan el dominio y Email Service.
- 08-11-2026: agenda rediseñada en dos columnas (PR #3) y flujo de solicitud como canal principal: selector con síntomas por equipo que entrega por POST a `/agendar/preparar/` (el texto libre nunca viaja en la URL), chips en el hero, termómetro de scroll, mazo y `<dialog>` en Trabajo real, revelados en diagonal, panel que abre en Agenda con contador de pendientes y refresco visible, `manifest.webmanifest` del panel. Revisión 6 en `DISENO.md`.
- 08-11-2026: PR #4 fusionado y revisión `3522619` desplegada manualmente con autorización de Diego; versión `66f88e66-3383-444c-822c-7157f02b990f`. HTTP 200 en Inicio, Servicios, Contacto y Admin. Sintaxis comprobada; rediseño y sesiones sin observación en navegador.
- 08-11-2026: secreto `ADMIN_SETUP_TOKEN` configurado, acceso del panel creado y solicitudes en línea activadas; `/agendar/` responde 200. Correo sigue desactivado hasta dominio y Email Service.
- 08-11-2026: origen por petición para canonical, OG, sitemap y JSON-LD (vistas previas correctas en workers.dev), og:image:width/height/alt y twitter:image, redirect de /favicon.ico, redirect www al apex inactivo hasta el dominio y `LANZAMIENTO.md` con la checklist de lanzamiento.
- 09-11-2026: PR #16 (comprobaciones `npm run check` y workflow «Comprobar ZÉROK», también antes del deploy automático) y PR #17 fusionados. Revisión `da48d80` desplegada manualmente, versión `43142331-80e6-4a87-bb32-e9b01668977e`. HTTP 200 en Inicio, Servicios, Contacto, Agendar, Admin, Privacidad y Créditos; OG y sitemap con el origen workers.dev; `noindex` vigente; `/favicon.ico` 301; validación de `/agendar/` (400) y API del panel sin sesión (401) comprobadas.
- 08-11-2026: auditoría UI/UX corregida con SWE-2 (PR #19 sitio público, PR #20 panel). Revisión `75420a8` desplegada, versión `8e5dac9e-8dd3-45b4-b434-c8ef364c78c1`. HTTP 200 en Inicio, Servicios, Contacto, Agendar, Admin, Privacidad y Créditos; en `/agendar/` el CTA ancla a `#solicitud` y un POST incompleto devuelve 400 con errores enlazados por campo. Panel sin observar en navegador con sesión real.
- 08-11-2026: revisión visual completa con capturas a 390 y 1440 de Inicio, Servicios, Contacto y Agendar (PR #21 y commits siguientes en `main`). Corregido: desborde horizontal de la franja, índice de servicios cortado (desvanecido y chip activo visible), botones desalineados en «Hablemos», chips de síntomas descentrados, chips del hero sobre la foto, aviso «Cuéntanos qué falla», tarjetas sin foto y número sobre el título, fotos con zonas borrosas o militares (compresor retocado, manómetros recortados, foto del técnico retirada) y línea de equipos repetida.
- 08-11-2026: textos sin repetición. Índice de servicios y equipos del hero sin píldoras (revisión 8 en `DISENO.md`). Se quitaron frases repetidas («Cuéntanos…», «tu casa o negocio», horario y cobertura duplicados), «Ver servicio» en las fichas de Inicio, encabezados redundantes en Contacto y Agendar, y la banda de cierre en Agendar. La franja lista fallas y equipos; «Quiénes somos» reemplaza al título que repetía «hogar o negocio».
- 09-11-2026: bloque de servicios de Inicio con fondo de plano técnico (degradado marino, trama y escala térmica lateral) y tarjetas como ficha didáctica: filas «Equipos», «Fallas que atendemos» y «Elige tu caso», cuyos casos abren el diagnóstico con equipo y falla marcados (revisión 10 en `DISENO.md`). Versión `61499de4-37eb-41a6-9610-a3d0d63c5f8f`, HTTP 200 en Inicio; láminas observadas en captura a 1440, índice móvil y clic en un caso sin observar.
- 09-11-2026: servicios de Inicio sin láminas apiladas: índice de filas en todos los anchos y, desde 1024 px, escenario fijo con la foto de la fila en uso (revisión 10 en `DISENO.md`). Se retiraron `.service-stack`, `.service-sheet` y su ScrollTrigger. Versión `027edefa-8865-48fe-a577-9a69657c30df`, HTTP 200 en Inicio; estado cerrado y abierto vistos en captura a 1440; cambio de foto al pasar el puntero y móvil a 390 sin observar.
- 09-11-2026: retirada de las filas de Inicio la ficha «Equipos / Fallas que atendemos / Elige tu caso» (decisión de Diego); cada fila deja resumen y acciones.
- 09-11-2026: nevada con el copo del logo en todo el sitio público (pedido de Diego, revisión 11 en `DISENO.md`); la crea `sitio.js` y no existe con movimiento reducido. Versión `5062b106-f6f1-40e5-863b-75ac1cffda40`, HTTP 200 y copos vistos en captura a 1440; fluidez en celular sin observar.
- 09-11-2026: «Donde lo necesitas» pasa de pestañas con foto a dos listas tipográficas de equipos que abren el diagnóstico con el equipo marcado (revisión 12 en `DISENO.md`); foto de cocina y su crédito retirados. Vista en captura a 1440; puntero y móvil sin observar.
- 09-11-2026: «Antes y después» en Trabajo real con 6 fotos del cliente en tres pares (revisión 13 en `DISENO.md`), mejoradas sin generación con Codex. Los títulos de cada par son lectura de las fotos, por confirmar con el cliente. Fijas en `sitio/img/trabajos/antes/`, no editables desde el panel.
- 09-11-2026: dominio `zerok.cl` conectado (rutas `custom_domain` activas en `wrangler.jsonc`). Tarjeta social fija `sitio/img/og.jpg` de 1200×630 con titular y llamado para todas las páginas sin foto de artículo; títulos de hasta 60 caracteres y descripciones de hasta 125. Email Routing activado en `zerok.cl`; el reenvío de `avisos@zerok.cl` al correo del técnico espera que el destinatario confirme el correo de verificación de Cloudflare. `PUBLIC_INDEXING` sigue en `false`.
- 09-11-2026: reenvío catch-all de todo `@zerok.cl` al correo del técnico activo (Email Routing). Indexación abierta (`PUBLIC_INDEXING=true`), http y www a https://zerok.cl en un salto, clave IndexNow servida por el Worker y URLs enviadas. Search Console y Bing Webmaster Tools requieren la cuenta de Diego.
- 09-11-2026: Email Sending activado en `zerok.cl` (registros cf-bounce, DKIM y DMARC creados por Cloudflare). Avisos de la agenda con plantilla HTML de marca (`marco()` en `src/agenda.js`); correo de prueba enviado a Diego. Faltan el binding `send_email` `AVISOS` y `AVISOS_HABILITADOS=true`, pendientes de su visto bueno al diseño.
- 13-11-2026: binding `send_email` `AVISOS` con destino `avisos@zerok.cl` y `AVISOS_HABILITADOS=true` en `wrangler.jsonc`. Despliegue por API (versión 49): HTTP 200 en todas las rutas públicas, panel y assets. Agenda activa en KV (`activa:true`).
- 13-11-2026: `zerokosorno@gmail.com` verificado en Cloudflare y catch-all apuntado a él: todo `@zerok.cl` llega a Zerokosorno. `vicentebermedo@gmail.com` queda como destino verificado de respaldo (una sola acción por regla; el cambio es de una línea). Email Sending y DNS completos (MX, DKIM, SPF, DMARC).
- 13-11-2026: el aviso de solicitud nueva sale de inmediato (`waitUntil` en `/interno/reserva`); el cron de 15 min queda solo para reintentos. Desplegado por API (deployment `6227ab31`). Solicitud de prueba registrada desde `zerok.cl/agendar/` para validar el correo de punta a punta: borrarla desde el panel («PRUEBA DEVIN»).
- 13-11-2026: panel de agenda completado para el técnico (deployment `c0b3e382`): cada visita muestra el estado del aviso por correo (enviado/pendiente/reintentando), botón «Reenviar correo» en solicitudes, búsqueda por nombre/teléfono/dirección y descarga CSV. El correo de solicitud incluye botón «Abrir en el panel». Acción `reenviar` en la API de visitas.
- 13-11-2026: calendario mensual en la agenda (deployment `56fbaf5f`): cada día marca las visitas por estado (puntos de color), el día actual con borde, los bloqueados tachados y los pasados atenuados; tocar un día filtra sus visitas y ‹ › cambian de mes. Los contadores anónimos (`/api/evento`, tabla `metricas`) se implementaron y se retiraron el mismo día por decisión de Diego (la tabla quedó creada en el DO pero sin escritura ni lectura).
- 13-11-2026: «Días bloqueados» pasa de textarea a calendario táctil dentro de «Disponibilidad y avisos» (deployment `30fbe074`): tocar un día futuro lo bloquea o libera (tachado), los días con visitas muestran sus puntos y los pasados no se pueden marcar. El valor viaja en un input oculto `bloqueados`; los cambios piden «Guardar disponibilidad».
- 13-11-2026: panel a lo ancho real (deployment `9db66430`): `.admin-content` sube de 1100 a 1440 px y, desde 1200 px, las tarjetas de elementos y visitas van en dos columnas; notas, barra de herramientas, calendarios y bloques de sección siguen a todo lo ancho.
- 13-11-2026: nota «Portada creada con IA. Fotos de apoyo: Wikimedia Commons.» quitada del pie de página (deployment `994731c4`); queda «Osorno, Región de Los Lagos». La página /creditos/ conserva sus atribuciones.
- 13-11-2026: SEO/GEO profesional (deployment `27dfd6e3`): grafo JSON-LD con `@id` (HVACBusiness + WebSite + WebPage + FAQPage cuando haya FAQ + BreadcrumbList), geo, contactPoint, knowsAbout y ReserveAction de /agendar/; `/llms.txt` generado desde el contenido; robots.txt declara bots de IA (GPTBot, Claude, Perplexity, etc.) con solo público permitido; sitemap con priority/changefreq y lastmod en posts; metas geo.region/placename, twitter:image:alt y article:published_time.
- 13-11-2026: página propia por servicio `/servicios/<id>/` (deployment `b977225d`): título y descripción propios, schema `Service`, BreadcrumbList, índice interno entre servicios, entradas en sitemap (0.8) y enlaces en `/llms.txt`; en `/servicios/` cada ficha enlaza «Más sobre este servicio». Inspirado en la táctica de Climatotal (página por servicio + cobertura por comunas).
- Pendiente: checklist completa en `LANZAMIENTO.md`. Resumen: secretos de GitHub para el deploy automático, material real del cliente (§9 del plan), horario exacto. Precios, blog, galería y FAQ siguen ocultos hasta cargar contenido confirmado.
