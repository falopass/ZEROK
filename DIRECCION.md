---
version: alpha
name: ZEROK
colors:
  primary: "#071A30"
  secondary: "#DDE8EF"
  tertiary: "#E09A1F"
  neutral: "#EEF3F5"
  surface: "#F8FAFB"
  on-primary: "#E6EEF1"
  on-tertiary: "#0C2340"
typography:
  display:
    fontFamily: Archivo
    fontSize: 3.75rem
    fontWeight: 800
    lineHeight: 1.05
  body-md:
    fontFamily: Archivo
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.6
  label-caps:
    fontFamily: IBM Plex Mono
    fontSize: 11px
    fontWeight: 400
    letterSpacing: 0.08em
  button:
    fontFamily: Archivo
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.2
rounded:
  sm: 10px
  md: 20px
  lg: 32px
spacing:
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    rounded: "{rounded.sm}"
    padding: 12px
    typography: "{typography.button}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: 12px
  surface-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 24px
  band:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.primary}"
    padding: 20px
  closing:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    padding: 64px
  page:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
---

## Overview

**Estado: borrador vivo.** Este fichero describe lo que hay hoy en `ZEROK`, no un diseño cerrado. **Nada es final y todo puede modificarse**: paleta, tipografía, composición y movimiento se pueden cambiar en el próximo encargo. Su única función es que el agente no invente y que la próxima sesión sepa de dónde parte.

**Concepto:** del calor de la falla al frío que vuelve (`DISENO.md` §2).
**Ancla:** la lente térmica del hero y el logo del cliente: un copo con Z y aguja de manómetro, vectorizado en `sitio/img/logo.svg` con símbolos `#simbolo` y `#palabra` (`DISENO.md`, revisión 4).
**Portabilidad:** no medida; la identidad vive en el repositorio, no en el nombre.

Paleta medida de `sitio/css/estilos.css`: hielo, tinta noche en azul marino y ámbar de acción. Los celestes existen, pero solo en el logo y sus tintas (`--marca`, `--logo-*`): fuera del logo el cian no es color de interfaz y el copo no se usa como decoración (`DISENO.md`, revisión 4).

## Colors

Los tokens salen del `:root` de `sitio/css/estilos.css`, no de una propuesta.

- `primary` = `--cierre`; `secondary` = `--superficie-2`; `tertiary` = `--acento`; `neutral` = `--fondo`; `surface` = `--superficie`.
- `on-primary` = `--texto` en oscuro; `on-tertiary` = `--sobre-acento`.
- El ámbar nunca se usa como texto sobre fondo claro: en claro es relleno con texto oscuro (`DISENO.md` §3.2).

## Typography

Display y cuerpo en **Archivo** variable (400-800, ancho 100-125); cuerpo a 17 px con interlineado 1.6. Etiquetas (eyebrows) en **IBM Plex Mono** 400 a 11 px y 0.08em; datos en la misma familia a 13 px. Sin tercera familia: el énfasis usa peso o ancho de Archivo.

## Layout

Contenedor `.wrap` de 1200 px (`20/32 px` laterales), bajado en la revisión 5 de `DISENO.md`. Retícula 4/12 columnas, breakpoints 640/768/1024 en el CSS (`DISENO.md` añade 1280), escala base 4 de 4 a 96 px, secciones de 72/80 px, botones de 48 px y áreas táctiles de 44 px. `min-height: 100dvh`, nunca `100vh`.

## Elevation & Depth

Sin elevación decorativa. Sombras teñidas `rgb(15 29 38 / .08)` solo en el header al hacer scroll y en el menú móvil; la profundidad la dan el color y el filete.

## Shapes

Radios en escala desde la revisión 3 de `DISENO.md`: **10 px** (botones e inputs), **20 px** (fotos, láminas y paneles) y **32 px** (hero, bloque de servicios y cierre). Etiquetas de fallas, sectores e índice de servicios van en píldora.

## Components

Botón primario ámbar con texto tinta; secundario de borde sobre superficie; tarjeta de superficie; banda de datos en `--superficie-2`; cierre en tinta noche. Los que existan en el código mandan sobre esta lista.

## Do's and Don'ts

- **Sí:** conservar los tokens y la identidad que ya están en el repositorio.
- **No:** cambiar paleta, tipografía o composición sin un encargo explícito; usar cian fuera del logo, copos de nieve decorativos ni íconos decorativos.
- **Nunca:** inventar datos, testimonios, precios ni cifras; usar marcas o copy de terceros.

## Decisiones abiertas

- **Todo el diseño es revisable.** No hay ninguna decisión cerrada por este documento.
- El concepto y el ancla salen de `DISENO.md`; cualquier cambio de identidad se escribe aquí primero.
- Los valores medidos se confirman al abrir el sitio; el material real del cliente manda sobre las imágenes provisionales.

## Implementation Starting Point

HTML/CSS/JS estático en `sitio/` + worker en `src/`. Abrir `sitio/index.html` o servir la carpeta; no hay build.

## Agent Prompt

Lee este fichero, `DISENO.md` y `AGENTS.md` antes de tocar frontend. Respeta los tokens mientras no haya encargo de rediseño; si lo hay, actualiza este documento primero y pasa `npx -y -p @google/design.md designmd lint DIRECCION.md` con 0 errores y 0 warnings. Verifica 390 px, contraste y `prefers-reduced-motion`.
