# ZÉROK

Sitio y panel del servicio técnico ZÉROK en Osorno. HTML, CSS y JavaScript, sin framework ni build del frontend.

## Lo implementado

- Inicio, Servicios y Contacto con los siete servicios y los contactos reales.
- Selector de equipo y falla que es el primer paso de la solicitud de visita. Con la agenda activa, «Elegir día y enviar» entrega equipo, falla y sector por POST a `/agendar/preparar/` (mismo origen, sin guardar, `no-store`; el texto libre nunca viaja en la URL) y `/agendar/` recibe el paso resuelto. Con la agenda inactiva prepara el mensaje de WhatsApp en el dispositivo y solo lo abre al pulsar el botón.
- Lente térmica, entrada de marca, láminas apiladas, revelados, cambio Casa/Negocio y recorrido animado. Alternativas con movimiento reducido y lectura sin JavaScript.
- Revisión 3 de diseño (06-11-2026, ver `DISENO.md`): radios en escala, bloques en tinta noche, franja en movimiento, selector con fotos y burbuja que «escribe», servicios apilados con foto, Casa/Negocio a sangre con parallax, presentación que se enciende con el scroll, recorrido con pasos que se marcan, mapa de Osorno con marcador y cierre fotográfico.
- Logo del cliente (06-11-2026) vectorizado con potrace en `sitio/img/logo.svg` (símbolos `#simbolo` y `#palabra`, colores por variables CSS para modo claro, oscuro y bloques noche), `favicon.svg`, `icono-180.png` y `logo.png` para datos estructurados. La paleta se recalibró con el azul marino y el celeste del logo; el ámbar queda para las acciones.
- Fotos reales del cliente en `sitio/img/trabajos/` (patentes difuminadas): sección «Trabajo real» en Inicio con la frase del técnico, aire acondicionado automotriz, refrigeradores y vitrinas, y selector.
- Fotos de apoyo de Wikimedia Commons en `sitio/img/fotos/`, registradas con autoría y licencia en `src/creditos.js` y listadas en `/creditos/`. Solo se muestran si están registradas; las fotos que suba el cliente desde el panel las reemplazan.
- Catálogo filtrable y blog renderizados en servidor. Sin contenido publicado responden 404 con `noindex` y desaparecen de navegación y sitemap.
- Panel `/admin/` con textos, horario, cobertura, servicios, precios/productos, fotografías, blog y FAQ. Todos los elementos nuevos de catálogo/blog empiezan ocultos o en borrador.
- Subida WebP a R2: el navegador redimensiona hasta 1600 px y comprime a 200 KB. El servidor limita tamaño y formato.
- Metadatos, datos estructurados, sitemap y robots. La indexación permanece desactivada hasta el lanzamiento del dominio.

El horario exacto sigue sin confirmar: se muestra lunes a sábado, sin hora de cierre ni estado abierto/cerrado. No se inventaron precios, reseñas, garantías ni artículos técnicos. No hay contador de visitas, pagos ni reservas.

## Archivos

- `sitio/index.html`: plantilla común, completada en servidor con `HTMLRewriter`.
- `sitio/css/`, `sitio/js/`: presentación e interacciones públicas.
- `sitio/admin/`: editor con formularios y acceso seguro.
- `sitio/contenido.json`: contenido inicial confirmado, importado por el Worker; no se publica como archivo.
- `src/render.js`: contenido HTML de las páginas, navegación y datos estructurados.
- `src/content.js`: validación del documento y selección del contenido público.
- `src/worker.js`: rutas, render, medios y cabeceras.
- `src/admin.js`: acceso y persistencia del panel.
- `wrangler.jsonc`: Cloudflare Workers + Static Assets, KV, R2 y un Durable Object SQLite.

Las páginas comparten una plantilla en vez de duplicar header, footer y metadatos en cinco archivos. No requieren JavaScript para leer su contenido.

## Configuración del alojamiento

Primer deploy hecho el 06-11-2026 en https://zerok.ddiegosebastianbb.workers.dev (cuenta Cloudflare del estudio). Recursos creados: KV `zerok-contenido` (ID en `wrangler.jsonc`), bucket R2 `zerok-media` y Durable Object `Admin` (migración `v1`). El 08-11-2026 se publicó manualmente la revisión `3522619` (PR #4), versión del Worker `66f88e66-3383-444c-822c-7157f02b990f`, con Wrangler 4.156.0 fijado en el lockfile y autorización de Diego. El 08-11-2026 se configuró `ADMIN_SETUP_TOKEN`, se creó el acceso del panel y se activaron las solicitudes en línea. Indexación, correo y dominio continúan desactivados; el workflow automático sigue sin habilitarse.

1. En la cuenta Cloudflare del cliente, habilitar R2 y preparar un token con permisos para Workers, KV, R2 y Durable Objects. No almacenar el token en el repositorio.
2. Configurar en GitHub los secretos `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`.
3. Aprovisionar el namespace KV y el bucket `zerok-media`. La versión fijada de Wrangler permite omitir el ID de KV para su aprovisionamiento inicial interactivo. Una vez creado, registrar el ID real del namespace en `wrangler.jsonc` para los deploys no interactivos. Conservar los bindings `CONTENIDO`, `MEDIA`, `ADMIN` y `ASSETS`.
4. Para el primer deploy autorizado, usar la versión fijada en `package-lock.json` desde el VPS del estudio o el entorno de CI: `npm ci` y `npm run deploy`. No hace falta un build del frontend. No ejecutar instalaciones ni servidores locales por rutina.
5. En Cloudflare, agregar el secreto **del Worker** `ADMIN_SETUP_TOKEN`, aleatorio y de alta entropía, mediante el gestor de secretos o `wrangler secret put ADMIN_SETUP_TOKEN`. El comando solicita el valor sin incorporarlo al historial. Este secreto es distinto del token de API de Cloudflare. Nunca ponerlo en una URL, un commit o el chat.
6. Abrir `/admin/`, introducir el código y definir una contraseña de al menos 12 caracteres. Guardar ambos en el gestor de contraseñas. El registro queda cerrado después de crear la cuenta.
7. Configurar `SITE_HEALTH_URL` en las variables de GitHub con la URL exacta de `workers.dev`. Después de ese primer despliegue y la autorización de publicación, establecer `CLOUDFLARE_DEPLOY_ENABLED=true`. Los siguientes merges a `main` publican automáticamente. El workflow comprueba únicamente HTTP 200.

No se habilita el workflow automáticamente sin cuenta, recursos y destino concretos. No se registró ni compró `zerok.cl`.

Antes de indexar: confirmar horario, sectores y fotografías; conectar `zerok.cl`; conservar `SITE_URL=https://zerok.cl` y cambiar `PUBLIC_INDEXING` a `true`. Workers.dev continúa con `noindex` aunque esté activada la indexación del dominio final.

## Uso del panel

1. En **Textos y cobertura**, editar bajada y presentación. Confirmar horario solo con el dato del cliente; un sector por línea.
2. En cada lista, **Agregar elemento**, completar y **Guardar y publicar**. Servicios y productos se pueden ordenar. Los cambios de KV pueden tardar aproximadamente un minuto en propagarse.
3. Para precios, introducir pesos enteros sin puntos. Marcar Visible para publicar; Destacado agrega el producto a Inicio. Sin stock conserva el precio y retira el botón de pedido.
4. En Blog, separar párrafos con una línea vacía. Un subtítulo empieza con `## `. Elegir servicio relacionado y marcar Publicar solo después de revisión del técnico. La fecha futura publica a partir de ese día UTC.
5. En Trabajos, usar únicamente fotos reales del cliente, verticales si es posible. La frase se muestra sobre la foto, entre comillas, con la voz de quien hizo el trabajo («Acá estoy…»). Tapar patentes y caras antes de subir. Las tres primeras van en Inicio y en los datos estructurados.
6. Al reemplazar la portada, ajustar su descripción y marcar si es real. La lente térmica solo acompaña la imagen ilustrativa original.
7. Si aparece un conflicto de versiones, descargar un respaldo JSON desde **Seguridad y respaldo** antes de cargar la última versión. No se sobrescribe automáticamente el trabajo de otra sesión.

El panel conserva en Durable Objects el documento actual y una versión anterior; KV sirve como copia pública. Si KV falla al publicar, el guardado sigue disponible y **Publicar de nuevo** permite reintentar. Los borradores nunca se sirven en las páginas públicas. El respaldo descargable incluye todo el documento de la pestaña y puede ser repuesto por el mantenedor usando el endpoint autenticado; no hay importación automática en la interfaz.

El documento completo tiene un límite conjunto de 400000 bytes (400 KB) en JSON UTF-8, además de los máximos de cada campo y lista. Los límites individuales no son una garantía de que todos puedan llenarse simultáneamente. Las fotos viven aparte en R2. El panel avisa antes de enviar un documento demasiado grande y el servidor aplica el mismo límite, con respuesta 413. Una solicitud sin JSON devuelve 415 y un JSON inválido devuelve 400, sin modificar lo guardado.

La solicitud de contenido admite hasta 800000 bytes para incluir el envoltorio, la revisión y la sangría del respaldo descargado. Después de leerla, el servidor mantiene el límite de 400000 bytes para el documento normalizado. Para restaurar, el mantenedor conserva `data` del respaldo y utiliza la revisión vigente del servidor; si no coincide, el endpoint devuelve 409 para evitar sobrescribir cambios ajenos.

Las fotografías retiradas del contenido no se borran de R2 automáticamente, para conservar recuperación y enlaces. El mantenedor puede retirar objetos sin referencias desde Cloudflare después de comprobarlos.

## Acceso y seguridad

- Contraseña con PBKDF2-SHA256, sal aleatoria y 100000 iteraciones, límite soportado por Web Crypto en Workers.
- Sesiones aleatorias de 12 horas, almacenadas por su hash. Cookie `__Host-zerok`, `HttpOnly`, `Secure`, `SameSite=Strict`.
- Un Durable Object serializa configuración, accesos y escrituras. Cinco intentos de acceso por ventana de 15 minutos por identificador de red hasheado, sin persistir la IP en claro.
- Mutaciones limitadas al mismo origen, validación de documentos, texto escapado, cuerpo acotado y sin HTML editorial arbitrario.
- Cambiar contraseña invalida las otras sesiones. El acceso queda cerrado si faltan bindings o el secreto de configuración.
- Sin caché ni indexación en el panel. CSP, cabeceras de tipo, política de referente y HTTPS.

## Agenda de visitas

La agenda se incluye sin costo adicional para ZÉROK como beneficio al primer cliente. El cliente solicita un día preferido, describe la falla y deja sus datos. No es una reserva confirmada ni promete un cupo: ZÉROK llama, coordina la hora y confirma desde **Agenda de visitas** en el panel.

- El envío desactiva el botón mientras navega para evitar dobles envíos; no hay deduplicación en servidor, así que un reintento de red muy puntual podría registrar una solicitud dos veces (se revisa y se borra desde el panel).
- El correo al técnico incluye Llamar, WhatsApp (número normalizado y validado) y Mapa. Solicitudes cuyo día pedido ya pasó se avisan como «Solicitud pendiente», nunca como nuevas.
- El panel muestra el conteo agregado de avisos en cola (pendientes y reintentos), sin prometer entregas.

- Activa desde **Disponibilidad y avisos**, después de configurar el acceso al panel. Al desactivarla, los botones vuelven a WhatsApp.
- Ofrece los próximos 14 días desde mañana, de lunes a sábado, con fechas bloqueables. No publica horas. La jornada exacta y los sectores atendidos siguen pendientes de confirmación.
- Estados: por confirmar, confirmada, realizada, no estaba, cancelada y cerrada. Se puede borrar definitivamente cada visita.
- Al marcar realizada, programa el llamado a los **14 días** desde ese día, según el calendario de Santiago. El plazo puede cambiarse para futuras visitas.
- El cron de 15 minutos procesa avisos nuevos y reintentos. Desde las 09:00 de Chile, recuerda diariamente los llamados vencidos mientras no se cierren.
- Los datos personales viven en SQLite del Durable Object, no en KV ni archivos públicos. Se eliminan después de 365 días desde la última modificación. El borrado no elimina automáticamente correos ya entregados.
- Validación en servidor, consentimiento obligatorio, campo señuelo y límites de 5 solicitudes por red/hora y 40 globales/día. Se conserva temporalmente un hash de red, no la IP en claro.
- Formularios, confirmaciones y APIs administrativas usan `no-store` y `noindex`. Las acciones del panel verifican la versión para evitar sobrescrituras entre sesiones.

### Habilitar avisos por correo

El código usa **Cloudflare Email Service**, no solo Email Routing. Los avisos permanecen apagados con `AVISOS_HABILITADOS=false`; las solicitudes se guardan igualmente y el panel advierte que debes revisarlas manualmente.

1. Comprar y conectar `zerok.cl` a Cloudflare DNS.
2. Incorporar el dominio a Email Sending y verificar sus registros de autenticación.
3. Configurar y verificar el reenvío privado de `avisos@zerok.cl` al correo del técnico. No poner el correo personal en el frontend ni en el repositorio.
4. Incorporar a Wrangler el binding `send_email` con nombre `AVISOS` y `destination_address: "avisos@zerok.cl"`, según las restricciones y verificaciones de la cuenta.
5. Publicar con `AVISOS_HABILITADOS=true` únicamente cuando remitente y destinatario estén habilitados. Comprobar la recepción real de una solicitud y un seguimiento.

Remitente y destinatario del código son `avisos@zerok.cl`. La cola persiste los fallos con reintentos; no envía solicitudes ya atendidas. La entrega es al menos una vez: un fallo entre la aceptación del proveedor y el registro local puede duplicar un aviso. No se ha confirmado la disponibilidad ni el costo del servicio de correo en esta cuenta.

Referencias: [API de envío](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/), [bindings](https://developers.cloudflare.com/email-service/configuration/send-bindings/) y [configuración del dominio](https://developers.cloudflare.com/email-service/get-started/send-emails/).

## Comprobaciones y límites

`npm run check` (`scripts/comprobar.mjs`, Node 22 sin dependencias) revisa la sintaxis de todos los `.js`/`.mjs`, que el JSON y los manifests de `sitio/` parseen, que los `href`/`src` locales de los HTML apunten a archivos existentes y que no haya rayas largas en `contenido.json` ni en las cadenas de `src/render.js`. El workflow «Comprobar ZÉROK» corre esa revisión y un `wrangler deploy --dry-run` en cada PR y push a `main`, sin credenciales de Cloudflare.

Evidencia previa al PR #4: agenda comprobada en Preview local con Wrangler usando datos ficticios, con validación, confirmación manual, visita realizada, seguimiento a 14 días y cierre del llamado. Ese pase no verifica el rediseño y las interacciones incorporadas por el PR #4.

Entrega del 08-11-2026: revisión del diff y `node --check` de los JavaScript modificados, sin errores de sintaxis. Tras el deploy autorizado se comprobó HTTP 200 en Inicio, Servicios, Contacto y Admin. El 08-11-2026 se configuró el acceso y se activaron las solicitudes; `/agendar/` responde 200. Producción mantiene la fecha de compatibilidad `2026-11-05`. No se ejecutaron tests, lint, build de aplicación, navegador ni Lighthouse para esta entrega. El render a 390/1440, FLIP, mazo, diálogo, View Transitions, sesiones y recepción real de correos no se observaron en ejecución. Notificaciones, dominio e indexación siguen desactivados.

Las fotos de apoyo se identifican en Créditos y no se presentan como trabajos propios. Las fotos reales del cliente están en Trabajo real. La portada ilustrativa y su versión térmica están en `sitio/img/`, con procedencia y prompts en `material/prompts.md`.

## Dependencias y fuentes

- Wrangler 4.156.0 fijado en lockfile; solo herramienta de despliegue.
- Íconos utilitarios de [Tabler Icons](https://tabler.io/icons) 3.50 (MIT), incrustados en `src/render.js`.
- Mapa estático generado con teselas de [OpenStreetMap](https://www.openstreetmap.org/copyright) (ODbL), con atribución visible.
- GSAP y ScrollTrigger 3.13.0 autoalojados, con avisos de licencia originales. [Licencia comercial sin cargo](https://gsap.com/community/standard-license/).
- Archivo variable y IBM Plex Mono latín, autoalojadas con licencias OFL junto a los archivos. Las fuentes suman 105 KB antes de transferencia.
- [Workers Static Assets y binding](https://developers.cloudflare.com/workers/static-assets/binding/), [manejo de HTML](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/) y [configuración de Wrangler](https://developers.cloudflare.com/workers/wrangler/configuration/).

Para rollback, revertir el commit de código y publicar por el flujo habitual. El contenido es independiente del deploy: conservar el respaldo del panel antes de una modificación amplia.
