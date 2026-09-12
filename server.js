#!/usr/bin/env node
/**
 * Static file server for FocusFlow.
 * No npm packages required: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const START_PORT = Number(process.env.PORT) || 8000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.otf': 'font/otf',
  '.ico': 'image/x-icon'
};

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent((urlPath || '/').split('?')[0]);
  const candidate = path.normalize(path.join(root, decoded));
  if (!candidate.startsWith(root)) return root;
  return candidate;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache',
    ...headers
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    send(res, 204, '');
    return;
  }

  let filePath = safeJoin(ROOT, req.url);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  });
});

function listen(port) {
  server.listen(port, () => {
    console.log('\nFocusFlow is running at http://localhost:' + port);
    console.log('Open that URL in your browser. Press Ctrl+C to stop.\n');
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    listen(START_PORT + 1);
    return;
  }
  throw err;
});

listen(START_PORT);
