# DISENO.md: Sistema visual del sitio ZÉROK

Leer antes de tocar cualquier página pública. El panel `/admin/` es interfaz de producto: se dirige con
`interface-design`, reutiliza solo los tokens de color y tipografía de este documento y no hereda
composición, hero ni motion de la web pública.

Fecha: 05-11-2026. Decisiones cerradas con Diego: dominio **zerok.cl**, trato de **tú**, precios se
cargan después (la página Precios queda oculta hasta tener ítems).

---

## 1. Lectura del diseño

**Lectura:** landing de servicio técnico local para dueños de casa y negocios de Osorno con una falla
encima, con lenguaje técnico preciso y cercano («ficha técnica en frío»), construida con CSS nativo,
tokens en variables y motion CSS liviano.

Quien llega tiene un refrigerador que no enfría o una vitrina con mercadería en riesgo. Lee en el
celular, apurado, a veces con frío. El diseño tiene que transmitir **oficio y respuesta rápida** y
llevar a WhatsApp sin fricción. Nada de estética de «startup», nada de catálogo de electrodomésticos.

### Diales
| Dial | Valor | Por qué |
|------|-------|---------|
| `DESIGN_VARIANCE` | **6** | Composición asimétrica en escritorio para tener carácter; columna única estricta en móvil. Es un servicio de confianza: no se arriesga la legibilidad. |
| `MOTION_INTENSITY` | **4** | Motion que informa (entrada del hero, cambios de estado del selector, aparición de la barra de contacto). Sin parallax, sin scroll-hijack, sin loops. |
| `VISUAL_DENSITY` | **4** | Datos útiles a la vista (horario, cobertura, servicios) con aire suficiente para leer de pie. |

### Stack (cultura del estudio sobre el default de la skill)
HTML, CSS y JS vanilla en `sitio/`, sobre Cloudflare Workers (igual que Rancho Itahue y Arco). Sin
React, Tailwind ni librerías de animación: el sitio es chico, se mantiene por una persona y así no hay
paso de build. Motion con transiciones CSS + `IntersectionObserver`.

---

## 2. Concepto: «ficha técnica en frío»

- **Frío** en la base: neutrales grises con tinte azul hielo. El frío *es* la familia neutra, no un acento.
- **Calor** en la acción: un único acento ámbar para todo lo que se toca (CTA, estado «abierto»,
  selección activa). Calor contra frío: también se lee bien en un día gris de Osorno.
- **Ficha técnica**: datos alineados, cifras en mono, líneas finas de 1 px que **organizan contenido
  real** (nunca grillas decorativas).

**Prohibido en este sitio:** copos de nieve, termómetros caricatura, degradados celeste, glows,
técnicos de stock sonriendo, íconos 3D, morado, fotos de banco presentadas como trabajos propios.

---

## 3. Color

Tema **automático** según `prefers-color-scheme` (claro por defecto), sin interruptor. Una sola
inversión deliberada en la página: el **cierre** (CTA final + footer) va en tinta noche también en
modo claro.

### 3.1 Tokens

| Token | Claro | Oscuro | Uso |
|-------|-------|--------|-----|
| `--fondo` | `#EEF3F5` hielo | `#0B161D` noche | Fondo de página |
| `--superficie` | `#F8FAFB` | `#12212A` | Paneles, selector, tarjetas con jerarquía real |
| `--superficie-2` | `#DFE8EC` | `#183039` | Bloques tintados (negocio, banda de datos) |
| `--linea` | `#C9D5DB` | `#24353F` | Líneas de 1 px, bordes de inputs |
| `--texto` | `#0F1D26` | `#E6EEF1` | Texto principal |
| `--texto-2` | `#4A5F6B` | `#9DB0BA` | Texto secundario, metadatos |
| `--acento` | `#E09A1F` ámbar | `#E09A1F` | Fondo de CTA, estado activo, selección |
| `--acento-hover` | `#C9861A` | `#F0AE3A` | Hover del CTA |
| `--sobre-acento` | `#0F1D26` | `#0F1D26` | Texto sobre ámbar (siempre oscuro) |
| `--error` | `#B42318` | `#F97066` | Errores de formulario |
| `--cierre` | `#0B161D` | `#070F14` | Bloque final + footer |

- Sin `#000` ni `#fff` puros.
- Verde WhatsApp: **solo** dentro del ícono de WhatsApp, nunca como fondo de botón (el CTA es ámbar).
- Sombras teñidas del fondo (`rgb(15 29 38 / .08)`), nunca negras. Se usan solo en el header al hacer
  scroll y en el menú móvil.

### 3.2 Contraste (cálculo WCAG aproximado, a confirmar con herramienta al implementar)
| Par | Ratio aprox. | Resultado |
|-----|--------------|-----------|
| `--texto-2` sobre `--fondo` (claro) | ~6,0:1 | AA cuerpo |
| `--texto-2` sobre `--fondo` (oscuro) | ~8,2:1 | AA cuerpo |
| `--sobre-acento` sobre `--acento` | ~7,2:1 | AA cuerpo |
| `--acento` como texto sobre `--fondo` oscuro | ~7,7:1 | AA cuerpo |

**Regla:** el ámbar **nunca** se usa como color de texto sobre fondo claro (no alcanza contraste).
En claro, el ámbar es siempre relleno con texto oscuro encima.

### 3.3 Logo
Si el cliente entrega logo con colores propios, el logo manda: se recalibra el acento con él y se
actualiza esta tabla. Mientras no llegue, se usa el wordmark tipográfico (§4.3).

---

## 4. Tipografía

Autoalojada en `.woff2` con `font-display: swap`, subset latín con tildes y ñ. Nunca `<link>` a Google Fonts.

| Rol | Fuente | Ajustes |
|-----|--------|---------|
| Titulares | **Archivo** variable | ancho `wdth 112-125`, peso 700-800, `letter-spacing: -0.02em` |
| Cuerpo | **Archivo** variable | ancho 100, peso 400/500, `line-height 1.6`, máx. 65ch |
| Datos | **IBM Plex Mono** | 400/500. Horarios, chip de estado, precios, fechas del blog, teléfono |

Una sola familia para titulares y cuerpo (menos peso de descarga). Énfasis dentro de un titular:
**negrita o ancho distinto de Archivo**, nunca otra familia. Sin serif.

### 4.1 Escala (fluida)
| Token | Tamaño | Uso |
|-------|--------|-----|
| `--t-marca` | `clamp(3rem, 9vw, 6.5rem)` | «ZÉROK» en el hero |
| `--t-h1` | `clamp(1.375rem, 3vw, 2rem)` | Resto del H1 |
| `--t-h2` | `clamp(1.75rem, 4vw, 2.75rem)` | Títulos de sección |
| `--t-h3` | `1.25rem` | Servicios, preguntas |
| `--t-cuerpo` | `1.0625rem` (17 px) | Texto: lectura de pie en celular |
| `--t-chico` | `0.875rem` | Metadatos |
| `--t-mono` | `0.9375rem` | Datos |

### 4.2 H1 del hero
El H1 es el texto del cliente, en dos niveles dentro del mismo elemento:

```html
<h1 class="hero-titulo">
  <span class="hero-marca">ZÉROK</span>
  <span class="hero-rubro">Refrigeración &amp; Climatización Profesional</span>
</h1>
```

«ZÉROK» en ancho 125 y peso 800; el rubro en ancho 112 y peso 600. Máximo 2 líneas en escritorio.

### 4.3 Wordmark provisorio
«ZÉROK» en Archivo ancho 125, peso 800, `letter-spacing: 0.02em`. La tilde de la É se conserva siempre.
No se dibuja un logo inventado.

---

## 5. Forma, espacio y retícula

- **Radio único: 6 px** para todo (botones, inputs, paneles, chips, imágenes). Sin píldoras, sin
  radios mezclados. Es la regla de forma del sitio.
- **Espaciado** en base 4: `--e-1 4px` · `--e-2 8px` · `--e-3 12px` · `--e-4 16px` · `--e-6 24px` ·
  `--e-8 32px` · `--e-12 48px` · `--e-16 64px` · `--e-24 96px`.
- **Secciones:** `padding-block: var(--e-16)` en móvil, `var(--e-24)` en escritorio.
- **Contenedor:** `max-width: 1240px`, `padding-inline: 20px` móvil / `32px` escritorio.
- **Retícula:** 4 columnas en móvil (columna única de contenido), 12 en escritorio desde 1024 px.
- **Breakpoints:** 640 · 768 · 1024 · 1280.
- **Alturas:** nada de `100vh`; si algo necesita alto de pantalla, `min-height: 100dvh`.
- **Áreas táctiles:** mínimo 44×44 px; botones de 48 px de alto.
- **Tarjetas** solo cuando la elevación significa algo (selector, ítems de precio). El resto se agrupa
  con espacio y líneas de 1 px.
- **Capas (z-index):** `--z-header 10`, `--z-barra 20`, `--z-menu 30`. Nada más.

---

## 6. Íconos e imágenes

### 6.1 Íconos
**Tabler Icons** (MIT), variante outline, `stroke-width: 1.5`, una sola familia en todo el sitio. Se
copian como SVG a un sprite (`sitio/img/iconos.svg`) y se usan con `<use>`. No se dibujan íconos a mano.

Glifos previstos (confirmar el nombre exacto en tabler.io al implementar; si falta uno, se elige el
más cercano de la misma familia): refrigerador, aire acondicionado, lavadora, auto, llama
(calefón/calefacción), tienda (comercial), herramienta, teléfono, WhatsApp, Instagram, reloj,
ubicación, gota (filtración), volumen (ruido), copo/termómetro solo si no hay alternativa.

### 6.2 Fotos
- **Solo fotos reales** del cliente en «Trabajos», servicios y hero.
- Tratamiento uniforme: recorte fijo (hero 4:5 en móvil y 5:6 en escritorio; servicios 4:3; galería
  libre en mosaico), leve ajuste de contraste, sin filtros de color, sin etiquetas encima de la foto.
  Pie de foto, si hace falta, debajo y funcional («Mantención de split en Rahue»).
- Formato `.webp`, `width`/`height` declarados (sin CLS), `loading="lazy"` salvo la del hero
  (`fetchpriority="high"` + preload).
- **Mientras no lleguen fotos:** el hero puede usar una imagen de atmósfera **generada** (detalle macro
  de aletas de un condensador o serpentín con condensación, sin personas ni marcas), declarada en el
  código como `<!-- imagen de atmósfera generada, no es un trabajo -->`. Nunca se usa en «Trabajos» ni
  en servicios. Si no hay herramienta de generación disponible, el hero queda tipográfico con un slot
  marcado `<!-- TODO: foto real de trabajo, 1200x1500 -->`.

---

## 7. Motion

Todo motion responde a una pregunta: ¿qué comunica? Si no hay respuesta, no va.

### 7.1 Tokens
```css
--dur-1: 150ms;  /* hover, press */
--dur-2: 240ms;  /* cambios de estado, menú */
--dur-3: 600ms;  /* entradas */
--ease-salida: cubic-bezier(.16, 1, .3, 1);
--ease-estado: cubic-bezier(.2, 0, 0, 1);
```
Solo se animan `transform` y `opacity`.

### 7.2 Catálogo
| Elemento | Qué hace | Qué comunica |
|----------|----------|--------------|
| Entrada del hero | «ZÉROK» sube 16 px y aparece (600 ms); rubro, bajada y CTA siguen con 80 ms de desfase | Jerarquía: primero la marca, después la acción |
| Selector: elegir equipo | Los síntomas del equipo entran en cascada (240 ms, 40 ms de desfase); el elegido queda con fondo ámbar | Cambio de estado: «ahora elige el síntoma» |
| Selector: vista previa | El mensaje de WhatsApp se actualiza con un fundido de 150 ms | Retroalimentación: lo que eliges se escribe en el mensaje |
| Barra de contacto móvil | Sube desde abajo (240 ms) cuando el CTA del hero sale de pantalla; baja cuando vuelve | Evita dos CTA iguales visibles a la vez |
| Header | Al hacer scroll gana fondo sólido y sombra teñida (150 ms) | Separación del contenido |
| Revelado de secciones | Bloques clave (servicios, cómo trabajamos, cobertura) aparecen con 24 px de subida, una vez | Ritmo de lectura |
| Botones | Hover: cambio de color 150 ms. `:active`: `translateY(1px)` | Respuesta física al toque |
| Menú móvil | Panel entra desde la derecha 240 ms; foco atrapado; `Esc` cierra | Cambio de estado |
| Preguntas frecuentes | `<details>` nativo; el ícono gira 45° | Abierto/cerrado |
| Filtro de precios (cuando exista) | Ítems filtrados con fundido de 150 ms | Cambio de estado |

### 7.3 Prohibido
Parallax, scroll-hijack, marquees, loops infinitos, pulso en el chip de estado, escritura tipo
máquina, cursores personalizados, `window.addEventListener('scroll')`. Los cambios por scroll se
detectan con `IntersectionObserver`.

### 7.4 Movimiento reducido
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
}
```
Además, el JS no agrega clases de revelado si `matchMedia('(prefers-reduced-motion: reduce)')` es
verdadero: el contenido aparece directo. Sin JS, todo el contenido es visible desde el inicio (las
clases de estado oculto las pone el script, no el HTML).

---

## 8. Componentes

### 8.1 Botones (una etiqueta por intención)
| Intención | Etiqueta única | Estilo |
|-----------|----------------|--------|
| Contactar por WhatsApp | **Agendar visita** (+ ícono WhatsApp) | Primario: fondo ámbar, texto `--sobre-acento` |
| Llamar | **Llamar** (+ ícono teléfono) | Secundario: borde `--texto` 1,5 px, fondo transparente |
| Enviar el mensaje armado en el selector/formulario | **Enviar mensaje** | Primario |
| Pedir un producto | **Pedir por WhatsApp** | Secundario dentro del ítem |

Etiquetas siempre en una línea. Foco visible: `outline: 2px solid var(--acento); outline-offset: 3px`
(en claro, `outline` en `--texto` para que se vea sobre fondo hielo).

### 8.2 Chip de estado del horario
Mono, en el header: **«Abierto ahora»** con un punto ámbar, o **«Cerrado, abre 07:30»** en
`--texto-2` sin punto. Es el único punto de color del sitio (estado real). Se calcula con
`Intl.DateTimeFormat` en `America/Santiago`. Sin JS no se muestra. Horario pendiente de confirmar
(21:00 o 21:30).

### 8.3 Inputs (formulario de contacto y selector)
Etiqueta arriba, ayuda debajo, error debajo en `--error`. Nunca placeholder como etiqueta. Borde
`--linea`, foco con borde `--texto` + anillo ámbar. Altura 48 px.

### 8.4 Barra de contacto móvil
Fija abajo, 64 px + `env(safe-area-inset-bottom)`. Dos botones a lo ancho: **Agendar visita** (ámbar)
y **Llamar** (borde). El `body` reserva ese alto para no tapar texto. Se oculta en escritorio (≥1024 px).

### 8.5 Estados vacíos
Lo que no tiene contenido no se muestra: precios destacados, trabajos, blog y FAQ se ocultan
completos (sección y enlace del menú). No hay estados «próximamente» en la web pública.

---

## 9. Composición por página

Regla: en la home cada familia de layout aparece una sola vez; máximo 1 eyebrow cada 3 secciones;
sin títulos partidos (titular a la izquierda + párrafo flotando a la derecha); sin numeración de secciones.

### 9.1 Inicio

| # | Bloque | Familia de layout | Móvil |
|---|--------|-------------------|-------|
| 1 | **Header** 64 px | Wordmark, chip de estado, navegación en una línea, «Agendar visita» | Wordmark + chip + menú hamburguesa |
| 2 | **Hero** | Split asimétrico: texto en 7 columnas a la izquierda; foto en 5 columnas que sangra al borde derecho. Máx. 4 elementos de texto: H1 (2 niveles), bajada, 2 CTA | Columna única: H1, bajada y CTA caben en 390×844 sin scroll; la foto va debajo |
| 3 | **Banda de datos** | Franja de 3 columnas en `--superficie-2`, mono: «Lunes a sábado, 07:30 a 21:00» / «Vamos a tu casa o negocio» / «Osorno y sectores de Los Lagos» | 3 filas apiladas |
| 4 | **¿Qué está fallando?** | Panel interactivo en `--superficie`: pasos a la izquierda, vista previa del mensaje a la derecha | Apilado: equipo, síntoma, sector, vista previa, botón |
| 5 | **Servicios** | Bento de **exactamente 7 celdas**: 2 grandes con foto (Refrigeradores y vitrinas / Aire acondicionado) y 5 chicas; al menos 1 chica tintada en `--superficie-2` | Columna única; las grandes con foto 4:3 |
| 6 | **En tu casa / En tu negocio** | Dos paneles de igual alto lado a lado; el de negocio tintado en `--superficie-2` | Apilados |
| 7 | **Presentación** | Manifiesto editorial: párrafo grande (`--t-h3`, 60ch), sin imagen | Igual |
| 8 | **Cómo trabajamos** | Línea horizontal de 4 verbos conectados por una línea de 1 px: Escribes, Agendamos, Diagnosticamos, Reparamos | Línea de tiempo vertical |
| 9 | **Precios destacados** *(oculto hasta tener ítems)* | Fila con scroll-snap horizontal | Igual, con deslizamiento |
| 10 | **Trabajos recientes** *(oculto hasta tener fotos)* | Mosaico (masonry) de fotos reales | 2 columnas |
| 11 | **Cobertura y horario** | Lista de sectores + horario en mono a la izquierda; mapa de Osorno a la derecha, cargado al tocar (fachada estática, sin iframe en la carga inicial) | Lista, horario, botón «Ver mapa» |
| 12 | **Del blog** *(oculto sin entradas)* | Filas editoriales: fecha en mono + título + extracto | Igual |
| 13 | **Preguntas frecuentes** *(solo respuestas confirmadas)* | Acordeón `<details>` en una columna de 65ch | Igual |
| 14 | **Cierre** (inversión única a `--cierre`) | CTA final grande + footer con datos de contacto, horario, Instagram y enlaces | Apilado |

Eyebrow: solo uno en toda la home, sobre «¿Qué está fallando?» («Diagnóstico por WhatsApp»).

### 9.2 Servicios
Índice de anclas fijo bajo el header (chips con scroll horizontal en móvil). Luego un bloque por
servicio con la misma ficha (es una página de consulta: aquí la repetición ayuda a comparar):
título H2, «Qué hacemos», «Fallas que atendemos» (lista corta en 2 columnas), foto si existe y botón
**Agendar visita** con el servicio escrito en el mensaje.

### 9.3 Precios y productos (cuando haya ítems)
Chips de categoría arriba; grilla de ítems de 1 / 2 / 3 columnas (móvil / tablet / escritorio). Ítem:
foto 4:3 opcional, nombre, descripción de 2 líneas, precio en mono grande (`$29.990`, «desde» en
`--texto-2`), botón **Pedir por WhatsApp**. Agotado: precio en `--texto-2` + texto «Sin stock», botón
desactivado.

### 9.4 Blog
Listado en filas editoriales (no tarjetas iguales en 3 columnas). Entrada: columna de lectura de 65ch,
H1, fecha en mono, foto opcional, cuerpo con buen interlineado, recuadro final con **Agendar visita** y
enlace al servicio relacionado.

### 9.5 Contacto
Split: datos (WhatsApp, teléfono en mono, Instagram, horario, sectores) a la izquierda; formulario que
arma el mensaje a la derecha (nombre, equipo, qué le pasa, sector) con botón **Enviar mensaje**. No se
guarda nada.

---

## 10. Copy

- **Trato de tú** en todo el sitio. Verbos concretos («revisamos», «reparamos», «vamos a tu casa»).
- **Sin rayas largas (— ni –) en ningún texto visible.** Rangos con «a» («07:30 a 21:00») o guion simple.
- Punto medio (·) máximo uno por línea.
- Sin cifras, años, garantías, marcas ni reseñas que el cliente no haya entregado.
- Sin «soluciones integrales», «calidad garantizada», «los mejores», «expertos líderes».

### 10.1 Textos base
| Lugar | Texto |
|-------|-------|
| Bajada del hero | Servicio técnico especializado en refrigeración, climatización y línea blanca a domicilio en Osorno y la Región de Los Lagos. *(19 palabras: cumple el máximo de 20)* |
| Selector, título | ¿Qué está fallando? |
| Selector, apoyo | Elige el equipo y lo que le pasa. Te dejamos el mensaje listo para WhatsApp. |
| Mensaje armado | Hola ZÉROK, tengo un {equipo} que {síntoma}. Estoy en {sector}. ¿Pueden venir a revisarlo? |
| En tu casa | Refrigeradores, lavadoras, secadoras, calefones, splits y A/A de auto. |
| En tu negocio | Vitrinas refrigeradas, conservadores y máquinas cecineras y de panadería. |
| Presentación | En ZÉROK nos especializamos en la reparación, revisión y mantención a domicilio de refrigeradores, vitrinas comerciales y equipos de aire acondicionado en Osorno. Solucionamos fugas de gas, cambios de motor, problemas de enfriamiento y ruidos extraños. Servicio técnico rápido, transparente y confiable, directo en tu casa o negocio. |
| Cierre | ¿Tu equipo falló? Escríbenos y agendamos la visita. |

Síntomas del selector: «no enfría», «tiene una fuga de gas», «hace un ruido extraño», «no enciende»,
«gotea agua», «otra falla». Los síntomas solo describen lo que escribe la persona; no son promesas.

---

## 11. Calidad mínima (se revisa leyendo el código, sin suites de test)

- Ninguna raya larga en texto visible; una etiqueta por intención de CTA; CTA en una línea.
- Hero completo dentro de 390×844 sin scroll; header de 64 px en una línea en escritorio.
- Contraste según §3.2; foco visible en todo control; navegación por teclado en menú y selector.
- `prefers-reduced-motion` respetado; sin JS el sitio se lee completo y WhatsApp funciona por enlace.
- Imágenes con medidas declaradas; hero precargado; fuentes con `swap`.
- Presupuesto: home < 100 KB de HTML+CSS+JS comprimido, fuentes < 90 KB, hero ≤ 150 KB.
  La medición real (Lighthouse) se hace solo si Diego la pide.
