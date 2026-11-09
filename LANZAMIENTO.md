# Lanzamiento en zerok.cl

Checklist ordenada para publicar el sitio en el dominio final. Hoy producción vive en
https://zerok.ddiegosebastianbb.workers.dev con `PUBLIC_INDEXING=false` y avisos por
correo apagados. Cada punto indica quién lo hace y cómo se verifica.

## 1. Dominio

1. **Verificar disponibilidad de `zerok.cl` en NIC Chile** — Diego.
   Verificación: la búsqueda en nic.cl muestra el dominio disponible. Si está tomado,
   se consulta al cliente antes de elegir otra variante (PLAN.md §10).
2. **Registrar `zerok.cl`** — Diego.
   Verificación: el dominio aparece activo en la cuenta de NIC Chile.
3. **Conectar el DNS a Cloudflare** — Diego.
   Agregar `zerok.cl` como sitio en la cuenta Cloudflare del estudio y apuntar los
   nameservers en NIC Chile a los que indique Cloudflare.
   Verificación: el dashboard marca el sitio como Active y `nslookup zerok.cl`
   responde con los nameservers de Cloudflare.
4. **Añadir `routes` con custom_domain al Worker** — Diego.
   Descomentar el bloque `routes` ya preparado en `wrangler.jsonc` y publicar.
   El Worker ya redirige `www.zerok.cl` a `zerok.cl` en código, no hace falta regla extra.
   Verificación: `curl -I https://zerok.cl` responde 200 y
   `curl -I https://www.zerok.cl` responde 301 con `Location: https://zerok.cl/...`.
   Además, canonical, `og:url` y `og:image` deben apuntar a `https://zerok.cl`.
5. **Activar la indexación** — Diego.
   Cambiar `PUBLIC_INDEXING` a `"true"` en `wrangler.jsonc` y publicar.
   Verificación: `https://zerok.cl/robots.txt` declara el sitemap, las páginas públicas
   no llevan `x-robots-tag`, y `workers.dev` sigue respondiendo con `noindex`.

## 2. Correo de la agenda

6. **Configurar Cloudflare Email Service** — Diego.
   Seguir los cinco pasos de README.md, sección «Habilitar avisos por correo»
   (dominio en Email Sending, registros de autenticación, reenvío de `avisos@zerok.cl`
   al correo del técnico, binding `send_email` `AVISOS`, publicación).
   El correo de destino lo confirma el cliente.
   Verificación: recepción real de una solicitud y de un aviso de seguimiento.
7. **Encender los avisos** — Diego.
   `AVISOS_HABILITADOS=true` solo cuando remitente y destinatario estén verificados.

## 3. SEO local

8. **Google Business Profile** — Diego con el cliente.
   Primero confirmar si el negocio ya tiene perfil de Google (PLAN.md §9, ítem 15):
   se reclama el existente o se crea uno nuevo con teléfono, zona y enlace a `zerok.cl`.
   Verificación: perfil publicado y visible en la búsqueda del nombre.
9. **Google Search Console** — Diego.
   Verificar la propiedad de `zerok.cl` y enviar `https://zerok.cl/sitemap.xml`.
   Verificación: el sitemap figura procesado sin errores en el panel.

## 4. Deploy automático

10. **Secretos y variables de GitHub** — Diego.
    Secretos: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
    Variables: `SITE_HEALTH_URL` (cambiar a `https://zerok.cl/` una vez activo el
    dominio) y `CLOUDFLARE_DEPLOY_ENABLED=true`.
    Verificación: un merge a `main` publica y el paso «Comprobar HTTP 200» queda verde.
    Detalle en README.md, «Configuración del alojamiento».

## 5. Datos que confirma el cliente

Nada de esto se publica sin confirmación (PLAN.md §9 detalla la lista completa).

11. **Horario exacto** — Cliente confirma, Diego lo carga en el panel.
    ¿Cierra 21:00 o 21:30? ¿Qué días a cada hora? ¿Atiende domingo o emergencias
    fuera de horario?
    Verificación: el sitio muestra la hora de cierre y el JSON-LD incluye
    `openingHoursSpecification`.
12. **Sectores y comunas fuera de Osorno** — Cliente entrega la lista, Diego la carga
    en «Textos y cobertura».
    Verificación: la lista de sectores publicada coincide y `areaServed` la refleja.
13. **Fotos y videos reales** — Cliente entrega 10 a 20 fotos de trabajos y videos
    verticales cortos. Diego reemplaza las fotos de apoyo de Wikimedia Commons.
    Verificación: las fotos nuevas aparecen con su frase en «Trabajo real». La página
    Créditos lista siempre las fotos registradas en `src/creditos.js`: al retirar una
    foto de apoyo del sitio, borrarla también de ese archivo.
14. **Precios, garantía, marcas, pagos y credenciales** — Cliente confirma.
    Solo si vende productos o planes: precios CLP. Garantía con plazo y cobertura,
    medios de pago, boleta o factura, marcas reales y registro SEC para gas.
    Sin esos datos estas secciones permanecen ocultas.
15. **Blog y FAQ** — Cliente revisa los textos antes de publicar.
    FAQ y entradas de blog se activan desde el panel solo tras su revisión.
    Verificación: las páginas responden 200 y entran a navegación y sitemap.
