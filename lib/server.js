'use strict';

const { http, https, path, worker } = require('./dependencies.js');

const WebSocket = require('ws');
const Semaphore = require('./semaphore.js');

const MIME_TYPES = {
  html: 'text/html; charset=UTF-8',
  json: 'application/json; charset=UTF-8',
  js: 'application/javascript; charset=UTF-8',
  css: 'text/css',
  png: 'image/png',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
};

const SHUTDOWN_TIMEOUT = 5000;
const LONG_RESPONSE = 30000;
const METHOD_OFFSET = '/api/'.length;

const clients = new Map();

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

const closeClients = () => {
  for (const [connection, client] of clients.entries()) {
    clients.delete(connection);
    client.error(503);
    connection.destroy();
  }
};

class Client {
  constructor(req, res, application, connection) {
    this.req = req;
    this.res = res;
    this.application = application;
    this.connection = connection;
  }

  static() {
    const { req: { url }, res, application } = this;
    const filePath = url === '/' ? '/index.html' : url;
    const fileExt = path.extname(filePath).substring(1);
    const mimeType = MIME_TYPES[fileExt] || MIME_TYPES.html;
    res.writeHead(200, { 'Content-Type': mimeType });
    const data = application.cache.get(filePath);
    if (data) res.end(data);
    else this.error(404);
  }

  redirect(location) {
    const { res } = this;
    if (res.headersSent) return;
    res.writeHead(302, { 'Location': location });
    res.end();
  }

  error(status, err) {
    const { application, req: { url }, res, connection } = this;
    const reason = http.STATUS_CODES[status];
    const error = err ? err.stack : reason;
    const msg = status === 403 ? err.message : `${url} - ${error} - ${status}`;
    application.logger.error(msg);
    const result = JSON.stringify({ result: 'error', reason });
    if (connection) {
      connection.send(result);
      return;
    }
    if (res.finished) return;
    res.writeHead(status, { 'Content-Type': MIME_TYPES.json });
    res.end(result);
  }

  async rpc(method, args) {
    const { application, res, connection } = this;
    const { semaphore } = application.server;
    try {
      await semaphore.enter();
    } catch {
      this.error(504);
      return;
    }
    try {
      const session = await application.auth.restore(this);
      const proc = application.runScript(method, session);
      if (!proc) {
        this.error(404);
        return;
      }
      if (!session && proc.access !== 'public') {
        this.error(403, new Error(`Forbidden: /api/${method}`));
        return;
      }
      const result = await proc.method(args);
      if (!session && proc.access === 'public') {
        const session = application.auth.start(this, result.userId);
        result.token = session.token;
      }
      const data = JSON.stringify(result);
      if (connection) connection.send(data);
      else res.end(data);
    } catch (err) {
      this.error(500, err);
    } finally {
      semaphore.leave();
    }
  }
}

const listener = application => (req, res) => {
  let finished = false;
  const { method, url, connection } = req;
  const client = new Client(req, res, application);
  clients.set(connection, client);

  const timer = setTimeout(() => {
    if (finished) return;
    finished = true;
    clients.delete(connection);
    client.error(504);
  }, LONG_RESPONSE);

  res.on('close', () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    clients.delete(connection);
  });

  application.logger.log(`${method}\t${url}`);
  if (url.startsWith('/api/')) {
    if (method !== 'POST') {
      client.error(403, new Error(`Forbidden: ${url}`));
      return;
    }
    receiveArgs(req).then(args => {
      const method = url.substring(METHOD_OFFSET);
      client.rpc(method, args);
    });
  } else {
    if (url === '/' && !req.connection.encrypted) {
      const { host } = req.headers;
      const portOffset = host.indexOf(':');
      const addr = portOffset > -1 ? host.substr(0, portOffset) : host;
      const port = application.server.randomPort();
      client.redirect(`https://${addr}:${port}/`);
    }
    client.static();
  }
};

class Server {
  constructor(config, application) {
    this.config = config;
    this.application = application;
    const { ports, host, concurrency, queue } = config;
    this.semaphore = new Semaphore(concurrency, queue.size, queue.timeout);
    const { threadId } = worker;
    const port = ports[threadId - 1];
    this.ports = config.ports.slice(1);
    const handler = listener(application);
    const transport = threadId === 1 ? http : https;
    this.instance = transport.createServer({ ...application.cert }, handler);
    this.ws = new WebSocket.Server({ server: this.instance });
    this.ws.on('connection', (connection, req) => {
      const client = new Client(req, null, application, connection);
      connection.on('message', message => {
        const { method, args } = JSON.parse(message);
        client.rpc(method, args);
      });
    });
    this.instance.listen(port, host);
  }

  randomPort() {
    return this.ports[Math.floor(Math.random() * this.ports.length)];
  }

  async close() {
    this.instance.close(err => {
      if (err) this.application.logger.error(err.stack);
    });
    await timeout(SHUTDOWN_TIMEOUT);
    closeClients();
  }
}

module.exports = Server;
