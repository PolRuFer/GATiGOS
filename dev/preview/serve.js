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
http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const route = routes.find(([prefix]) => u.startsWith(prefix));
  let f = route ? path.join(route[1], u.slice(route[0].length)) : path.join(OUT, u === '/' ? 'index.html' : u);
  // Section Rendering API mock: any /collections/* request returns the
  // filtered or unfiltered collection render.
  if (u.startsWith('/collections/')) f = path.join(OUT, req.url.includes('filter.') ? 'collection-filtered.html' : 'collection.html');
  fs.readFile(f, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('404 ' + u); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'max-age=3600' });
    res.end(buf);
  });
}).listen(port, () => console.log('serving on', port));
