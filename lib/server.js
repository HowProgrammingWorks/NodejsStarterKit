'use strict';

const http = require('http');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;

const MIME_TYPES = {
  html: 'text/html; charset=UTF-8',
  js: 'application/javascript; charset=UTF-8',
  css: 'text/css',
  png: 'image/png',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
};

const curDir = process.cwd();
const API_PATH = path.join(curDir, './api');
const STATIC_PATH = path.join(curDir, './static');
const STATIC_PATH_LENGTH = STATIC_PATH.length;

const api = new Map();
const cache = new Map();
const connections = new Map();

const cacheFile = async filePath => {
  const key = filePath.substring(STATIC_PATH_LENGTH);
  try {
    const data = await fsp.readFile(filePath, 'utf8');
    cache.set(key, data);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
};

const cacheDirectory = async directoryPath => {
  const files = await fsp.readdir(directoryPath, { withFileTypes: true });
  for (const file of files) {
    const filePath = path.join(directoryPath, file.name);
    if (file.isDirectory()) cacheDirectory(filePath);
    else cacheFile(filePath);
  }
  fs.watch(directoryPath, (event, fileName) => {
    const filePath = path.join(directoryPath, fileName);
    cacheFile(filePath);
  });
};

cacheDirectory(STATIC_PATH);

const cacheMethod = async fileName => {
  const key = path.basename(fileName, '.js');
  try {
    const libPath = require.resolve(fileName);
    delete require.cache[libPath];
  } catch (e) {
    return;
  }
  try {
    const method = require(fileName);
    api.set(key, method);
  } catch (e) {
    api.delete(key);
  }
};

(async () => {
  const files = await fsp.readdir(API_PATH);
  for (const fileName of files) {
    const filePath = path.join(API_PATH, fileName);
    cacheMethod(filePath);
  }
  fs.watch(API_PATH, (event, fileName) => {
    const filePath = path.join(API_PATH, fileName);
    cacheMethod(filePath);
  });
})();

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
    const method = api.get(second);
    const args = await receiveArgs(req);
    try {
      const result = await method(...args);
      if (!result) {
        httpError(res, 500, 'Server error');
        return;
      }
      res.end(JSON.stringify(result));
    } catch (err) {
      application.logger.error(err.stack);
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
