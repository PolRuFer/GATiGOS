/**
 * GatYGos — hero scene "A la altura de ellos".
 * A warm interior seen from 25 cm above the floor: oak planks, a skirting
 * board, a mullioned window letting in late-afternoon light and a wool bed
 * in the foreground. Matte PBR only, no plastic highlights.
 *
 * Toy: dust motes float in the beam and the pointer stirs them like a slow
 * fluid before they settle back; the wool gives under the pointer with an
 * elastic return. A tap stirs the dust around the tap point.
 *
 * Colours come from the CSS tokens on :root. Rendering is driven by the
 * central ticker; the loader (hero.js) starts and stops it.
 */
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Points,
  Raycaster,
  RepeatWrapping,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { ticker } from '@gatygos/ticker';

const WINDOW = { x0: 0.3, x1: 2.3, y0: 0.35, y1: 2.6, z: -4 };
// The sun enters through the window and lands on the bed.
const LIGHT_FROM = new Vector3(3.2, 5, -9);
const LIGHT_TO = new Vector3(0.9, 0, 0.2);
const LIGHT_DIR = LIGHT_TO.clone().sub(LIGHT_FROM).normalize();
const PARALLAX = MathUtils.degToRad(4);

// Camera path: 25 cm off the floor (the pet's point of view) → eye level.
const VIEW_LOW = { pos: new Vector3(0.1, 0.25, 3.4), look: new Vector3(0.45, 0.5, -4) };
const VIEW_HIGH = { pos: new Vector3(0.35, 1.6, 4.4), look: new Vector3(-0.3, 0.2, -0.4) };

// Three's Color parses CSS strings as sRGB and stores linear values.
const token = (name) => new Color(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
const WHITE = new Color(1, 1, 1);

/* Procedural textures -------------------------------------------------- */

function woodTexture(camel, tobacco, espresso, anisotropy) {
  const size = 1024;
  const planks = 8;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const w = size / planks;
  const css = (c) => `#${c.getHexString()}`;
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  for (let i = 0; i < planks; i++) {
    let y = -rand() * size;
    while (y < size) {
      const length = size * (0.45 + rand() * 0.5);
      const tone = camel.clone().lerp(tobacco, 0.25 + rand() * 0.4);
      ctx.fillStyle = css(tone);
      ctx.fillRect(i * w, y, w, length);
      // Grain: long, faint, slightly wavy strokes.
      ctx.strokeStyle = css(tone.clone().lerp(espresso, 0.35));
      for (let g = 0; g < 14; g++) {
        ctx.globalAlpha = 0.06 + rand() * 0.1;
        ctx.lineWidth = 0.6 + rand() * 1.4;
        const x = i * w + rand() * w;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(x + rand() * 6 - 3, y + length * 0.33, x + rand() * 6 - 3, y + length * 0.66, x + rand() * 4 - 2, y + length);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = css(espresso);
      ctx.fillRect(i * w, y, w, 1.5); // butt joint
      ctx.globalAlpha = 1;
      y += length;
    }
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = css(espresso);
    ctx.fillRect(i * w, 0, 1.5, size); // seam
    ctx.globalAlpha = 1;
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(9, 6);
  texture.anisotropy = anisotropy;
  return texture;
}

function knitTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);
  const cell = 16;
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      for (const side of [-1, 1]) {
        const g = ctx.createLinearGradient(x + cell / 2, y, x + cell / 2 + side * cell / 2, y);
        g.addColorStop(0, '#d0d0d0');
        g.addColorStop(1, '#404040');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x + cell / 2, y + cell);
        ctx.lineTo(x + cell / 2 + (side * cell) / 2, y);
        ctx.lineTo(x + cell / 2 + (side * cell) / 4, y);
        ctx.lineTo(x + cell / 2, y + cell * 0.55);
        ctx.fill();
      }
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(28, 5);
  return texture;
}

/* Scene ---------------------------------------------------------------- */

/**
 * @param {HTMLElement} container - Element the canvas fills
 * @param {{ interactive?: HTMLElement, still?: boolean }} [options]
 */
export function createHeroScene(container, options = {}) {
  const interactive = options.interactive || container;
  const compact = container.clientWidth < 750;
  const colors = {
    paper: token('--paper'),
    sand: token('--sand'),
    camel: token('--camel'),
    tobacco: token('--tobacco'),
    espresso: token('--espresso'),
  };
  // Afternoon light: paper warmed with camel.
  colors.light = colors.paper.clone().lerp(colors.camel, 0.45).lerp(WHITE, 0.25);

  const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!options.still });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const canvas = renderer.domElement;
  canvas.className = 'hero__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  container.append(canvas);

  const scene = new Scene();
  scene.background = colors.paper.clone().lerp(colors.sand, 0.5);
  const camera = new PerspectiveCamera(40, 1, 0.05, 40);
  const disposables = [];
  const keep = (thing) => (disposables.push(thing), thing);

  // Floor
  const floorMaterial = keep(new MeshStandardMaterial({
    map: keep(woodTexture(colors.camel, colors.tobacco, colors.espresso, renderer.capabilities.getMaxAnisotropy())),
    roughness: 0.82,
  }));
  const floor = new Mesh(keep(new PlaneGeometry(14, 12)), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = 1.5;
  floor.receiveShadow = true;
  scene.add(floor);

  // Back wall with a window opening, built from four blocks so the light
  // only enters through the opening and draws its shape on the floor.
  const wallMaterial = keep(new MeshStandardMaterial({ color: colors.paper.clone().lerp(colors.sand, 0.35), roughness: 0.95 }));
  const block = (x0, x1, y0, y1, depth = 0.16, material = wallMaterial) => {
    const mesh = new Mesh(keep(new BoxGeometry(x1 - x0, y1 - y0, depth)), material);
    mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, WINDOW.z);
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  };
  // Tall enough that the low sun never spills over the top (there is no
  // ceiling in view).
  block(-7, WINDOW.x0, 0, 9);
  block(WINDOW.x1, 7, 0, 9);
  block(WINDOW.x0, WINDOW.x1, 0, WINDOW.y0);
  block(WINDOW.x0, WINDOW.x1, WINDOW.y1, 9);

  // Window frame and mullions (paper, slightly lighter than the wall).
  const frameMaterial = keep(new MeshStandardMaterial({ color: colors.paper, roughness: 0.8 }));
  const bar = 0.045;
  block(WINDOW.x0, WINDOW.x0 + bar, WINDOW.y0, WINDOW.y1, 0.2, frameMaterial);
  block(WINDOW.x1 - bar, WINDOW.x1, WINDOW.y0, WINDOW.y1, 0.2, frameMaterial);
  block(WINDOW.x0, WINDOW.x1, WINDOW.y1 - bar, WINDOW.y1, 0.2, frameMaterial);
  block(WINDOW.x0, WINDOW.x1, WINDOW.y0, WINDOW.y0 + bar, 0.2, frameMaterial);
  const midX = (WINDOW.x0 + WINDOW.x1) / 2;
  const midY = WINDOW.y0 + (WINDOW.y1 - WINDOW.y0) * 0.58;
  block(midX - bar / 2, midX + bar / 2, WINDOW.y0, WINDOW.y1, 0.12, frameMaterial);
  block(WINDOW.x0, WINDOW.x1, midY - bar / 2, midY + bar / 2, 0.12, frameMaterial);

  // Skirting board
  const skirting = new Mesh(keep(new BoxGeometry(14, 0.1, 0.025)), frameMaterial);
  skirting.position.set(0, 0.05, WINDOW.z + 0.09);
  skirting.receiveShadow = true;
  scene.add(skirting);

  // Late-afternoon sky behind the glass.
  // Overexposed on purpose: the window reads as a source of light.
  const sky = new Mesh(keep(new PlaneGeometry(8, 6)), keep(new MeshBasicMaterial({ color: colors.light.clone().lerp(WHITE, 0.5), toneMapped: false })));
  sky.position.set(midX, 1.6, WINDOW.z - 1.2);
  scene.add(sky);

  // Light: warm low sun through the window + dim, warm ambient bounce.
  const sun = new DirectionalLight(colors.light, 5.2);
  sun.position.copy(LIGHT_FROM);
  sun.target.position.copy(LIGHT_TO);
  sun.castShadow = true;
  sun.shadow.mapSize.set(compact ? 1024 : 2048, compact ? 1024 : 2048);
  // The frustum covers the whole visible floor: outside it everything would
  // be treated as sunlit.
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 2, far: 24 });
  sun.shadow.radius = 4;
  sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);
  // Bounce: warm sky/ground fill plus a soft frontal fill for the walls.
  scene.add(new HemisphereLight(colors.paper, colors.camel, 1.35));
  const fill = new DirectionalLight(colors.paper, 0.5);
  fill.position.set(-2, 3, 7);
  fill.target.position.set(0.5, 1, -4);
  scene.add(fill, fill.target);

  // Light shaft: a faint additive prism from the opening to the floor.
  const shaft = buildShaft(colors);
  keep(shaft.geometry);
  keep(shaft.material);
  scene.add(shaft);

  // Wool bed (transforms baked into the geometry so the dent is metric).
  const press = { point: new Vector3(0, -10, 0), amount: 0, velocity: 0, target: 0 };
  const woolUniforms = {
    uPressPoint: { value: press.point },
    uPressAmount: { value: 0 },
    uPressRadius: { value: 0.28 },
  };
  const knit = keep(knitTexture());
  const wool = keep(new MeshStandardMaterial({ color: colors.paper.clone().lerp(colors.sand, 0.2), roughness: 1, bumpMap: knit, bumpScale: 0.3 }));
  wool.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, woolUniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uPressPoint;\nuniform float uPressAmount;\nuniform float uPressRadius;')
      // Tilt the normals around the press point so the light draws the dent
      // (0 at the centre and the rim, strongest on the slope).
      .replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
        vec3 gyDelta = (modelMatrix * vec4(position, 1.0)).xyz - uPressPoint;
        float gyT = clamp(length(gyDelta) / uPressRadius, 0.0, 1.0);
        vec3 gyLocal = transpose(mat3(modelMatrix)) * gyDelta;
        objectNormal = normalize(objectNormal - normalize(gyLocal + 1e-5) * sin(gyT * 3.14159) * uPressAmount * 0.9);`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float gyFall = 1.0 - smoothstep(0.0, uPressRadius, length(gyDelta));
        transformed -= normal * gyFall * gyFall * uPressAmount * 0.07;`
      );
  };
  const bed = new Group();
  const rim = keep(new TorusGeometry(0.5, 0.2, 48, 160));
  rim.rotateX(-Math.PI / 2).translate(0, 0.2, 0);
  const cushion = keep(new SphereGeometry(0.44, 72, 36));
  cushion.scale(1, 0.24, 1).translate(0, 0.12, 0);
  for (const geometry of [rim, cushion]) {
    const mesh = new Mesh(geometry, wool);
    mesh.castShadow = mesh.receiveShadow = true;
    bed.add(mesh);
  }
  // In the patch of sun, right of centre, so the copy panel keeps the left.
  bed.position.set(0.95, 0, 0.1);
  bed.rotation.y = 0.4;
  scene.add(bed);

  // Low-poly twin for pointer raycasts (~600 triangles instead of ~20k), so
  // the toy stays cheap on phones. Never rendered.
  const bedProxy = new Group();
  const proxyRim = keep(new TorusGeometry(0.5, 0.2, 10, 24));
  proxyRim.rotateX(-Math.PI / 2).translate(0, 0.2, 0);
  const proxyCushion = keep(new SphereGeometry(0.44, 16, 8));
  proxyCushion.scale(1, 0.24, 1).translate(0, 0.12, 0);
  bedProxy.add(new Mesh(proxyRim), new Mesh(proxyCushion));
  bedProxy.position.copy(bed.position);
  bedProxy.rotation.copy(bed.rotation);
  bedProxy.updateMatrixWorld(true);

  // Dust motes living inside the beam.
  const dust = buildDust(compact ? 220 : 420, colors, renderer.getPixelRatio());
  keep(dust.points.geometry);
  keep(dust.points.material);
  scene.add(dust.points);

  /* Interaction -------------------------------------------------------- */
  const pointer = { ndc: new Vector2(), smooth: new Vector2(), inside: false, world: new Vector3(), lastWorld: new Vector3(), speed: new Vector3() };
  const raycaster = new Raycaster();
  const beamPlane = new Plane(new Vector3(0, 0, 1), 1.2);
  const hits = [];
  const toNdc = (event) => {
    const rect = container.getBoundingClientRect();
    pointer.ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
  };
  const onMove = (event) => {
    toNdc(event);
    pointer.inside = true;
  };
  const onLeave = () => (pointer.inside = false);
  const onDown = (event) => {
    toNdc(event);
    raycaster.setFromCamera(pointer.ndc, camera);
    const at = new Vector3();
    if (raycaster.ray.intersectPlane(beamPlane, at)) dust.burst(at);
  };
  const listeners = new AbortController();
  interactive.addEventListener('pointermove', onMove, { signal: listeners.signal, passive: true });
  interactive.addEventListener('pointerleave', onLeave, { signal: listeners.signal, passive: true });
  interactive.addEventListener('pointerdown', onDown, { signal: listeners.signal, passive: true });

  /* Camera ------------------------------------------------------------- */
  let progress = 0;
  let eased = 0;
  // Portrait screens frame the window and the bed, which sit right of centre.
  let shiftX = 0;
  const pos = new Vector3();
  const look = new Vector3();
  const placeCamera = () => {
    const e = eased * eased * (3 - 2 * eased);
    pos.lerpVectors(VIEW_LOW.pos, VIEW_HIGH.pos, e);
    look.lerpVectors(VIEW_LOW.look, VIEW_HIGH.look, e);
    pos.x += shiftX;
    look.x += shiftX;
    camera.position.copy(pos);
    camera.lookAt(look);
    camera.rotateY(-pointer.smooth.x * PARALLAX);
    camera.rotateX(pointer.smooth.y * PARALLAX * 0.6);
  };

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = container;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 1 ? 56 : 40;
    shiftX = camera.aspect < 1 ? 0.75 : 0;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  /* Frame -------------------------------------------------------------- */
  let ready = false;
  const frame = (time = 0, deltaMs = 16.7) => {
    const dt = Math.min(deltaMs, 50) / 16.7;
    eased += (progress - eased) * Math.min(1, 0.12 * dt);
    pointer.smooth.lerp(pointer.inside ? pointer.ndc : pointer.smooth.clone().multiplyScalar(0.96), Math.min(1, 0.06 * dt));
    placeCamera();

    // Pointer in the world: the beam plane for dust, the bed for the wool.
    raycaster.setFromCamera(pointer.ndc, camera);
    if (pointer.inside && raycaster.ray.intersectPlane(beamPlane, pointer.world)) {
      pointer.speed.subVectors(pointer.world, pointer.lastWorld).clampLength(0, 0.3);
      pointer.lastWorld.copy(pointer.world);
    } else {
      pointer.speed.multiplyScalar(0.8);
    }
    dust.update(time, dt, pointer.inside ? raycaster.ray : null, pointer.speed);

    hits.length = 0;
    if (pointer.inside) raycaster.intersectObject(bedProxy, true, hits);
    press.target = hits.length ? 1 : 0;
    if (hits.length) press.point.lerp(hits[0].point, press.amount < 0.05 ? 1 : 0.35);
    // Damped spring: the wool gives, then springs back past rest and settles.
    press.velocity += (press.target - press.amount) * 0.1 * dt;
    press.velocity *= Math.pow(0.8, dt);
    press.amount += press.velocity * dt;
    woolUniforms.uPressAmount.value = press.amount;

    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
      canvas.classList.add('is-ready');
    }
  };

  renderer.shadowMap.needsUpdate = true;

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    api.stop();
    canvas.classList.remove('is-ready');
  }, { signal: listeners.signal });

  const api = {
    canvas,
    start: () => ticker.add(frame),
    stop: () => ticker.remove(frame),
    /** @param {number} value - 0 = pet's eye level, 1 = standing height */
    setProgress: (value) => (progress = MathUtils.clamp(value, 0, 1)),
    /** Renders one settled frame (used to export the static fallback). */
    renderStill: () => {
      eased = progress;
      pointer.smooth.set(0, 0);
      frame();
      return canvas;
    },
    dispose: () => {
      api.stop();
      listeners.abort();
      resizeObserver.disconnect();
      disposables.forEach((thing) => thing.dispose());
      renderer.dispose();
      canvas.remove();
    },
  };
  return api;
}

/* Light shaft ------------------------------------------------------------ */

function buildShaft(colors) {
  // Four window corners and their landing points on the floor.
  const corners = [
    [WINDOW.x0, WINDOW.y0],
    [WINDOW.x1, WINDOW.y0],
    [WINDOW.x1, WINDOW.y1],
    [WINDOW.x0, WINDOW.y1],
  ].map(([x, y]) => new Vector3(x, y, WINDOW.z + 0.1));
  const land = corners.map((c) => c.clone().addScaledVector(LIGHT_DIR, (c.y - 0.01) / -LIGHT_DIR.y));
  const positions = [];
  const along = [];
  for (let i = 0; i < 4; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % 4];
    const c = land[(i + 1) % 4];
    const d = land[i];
    positions.push(...a.toArray(), ...b.toArray(), ...c.toArray(), ...a.toArray(), ...c.toArray(), ...d.toArray());
    along.push(0, 0, 1, 0, 1, 1);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('aAlong', new BufferAttribute(new Float32Array(along), 1));
  const material = new ShaderMaterial({
    uniforms: { uColor: { value: colors.light } },
    vertexShader: `attribute float aAlong; varying float vAlong;
      void main() { vAlong = aAlong; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uColor; varying float vAlong;
      void main() { float a = 0.11 * (1.0 - vAlong) * smoothstep(0.0, 0.15, vAlong + 0.02); gl_FragColor = vec4(uColor * a, a); }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
  });
  return new Mesh(geometry, material);
}

/* Dust ------------------------------------------------------------------- */

function buildDust(count, colors, pixelRatio) {
  const home = new Float32Array(count * 3);
  const position = new Float32Array(count * 3);
  const velocity = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const p = new Vector3();
  for (let i = 0; i < count; i++) {
    const x = MathUtils.lerp(WINDOW.x0 + 0.1, WINDOW.x1 - 0.1, Math.random());
    const y = MathUtils.lerp(WINDOW.y0 + 0.1, WINDOW.y1 - 0.1, Math.random());
    const reach = (y - 0.06) / -LIGHT_DIR.y;
    // Inside the room only: from 40 cm past the glass down to the floor.
    p.set(x, y, WINDOW.z + 0.1).addScaledVector(LIGHT_DIR, MathUtils.lerp(0.4, reach, Math.random()));
    home.set([p.x, p.y, p.z], i * 3);
    position.set([p.x, p.y, p.z], i * 3);
    seed[i] = Math.random();
  }
  const geometry = new BufferGeometry();
  const positionAttribute = new BufferAttribute(position, 3);
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('aSeed', new BufferAttribute(seed, 1));
  const material = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: 24 * pixelRatio },
      uColor: { value: colors.light.clone().lerp(WHITE, 0.3) },
    },
    vertexShader: `attribute float aSeed; uniform float uTime; uniform float uSize; varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        vAlpha = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (0.4 + aSeed) + aSeed * 40.0));
        gl_PointSize = uSize * (0.35 + aSeed * 0.65) / -mv.z;
      }`,
    fragmentShader: `uniform vec3 uColor; varying float vAlpha;
      void main() {
        float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)) * vAlpha;
        gl_FragColor = vec4(uColor * a, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;

  const toRay = new Vector3();
  const closest = new Vector3();
  const burstAt = new Vector3();
  let burst = 0;

  return {
    points,
    burst(at) {
      burstAt.copy(at);
      burst = 1;
    },
    update(time, dt, ray, speed) {
      material.uniforms.uTime.value = time;
      const radius = 0.4;
      for (let i = 0; i < count; i++) {
        const k = i * 3;
        const s = seed[i];
        // Slow drift around home, then a soft spring back to it.
        const hx = home[k] + Math.sin(time * 0.2 + s * 30) * 0.05;
        const hy = home[k + 1] + Math.sin(time * 0.15 + s * 50) * 0.06;
        const hz = home[k + 2] + Math.cos(time * 0.18 + s * 20) * 0.05;
        velocity[k] += (hx - position[k]) * 0.0025 * dt;
        velocity[k + 1] += (hy - position[k + 1]) * 0.0025 * dt;
        velocity[k + 2] += (hz - position[k + 2]) * 0.0025 * dt;

        if (ray) {
          toRay.set(position[k], position[k + 1], position[k + 2]);
          ray.closestPointToPoint(toRay, closest);
          const d = toRay.distanceTo(closest);
          if (d < radius) {
            const f = (1 - d / radius) ** 2;
            // Carried along with the pointer, plus a gentle outward push.
            velocity[k] += (speed.x * 0.35 + (toRay.x - closest.x) * 0.01) * f * dt;
            velocity[k + 1] += (speed.y * 0.35 + (toRay.y - closest.y) * 0.01) * f * dt;
            velocity[k + 2] += (speed.z * 0.35 + (toRay.z - closest.z) * 0.01) * f * dt;
          }
        }
        if (burst > 0) {
          const dx = position[k] - burstAt.x;
          const dy = position[k + 1] - burstAt.y;
          const dz = position[k + 2] - burstAt.z;
          const d = Math.hypot(dx, dy, dz) || 1;
          if (d < 0.8) {
            const f = (1 - d / 0.8) * 0.02 * burst;
            velocity[k] += (dx / d) * f;
            velocity[k + 1] += (dy / d) * f;
            velocity[k + 2] += (dz / d) * f;
          }
        }
        const damping = Math.pow(0.94, dt);
        velocity[k] *= damping;
        velocity[k + 1] *= damping;
        velocity[k + 2] *= damping;
        position[k] += velocity[k] * dt;
        position[k + 1] = Math.max(0.02, position[k + 1] + velocity[k + 1] * dt);
        position[k + 2] += velocity[k + 2] * dt;
      }
      burst = 0;
      positionAttribute.needsUpdate = true;
    },
  };
}
