// Static server for the preview harness: rendered pages + theme assets + mock media.
const http = require('http');
const fs = require('fs');
const path = require('path');

const THEME = process.env.THEME || path.resolve(__dirname, '../..');
const OUT = path.join(__dirname, 'out');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json' };
const routes = [
  ['/assets/', THEME + '/assets/'],
  ['/dev/', THEME + '/dev/'],
  ['/media/', __dirname + '/media/'],
  ['/gen/', __dirname + '/gen/'],
  ['/node_modules/', __dirname + '/node_modules/'],
];
const port = +process.env.PORT || 4173;
const { renderPage } = require('./render.js');
const mock = require('./data.js');

// Pages are re-rendered from the theme on every request: edit, save, reload.
async function fresh(name) {
  const page = mock.pages().find((p) => p.out === name);
  if (!page) return;
  if (page.before) page.before();
  await renderPage(page.locale, page.template, page.out, page.scope ? page.scope() : {});
}

http.createServer(async (req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  // Cart API mock: /cart/update.js updates the mock cart and answers with the
  // cart plus the re-rendered page as the requested section.
  if (u === '/cart/update.js' && req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    const { updates = [], sections = [] } = JSON.parse(body || '{}');
    mock.setCart(updates);
    await fresh('cart.html');
    const html = fs.readFileSync(path.join(OUT, 'cart.html'), 'utf8');
    const cart = mock.globals('es', 'cart').cart;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ item_count: cart.item_count, sections: Object.fromEntries(sections.map((id) => [id, html])) }));
  }
  if (u === '/cart/reset') { mock.resetCart(); res.writeHead(302, { Location: '/cart' }); return res.end(); }
  if (u === '/cart') { await fresh('cart.html'); req.url = '/cart.html'; }
  const name = u === '/' ? 'index.html' : u.slice(1);
  if (name.endsWith('.html') && !u.startsWith('/dev/') && !u.startsWith('/gen/')) {
    try { await fresh(name); } catch (e) { res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Error de Liquid:\n' + e.message); }
  }
  const route = routes.find(([prefix]) => u.startsWith(prefix));
  let f = route ? path.join(route[1], u.slice(route[0].length)) : path.join(OUT, u === '/' ? 'index.html' : u === '/cart' ? 'cart.html' : u);
  // Section Rendering API mock: any /collections/* request returns the
  // filtered or unfiltered collection render.
  const own = { '/collections/perro': 'perro.html', '/collections/gato': 'gato.html' }[u];
  if (own && !req.url.includes('filter.')) {
    try { await fresh(own); } catch (e) { res.writeHead(500); return res.end(e.message); }
    f = path.join(OUT, own);
  } else if (u.startsWith('/collections/')) f = path.join(OUT, req.url.includes('filter.') ? 'collection-filtered.html' : 'collection.html');
  fs.readFile(f, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('404 ' + u); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
}).listen(port, () => console.log('serving on', port));
