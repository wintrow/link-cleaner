import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractText } from './lib/extract.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, 'public');
const PORT = process.env.PORT || 3456;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function serveStatic(req, res) {
  const reqPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const filePath = path.join(PUBLIC, reqPath);
  const resolved = path.resolve(filePath);

  if (!resolved.startsWith(PUBLIC)) {
    res.writeHead(403);
    res.end();
    return;
  }

  const ext = path.extname(resolved);
  fs.readFile(resolved, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/api/extract') {
    const target = url.searchParams.get('url');
    if (!target) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '缺少 url 參數' }));
      return;
    }

    try {
      const text = await extractText(target);
      if (!text) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '無法取得貼文內容' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ text }));
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || '取得失敗' }));
    }
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
