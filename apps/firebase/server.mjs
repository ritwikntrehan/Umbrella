import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = __filename.slice(0, __filename.lastIndexOf('/'));
const publicDir = join(__dirname, 'hosting');
const port = Number(process.env.PORT ?? 8080);
const host = '0.0.0.0';

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const safePath = (requestPath) => {
  const decoded = decodeURIComponent(requestPath.split('?')[0]);
  const normalized = normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const fullPath = join(publicDir, normalized === '/' ? 'index.html' : normalized);
  return fullPath;
};

const sendFile = (res, filePath) => {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    res.statusCode = 404;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end('Not Found');
    return;
  }

  const type = contentTypes[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
  res.statusCode = 200;
  res.setHeader('content-type', type);
  createReadStream(filePath).pipe(res);
};

const server = createServer((req, res) => {
  const requestPath = req.url ?? '/';
  const filePath = safePath(requestPath);
  const hostingRoot = publicDir.endsWith('/') ? publicDir : `${publicDir}/`;

  if (!filePath.startsWith(hostingRoot)) {
    res.statusCode = 400;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end('Bad Request');
    return;
  }

  sendFile(res, filePath);
});

server.listen(port, host, () => {
  console.log(`Firebase app root listening on http://${host}:${port}`);
});
