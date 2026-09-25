# DECISIONES

Decisiones que el brief no cubre. En cada caso, la opción más sobria.

## Fase 1 · Base, superficies, header y footer

### Base y fuentes
- **Skeleton Theme** copiado tal cual de `Shopify/skeleton-theme@a4f32d3` (equivale a `shopify theme init`). Las secciones fuera de alcance (producto, cesta, blog…) no se tocan.
- **Fuentes autoalojadas** en `/assets` en vez de cargarlas desde Google: evita enviar la IP del visitante a Google (RGPD; hay sentencias en la UE contra Google Fonts remoto), permite hacer preload real y ahorra una conexión.
  - Fraunces se genera a partir de la variable oficial de `google/fonts`: SOFT 0, **WONK 0** (sin las h/m/n inclinadas, que se leen caprichosas), peso 300–400 y eje óptico 9–144 activo. Subset latino (incluye €, ñ, ¿, ¡). 59,7 KB.
  - Hanken Grotesk 400–500. Subset latino. 19,5 KB.
  - La licencia OFL se conserva en los metadatos de cada fichero.
  - Fraunces 300 en titulares, hero y manifiesto; 400 solo en el logotipo, donde el tamaño es menor.

### Color y contraste (WCAG 2.x)
| Par | Ratio | Uso |
|---|---|---|
| espresso / paper | 11,97 | texto |
| espresso / sand | 8,73 | texto en tarjetas |
| tobacco / paper | 4,52 | solo ≥ 24px o decorativo |
| tobacco / sand | 3,30 ✗ | → `--tobacco-ink` |
| `--tobacco-ink #6D4A2F` / sand | 4,62 | eyebrows y texto pequeño en tabaco |
| `--tobacco-ink` / paper | 6,34 | |
| `--ink-muted #574C42` / paper · sand | 6,73 · 4,91 | secundario, **solo sobre plano** |
| paper / pine | 11,99 | salas oscuras |
| paper / tobacco | 4,52 | botón sólido |

- `--tobacco-ink` es el mismo tono y saturación que `--tobacco`, más oscuro (L 38,6 % → 30,6 %).

### Cristal
- **Peor caso calculado** con el tinte sobre el fondo más oscuro posible:
  - Claro 0,55 sobre negro: espresso 3,72 ✗. Sobre pino: 4,66. Sobre orbes en papel: ≥ 10,1.
  - Claro 0,72 (`.glass--dense`) sobre negro: 6,13 ✓.
  - Oscuro 0,55 sobre pino: papel 11,99. Sobre papel: 3,29 ✗, así que `.glass--dark` solo se usa sobre pino.
- **Tinte 0,72** donde el fondo es imprevisible: header, píldoras de precio (el objeto puede ser negro), barra y drawer de filtros y menú móvil. **Tinte 0,55** donde el fondo está controlado: panel del hero (se medirá contra la escena en la fase 6), barra de confianza y newsletter.
- Sobre cristal con fondo imprevisible, el texto siempre va en espresso: el gris apagado cae a 3,44.
- **Presupuesto de 4 superficies con blur**: una rejilla tiene más de 4 píldoras visibles a la vez. Por eso los elementos repetidos usan `.glass--static`, que conserva tinte, canto, reflejo y grano pero no lleva `backdrop-filter`. El blur real (28px) solo aparece en la tarjeta con hover o foco, que es siempre una.
- El canto superior en `.glass--dark` usa papel al 12 % en lugar del blanco al 45 %, que se ve como una línea dura sobre pino.
- `@supports not` comprueba la propiedad con y sin prefijo `-webkit-`; si no, Safari < 18 caería al sólido sin necesidad.
- Orbes de 40–60vw, pero **nunca menores de 22rem**: a 360px, 50vw serían 180px y el blur de 80px los haría desaparecer.

### Header
- Es transparente sobre el hero: el estado inicial lo fija CSS con `:has([data-header-overlay])` para que no haya parpadeo, y un IntersectionObserver lo cambia después. El compactado usa solo `transform`. El cristal aparece por `opacity` y nunca se anima el blur.
- El texto espresso sobre el hero exige que la franja superior de la escena sea clara. La escena se diseñará para cumplirlo en las fases 3–4 y se medirá en la 6.
- El header es fijo, así que a veces pasa sobre papel plano. Se acepta como excepción, porque es la única superficie que recorre toda la página, y lleva tinte 0,72.
- Está a 8px del borde en móvil y a 12px en desktop, para ganar ancho a 360px. El menú completo aparece desde 990px.
- Solo se muestran los enlaces de primer nivel del menú; el brief no pide desplegables.
- "Cesta" y "Menú" van en texto, sin iconos. El contador se oculta si la cesta está vacía. Se quita el acceso a la cuenta, que el header del brief no incluye.
- El selector ES/EN usa botones `submit` con `locale_code` dentro del form `localization`: funciona sin JavaScript.
- El menú móvil es un `<dialog>` nativo con `showModal()`, que da trampa de foco, cierre con Esc y fondo inerte. Deja 8px de margen y 14px de radio, igual que la píldora.

### Footer
- Va sobre papel con dos orbes, y la newsletter es el único panel de cristal.
- Shopify no tiene política de cookies, así que hay un ajuste `cookies_url`; si se deja vacío, el enlace va a la de privacidad. El aviso legal sale de `shop.policies` (legal-notice).
- Las políticas que no estén configuradas no se muestran en la tienda, pero sí aparecen señaladas en el editor.
- Las redes van como enlaces de texto, sin iconos. Se quitan los iconos de pago del Skeleton, que el brief no pide.
- Los textos editables vienen vacíos por defecto y, mientras lo estén, usan la traducción del locale, así que ES/EN funcionan sin configurar nada.

### Accesibilidad
- Foco: el halo papel es un `box-shadow` de 7px bajo el outline, que da papel · tabaco · papel. Se distingue sobre papel, cristal y pino.
- `body { overflow-x: clip }` como red de seguridad contra el scroll horizontal. `clip` no crea contenedor de scroll, así que `sticky` sigue funcionando.

### Muestra de superficies
- `dev/muestra-superficies.html` está fuera de las carpetas del tema, porque una plantilla de página no está entre los ficheros editables, y Shopify CLI no lo sube. Se abre en el navegador sin tienda.

## Fase 2 · Producto y colección

### Entorno de verificación
- `dev/preview/` contiene un renderizador local (LiquidJS con datos de prueba), un servidor estático y scripts de captura con Playwright, para verificar sin tienda. Son herramientas de desarrollo instaladas con `npm i --no-save` y no forman parte del tema: no hay `package.json` y el CLI no sube `dev/`.
- Las "fotos de proveedor" de prueba (`dev/preview/media`) son renders de Three.js con fondos blancos, grises, en degradado y uno oscuro, proporciones de 1:1 a 16:9 y encuadres descentrados, para someter a `product-media` al peor caso real.

### `product-media`
- **Franja de suelo para la píldora.** El marco es 4:5 con un 12% de padding, pero bajo el plinto queda una franja de 72px (56px en tarjetas compactas) donde va la píldora, como la cartela delante de una peana. Así no tapa ni el objeto ni el pedestal, y detrás solo hay arena, el resplandor y la sombra. Con eso el peor caso a tinte 0,55 da 7,56:1 y no hace falta `.glass--dense`.
- El `multiply` va sobre el escenario y no sobre la imagen. El escenario es su propio contexto de apilado (tiene `z-index` y `transform` en hover): aplicado a la imagen, se fundiría contra transparente.
- `brightness(1,06) contrast(1,04)` antes de la fusión: lleva a blanco los fondos casi blancos (#f2f2f2 o degradados suaves) para que desaparezcan en lugar de dejar un rectángulo gris. Cambia muy poco el color del producto.
- La imagen se ancla abajo (`object-position: 50% 100%`) para que el objeto quede lo más cerca posible del plinto. **Límite conocido:** si la foto del proveedor tiene mucho margen inferior, el objeto "flota" sobre el plinto. Se lee como un objeto expuesto, pero conviene recortar fotos con más de un 15% de margen.
- En tarjetas de menos de 240px, una container query reduce la píldora: nombre en una línea con puntos suspensivos y precio debajo. El nombre completo sigue en el nombre accesible del enlace, que usa `aria-labelledby` con título y precio.
- El hover solo existe con `(hover: hover) and (pointer: fine)`, para que en táctil el primer toque abra el producto. El foco de teclado reproduce el hover.
- El precio tachado solo aparece si `compare_at_price > price`, con etiquetas ocultas "Precio de oferta" y "Precio habitual" para lectores de pantalla. Sin insignias de oferta.
