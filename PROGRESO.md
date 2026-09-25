# PROGRESO

Estado vivo del tema GatYGos. Basta con este fichero y `DECISIONES.md` para retomar el trabajo sin leer conversaciones anteriores.

**Rama de trabajo:** `claude/adoring-franklin-rzxcn0` (nunca `main` ni otra rama).
**Siguiente paso:** ver [Siguiente paso exacto](#siguiente-paso-exacto).

---

## Cómo retomar
1. `git checkout claude/adoring-franklin-rzxcn0 && git pull`
2. Leer `DECISIONES.md`, `assets/glass.css`, `assets/critical.css`, `snippets/css-variables.liquid`, `layout/theme.liquid` y `dev/muestra-superficies.html`.
3. Preparar el entorno de verificación (ver abajo) y continuar el bucle desde el siguiente paso, sin pedir confirmación entre fases.

### Entorno de verificación (herramientas de desarrollo, no forman parte del tema)
```bash
npm i -g @shopify/cli                       # shopify theme check
cd dev/preview && npm i --no-save liquidjs playwright lighthouse
node render.js                              # renderiza las plantillas con datos de prueba → dev/preview/out/
PORT=4173 node serve.js &                   # sirve out/ + /assets + /media
node shots.js http://localhost:4173/index.html shot/home 1440,768,360 [scrollY] [menu|tab] [fullPage 0|1]
```
- Chromium: `/opt/pw-browsers/chromium` (o la variable `CHROMIUM`). No ejecutar `playwright install`.
- `render.js` usa LiquidJS con filtros y etiquetas de Shopify simulados (`data.js` = tienda de prueba). Es una aproximación: la verdad final es `shopify theme dev`.
- `dev/` no se sube a Shopify: el CLI solo sincroniza `assets/ blocks/ config/ layout/ locales/ sections/ snippets/ templates/`.

---

## Reglas (ley)
- Brief original vigente: paleta exacta, Fraunces 300/400 + Hanken Grotesk 400/500, lujo silencioso sin nada cursi, fotos del proveedor tratadas con `product-media`, sin urgencias falsas ni reseñas inventadas, reduced-motion completo.
- `--tobacco-ink` en texto pequeño. `.glass--dense` (0,72) cuando el fondo es imprevisible. `.glass--dark` solo sobre pino.
- Máximo 4 superficies con blur visibles. Repetidos con `.glass--static`; solo el elemento en hover/foco tiene blur real.
- Nunca se anima `blur`: solo `opacity` y `transform`.
- CSS solo con tokens (cero colores o tamaños sueltos). JS vanilla en módulos pequeños que limpian listeners y observers.
- Una sola instancia de `requestAnimationFrame` (ticker central) y nada corriendo fuera de viewport.
- Juguetes: uno por sección como máximo. Deben funcionar con ratón, táctil y teclado (o tener un equivalente estático digno), no tapar CTA, precio ni navegación, apagarse con reduced-motion y dar 60 fps en portátil y ≥ 45 fps en móvil con CPU 4×. Si no llegan, se simplifican o se eliminan.
- Cada juguete y cada gesto de scroll anota en `DECISIONES.md` de qué referencia toma el principio y qué cambia para ser de GatYGos.

## Bucle por subpaso
1. **Plan:** subpasos pequeños, cada uno cerrable en un commit que funcione, anotados aquí.
2. **Construir** un subpaso.
3. **Verificar con herramientas:**
   - `./dev/check.sh` (theme check con 0 errores y 0 avisos). El commit se encadena detrás: `./dev/check.sh && git commit …`. LiquidJS acepta sintaxis que Shopify rechaza, así que el check es obligatorio.
   - Capturas Playwright a 360, 768 y 1440 de las vistas afectadas, revisadas.
   - Contraste medido si hay texto nuevo sobre cristal.
   - Consola del navegador sin errores.
4. **Auditar contra la rúbrica.** Si algo sale ✗, se corrige y se vuelve al paso 3. Máximo 3 vueltas; después queda anotado como deuda y se sigue.
5. **Commit** `Fase N.x: …` + `git push -u origin claude/adoring-franklin-rzxcn0`. Actualizar este fichero.
6. Siguiente subpaso, sin pedir confirmación.

## Rúbrica (pasa / no pasa)
- **Visual:** la captura aguanta al lado de las referencias. Aire, jerarquía clara y alineación a la retícula de 8px y 12 columnas. Nada genérico ni cursi. Coherente con la fase 1.
- **Movimiento:** un gesto por sección, easing con intención y sin saltos al redimensionar.
- **Juego:** se entiende en menos de 3 segundos, apetece repetirlo y no estorba la compra.
- **Código:** sin código muerto ni duplicado, nombres claros, tokens y módulos pequeños con limpieza de listeners y observers.
- **Accesibilidad:** foco visible, teclado, `aria` correcto, AA medido y reduced-motion completo.
- **Rendimiento:** CLS ≈ 0, `srcset`, Three.js y GSAP solo cuando hacen falta, fps dentro del presupuesto. Lighthouse móvil: Perf ≥ 80, A11y ≥ 95, CLS < 0,1.

## Límites: parar y preguntar antes de
- Añadir dependencias al tema fuera de Three.js, GSAP, ScrollTrigger y Lenis.
- Instalar apps.
- `shopify theme push` o `publish`, o tocar el tema publicado.
- Hacer push a otra rama o a `main`.
- Borrar ficheros de fases anteriores.
- Cambiar tokens o reglas de la fase 1.

## Protección contra cortes
- Tras cada commit el repositorio funciona. No se empieza un subpaso sin haber commiteado el anterior.
- Si el contexto se ha compactado o la conversación es muy larga, no se empieza fase nueva: se cierra el subpaso, commit + push, se actualiza el siguiente paso exacto aquí y se para con un resumen de 5 líneas.

---

## Plan y estado

### Fase 1 · Base ✅
Tokens, cristal, fuentes, header, footer, locales ES/EN, muestra de superficies (commit `61f5a1f`).

### Fase 2 · `product-media`, colección y paginación ✅
- [x] 2.1 Entorno: preview en `dev/preview`, fotos de proveedor simuladas (fondos y proporciones dispares, `gen/run.js`), datos de colección.
- [x] 2.2 `snippets/product-media.liquid` + `snippets/product-card.liquid` + `snippets/price.liquid` + `assets/product-media.css`.
- [x] 2.3 Cabecera editorial de colección (`sections/collection-header.liquid`), `.orbs--fade-end`.
- [x] 2.4 Rejilla, filtros nativos (barra sticky y drawer móvil) y orden (`sections/collection.liquid`, `assets/collection.css`, `assets/collection-filters.js`).
- [x] 2.5 Paginación de 24 en píldora de cristal (`snippets/pagination.liquid`).

### Fase 3 · Home sin animación ✅
- [x] 3.1 Hero: estructura, panel de copy con bloques y fallback estático (`sections/hero.liquid`).
- [x] 3.2 Barra de confianza (`sections/trust-bar.liquid`, `assets/section-hero.css`).
- [x] 3.3 Salas Gato y Perro (una sección `room` reutilizable) + header que pasa a cristal oscuro sobre pino.
- [x] 3.4 Selección de 8 productos (`sections/featured-collection.liquid`).
- [x] 3.5 Manifiesto (`sections/manifesto.liquid`).

### Fase 4 · Hero Three.js ✅
- [x] 4.1 Three mínimo empaquetado en `/assets` (`dev/preview/build-vendor.mjs`) + import map + carga diferida (`assets/hero.js`).
- [x] 4.2 Escena (`assets/hero-scene.js`): suelo, zócalo, ventanal, luz de tarde, cama de lana; pausa fuera de viewport; fallback del mismo encuadre generado desde la escena (`dev/preview/gen/hero-still.js`).
- [x] 4.3 Juguete: motas de polvo en el haz (arrastre, toque) y lana que se hunde con retorno elástico (normales inclinadas, raycast con proxy).

### Fase 5 · Scroll y juguetes ✅
- [x] 5.1 Ticker central + Lenis + ScrollTrigger + parallax de orbes; reduced-motion sin carga (`assets/motion.js`, `html.motion-ok` antes del primer pintado, desactivado en el editor).
- [x] 5.2 Hero pineado: la cámara "crece" de 25 cm a la altura de los ojos, ±4° de parallax (`assets/motion-hero.js`).
- [x] 5.3 Salas pineadas con recorrido horizontal. Juguetes: huellas de gato que persiguen al cursor (gato) y carril arrastrable con inercia (perro) (`assets/motion-rooms.js`).
- [x] 5.4 Reveal escalonado + tilt magnético de tarjetas con brillo del canto (`assets/motion-cards.js`).
- [x] 5.5 Manifiesto pineado (papel → pino, línea a línea) + palabras que se apartan del cursor (`assets/motion-manifesto.js`).

### Fase 6 · Auditoría final ✅
- [x] Lighthouse móvil y escritorio, theme check, capturas de todas las vistas a 3 anchos, recorrido de teclado, reduced-motion, coste de cada juguete, tabla final (abajo).

---

## Siguiente paso exacto
Fases 1–6 terminadas. Solo queda lo que depende de ti (ver **Pendiente de tu OK** y **Qué necesitas hacer tú**) y verificar en `shopify theme dev` con una tienda real.

## Auditoría final (fase 6)

Render local de `dev/preview` (LiquidJS con datos de prueba, servidor sin compresión). Lighthouse con throttling simulado. En Shopify, el CDN comprime con brotli, así que los tiempos reales deberían ser iguales o mejores.

| Comprobación | Resultado |
|---|---|
| `shopify theme check` | 52 ficheros, 0 errores, 0 avisos |
| Lighthouse home · móvil | Rend. **82** · Accesib. **100** · Buenas prácticas **100** · SEO **100** · TBT 70 ms · CLS **0,044** · LCP 4,2 s |
| Lighthouse home · escritorio | 99 · 100 · 100 · 100 · TBT 0 ms · CLS 0,018 · LCP 0,9 s |
| Lighthouse colección · móvil | **83** · 100 · 100 · 100 · TBT 10 ms · CLS **0** · LCP 4,4 s |
| Lighthouse colección · escritorio | 99 · 100 · 100 · 100 · TBT 0 ms · CLS 0 · LCP 0,9 s |
| Teclado, de principio a fin | Home: 46 paradas, 0 problemas (1440, 390 y reduced-motion). Colección: 56 paradas, 0. Menú móvil y drawer de filtros: foco atrapado, Esc cierra y el foco vuelve al botón |
| Reduced-motion | Home y colección a 360, 768 y 1440: sin `motion-ok`, 0 pines, 0 tarjetas ocultas, 0 descargas de Three, GSAP o Lenis |
| Scroll horizontal accidental | 0 px en todas las vistas a 360, 768 y 1440 |
| Contraste en cristal (peor caso) | Ver la tabla de DECISIONES. Todo el texto nuevo medido: píldora 7,56, ficha oscura 6,15, manifiesto 11,24 (papel) y 4,88 (camel) |
| Juguete del hero (CPU) | 0,04 ms por fotograma (0,16 ms a 4×); raycast contra un proxy de ~600 triángulos |
| Huellas de la sala del gato | 0,23 ms por evento a 4× (frame mediano 17 ms) |
| Palabras del manifiesto | 1,43 ms por evento a 4× |
| Tilt de tarjetas | 0,02 ms por evento a 4× |
| Arrastre en la sala del perro | Va por el scroll de Lenis, sin coste propio |
| fps en reposo a 4× (sin GPU) | 60 fps en todas las secciones |
| fps con el juguete activo a 4× (sin GPU) | Manifiesto y tarjetas: 60 fps. Sala del gato: ~56 fps (17,8 ms; antes ~13 fps, resuelto con orbes sin filtro) |

## Qué necesitas hacer tú en Shopify
1. **Fotos:** subirlas tal como llegan del proveedor. `product-media` las normaliza. En fotos con fondo oscuro, marca el metafield `custom.media_blend = false`.
2. **Metafields de producto** (Ajustes › Metafields): `custom.material` (texto de una línea) y `custom.media_blend` (booleano). Para filtrar por material, activa `custom.material` como filtro en Search & Discovery junto a Disponibilidad y Precio.
3. **Menús:** `main-menu` con Perro / Gato / Novedades / Nosotros y `footer` (más un segundo menú opcional). Tradúcelos con Translate & Adapt.
4. **Colecciones:** `gato`, `perro` y `seleccion`, ya enlazadas en `templates/index.json`. Elige el producto destacado de cada sala en el editor.
5. **Políticas** (Ajustes › Políticas): aviso legal, privacidad, términos, envíos y reembolsos, más la URL de la política de cookies en el pie de página. Son obligatorias en España.
6. **Idiomas:** publica EN. Los textos del tema ya están en ES y EN.
7. **Opcional:**
   - Imagen fija del hero. Por defecto se usa una renderizada desde la escena 3D.
   - Redes sociales.
   - Umbral de envío gratuito y días de devolución, en la barra de confianza.

### Plan técnico acordado para las fases 4 y 5 (seguir salvo motivo anotado en DECISIONES)
- **Carga de módulos:** import map en `layout/theme.liquid` con `three`, `gsap`, `gsap/ScrollTrigger` y `lenis`, que apuntan a `asset_url`. Los módulos propios son ES modules en `/assets`, cargados con `<script type="module">`.
- **Three mínimo:** `dev/build-three.mjs` (esbuild con tree-shaking) exporta solo las clases usadas y genera `assets/three.min.js`, que se versiona. El tema no tiene paso de build: el fichero ya viene generado. Fijar la versión de `three` en el script.
- **GSAP, ScrollTrigger y Lenis:** copiar los builds ESM minificados de npm a `assets/` (`gsap.min.js`, `ScrollTrigger.min.js`, `lenis.min.js`) y anotar las versiones en DECISIONES.
- **Ticker central:** `assets/ticker.js` envuelve `gsap.ticker`, que es el único rAF. Lenis se conecta con `gsap.ticker.add(t => lenis.raf(t * 1000))` y `lagSmoothing(0)`. Cada juguete se suscribe o se da de baja según un IntersectionObserver (nada corre fuera de viewport) y según `document.hidden`.
- **Hero 3D:** `assets/hero-scene.js` se importa con `import()` solo si se cumplen a la vez:
  - el hero está en viewport (IntersectionObserver),
  - hay WebGL2,
  - `navigator.hardwareConcurrency >= 4`,
  - no hay `prefers-reduced-motion`.
  El canvas se monta dentro de `.hero__media` (ya existe) encima de la imagen fallback y aparece con un fundido de `opacity` cuando está listo. `pixelRatio` es `min(dpr, 1.75)`.
- **Escena del hero:** suelo de tablas (textura procedural en canvas), zócalo, ventanal con parteluces, luz direccional cálida de tarde con sombras PCF suaves más luz ambiente tenue, y cama de lana en primer plano. Materiales `MeshStandardMaterial` mate. La cámara empieza a 0,25 m del suelo. Expone `setProgress(p)` para la fase 5, en la que la cámara sube a 1,6 m y se inclina. El puntero añade ±4° de parallax.
- **Juguete del hero:** motas de polvo (`Points` con shader) dentro del volumen del haz que el cursor o el dedo empujan con amortiguación y que vuelven a posarse, y lana que se hunde donde pasa el cursor (raycast + uniform de desplazamiento con retorno elástico). Con teclado, equivalente estático digno: la escena queda en calma.
- **Imagen de fallback por defecto:** renderizar la escena a 2400×1500 con Playwright (script en `dev/`) y guardarla como `assets/hero-fallback.jpg` (más un tamaño menor), que `hero.liquid` usa cuando el ajuste de imagen está vacío.
- **Fase 5:**
  - `assets/motion.js`: no carga nada con reduced-motion.
  - Pin del hero ligado a `setProgress`.
  - Salas: pin más recorrido horizontal del contenedor `.room__featured + .room__rail`, solo con movimiento; la maquetación actual es el estado reduced-motion.
  - Reveal: `data-reveal` más `--reveal-index`, con IntersectionObserver y retardo de 60 ms.
  - Manifiesto: pin, fondo de papel a pino, panel de `.glass` a `.glass--dark` fundiendo dos capas, y líneas del titular reveladas una a una.
  - Juguetes: huellas de gato que persiguen al cursor (gato), carril arrastrable con inercia (perro), tilt de tarjetas, palabras que se apartan (manifiesto).
- **Lighthouse (fase 6):** `npm i --no-save lighthouse` en `dev/preview`, `CHROME_PATH=/opt/pw-browsers/chromium`, ejecutado contra `out/index.html` servido en local. Aclarar en la tabla que es el renderizado local, no Shopify.

### Utilidades del entorno de verificación (`dev/preview`)
- `./restart-server.sh` reinicia el servidor con pidfile. No usar `pkill` con patrones que contengan "serve.js": mata la propia shell.
- `shots.js` hace capturas de página, `clipel.js` de un elemento (los elementos fijos pueden salir desplazados en elementos más altos que el viewport; es un artefacto), `hover.js` captura los estados reposo, hover y foco, y `flow.js` prueba el flujo de filtros de la colección.
- `data.js` define las páginas que se renderizan (`index`, `index-en`, `collection`, `collection-en`, `collection-p4`, `collection-filtered`, `cards`, `cards-compact`, `demo`) y la tienda de prueba.
- LiquidJS acepta sintaxis que Shopify rechaza, como filtros en los argumentos de `render`: ejecutar siempre `./dev/check.sh` antes de commitear.

## Deuda abierta
1. ~~Juguete de la sala del gato sin GPU~~: resuelto. Los orbes ya no usan `filter: blur(80px)`; la suavidad va dibujada en el degradado (aprobado por ti). La sala pasa de 77 ms a 17,8 ms por fotograma a 4×.
2. **fps de GPU de la escena 3D:** no se pueden medir en este contenedor (SwiftShader). Verificar en un portátil y un móvil reales.
3. **Referencia lilguy.net:** la bloquea la política de red del entorno. Para revisarla, añade el dominio a los permitidos en los ajustes del entorno.
4. **Render local frente a Shopify:** comprobar en `shopify theme dev` la Section Rendering API de los filtros, el formulario de idioma, las políticas y los metafields reales.

## Pendiente de tu OK
