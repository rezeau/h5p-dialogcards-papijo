import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const browserDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(browserDir, '..', '..');
const columnRoot = 'C:/Users/josep/OneDrive/Documents/CODEX/papi-jo-h5p-column';
const h5pRoot = 'C:/my_first_h5p_environment/libraries';
const artifactPath = path.join(browserDir, 'artifacts', 'phase-2d2-results.json');

const files = new Map([
  ['/', [path.join(browserDir, 'phase-2d2.html'), 'text/html; charset=utf-8']],
  ['/phase-2d2-runtime.js', [path.join(browserDir, 'phase-2d2-runtime.js'), 'text/javascript; charset=utf-8']],
  ['/phase-2d2-runner.js', [path.join(browserDir, 'phase-2d2-runner.js'), 'text/javascript; charset=utf-8']],
  ['/jquery.js', [path.join(projectRoot, 'node_modules/jquery/dist/jquery.js'), 'text/javascript; charset=utf-8']],
  ['/papi.js', [path.join(projectRoot, 'dist/h5p-dialogcards.js'), 'text/javascript; charset=utf-8']],
  ['/papi.css', [path.join(projectRoot, 'dist/h5p-dialogcards.css'), 'text/css; charset=utf-8']],
  ['/column.js', [path.join(columnRoot, 'scripts/h5p-column.js'), 'text/javascript; charset=utf-8']],
  ['/column.css', [path.join(columnRoot, 'styles/h5p-column.css'), 'text/css; charset=utf-8']],
  ['/official.js', [path.join(h5pRoot, 'H5P.Dialogcards-1.9/dist/h5p-dialogcards.js'), 'text/javascript; charset=utf-8']],
  ['/official.css', [path.join(h5pRoot, 'H5P.Dialogcards-1.9/dist/h5p-dialogcards.css'), 'text/css; charset=utf-8']],
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
  if (url.pathname === '/slow-image.svg') {
    setTimeout(() => {
      response.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'no-store' });
      response.end('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#1768c4"/><text x="32" y="190" fill="white" font-size="42">delayed image</text></svg>');
    }, 350);
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

server.listen(8092, '127.0.0.1', () => {
  process.stdout.write('Phase 2D2 browser probe: http://127.0.0.1:8092/\n');
});
