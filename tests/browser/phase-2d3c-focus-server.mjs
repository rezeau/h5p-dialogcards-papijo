import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const browserDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(browserDir, '..', '..');
const columnRoot = 'C:/Users/josep/OneDrive/Documents/CODEX/papi-jo-h5p-column';
const artifactPath = path.join(browserDir, 'artifacts', 'phase-2d3c-focus-results.json');

const files = new Map([
  ['/', [path.join(browserDir, 'phase-2d3c-focus.html'), 'text/html; charset=utf-8']],
  ['/phase-2d2-runtime.js', [path.join(browserDir, 'phase-2d2-runtime.js'), 'text/javascript; charset=utf-8']],
  ['/phase-2d3c-focus.js', [path.join(browserDir, 'phase-2d3c-focus.js'), 'text/javascript; charset=utf-8']],
  ['/jquery.js', [path.join(projectRoot, 'node_modules/jquery/dist/jquery.js'), 'text/javascript; charset=utf-8']],
  ['/papi.js', [path.join(projectRoot, 'dist/h5p-dialogcards.js'), 'text/javascript; charset=utf-8']],
  ['/papi.css', [path.join(projectRoot, 'dist/h5p-dialogcards.css'), 'text/css; charset=utf-8']],
  ['/column.js', [path.join(columnRoot, 'scripts/h5p-column.js'), 'text/javascript; charset=utf-8']],
  ['/column.css', [path.join(columnRoot, 'styles/h5p-column.css'), 'text/css; charset=utf-8']],
]);

const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  if (url.pathname === '/results' && request.method === 'POST') {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
      fs.writeFileSync(artifactPath, Buffer.concat(chunks));
      response.writeHead(204);
      response.end();
    });
    return;
  }
  const entry = files.get(url.pathname);
  if (!entry) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  response.writeHead(200, { 'content-type': entry[1], 'cache-control': 'no-store' });
  fs.createReadStream(entry[0]).pipe(response);
});

server.listen(8095, '127.0.0.1', () => {
  process.stdout.write('Phase 2D3C focused probe: http://127.0.0.1:8095/\n');
});
