// Local preview harness: renders the Shopify theme with LiquidJS + mock data.
// Not part of the theme. Usage: node render.js [locale] ; serves via serve.js
const fs = require('fs');
const path = require('path');
const { Liquid, Tag, Value, Hash } = require('liquidjs');

const THEME = process.env.THEME || path.resolve(__dirname, '../..');
const OUT = path.join(__dirname, 'out');
const EXTRA_SECTIONS = path.join(__dirname, 'sections');
const mock = require('./data.js');

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/,(\s*[}\]])/g, '$1');
const readJSON = (p) => JSON.parse(stripComments(fs.readFileSync(p, 'utf8')));

function makeEngine(locale, globals = {}) {
  const dict = readJSON(path.join(THEME, 'locales', locale === 'es' ? 'es.default.json' : `${locale}.json`));
  const engine = new Liquid({
    root: [path.join(THEME, 'snippets')],
    extname: '.liquid',
    dynamicPartials: true,
    lenientIf: true,
    globals,
  });

  const lookup = (key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict);
  engine.registerFilter('t', function (key, ...args) {
    let v = lookup(key);
    const params = {};
    for (const a of args) if (Array.isArray(a)) params[a[0]] = a[1];
    if (v && typeof v === 'object' && 'count' in params) v = params.count === 1 ? v.one : v.other;
    if (v == null) return `translation missing: ${locale}.${key}`;
    return String(v).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (params[k] ?? ''));
  });
  const asset = (n) => `/assets/${n}`;
  engine.registerFilter('asset_url', asset);
  engine.registerFilter('stylesheet_tag', (u, ...a) => `<link href="${u}" rel="stylesheet" type="text/css" media="all">`);
  engine.registerFilter('script_tag', (u) => `<script src="${u}" defer></script>`);
  engine.registerFilter('preload_tag', (u, ...args) => {
    const attrs = args.filter(Array.isArray).map(([k, v]) => `${k}="${v}"`).join(' ');
    return `<link href="${u}" rel="preload" ${attrs}>`;
  });
  engine.registerFilter('inline_asset_content', (n) => fs.readFileSync(path.join(THEME, 'assets', n), 'utf8'));
  engine.registerFilter('link_to', (t, u) => `<a href="${u}">${t}</a>`);
  engine.registerFilter('money', (c) => mock.money(c));
  engine.registerFilter('money_with_currency', (c) => mock.money(c) + ' EUR');
  engine.registerFilter('money_without_currency', (c) => (c / 100).toFixed(2).replace('.', ','));
  engine.registerFilter('handleize', (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  engine.registerFilter('json', (v) => JSON.stringify(v));
  engine.registerFilter('structured_data', () => '{}');
  engine.registerFilter('image_url', (img, ...args) => mock.imageUrl(img, Object.fromEntries(args.filter(Array.isArray))));
  // Mirrors Shopify's image_tag: width/height from the source image, srcset from `widths`.
  engine.registerFilter('image_tag', (url, ...args) => {
    const o = Object.fromEntries(args.filter(Array.isArray));
    const img = url && url.__img;
    const base = String(url).split('?')[0];
    const attrs = [];
    if (img) {
      const w = Math.min(url.__width || img.width, img.width);
      attrs.push(`width="${w}"`, `height="${Math.round(w / img.aspect_ratio)}"`);
      const widths = String(o.widths || '').split(',').map((x) => +x.trim()).filter((x) => x && x <= img.width);
      if (widths.length) attrs.push(`srcset="${widths.map((x) => `${base}?width=${x} ${x}w`).join(', ')}"`);
    }
    for (const [k, v] of Object.entries(o)) {
      if (['widths', 'preload'].includes(k) || v === false || v == null || v === '') continue;
      attrs.push(v === true ? k : `${k}="${String(v).replace(/"/g, '&quot;')}"`);
    }
    if (!('alt' in o)) attrs.push(`alt="${img && img.alt ? img.alt : ''}"`);
    return `<img src="${url}" ${attrs.join(' ')}>`;
  });
  engine.registerFilter('money_without_trailing_zeros', (c) => mock.money(c).replace(',00', ''));
  engine.registerFilter('url_param_escape', (s) => encodeURIComponent(s));
  engine.registerFilter('placeholder_svg_tag', (name, cls) => `<svg class="${cls || ''}" viewBox="0 0 525 525" xmlns="http://www.w3.org/2000/svg"><rect width="525" height="525" fill="#cbb89f"/></svg>`);
  engine.registerFilter('payment_type_svg_tag', () => '');
  engine.registerFilter('font_face', () => '');
  engine.registerFilter('default_pagination', () => '');
  engine.registerFilter('within', (u) => u);
  engine.registerFilter('escape_once', (s) => s);

  // Tags that Shopify understands and LiquidJS does not.
  const swallow = (name) =>
    engine.registerTag(name, class extends Tag {
      constructor(token, remainTokens, liquid) {
        super(token, remainTokens, liquid);
        this.raw = '';
        while (remainTokens.length) {
          const t = remainTokens.shift();
          if (t.name === 'end' + name) return;
          this.raw += t.getText();
        }
      }
      *render(ctx) {
        if (name === 'schema') ctx.environments.__schema = this.raw;
        return '';
      }
    });
  ['schema', 'stylesheet', 'javascript', 'doc'].forEach(swallow);

  engine.registerTag('style', class extends Tag {
    constructor(token, remainTokens, liquid) {
      super(token, remainTokens, liquid);
      this.tpls = [];
      const stream = liquid.parser.parseStream(remainTokens).on('tag:endstyle', () => stream.stop()).on('template', (t) => this.tpls.push(t)).on('end', () => { throw new Error('tag style not closed'); });
      stream.start();
    }
    *render(ctx, emitter) {
      emitter.write('<style>');
      yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
      emitter.write('</style>');
    }
  });

  engine.registerTag('form', class extends Tag {
    constructor(token, remainTokens, liquid) {
      super(token, remainTokens, liquid);
      const m = token.args.match(/^\s*'([^']+)'(?:\s*,\s*(.*))?$/);
      this.type = m[1];
      this.hash = new Hash(m[2] || '');
      this.tpls = [];
      const stream = liquid.parser.parseStream(remainTokens).on('tag:endform', () => stream.stop()).on('template', (t) => this.tpls.push(t)).on('end', () => { throw new Error('form not closed'); });
      stream.start();
    }
    *render(ctx, emitter) {
      const h = yield this.hash.render(ctx);
      const actions = { localization: '/localization', customer: '/contact#' + (h.id || '') };
      emitter.write(`<form method="post" action="${actions[this.type] || '/'}" id="${h.id || ''}" class="${h.class || ''}" accept-charset="UTF-8"><input type="hidden" name="form_type" value="${this.type}"><input type="hidden" name="utf8" value="✓">`);
      if (this.type === 'localization') emitter.write('<input type="hidden" name="_method" value="put"><input type="hidden" name="return_to" value="/">');
      ctx.push({ form: mock.form(this.type, h.id) });
      yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
      ctx.pop();
      emitter.write('</form>');
    }
  });

  engine.registerTag('paginate', class extends Tag {
    constructor(token, remainTokens, liquid) {
      super(token, remainTokens, liquid);
      const m = token.args.match(/^\s*([\w.]+)\s+by\s+(\S+)/);
      this.expr = m[1];
      this.by = m[2];
      this.tpls = [];
      const stream = liquid.parser.parseStream(remainTokens).on('tag:endpaginate', () => stream.stop()).on('template', (t) => this.tpls.push(t)).on('end', () => { throw new Error('paginate not closed'); });
      stream.start();
    }
    *render(ctx, emitter) {
      const by = Number(yield new Value(this.by, this.liquid).value(ctx));
      ctx.push({ paginate: mock.paginate(by) });
      yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
      ctx.pop();
    }
  });

  engine.registerTag('sections', class extends Tag {
    constructor(token, remainTokens, liquid) {
      super(token, remainTokens, liquid);
      this.group = token.args.trim().replace(/['"]/g, '');
    }
    *render(ctx, emitter) {
      const group = readJSON(path.join(THEME, 'sections', `${this.group}.json`));
      for (const id of group.order) {
        const html = yield renderSection(engine, ctx.getAll(), group.sections[id], `sections--${this.group}__${id}`, `shopify-section-group-${this.group}`);
        emitter.write(html);
      }
    }
  });

  return engine;
}

function sectionFile(type) {
  const extra = path.join(EXTRA_SECTIONS, `${type}.liquid`);
  return fs.existsSync(extra) ? extra : path.join(THEME, 'sections', `${type}.liquid`);
}

function schemaOf(src) {
  const m = src.match(/{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/);
  return m ? JSON.parse(m[1]) : {};
}

function resolveSetting(def, value) {
  if (value === undefined) value = def.default;
  switch (def.type) {
    case 'link_list': return mock.linklists[value] || { links: [], title: '' };
    case 'collection': return mock.collections[value] || null;
    case 'image_picker': return value ? mock.image(value) : null;
    case 'product': return mock.productByHandle(value) || null;
    default: return value === undefined ? (def.type === 'checkbox' ? false : '') : value;
  }
}

async function renderSection(engine, scope, data, id, extraClass = '') {
  const src = fs.readFileSync(sectionFile(data.type), 'utf8');
  const schema = schemaOf(src);
  const settings = {};
  for (const def of schema.settings || []) if (def.id) settings[def.id] = resolveSetting(def, (data.settings || {})[def.id]);
  const blocks = (data.block_order || Object.keys(data.blocks || {})).map((bid) => {
    const b = data.blocks[bid];
    const bdef = (schema.blocks || []).find((x) => x.type === b.type) || { settings: [] };
    const bs = {};
    for (const def of bdef.settings || []) if (def.id) bs[def.id] = resolveSetting(def, (b.settings || {})[def.id]);
    return { id: bid, type: b.type, settings: bs, shopify_attributes: '' };
  });
  const section = { id, settings, blocks };
  const html = await engine.parseAndRender(src, { ...scope, section });
  return `<div id="shopify-section-${id}" class="shopify-section ${extraClass} ${schema.class || ''}">${html}</div>`;
}

async function renderPage(locale, templateName, outName, pageScope = {}) {
  const scope = { ...mock.globals(locale, templateName), ...pageScope };
  const engine = makeEngine(locale, scope);
  let content;
  const extraTpl = path.join(__dirname, 'templates', `${templateName}.json`);
  const tplPath = fs.existsSync(extraTpl) ? extraTpl : path.join(THEME, 'templates', `${templateName}.json`);
  const tpl = readJSON(tplPath);
  const parts = [];
  for (const id of tpl.order) {
    if (tpl.sections[id].disabled) continue;
    parts.push(await renderSection(engine, scope, tpl.sections[id], `template--1__${id}`));
  }
  content = parts.join('\n');
  const layout = fs.readFileSync(path.join(THEME, 'layout', 'theme.liquid'), 'utf8');
  const html = await engine.parseAndRender(layout, { ...scope, content_for_layout: content, content_for_header: '' });
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, outName), html);
  return path.join(OUT, outName);
}

module.exports = { renderPage };

if (require.main === module) {
  (async () => {
    const pages = mock.pages();
    for (const p of pages) {
      if (p.before) p.before();
      const f = await renderPage(p.locale, p.template, p.out, p.scope ? p.scope() : {});
      console.log('rendered', f);
    }
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
