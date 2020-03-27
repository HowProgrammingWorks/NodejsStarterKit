'use strict';

const http = require('http');
const path = require('path');
const fs = require('fs').promises;

const MIME_TYPES = {
  html: 'text/html; charset=UTF-8',
  js: 'application/javascript; charset=UTF-8',
  css: 'text/css',
  png: 'image/png',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
};

const STATIC_PATH = path.join(process.cwd(), './static');
const STATIC_PATH_LENGTH = STATIC_PATH.length;

const cache = new Map();
const connections = new Map();

const cacheFile = async filePath => {
  const data = await fs.readFile(filePath, 'utf8');
  const key = filePath.substring(STATIC_PATH_LENGTH);
  cache.set(key, data);
};

const cacheDirectory = async directoryPath => {
  const items = await fs.readdir(directoryPath, { withFileTypes: true });
  for (const item of items) {
    const itemPath = path.join(directoryPath, item.name);
    if (item.isDirectory()) cacheDirectory(itemPath);
    else cacheFile(itemPath);
  }
};

cacheDirectory(STATIC_PATH);

const receiveArgs = async req => new Promise(resolve => {
  const body = [];
  req.on('data', chunk => {
    body.push(chunk);
  }).on('end', async () => {
    const data = body.join('');
    const args = JSON.parse(data);
    resolve(args);
  });
});

const httpError = (res, status, message) => {
  res.statusCode = status;
  res.end(`<pre>HTTP ${status}: ${message}</pre>`);
};

const handler = async (req, res) => {
  connections.set(res.connection, res);
  const url = req.url === '/' ? '/index.html' : req.url;
  const [first, second] = url.substring(1).split('/');
  if (first === 'api') {
    const method = application.api.get(second);
    const args = await receiveArgs(req);
    try {
      const result = await method(...args);
      if (!result) {
        httpError(res, 500, 'Server error');
        return;
      }
      res.end(JSON.stringify(result));
    } catch (err) {
      console.dir({ err });
      httpError(res, 500, 'Server error');
    }
  } else {
    const fileExt = path.extname(url).substring(1);
    const mimeType = MIME_TYPES[fileExt] || MIME_TYPES.html;
    res.writeHead(200, { 'Content-Type': mimeType });
    const data = cache.get(url);
    if (data) res.end(data);
    else httpError(res, 404, 'File is not found');
  }
};

class Server {
  constructor(config) {
    this.config = config;
    const { port, host } = config;
    this.http = http.createServer(handler).listen(port, host);
    this.http.on('connection', connection => {
      connection.on('close', () => {
        connections.delete(connection);
      });
    });
  }

  close() {
    this.http.close();
    this.closeConnections();
  }

  closeConnections() {
    for (const [connection, res] of connections.entries()) {
      connections.delete(connection);
      res.end('Server stopped');
      connection.destroy();
    }
  }
}

module.exports = Server;
