'use strict';

const http = require('http');
const https = require('https');
const path = require('path');
const WebSocket = require('ws');

const TRANSPORT = { http, https, ws: http, wss: https };

const MIME_TYPES = {
  html: 'text/html; charset=UTF-8',
  js: 'application/javascript; charset=UTF-8',
  css: 'text/css',
  png: 'image/png',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
};

const SHUTDOWN_TIMEOUT = 5000;
const LONG_RESPONSE = 30000;
const METHOD_OFFSET = '/api/'.length;

const connections = new Map();

const timeout = msec => new Promise(resolve => {
  setTimeout(resolve, msec);
});

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

class Server {
  constructor(config, application) {
    this.config = config;
    this.application = application;
    const { ports, host, transport } = config;
    const { threadId } = application.worker;
    const port = ports[threadId - 1];
    const listener = this.handler.bind(this);
    const lib = TRANSPORT[transport];
    this.instance = lib.createServer({ ...application.cert }, listener);
    if (transport.startsWith('ws')) {
      this.ws = new WebSocket.Server({ server: this.instance });
      this.ws.on('connection', connection => {
        connection.on('message', message => {
          this.apiws(connection, message);
        });
      });
    } else {
      this.instance.on('connection', connection => {
        const timeout = setTimeout(() => {
          const res = connections.get(connection);
          application.server.error(res, 504, 'Gateway Timeout');
        }, LONG_RESPONSE);
        connection.on('close', () => {
          clearTimeout(timeout);
          connections.delete(connection);
        });
      });
    }
    this.instance.listen(port, host);
  }

  async close() {
    this.instance.close(err => {
      if (err) this.application.logger.error(err.stack);
    });
    await timeout(SHUTDOWN_TIMEOUT);
    this.closeConnections();
  }

  closeConnections() {
    for (const [connection, res] of connections.entries()) {
      connections.delete(connection);
      res.end('Server stopped');
      connection.destroy();
    }
  }

  error(res, status, message) {
    res.statusCode = status;
    res.end(`<pre>HTTP ${status}: ${message}</pre>`);
  }

  handler(req, res) {
    connections.set(res.connection, res);
    const { method, url } = req;
    this.application.logger.log(`${method}\t${url}`);
    if (url.startsWith('/api/')) {
      if (method === 'POST') this.api(req, res);
      else this.error(res, 403, 'Forbidden');
    } else {
      this.static(req, res);
    }
  }

  async api(req, res) {
    const { url } = req;
    const methodName = url.substring(METHOD_OFFSET);
    const session = this.application.sessions.restore(req);
    if (!session && methodName !== 'signIn') {
      this.application.logger.error(`Forbidden ${url}`);
      this.error(res, 403, 'Forbidden');
      return;
    }
    const args = await receiveArgs(req);
    const sandbox =  session ? session.sandbox : undefined;
    try {
      const method = this.application.runScript(methodName, sandbox);
      const result = await method({})(args);
      if (methodName === 'signIn') {
        const session = this.application.sessions.start(req);
        res.setHeader('Set-Cookie', session.cookie);
      }
      res.end(JSON.stringify(result));
    } catch (err) {
      this.application.logger.error(err.stack);
      if (err.message === 'Not found') {
        this.error(res, 404, 'File is not found');
      } else {
        this.error(res, 500, 'Server error');
      }
    }
  }

  async apiws(connection, message) {
    const { method, args } = JSON.parse(message);
    try {
      const fn = this.application.runScript(method);
      const result = await fn({})(args);
      connection.send(JSON.stringify(result));
    } catch (err) {
      this.application.logger.error(err.stack);
      connection.send(JSON.stringify({ result: 'error' }));
    }
  }

  static(req, res) {
    const { url } = req;
    const filePath = url === '/' ? '/index.html' : url;
    const fileExt = path.extname(filePath).substring(1);
    const mimeType = MIME_TYPES[fileExt] || MIME_TYPES.html;
    res.writeHead(200, { 'Content-Type': mimeType });
    const data = this.application.cache.get(filePath);
    if (data) res.end(data);
    else this.error(res, 404, 'File is not found');
  }
}

module.exports = Server;
