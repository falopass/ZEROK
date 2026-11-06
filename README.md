# ZÉROK

Sitio y panel del servicio técnico ZÉROK en Osorno. HTML, CSS y JavaScript, sin framework ni build del frontend.

## Lo implementado

- Inicio, Servicios y Contacto con los siete servicios y los contactos reales.
- Selector de equipo y falla que prepara el mensaje en el dispositivo. Solo abre WhatsApp cuando la persona pulsa Enviar mensaje. No envía mensajes automáticamente ni almacena datos del formulario.
- Lente térmica, entrada de marca, láminas apiladas, revelados, cambio Casa/Negocio y recorrido animado. Alternativas con movimiento reducido y lectura sin JavaScript.
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

No se ha realizado un deploy ni conectado el dominio. El repositorio no tenía secretos de despliegue configurados al comenzar la construcción. No se leyeron valores de credenciales.

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
5. En Trabajos, usar únicamente fotos reales del cliente. Las descripciones se usan como texto alternativo; no son pies de foto.
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

## Comprobaciones y límites

No se ejecutaron tests, lint, build local ni navegador. La entrega se revisa mediante lectura del código y comprobación de sintaxis JavaScript. No se ha observado el render ni probado el servicio de Cloudflare en ejecución. Tras el deploy autorizado corresponde comprobar HTTP 200, como pide el proyecto.

Fotografías reales de servicios, selector, recorrido y Casa/Negocio se cargarán cuando el cliente las entregue. Mientras tanto, esos bloques usan texto útil y la galería permanece oculta; no hay imágenes rotas ni fotos de librería presentadas como trabajos propios. La portada ilustrativa y su versión térmica están en `sitio/img/`, con procedencia y prompts en `material/prompts.md`.

## Dependencias y fuentes

- Wrangler 4.156.0 fijado en lockfile; solo herramienta de despliegue.
- GSAP y ScrollTrigger 3.13.0 autoalojados, con avisos de licencia originales. [Licencia comercial sin cargo](https://gsap.com/community/standard-license/).
- Archivo variable y IBM Plex Mono latín, autoalojadas con licencias OFL junto a los archivos. Las fuentes suman 105 KB antes de transferencia.
- [Workers Static Assets y binding](https://developers.cloudflare.com/workers/static-assets/binding/), [manejo de HTML](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/) y [configuración de Wrangler](https://developers.cloudflare.com/workers/wrangler/configuration/).

Para rollback, revertir el commit de código y publicar por el flujo habitual. El contenido es independiente del deploy: conservar el respaldo del panel antes de una modificación amplia.
