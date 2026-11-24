# Modelo de amenazas — ZÉROK

Usado por los escaneos de seguridad de Devin para priorizar hallazgos. Edítalo cuando cambien el sistema o las prioridades. Infraestructura: `wrangler.jsonc` de este repo (no hay repo de infraestructura aparte).

## Prioridades (Diego, 2026-11-17)

- Todos los activos pesan igual: datos personales y acceso a paneles de administración.
- Importan todos los atacantes: anónimo en internet, usuaria registrada contra otra y quien obtiene una clave o cookie de panel.
- Fuera de alcance / riesgo aceptado: nada. Todo cuenta, incluidos DoS y gasto de cuotas.

## Componente `ZEROK`

- Código: `src/worker.js`, `src/admin.js`, `src/agenda.js`, `src/content.js`, `sitio/`.
- Despliegue: Worker `zerok` (zerok.cl), KV `CONTENIDO`, R2 `zerok-media`, Durable Object `Admin` (SQLite), `send_email` `AVISOS`, cron cada 15 min.

## Límites de confianza y puntos de entrada

- Anónimo: páginas públicas, `/agendar/` y `/agendar/preparar/` (crean solicitudes con datos personales), `/media/*`.
- Panel: `/admin/api/*` con cookie `__Host-zerok` (`HttpOnly; Secure; SameSite=Strict`, 12 h). Primer setup exige `ADMIN_SETUP_TOKEN`.
- Cron: avisos por correo.

## Activos

- Solicitudes de visita: nombre, teléfono, dirección, sector, referencia, equipo, problema, notas (Ley 21.719).
- Contenido público editable en KV y fotos en R2.
- Credenciales del panel (hash PBKDF2) y sesiones.

## Controles existentes

- PBKDF2-SHA-256, 100 000 iteraciones con sal; contraseña de 12 a 200 caracteres.
- Tokens de sesión de 32 bytes guardados como SHA-256; comparación en tiempo constante.
- Login limitado a 5 intentos / 15 min; validación de `Origin` en métodos no GET; `cache-control: no-store` en JSON.

## Riesgos conocidos

- Agenda pública sin límite: se puede llenar con solicitudes falsas y bloquearla 24 h (escaneo 2026-11-17).

## Preguntas abiertas

- ¿Está configurado `ADMIN_SETUP_TOKEN` en producción?
