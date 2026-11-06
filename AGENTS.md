# AGENTS.md — ZÉROK Refrigeración & Climatización Profesional

Proyecto del cliente **ZÉROK** (servicio técnico a domicilio, Osorno). Todo el trabajo de este cliente
se hace en esta carpeta (`D:\Códigos\clientes\ZEROK`), nunca en otro repo. Remoto:
`https://github.com/falopass/ZEROK` (rama `main`). Plan completo en `PLAN.md`.
**Antes de tocar cualquier página pública, leer `DISENO.md`** (paleta, tipografía, motion, componentes,
composición y copy). El panel `/admin/` se diseña con `interface-design` y solo comparte tokens.
**Animaciones: van y no se prohíben** (decisión de Diego, 05-11-2026); las restricciones por tipo de
sitio de la skill `design-taste-frontend` no aplican aquí.

## Decisiones cerradas (05-11-2026)
- Dominio: **zerok.cl** (disponibilidad por verificar en NIC Chile).
- Trato de **tú** en todo el sitio. Sin rayas largas (— ni –) en texto visible.
- Precios y productos se cargan después desde el panel; hasta entonces la página Precios queda oculta.

## Plan contratado
$29.990/mes + $29.990 de activación, sin permanencia: hosting y dominio, 5 páginas, blog integrado,
diseño editorial a medida, SEO local (Google Business Profile), mobile-first. Plazo: 10 días hábiles.
Pago en línea, carrito y agenda de reservas quedan fuera del plan.

## Datos reales (no inventar nada más)
- Nombre: **ZÉROK Refrigeración & Climatización Profesional** (en slugs y dominio: `zerok`).
- Zona: Osorno y sectores de la Región de Los Lagos (lista de sectores: pendiente del cliente).
  Negocio a domicilio: no se publica dirección exacta.
- Teléfono/WhatsApp: **+56 9 7789 6895** · `https://wa.me/56977896895` · `tel:+56977896895`.
- Instagram: `https://www.instagram.com/zerok_osorno/`.
- Horario: lunes a sábado 07:30 a 21:00 / 21:30 (pendiente confirmar cuál aplica y cuándo).
- Servicios (7): técnico general y de emergencia; refrigeradores y vitrinas comerciales; aire
  acondicionado (instalación, mantención, reparación, desmantelamiento; splits, portátiles, conductos,
  filtros); A/A automotriz; lavadoras y secadoras; calefones y calefacción (incluye termostatos);
  equipos comerciales (conservadores, máquinas cecineras y de panadería).
- Fallas que el cliente nombra: fugas de gas, cambio de motores, problemas de enfriamiento, ruidos extraños.
- Si algo no está en esta lista (precios, garantía, marcas, años, certificaciones, reseñas), no se
  escribe: se oculta o se pregunta a Diego.

## Cómo se trabaja
- Stack del estudio: Cloudflare Workers + Static Assets, HTML/CSS/JS vanilla en `sitio/`, contenido
  editable en KV, fotos en R2, panel en `/admin/`. Patrón copiado de `rancho-itahue` sin tocar ese repo.
- Mobile-first (390×844), contraste AA, sin placeholders de contenido, fotos reales en `.webp`.
- Sin tests, lint ni build local (pedido de Diego). Tras cada deploy, solo comprobar HTTP 200.
- Al cerrar cada bloque: commit (mensajes en español), push y deploy.
- El WhatsApp del cliente no lo escribe ningún script.

## Estado
- 05-11-2026: sitio y panel implementados en `sitio/` y `src/`, con render en servidor, contenido en KV, medios en R2 y acceso serializado en Durable Objects. Configuración y límites en `README.md`.
- Sin tests, lint ni build local. Revisión de código y sintaxis; falta observarlo en ejecución después del despliegue autorizado.
- 06-11-2026: primer deploy en https://zerok.ddiegosebastianbb.workers.dev con KV, R2 y Durable Object creados (HTTP 200 comprobado).
- 06-11-2026: revisión 3 de diseño (menos plano, más foto y motion; detalle en `DISENO.md`). Fotos de apoyo de Wikimedia Commons con créditos en `/creditos/` hasta que lleguen las del cliente.
- 06-11-2026: logo del cliente vectorizado y paleta recalibrada; primeras 3 fotos reales con su frase en «Trabajo real» (revisión 4 en `DISENO.md`).
- Pendiente: secreto `ADMIN_SETUP_TOKEN` del Worker, secretos de GitHub para el deploy automático, material real del cliente (§9 del plan), horario exacto y registro/conexión del dominio. Precios, blog, galería y FAQ siguen ocultos hasta cargar contenido confirmado.
