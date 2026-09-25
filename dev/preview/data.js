// Mock Shopify data for the local preview harness (not part of the theme).
const fs = require('fs');
const path = require('path');

const money = (cents) =>
  (cents / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

// --- Images ------------------------------------------------------------------
const MEDIA = path.join(__dirname, 'media');
function jpegSize(file) {
  const b = fs.readFileSync(file);
  for (let i = 2; i < b.length; ) {
    const marker = b[i + 1];
    const len = b.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc2) return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  return { width: 1000, height: 1000 };
}
const image = (name, alt = '') => {
  const file = path.join(MEDIA, name + '.jpg');
  const { width, height } = fs.existsSync(file) ? jpegSize(file) : { width: 1600, height: 1000 };
  return { src: `/media/${name}.jpg`, width, height, aspect_ratio: width / height, alt, __image: true };
};

// --- Products ----------------------------------------------------------------
const P = (handle, title, price, imgs, opts = {}) => ({
  id: handle,
  handle,
  title,
  url: `/products/${handle}`,
  price,
  price_min: price,
  price_varies: !!opts.varies,
  compare_at_price: opts.compare || null,
  available: opts.available !== false,
  featured_image: image(imgs[0]),
  images: imgs.map((n) => image(n)),
  metafields: {
    custom: {
      material: opts.material ? { value: opts.material } : null,
      media_blend: opts.blend === false ? { value: false } : null,
    },
  },
});

const products = [
  P('cama-lana-merino', 'Cama Lana Merino', 18900, ['cama-lana-1', 'cama-lana-2'], { material: 'Lana merino' }),
  P('comedero-travertino', 'Comedero Travertino', 7400, ['comedero-travertino-1', 'comedero-travertino-2'], { material: 'Travertino' }),
  P('cuenco-ceramica-negra', 'Cuenco Cerámica Negra', 4200, ['cuenco-ceramica-negra-1'], { material: 'Gres esmaltado' }),
  P('cesta-ratan', 'Cesta de Ratán', 12900, ['cesta-ratan-1'], { material: 'Ratán natural', compare: 15900 }),
  P('collar-cuero', 'Collar Cuero Curtido', 5800, ['collar-cuero-1'], { material: 'Cuero vegetal' }),
  P('rascador-roble', 'Rascador Roble y Sisal', 16500, ['rascador-roble-1'], { material: 'Roble macizo' }),
  P('manta-lino', 'Manta de Lino Lavado', 6900, ['manta-lino-1'], { material: 'Lino', varies: true }),
  P('comedero-nogal', 'Comedero Elevado Nogal', 11900, ['comedero-nogal-1'], { material: 'Nogal' }),
  P('correa-cuero', 'Correa Cuero Trenzado', 6400, ['correa-cuero-1'], { material: 'Cuero vegetal' }),
  P('cueva-fieltro', 'Cueva de Fieltro', 9800, ['cueva-fieltro-1'], { material: 'Fieltro de lana', blend: false }),
  P('pelotas-fieltro', 'Pelotas de Fieltro', 1900, ['pelotas-fieltro-1'], { material: 'Fieltro de lana' }),
  P('cojin-terciopelo', 'Cojín Terciopelo Pino', 8900, ['cojin-terciopelo-1'], {}),
];
const byHandle = Object.fromEntries(products.map((p) => [p.handle, p]));
const pick = (...h) => h.map((x) => byHandle[x]);

// --- Filters -----------------------------------------------------------------
const base = '/collections/todo';
const value = (label, param, v, count, active = false) => ({
  label, value: v, count, active, param_name: param,
  url_to_add: `${base}?${param}=${encodeURIComponent(v)}`,
  url_to_remove: base,
});
const filters = [
  {
    label: 'Disponibilidad', type: 'list', param_name: 'filter.v.availability',
    values: [value('En stock', 'filter.v.availability', '1', 11), value('Agotado', 'filter.v.availability', '0', 1)],
  },
  {
    label: 'Material', type: 'list', param_name: 'filter.p.m.custom.material',
    values: [
      value('Lana merino', 'filter.p.m.custom.material', 'Lana merino', 1, true),
      value('Travertino', 'filter.p.m.custom.material', 'Travertino', 1),
      value('Cuero vegetal', 'filter.p.m.custom.material', 'Cuero vegetal', 2),
      value('Roble macizo', 'filter.p.m.custom.material', 'Roble macizo', 1),
      value('Fieltro de lana', 'filter.p.m.custom.material', 'Fieltro de lana', 2),
      value('Lino', 'filter.p.m.custom.material', 'Lino', 1),
    ],
  },
  {
    label: 'Precio', type: 'price_range', param_name: 'filter.v.price',
    min_value: { param_name: 'filter.v.price.gte', value: null },
    max_value: { param_name: 'filter.v.price.lte', value: null },
    range_max: 18900, url_to_remove: base,
  },
];
for (const f of filters) f.active_values = (f.values || []).filter((v) => v.active);

const sortOptions = [
  { value: 'manual', name: 'Destacados' },
  { value: 'best-selling', name: 'Más vendidos' },
  { value: 'created-descending', name: 'Novedades' },
  { value: 'price-ascending', name: 'Precio, de menor a mayor' },
  { value: 'price-descending', name: 'Precio, de mayor a menor' },
];

const repeatTo = (arr, n) => Array.from({ length: n }, (_, i) => arr[i % arr.length]);
const collections = {
  todo: {
    handle: 'todo', title: 'Para la casa', url: base,
    description: '<p>Objetos de diseño para perros y gatos, en materiales que envejecen bien: lana, travertino, roble y cuero curtido al vegetal.</p>',
    products: repeatTo(products, 24), all_products_count: 38, products_count: 38,
    filters, sort_options: sortOptions, sort_by: 'manual', default_sort_by: 'manual',
  },
  gato: { handle: 'gato', title: 'Para el gato', url: '/collections/gato', products: pick('cueva-fieltro', 'rascador-roble', 'pelotas-fieltro', 'cuenco-ceramica-negra', 'cojin-terciopelo', 'manta-lino') },
  perro: { handle: 'perro', title: 'Para el perro', url: '/collections/perro', products: pick('comedero-nogal', 'collar-cuero', 'correa-cuero', 'comedero-travertino', 'cesta-ratan', 'manta-lino') },
  seleccion: { handle: 'seleccion', title: 'Selección', url: '/collections/seleccion', products: pick('cama-lana-merino', 'comedero-travertino', 'cesta-ratan', 'cueva-fieltro', 'rascador-roble', 'collar-cuero', 'cojin-terciopelo', 'cuenco-ceramica-negra') },
};
collections.all = collections.todo;

// --- Menus, policies ---------------------------------------------------------
const linklists = {
  'main-menu': { title: 'Menú principal', links: [
    { title: 'Perro', url: '/collections/perro' }, { title: 'Gato', url: '/collections/gato' },
    { title: 'Novedades', url: '/collections/novedades' }, { title: 'Nosotros', url: '/pages/nosotros' },
  ] },
  footer: { title: 'Tienda', links: [
    { title: 'Perro', url: '/collections/perro' }, { title: 'Gato', url: '/collections/gato' },
    { title: 'Novedades', url: '/collections/novedades' }, { title: 'Nosotros', url: '/pages/nosotros' },
  ] },
};
const policies = [
  { title: 'Aviso legal', url: '/policies/legal-notice' },
  { title: 'Política de privacidad', url: '/policies/privacy-policy' },
  { title: 'Términos del servicio', url: '/policies/terms-of-service' },
  { title: 'Política de envío', url: '/policies/shipping-policy' },
  { title: 'Política de reembolso', url: '/policies/refund-policy' },
];

// --- Pagination --------------------------------------------------------------
function paginateState(current, pages, by) {
  const parts = [];
  for (let n = 1; n <= pages; n++) {
    if (n === 1 || n === pages || Math.abs(n - current) <= 1) parts.push({ title: n, url: `${base}?page=${n}`, is_link: n !== current });
    else if (parts[parts.length - 1].title !== '…') parts.push({ title: '…', is_link: false });
  }
  return {
    current_page: current, pages, page_size: by, items: 38, parts,
    previous: current > 1 ? { title: 'Anterior', url: `${base}?page=${current - 1}`, is_link: true } : null,
    next: current < pages ? { title: 'Siguiente', url: `${base}?page=${current + 1}`, is_link: true } : null,
  };
}
let pageState = { current: 1, pages: 2 };

// A filtered state (Material: Lana merino + Fieltro de lana) for the Section Rendering API mock.
function filteredScope() {
  const values = filters[1].values.map((v) => ({ ...v, active: ['Lana merino', 'Fieltro de lana'].includes(v.label) }));
  const material = { ...filters[1], values, active_values: values.filter((v) => v.active) };
  const f = [filters[0], material, filters[2]];
  return { collection: { ...collections.todo, filters: f, products: pick('cama-lana-merino', 'cueva-fieltro', 'pelotas-fieltro'), products_count: 3 } };
}

let formState = {};
module.exports = {
  money,
  linklists,
  collections,
  productByHandle: (h) => byHandle[h] || null,
  image: (v) => (typeof v === 'string' && v.startsWith('media:') ? image(v.slice(6)) : { src: v, width: 1600, height: 1000, alt: '' }),
  imageUrl: (img, o) => {
    const src = img && img.src ? img.src : String(img);
    const out = new String(o.width ? `${src}?width=${o.width}` : src);
    out.__img = img && img.src ? img : null;
    out.__width = o.width;
    return out;
  },
  form: () => ({ 'posted_successfully?': !!formState.success, errors: formState.errors || null, email: '' }),
  setForm: (s) => { formState = s; },
  setPage: (current, pages) => { pageState = { current, pages }; },
  paginate: (by) => paginateState(pageState.current, pageState.pages, by),
  globals: (locale, template) => ({
    shop: {
      name: 'GatYGos', description: 'Objetos de diseño para perros y gatos', policies,
      privacy_policy: policies[1], terms_of_service: policies[2], shipping_policy: policies[3], refund_policy: policies[4],
    },
    localization: {
      available_languages: [{ iso_code: 'es', endonym_name: 'español' }, { iso_code: 'en', endonym_name: 'English' }],
      language: { iso_code: locale },
    },
    cart: { item_count: 2 },
    routes: { root_url: locale === 'es' ? '/' : '/en', cart_url: '/cart', collections_url: '/collections', all_products_collection_url: '/collections/all' },
    request: { locale: { iso_code: locale }, design_mode: false, page_type: template, origin: 'http://localhost', path: '/' },
    settings: { social_instagram_link: 'https://instagram.com/gatygos', social_pinterest_link: 'https://pinterest.com/gatygos' },
    page_title: 'GatYGos', page_description: 'Objetos de diseño para perros y gatos: lana, travertino, roble y cuero.', canonical_url: 'http://localhost/', current_page: 1, template: { name: template },
    linklists, collections,
    collection: template === 'collection' ? collections.todo : undefined,
  }),
  pages: () => [
    { locale: 'es', template: 'demo', out: 'demo.html' },
    { locale: 'es', template: 'cards', out: 'cards.html' },
    { locale: 'es', template: 'cards-compact', out: 'cards-compact.html' },
    { locale: 'es', template: 'collection', out: 'collection.html', before: () => module.exports.setPage(1, 2) },
    { locale: 'en', template: 'collection', out: 'collection-en.html', before: () => module.exports.setPage(1, 2) },
    { locale: 'es', template: 'collection', out: 'collection-p4.html', before: () => module.exports.setPage(4, 7) },
    { locale: 'es', template: 'collection', out: 'collection-filtered.html', before: () => module.exports.setPage(1, 1), scope: filteredScope },
    { locale: 'es', template: 'index', out: 'index.html' },
    { locale: 'en', template: 'index', out: 'index-en.html' },
  ],
};
