'use strict';

const http = require('http');
const path = require('path');

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

const handler = application => async (req, res) => {
  connections.set(res.connection, res);
  const { method, url } = req;
  const request = url === '/' ? '/index.html' : url;
  const [first, second] = request.substring(1).split('/');
  application.logger.log(`${method}\t${url}`);
  if (first === 'api') {
    const session = application.sessions.restore(req);
    if (!session && second !== 'signIn') {
      application.logger.error(`Forbidden ${url}`);
      application.server.error(res, 403, 'Forbidden');
      return;
    }
    const method = application.api.get(second)({});
    const args = await receiveArgs(req);
    try {
      const result = await method(...args);
      if (!result) {
        application.server.error(res, 500, 'Server error');
        return;
      }
      if (second === 'signIn') {
        const session = application.sessions.start(req);
        res.setHeader('Set-Cookie', session.cookie);
      }
      res.end(JSON.stringify(result));
    } catch (err) {
      application.logger.error(err.stack);
      application.server.error(res, 500, 'Server error');
    }
  } else {
    const fileExt = path.extname(request).substring(1);
    const mimeType = MIME_TYPES[fileExt] || MIME_TYPES.html;
    res.writeHead(200, { 'Content-Type': mimeType });
    const data = application.cache.get(request);
    if (data) res.end(data);
    else application.server.error(res, 404, 'File is not found');
  }
};

class Server {
  constructor(config, application) {
    this.config = config;
    this.application = application;
    const { port, host } = config;
    const listener = handler(application);
    this.http = http.createServer(listener).listen(port, host);
    this.http.on('connection', connection => {
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

  async close() {
    this.http.close(err => {
      if (err) {
        this.application.logger.error(err.stack);
        process.exit(1);
      }
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
}

module.exports = Server;
