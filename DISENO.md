# DISENO.md: Sistema visual del sitio ZÉROK

Leer antes de tocar cualquier página pública. El panel `/admin/` es interfaz de producto: se dirige con
`interface-design`, reutiliza solo los tokens de color y tipografía de este documento y no hereda
composición, hero ni motion de la web pública.

Fecha: 05-11-2026 (revisión 2: sitio vivo, fotográfico, sin íconos decorativos). Decisiones cerradas con Diego: dominio **zerok.cl**, trato de **tú**, precios se
cargan después (la página Precios queda oculta hasta tener ítems).

### Revisión 3 (06-11-2026): menos plano, menos cuadrado
Pedido de Diego: «demasiado plana y cuadrada, le falta vida». Cambios que reemplazan reglas de abajo:
- **Radios en escala**, no radio único: `--radio 10px` (botones, inputs), `--radio-l 20px` (fotos,
  láminas, paneles), `--radio-xl 32px` (hero, bloque de servicios y cierre, insertos a 8-16 px del borde).
  Etiquetas de fallas, sectores e índice de servicios van en píldora.
- **Tinta noche en más de un bloque**: franja en movimiento, vista previa del mensaje, servicios
  apilados y cierre (clase `.noche`, que reutiliza los tokens oscuros). En el resto manda el tema automático.
- **Sombras teñidas** también en láminas, menú, barra de contacto y elementos elegidos (`--sombra`).
- **Franja en movimiento** bajo el hero con horario, cobertura y las cuatro fallas que nombra el cliente.
- **Fotos de apoyo de Wikimedia Commons** (licencias libres, créditos en `/creditos/`) en servicios,
  selector, Casa/Negocio, recorrido y cierre, hasta que lleguen las fotos reales del cliente. Se
  registran en `src/creditos.js`; reemplazarlas desde el panel no exige tocar código.
- **Mapa de Osorno** propio a partir de teselas de OpenStreetMap (`sitio/img/mapa-osorno.webp`), con
  marcador animado y atribución visible.
- Motion sumado: lente térmica con mira, parallax en fotos a sangre, palabras de la presentación que se
  encienden con el scroll, pasos del recorrido que se marcan al pasar la línea, escritura antes de la
  burbuja del mensaje, CTA magnético y fotos que se descubren al entrar. Todo con alternativa reducida.

---

## 1. Lectura del diseño

**Lectura:** landing de servicio técnico local para dueños de casa y negocios de Osorno, con un
lenguaje **vivo, fotográfico y de oficio**: se siente el frío, se ve la falla y se ve la mano que la
arregla. CSS nativo + GSAP para la coreografía de scroll, sin framework.

Quien llega tiene un refrigerador que no enfría o una vitrina con mercadería en riesgo. Lee en el
celular, apurado. El sitio tiene que **dar ganas de escribir**: mostrar el trabajo de verdad, responder
a lo que la persona toca y llevarla a WhatsApp con el mensaje ya armado.

**Pedido explícito de Diego (05-11-2026):** nada de página muerta ni genérica, nada de íconos SVG de
relleno. Vivo, con animaciones, realista y bien hecho.

### Diales
| Dial | Valor | Por qué |
|------|-------|---------|
| `DESIGN_VARIANCE` | **7** | Hero a sangre, bloques que se apilan al hacer scroll, cambios de escala entre secciones. Columna única estricta en móvil. |
| `MOTION_INTENSITY` | **7** | La página reacciona: lente térmica en el hero, servicios que se apilan con el scroll, selector que escribe el mensaje en vivo, recorrido del técnico que se dibuja. Todo con motivo y con alternativa para movimiento reducido. |
| `VISUAL_DENSITY` | **4** | Fotos grandes y datos útiles a la vista, con aire para leer de pie. |

### Stack (cultura del estudio sobre el default de la skill)
HTML, CSS y JS vanilla en `sitio/` sobre Cloudflare Workers (igual que Rancho Itahue y Arco), sin paso
de build. Para la coreografía de scroll: **GSAP + ScrollTrigger** autoalojados en `sitio/js/vendor/`,
versión fijada con más de 7 días publicada (confirmar al instalar que la licencia vigente permite uso
comercial sin costo; desde 2025 GSAP se distribuye gratis con todos sus plugins). Lo simple (hover,
revelados, estados) va en CSS + `IntersectionObserver`. Sin smooth-scroll que secuestre la rueda.

---

## 2. Concepto: «del calor de la falla al frío que vuelve»

Toda falla de refrigeración es calor donde no debería haberlo. El sitio cuenta eso visualmente:

- **El calor es la falla**: tonos térmicos (naranjo, ámbar) aparecen donde está el problema.
- **El frío es la solución**: la base del sitio es gris hielo con tinte azul, limpia y precisa.
- **El ámbar es la acción**: el único color de interfaz para lo que se toca (CTA, selección, estado).
- **La mano es la prueba**: fotos de manos, herramientas, manómetros y equipos reales abiertos. Oficio,
  no pose.

**Prohibido:** íconos decorativos (ni uno), ilustraciones SVG, copos de nieve, termómetros caricatura,
degradados celeste, glows, morado en la interfaz, técnicos de stock sonriendo a cámara, «mockups»
de pantallas armados con divs, fotos generadas presentadas como trabajos del cliente.

---

## 2.1 Relación con la skill del proyecto

En `.claude/skills/design-taste-frontend` (tasteskill 2.5, instalada en esta carpeta el 05-11-2026)
ZÉROK cae en el tipo **service** (`site-kind other`). Para ese tipo la skill restringe efectos,
momentos y loops a sitios tech. **Decisión de Diego (05-11-2026): en este sitio las animaciones van y
no se prohíben.** Esa restricción de la skill no aplica aquí; el resto de la skill se usa como guía:

- **Se adopta de la skill:** fotografía como protagonista, fotos de librería solo para detalles, sin
  pies de foto (créditos en el footer), capa de hover (foto 1,03, tarjeta sube 2 px, botones que bajan
  al presionar, subrayados que se dibujan), bordes izquierdo y derecho iguales, cada sección de una a dos
  pantallas de alto, copy primero.
- **Animaciones: mandan §7 de este documento**, no las restricciones por tipo de la skill. Los cinco
  momentos de §7.2 y las animaciones de §7.3 y §7.4 son parte del encargo.
- **No aplica a un cliente real:** la regla 9 de la skill (teléfonos falsos y contactos `.example`) es
  para demos. Aquí van el teléfono, WhatsApp e Instagram reales.
- El verificador de la skill (`consistency.mjs`) es una prueba en navegador: no se corre salvo que
  Diego lo pida.

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

## 6. Imagen: fotografía primero, cero íconos decorativos

El sitio vive de imágenes reales. Los equipos (refrigerador, split, lavadora, calefón, vitrina,
máquina de panadería, auto) se muestran **con fotografía**, nunca con íconos.

### 6.1 Íconos: solo utilitarios
**Tabler Icons** outline 1,5, en un sprite (`sitio/img/iconos.svg`), solo para funciones: teléfono,
WhatsApp, Instagram, reloj, ubicación, flecha, cerrar, menú. Ningún ícono ilustra un servicio, un
paso ni un beneficio. Se copian del paquete oficial; no se dibujan a mano.

### 6.2 Fuentes de imagen, en orden
1. **Fotos y videos reales del cliente** (Instagram + lo que mande por WhatsApp). Son los únicos que
   pueden aparecer en «Trabajos recientes», en el hero definitivo y como prueba de trabajo.
2. **Fotos reales de librería** (Unsplash y Wikimedia Commons) con `scripts/photos.mjs` de la skill del
   proyecto (`.claude/skills/design-taste-frontend`, ver su `references/photos.md`): solo **planos de
   detalle** (manos, herramientas, manómetros, cañerías, compresores, filtros), revisados uno por uno,
   sin marcas legibles ni personas reconocibles, máximo 1 de cada 3 fotos de la página salvo que se use
   su «draft path». Llevan `data-source="library-…"` y el crédito en **una sola línea del footer**.
   Son la primera opción para cubrir lo que falte: es fotografía real, no generada.
3. **Imágenes fotorrealistas generadas**, solo para lo que la librería no tenga (sobre todo la capa
   térmica del hero y las fotos de producto recortadas del selector), con reglas estrictas:
   - **Solo manos y detalles, sin rostros** (no se insinúa que es el equipo de ZÉROK).
   - Sin marcas, logos ni textos legibles en los equipos.
   - Contexto del sur de Chile: casas con madera, luz gris de lluvia en la ventana, una panadería o
     carnicería de barrio con vitrinas, un taller con piso de cemento.
   - Luz natural, color sobrio, grano fino; nada de render 3D brillante ni estética de banco de imágenes.
   - Nunca en «Trabajos recientes». Se reemplazan por fotos reales a medida que lleguen.
   - Se generan fuera de esta sesión (aquí no hay herramienta de imagen): delegando a Codex, como se
     hizo con el logo de C&G, o con el generador que Diego prefiera. Los prompts van en
     `material/prompts.md`.
4. **Si no hay ninguna**, el bloque queda con un slot marcado
   (`<!-- TODO: foto real, 1200x1500 -->`) y esa sección no se publica.

### 6.3 Imágenes necesarias para el lanzamiento
| Uso | Contenido | Formato |
|-----|-----------|---------|
| Hero (capa normal) | Manos abriendo el panel trasero de un refrigerador doméstico en una cocina del sur; compresor y cañerías a la vista | 4:5 móvil / 16:9 escritorio |
| Hero (capa térmica) | La **misma** foto procesada como imagen térmica (paleta «iron»), con el punto caliente en el compresor | Mismo encuadre exacto |
| Selector (7) | Cada equipo recortado sobre fondo neutro, foto de producto sin marca: refrigerador, vitrina/conservador, split, auto (rejilla de ventilación del tablero), lavadora/secadora, calefón, máquina de panadería/cecinas | 1:1, WebP con transparencia |
| Servicios (7) | Una foto de trabajo por servicio (manos + equipo abierto), mismo tratamiento de color | 4:3 |
| Recorrido (4) | Celular con chat en la mano / caja de herramientas en la puerta / manómetros conectados / equipo funcionando con escarcha limpia | 3:4 |
| Casa / Negocio (2) | Cocina de casa / vitrinas de una panadería de barrio | 16:10 |
| Textura de escarcha | Macro real de escarcha para la máscara del wordmark | 2000 px, escala de grises |
| Cierre | Rejilla de un split con aire frío visible, o video corto | 16:9 |

### 6.4 Video
- Pedir al cliente **3 a 5 clips verticales de 10 a 15 s** grabados con el celular durante trabajos
  reales (manos, equipo abierto, manómetro, prueba final). Es el material más vivo y más creíble.
- Uso: fondo del bloque de cierre, «Trabajos recientes» y, si la calidad da, una capa del hero.
- Técnica: MP4 H.264 + WebM, sin audio, ≤ 1,5 MB, `muted playsinline loop`, con `poster`. No se carga
  con `Save-Data`, con movimiento reducido ni en conexión lenta (`navigator.connection`): queda el poster.

### 6.5 Tratamiento común
Mismo ajuste de color en todas las fotos (blancos levemente fríos, negros profundos, saturación
contenida) para que reales y generadas se vean como una sola serie. `.webp`, medidas declaradas,
`loading="lazy"` salvo el hero (`fetchpriority="high"` + preload). Sin etiquetas encima de las fotos
y **sin pies de foto** debajo; los créditos de librería van en una línea del footer. Cada `<img>` lleva
`data-source` (`client`, `library-…`, `generated`) para saber qué reemplazar cuando lleguen fotos reales.

---

## 7. Motion: la página responde

Regla: cada animación comunica algo (jerarquía, historia, respuesta o cambio de estado). Lo que solo
«se ve bonito» no entra.

### 7.1 Tokens
```css
--dur-1: 150ms;   /* hover, press */
--dur-2: 280ms;   /* cambios de estado */
--dur-3: 700ms;   /* entradas */
--dur-4: 1200ms;  /* momento de marca (escarcha) */
--ease-salida: cubic-bezier(.16, 1, .3, 1);
--ease-estado: cubic-bezier(.2, 0, 0, 1);
--resorte: linear(0, .5 7%, .9 15%, 1.06 24%, 1.02 34%, 1); /* rebote corto */
```
Solo se animan `transform`, `opacity`, `clip-path` y variables de máscara. Nunca `top/left/width/height`.

### 7.2 Los cinco momentos firma

**1. Hero: lente térmica.** Foto a sangre de un refrigerador abierto. Encima, la misma foto en
versión térmica, visible solo dentro de un círculo de ~220 px que sigue al puntero con inercia suave
(escritorio, `pointer: fine`). En móvil la lente recorre sola la foto una vez al cargar y se detiene
sobre el compresor caliente; al deslizar el dedo sobre la foto, la lente lo sigue.
*Qué comunica:* «vemos lo que tú no ves; encontramos la falla».
*Implementación:* dos `<img>` apiladas; la de arriba con `mask-image: radial-gradient(...)` ubicada
por variables CSS `--lx/--ly` que se actualizan en `pointermove` dentro de `requestAnimationFrame`.
Con movimiento reducido: lente fija sobre el compresor.
*Pendiente:* preguntar al cliente si usa cámara térmica. Si la usa, se nombra en el copy; si no, es
solo lenguaje visual y el texto no la menciona.

**2. Wordmark con escarcha.** Al cargar, «ZÉROK» se cubre de escarcha de abajo hacia arriba (máscara
con la textura real, 1200 ms, una sola vez) y queda nítido. *Qué comunica:* el nombre es frío.
Con movimiento reducido: aparece directo.

**3. Selector que escribe el mensaje.** Riel horizontal con las fotos de los 7 equipos (scroll-snap
en móvil). Al tocar uno, la foto crece y se fija arriba (transición FLIP de 280 ms) y los síntomas
entran con resorte en cascada (40 ms entre cada uno). Al elegir síntoma, la vista previa muestra
primero «escribiendo…» (600 ms) y luego la burbuja con el mensaje exacto que se enviará; cada cambio
la reescribe con un fundido. *Qué comunica:* respuesta inmediata; lo que eliges es lo que se manda.
La vista previa usa el estilo de ZÉROK, no copia la interfaz de WhatsApp.

**4. Servicios que se apilan.** En escritorio, los 7 servicios son láminas de pantalla completa que
se fijan arriba al hacer scroll (`ScrollTrigger`, `start: "top top"`, `pin: true`); la lámina anterior
se reduce a 0,92 y se oscurece mientras entra la siguiente. Cada lámina: foto grande, nombre del
servicio, «Lo que falla», «Lo que hacemos» y Agendar visita con el servicio escrito en el mensaje.
En móvil se apilan con `position: sticky` y 12 px de desfase por lámina, sin escala (más liviano).
*Qué comunica:* recorrer el oficio completo, uno a uno, en vez de una lista plana.

**5. Recorrido del técnico.** «Cómo trabajamos» tiene una línea que se dibuja con el scroll
(`stroke-dashoffset` con `scrub`) y une los 4 momentos (Escribes, Agendamos, Diagnosticamos,
Reparamos). Cuando la línea llega a cada uno, su foto se descubre con `clip-path` de abajo hacia
arriba. *Qué comunica:* el proceso es corto y ordenado.

### 7.3 Motion de apoyo
| Elemento | Comportamiento | Qué comunica |
|----------|----------------|--------------|
| Chip de horario | «Abierto · cierra en 2 h 14 min», recalculado cada minuto; el dígito que cambia se desliza | Estado real |
| Casa / Negocio | Control segmentado; la foto cambia con un barrido `clip-path` y el texto con fundido | Cambio de estado |
| Mapa de cobertura | Al entrar en pantalla, los sectores confirmados aparecen como marcadores en secuencia (60 ms) sobre un mapa real de Osorno | Alcance |
| Entrada del hero | Rubro, bajada y CTA suben 16 px después de la escarcha, con 80 ms de desfase | Jerarquía |
| Revelados | Titulares de sección suben 24 px y aparecen, una vez | Ritmo de lectura |
| Fotos | Al entrar, des-zoom leve de 1,06 a 1 (700 ms); al pasar el mouse, zoom 1,03 dentro de su marco | Profundidad y respuesta |
| Tarjetas con enlace | Al pasar el mouse suben 2 px; los subrayados de enlaces se dibujan de izquierda a derecha | Que se puede tocar |
| CTA primario | En escritorio, atracción magnética leve (máx. 6 px); `:active` baja 1 px | Respuesta física |
| Barra de contacto móvil | Sube cuando el CTA del hero sale de pantalla y baja cuando vuelve | Evita CTA duplicados a la vista |
| Header | Se compacta de 72 a 60 px y gana fondo sólido al bajar | Separación |
| Cambio de página | View Transitions entre las 5 páginas (`@view-transition { navigation: auto; }`): el header se queda y el contenido se funde | Continuidad |
| Preguntas frecuentes | `<details>`; la respuesta se despliega y el «+» gira a «×» | Abierto/cerrado |

### 7.4 Más animación disponible (se usa donde aporte)
Nada de esto está prohibido; se suma cuando la sección lo pida y se ve bien en el celular:
- **Parallax suave** en fotos a sangre (desplazamiento de 8 a 12 %, con `scrub`), por ejemplo en el
  bloque Casa/Negocio y en el cierre.
- **Franja en movimiento** con los sectores que atiende ZÉROK (una por página, se detiene al pasar el
  mouse o al tocarla), cuando el cliente confirme la lista.
- **Loops cortos** en tarjetas: el vapor frío del split en el cierre, la escarcha que se forma en la
  foto de la vitrina, el manómetro que se estabiliza en la foto del recorrido (videos cortos o
  secuencias, 2,5 a 4 s, se reinician al pasar el mouse).
- **Titulares que entran palabra por palabra** en secciones clave (no en todas).
- **Contador de horario** que corre en vivo (ya en §7.3).
- **Revelado de fotos con máscara** en Servicios y Trabajos (`clip-path` en diagonal o desde abajo).
- **Transiciones compartidas** entre la tarjeta de un servicio en Inicio y su bloque en `/servicios/`
  (View Transitions con `view-transition-name`).

### 7.4.1 Límites técnicos (no son prohibiciones de estilo)
Son para que la animación no rompa el sitio:
- Nunca `window.addEventListener('scroll')`: ScrollTrigger o `IntersectionObserver`.
- Nunca tapar ni retrasar el CTA ni el texto que se está leyendo.
- Sin números inventados en contadores (solo datos reales como el horario).
- Cursor del sistema siempre visible (se puede agregar la lente o un halo, no reemplazar el cursor).
- Todo con su versión de movimiento reducido (§7.5) y fluido en un celular de gama media.

### 7.5 Movimiento reducido y sin JS
- Con `prefers-reduced-motion: reduce` no se cargan GSAP ni los efectos: lente fija, escarcha resuelta,
  servicios como lista normal con fotos, línea del recorrido ya dibujada, sin magnetismo y video
  reemplazado por su poster.
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
}
```
- Sin JS: todo el contenido visible desde el inicio (los estados ocultos los pone el script) y el
  selector se reemplaza por enlaces directos a WhatsApp por equipo.
- Los `ScrollTrigger` se recalculan al cambiar de orientación; ninguna animación deja contenido a medio
  aparecer si el usuario salta con el teclado o con un ancla.

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
Mono, en el header: **«Abierto · cierra en 2 h 14 min»** con un punto ámbar, o **«Cerrado, abre
07:30»** en `--texto-2` sin punto. Se recalcula cada minuto. Es el único punto de color del sitio (estado real). Se calcula con
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

| # | Bloque | Composición | Móvil |
|---|--------|-------------|-------|
| 1 | **Header** 72 px (60 al bajar) | Wordmark, chip de horario, navegación en una línea, «Agendar visita» | Wordmark + chip + menú |
| 2 | **Hero con lente térmica** | Foto a sangre; texto a la izquierda sobre un velo frío que asegura AA. Máx. 4 elementos: H1 (2 niveles), bajada, 2 CTA | Foto arriba (55 % del alto), texto y CTA debajo; todo dentro de 390×844 |
| 3 | **Banda de datos** | Franja en `--superficie-2`, mono: «Lunes a sábado, 07:30 a 21:00» / «Vamos a tu casa o negocio» / «Osorno y sectores de Los Lagos» | 3 filas |
| 4 | **¿Qué está fallando?** | Riel de fotos de equipos + síntomas + vista previa del mensaje | Riel deslizable, luego síntomas, sector, burbuja y botón |
| 5 | **Servicios apilados** | 7 láminas de pantalla completa fijadas con el scroll | Láminas `sticky` sin escala |
| 6 | **Casa / Negocio** | Control segmentado + foto 16:10 con barrido | Igual, foto arriba |
| 7 | **Presentación** | Párrafo grande en columna de 60ch, sin imagen: descanso visual después del movimiento | Igual |
| 8 | **Recorrido del técnico** | Línea dibujada con el scroll que une 4 fotos | Línea vertical a la izquierda |
| 9 | **Precios destacados** *(oculto hasta tener ítems)* | Fila con scroll-snap | Igual |
| 10 | **Trabajos recientes** *(solo fotos y videos reales; oculto sin material)* | Mosaico; los videos corren solo mientras están a la vista | 2 columnas |
| 11 | **Cobertura y horario** | Mapa real de Osorno (imagen estática de OpenStreetMap con atribución) con marcadores animados + horario en mono | Mapa arriba, lista debajo |
| 12 | **Del blog** *(oculto sin entradas)* | Filas editoriales con foto pequeña | Igual |
| 13 | **Preguntas frecuentes** *(solo respuestas confirmadas)* | Acordeón en 65ch | Igual |
| 14 | **Cierre** (inversión única a `--cierre`) | Video real o foto a sangre del aire frío de un split, CTA grande, footer | Apilado |

Eyebrow: solo uno en toda la home, sobre «¿Qué está fallando?» («Diagnóstico por WhatsApp»).
Ritmo: impacto (hero) → dato (banda) → interacción (selector) → inmersión (servicios) → elección
(casa/negocio) → calma (presentación) → historia (recorrido) → prueba (trabajos) → lugar (mapa) → cierre.

### 9.2 Servicios
Índice de anclas fijo bajo el header (chips con scroll horizontal en móvil; el chip de la sección a
la vista se marca en ámbar). Luego un bloque por servicio con la misma ficha (es una página de
consulta: la repetición ayuda a comparar) y su foto grande, que se descubre con `clip-path` al entrar:
título H2, «Qué hacemos», «Fallas que atendemos» (lista corta en 2 columnas) y botón
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
- Ningún ícono decorativo: los íconos solo acompañan funciones (llamar, WhatsApp, horario, ubicación).
- Hero completo dentro de 390×844 sin scroll; header en una línea en escritorio.
- Contraste según §3.2, también sobre fotos (velo); foco visible; teclado en menú, selector y control
  Casa/Negocio.
- Cada animación de §7 tiene su versión con movimiento reducido y su versión sin JS. Las animaciones
  no se recortan por el tipo de sitio: el límite es técnico (§7.4.1), no de estilo.
- Presupuesto (móvil 4G, p75): LCP < 2,5 s, CLS < 0,1, INP < 200 ms.
  HTML+CSS+JS propio < 80 KB comprimidos; GSAP + ScrollTrigger ~45 KB comprimidos, con `defer` y solo
  sin movimiento reducido; fuentes < 90 KB; hero normal ≤ 160 KB y capa térmica ≤ 120 KB (se carga
  después del LCP); video ≤ 1,5 MB y nunca en la carga inicial.
- La medición real (Lighthouse) se hace solo si Diego la pide.
