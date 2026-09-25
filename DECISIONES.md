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
- **Tinte 0,72** donde el fondo es imprevisible: header, barra, desplegables y drawer de filtros, menú móvil, y panel del hero y barra de confianza (van sobre la imagen que suba el comerciante). **Tinte 0,55** donde el fondo está controlado: newsletter, paginación (sobre un orbe) y píldoras de precio (sobre la franja de suelo de arena, 7,56:1).
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

### Colección
- **Un solo juego de filtros.** En escritorio los filtros viven en la barra sticky como desplegables `<details>`, solo uno abierto a la vez, cerrables con Esc o con clic fuera. Por debajo de 990px, el mismo nodo pasa a un `<dialog>` modal, que da foco atrapado y fondo inerte sin código propio. Duplicar el marcado habría enviado cada input dos veces.
- Sin JavaScript, el formulario GET nativo funciona con un botón "Aplicar". Con JavaScript, cada cambio pide la sección a la Section Rendering API, sustituye los resultados con una View Transition (si se permite el movimiento) y sincroniza contadores y estados de los inputs sin reemplazarlos, para que el foco no se pierda. Atrás y adelante del navegador funcionan con `pushState`.
- El elemento sticky es el `<form>`, porque su padre abarca todos los resultados; si fuera la barra, dentro de un padre de su misma altura, nunca se quedaría pegada.
- Presupuesto de blur: header, barra, panel desplegado y píldora en hover suman 4. En el drawer, los paneles pierden su propio cristal para no poner cristal sobre cristal.
- Casillas cuadradas de 1rem con relleno espresso y aro papel, sin iconos. Los chevrons se dibujan con bordes en `currentColor`: el subset de Hanken no incluye flechas y evitamos mezclar tipografías del sistema.
- Paginación: por debajo de 750px se reduce a `‹ 4 / 7 ›`, con el texto accesible "Página 4 de 7", porque nueve botones de 44px no caben en 320px. Va sobre un orbe para no poner cristal sobre papel plano.

## Fase 3 · Home

- Hero: si el campo de imagen está vacío, el fondo es arena con una luz radial de papel. En la fase 4 se generará una imagen por defecto desde la propia escena 3D. Un velo de papel al 62% en la franja superior garantiza la legibilidad del header transparente sobre cualquier imagen.
- Los textos editables (titular, CTA) vienen vacíos y usan el locale. Si el CTA no tiene enlace, va a "todos los productos".
- Barra de confianza: en móvil, "Envío gratuito" ocupa la primera línea y las otras dos van en la segunda, sin iconos. El umbral se escribe en euros enteros y se formatea con la moneda de la tienda.
- Bug corregido de la fase 1: el reset de listas `ul[role=list]` tenía especificidad 0,1,1 y anulaba el padding de las píldoras que son `<ul>` (confianza y paginación). Ahora usa `:where()` y no tiene especificidad.
- **Salas.** Una sola sección `room` con un selector Gato/Perro que fija el tono, la composición, los textos por defecto y, en la fase 5, el juguete. Gato: papel con orbes camel, destacado a la izquierda. Perro: pino con orbes tabaco, composición en espejo. Así las dos salas tienen ritmo propio sin duplicar código.
- En la sala de pino, la ficha del destacado es `.glass--dark.glass--dense`, porque se apoya en parte sobre el marco arena (6,15:1). Los antetítulos de las tarjetas pasan a camel (5,21:1 sobre pino) mediante `--card-eyebrow`.
- La ficha del destacado solapa la franja de suelo de su marco, igual que la píldora en las tarjetas.
- **Header sobre pino:** las secciones con `data-header-tone="dark"` hacen que la píldora del header pase a cristal oscuro denso. Hay dos capas de cristal fijas, se funden solo con `opacity` y el blur no se anima. Sin este cambio, el cristal claro denso sobre pino quedaba gris apagado.
- Selección: 8 productos en 4 columnas (escritorio) o 2 (tablet y móvil), con la misma `product-card` que el catálogo.
- Manifiesto: pino con dos orbes tabaco al 14–20% y un panel `.glass--dark` a 0,55. En el punto más claro del orbe, el texto papel da 11,24:1 y el antetítulo camel 4,88:1. El texto por defecto está en los locales y se puede sustituir desde la sección.
- Contraste medido en la sala oscura: el antetítulo de la ficha pasa de camel a papel. Camel sobre cristal oscuro denso apoyado en arena daba 2,67:1; papel da 6,15:1.

## Fase 4 · Hero 3D

- **Librerías:** `three@0.186.1`, `gsap@3.15.0` (con ScrollTrigger) y `lenis@1.3.26`, empaquetadas con esbuild desde `dev/preview/build-vendor.mjs`. `three.min.js` contiene solo las 30 clases que importa la escena (529 KB, 136 KB con gzip). Son muchas porque `WebGLRenderer` arrastra sus shaders. `vendor-motion.min.js` junta GSAP, ScrollTrigger y Lenis (51 KB con gzip). Las licencias se conservan en los ficheros. Se resuelven con un import map y no hay paso de build en el tema.
- **Carga:** el custom element `<hero-media>` solo importa la escena si se cumplen a la vez: el hero está en pantalla, la página ya cargó y está en reposo (`requestIdleCallback`), hay WebGL2, hay al menos 4 núcleos y no hay reduced-motion. El render se suscribe al ticker central solo mientras el hero es visible y la pestaña está activa. Si se pierde el contexto WebGL, vuelve a verse la imagen fija.
- **Escena:**
  - Luz: sol bajo que entra por un ventanal de cuatro hojas y cae sobre la cama, rebote cálido tenue y un volumen de haz aditivo muy suave.
  - Materiales mate: roble procedural, yeso, lana con relieve de punto.
  - Colores derivados de los tokens CSS en tiempo de ejecución.
  - Las sombras se calculan una sola vez (`shadowMap.autoUpdate = false`), porque la luz y la geometría no se mueven.
  - El muro es alto para que el sol no entre por encima: no hay techo.
  - En pantallas verticales, la cámara se desplaza para centrar ventana y cama.
- **Fallback por defecto:** `hero-fallback-{2400,1600,portrait}.webp` se renderizan desde la misma escena, en el mismo encuadre (15–31 KB), así que el fundido al 3D no salta. Si el comerciante sube una imagen, tiene prioridad.
- **Juguete (polvo y lana):**
  - Principio de Lusion y Active Theory: física que invita a tocar. De Igloo Inc: la luz y la materia cuentan la historia.
  - Lo que cambia para GatYGos: no hay partículas espectaculares ni colores. Es polvo en un haz de tarde, lento, que vuelve a posarse (muelle suave) y que solo se ve dentro de la luz. La lana cede bajo el cursor y recupera su forma con un muelle amortiguado que se pasa un poco, como un cojín de verdad.
  - Para que la hendidura se lea desde una cámara tan baja, también se inclinan las normales.
  - En táctil, un toque levanta el polvo alrededor del dedo sin bloquear el scroll. Con teclado, la escena queda en calma: es el equivalente estático.
- **Rendimiento del juguete:** el raycast va contra un gemelo de baja resolución de la cama (~600 triángulos en vez de ~20 000). En CPU cuesta unos 0,035 ms por fotograma, alrededor de 0,14 ms con 4× de throttling (medido con `dev/preview/bench-toy.mjs`). En este contenedor sin GPU no se pueden medir los fps de GPU (SwiftShader), así que queda como verificación pendiente en dispositivo real.

## Fase 5 · Scroll y juguetes

- **Lenis y ScrollTrigger** van sobre el ticker de GSAP, el único rAF de la página. La curva de Lenis es expo-out y dura 1,15 s. Referencia: darkroom.engineering. Lo que se cambia para GatYGos: una deceleración más larga y sin elasticidad, que es lo que pide un lujo tranquilo. Lenis se detiene cuando hay un `<dialog>` abierto (menú o filtros).
- **`html.motion-ok`** se decide con un script inline antes del primer pintado. Sin esa clase (reduced-motion o editor de temas), todo queda en flujo vertical estático y no se descarga GSAP, Lenis ni Three. El layout con movimiento no causa CLS porque existe desde el primer pintado. En el editor se desactiva porque las secciones se vuelven a renderizar y los pines quedarían huérfanos.
- **Parallax de orbes:** son la capa más profunda y se desplazan como mucho un ±10–18% de su tamaño mientras pasa su sala. Las animaciones con scrub usan `ease: 'none'` a propósito: el easing lo pone el propio scroll de Lenis.
- **Hero:** pin de 100vh. El progreso del scroll mueve la cámara de 0,25 m a 1,6 m y la inclina para mostrar la habitación. Referencia: las páginas de producto de Apple, con una cámara que dirige el scroll. Lo que cambia: no hay cortes ni texto que entre; es una sola subida lenta, del punto de vista de la mascota al de la persona. Sin escena 3D, la imagen fija sube un 4% y escala a 1,06.
- **Salas:** pin y recorrido lateral. La cabecera se queda en su columna, como la cartela de una sala de exposiciones, y los productos pasan por una ventana recortada: de derecha a izquierda en la del gato y al revés en la del perro. Sin GSAP, la ventana tiene scroll horizontal nativo. Si el foco de teclado entra en el carril, la página se desplaza hasta que el elemento queda visible.
- **Juguete de la sala del gato:** una mancha de sol (camel en modo `screen` sobre el papel) sigue al cursor con 1,4 s de retardo, y la pieza destacada se gira hacia ella (hasta 10° en Y y 6° en X). Referencia: Lusion, la luz como material. Lo que cambia: nada brilla ni tiene color propio; solo calienta el papel. En táctil, el sol va al punto que se toca.
- **Juguete de la sala del perro:** el carril se arrastra (el arrastre se traduce en scroll de Lenis), sigue deslizándose con inercia al soltar y rebota con una banda elástica en los extremos. Las piezas se inclinan hasta 6° según la velocidad y se asientan 0,15 s después de parar. Referencia: Bruno Simon, la web como objeto físico. Lo que cambia: solo se inclinan, sin rotaciones ni rebotes exagerados. Un arrastre de más de 6px no abre el producto. En táctil se usa `touch-action: pan-y`, así que el scroll vertical sigue siendo nativo.
- **Revelado:** solo se ocultan las tarjetas que están fuera de pantalla cuando arranca el script; fundido y subida de 16px, 60ms entre tarjetas de cada tanda, ordenadas por posición. Si el JavaScript falla, la rejilla nunca queda vacía, y el primer pliegue no parpadea. También se aplica a los resultados que llegan filtrando (evento `gatygos:results`).
- **Juguete de las tarjetas:** con puntero fino, el marco se inclina hasta ±6° hacia el puntero y un brillo especular recorre el canto superior de la píldora siguiendo la luz. Referencia: las microinteracciones de Linear y Stripe. Lo que cambia: el ángulo es pequeño y no hay reflejo sobre la foto, solo en el cristal. Con teclado, el equivalente estático es el hover plano (elevación y segunda foto). En táctil no existe, y el primer toque abre el producto.
- **Manifiesto:**
  - Gesto: pin de 160% de la altura. En el primer 24% se apaga la luz: una capa de pino sobre el papel (solo `opacity`) y el panel funde de cristal claro a oscuro con dos capas. Después, el titular aparece línea a línea, en papel sobre pino, así que el texto nunca anima su color. Al pasar el 15% del recorrido, la sección anuncia tono oscuro y el header cambia de cristal. Referencia: Aesop, la tipografía como material. Lo que cambia: el scroll primero baja la luz de la sala y luego llegan las palabras.
  - Juguete: las palabras se apartan del puntero en un radio de 140px (hasta 28px, con un leve giro de 4°) y vuelven en 1,6 s. Referencia: la tipografía física de Active Theory. Lo que cambia: es solo un empujón, sin dispersión.
  - Accesibilidad: el texto visible, partido en palabras, lleva `aria-hidden` y sigue siendo seleccionable; los lectores de pantalla leen una copia oculta visualmente.
  - Robustez: el estado escenificado (fondo papel) solo lo activa el JavaScript al crear la línea de tiempo. Sin él, queda la versión estática en pino.
