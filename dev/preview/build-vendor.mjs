// Builds the vendored libraries in /assets (the theme itself has no build step).
//   cd dev/preview && npm i --no-save esbuild three@0.186.1 gsap@3.15.0 lenis@1.3.26
//   node build-vendor.mjs
// - assets/three.min.js: only the Three.js classes imported by assets/hero-scene.js.
// - assets/vendor-motion.min.js: GSAP core + ScrollTrigger + Lenis as one ES module.
import { build } from 'esbuild';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const assets = path.resolve(here, '../../assets');
const common = { bundle: true, format: 'esm', minify: true, target: 'es2020', legalComments: 'inline', logLevel: 'warning' };

const scene = readFileSync(path.join(assets, 'hero-scene.js'), 'utf8');
const names = scene
  .match(/import\s*\{([^}]+)\}\s*from\s*'three'/)[1]
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);

await build({
  ...common,
  stdin: { contents: `export { ${names.join(', ')} } from 'three';`, resolveDir: here },
  outfile: path.join(assets, 'three.min.js'),
});

await build({
  ...common,
  stdin: {
    contents: "export { gsap } from 'gsap';\nexport { ScrollTrigger } from 'gsap/ScrollTrigger';\nexport { default as Lenis } from 'lenis';",
    resolveDir: here,
  },
  outfile: path.join(assets, 'vendor-motion.min.js'),
});

for (const file of ['three.min.js', 'vendor-motion.min.js']) {
  console.log(file, (statSync(path.join(assets, file)).size / 1024).toFixed(1), 'KB');
}
console.log('three exports:', names.length);
