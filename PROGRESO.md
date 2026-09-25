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
   - `shopify theme check` sin errores.
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

### Fase 2 · `product-media`, colección y paginación
- [x] 2.1 Entorno: preview en `dev/preview`, fotos de proveedor simuladas (fondos y proporciones dispares, `gen/run.js`), datos de colección.
- [ ] 2.2 `snippets/product-media.liquid` + `snippets/product-card.liquid` + `assets/product-media.css`.
- [ ] 2.3 Cabecera editorial de colección (`sections/collection-header.liquid`).
- [ ] 2.4 Rejilla, filtros nativos (barra sticky y drawer móvil) y orden (`sections/collection.liquid`, `assets/collection.css`, `assets/collection-filters.js`).
- [ ] 2.5 Paginación de 24 en píldora de cristal (`snippets/pagination.liquid`).

### Fase 3 · Home sin animación
- [ ] 3.1 Hero: estructura, panel de copy con bloques y fallback estático.
- [ ] 3.2 Barra de confianza.
- [ ] 3.3 Salas Gato y Perro (una sección `room` reutilizable).
- [ ] 3.4 Selección de 8 productos.
- [ ] 3.5 Manifiesto.

### Fase 4 · Hero Three.js
- [ ] 4.1 Three mínimo empaquetado en `/assets` + import map + carga diferida (viewport, WebGL2, ≥ 4 núcleos).
- [ ] 4.2 Escena: suelo, zócalo, ventanal, luz de tarde, cama de lana; pausa fuera de viewport; imagen de fallback del mismo encuadre.
- [ ] 4.3 Juguete: motas de polvo en el haz y lana que se hunde bajo el cursor.

### Fase 5 · Scroll y juguetes
- [ ] 5.1 Ticker central + Lenis + ScrollTrigger + parallax de orbes; reduced-motion sin carga.
- [ ] 5.2 Hero pineado: la cámara "crece" de 25 cm a la altura de los ojos, ±4° de parallax.
- [ ] 5.3 Salas pineadas con recorrido horizontal. Juguetes: sol que sigue al cursor (gato) y carril arrastrable con inercia (perro).
- [ ] 5.4 Reveal escalonado + tilt magnético de tarjetas con brillo del canto.
- [ ] 5.5 Manifiesto pineado (papel → pino, línea a línea) + palabras que se apartan del cursor.

### Fase 6 · Auditoría final
- [ ] Lighthouse móvil y desktop, theme check, capturas de todas las vistas a 3 anchos, recorrido de teclado, reduced-motion, fps de cada juguete, tabla final.

---

## Siguiente paso exacto
Fase 2.2: `snippets/product-media.liquid`.

## Deuda abierta
_Ninguna._

## Pendiente de tu OK
- Borrar ficheros del Skeleton que quedarán sin uso (`sections/hello-world.liquid`, `sections/custom-section.liquid`, `assets/icon-account.svg`, `assets/icon-cart.svg`, `assets/shoppy-x-ray.svg`). No se borran sin permiso; mientras tanto no se referencian.
