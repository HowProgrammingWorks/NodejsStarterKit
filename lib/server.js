'use strict';

const { http, https, path, worker } = require('./dependencies.js');

const WebSocket = require('ws');
const Semaphore = require('./semaphore.js');

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
    const { url } = this.req;
    const filePath = url === '/' ? '/index.html' : url;
    const fileExt = path.extname(filePath).substring(1);
    const mimeType = MIME_TYPES[fileExt] || MIME_TYPES.html;
    this.res.writeHead(200, { 'Content-Type': mimeType });
    const data = this.application.cache.get(filePath);
    if (data) this.res.end(data);
    else this.error(404);
  }

  error(status) {
    if (this.res.finished) return;
    this.res.writeHead(status, { 'Content-Type': 'text/plain' });
    this.res.end(`HTTP ${status}: ${http.STATUS_CODES[status]}`);
  }

  async api() {
    const { semaphore } = this.application.server;
    try {
      await semaphore.enter();
    } catch {
      this.error(504);
      return;
    }
    const { req, res } = this;
    const { url } = req;
    const name = url.substring(METHOD_OFFSET);
    const session = await this.application.auth.restore(this);
    const args = await receiveArgs(req);
    const sandbox = session ? session.sandbox : undefined;
    const context = session ? session.context : {};
    try {
      const exp = this.application.runScript(name, sandbox);
      const { method, access } = exp(context);
      if (!session && access !== 'public') {
        this.application.logger.error(`Forbidden ${url}`);
        this.error(403);
        semaphore.leave();
        return;
      }
      const result = await method(args);
      if (res.finished) {
        semaphore.leave();
        return;
      }
      if (!session && access === 'public') {
        this.application.auth.start(this, result.userId);
      }
      res.end(JSON.stringify(result));
    } catch (err) {
      this.application.logger.error(err.stack);
      this.error(err.message === 'Not found' ? 404 : 500);
    }
    semaphore.leave();
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
    clients.delete(res.connection);
    client.error(504);
  }, LONG_RESPONSE);

  res.on('close', () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    clients.delete(res.connection);
  });

  application.logger.log(`${method}\t${url}`);
  if (url.startsWith('/api/')) {
    if (method === 'POST') client.api();
    else client.error(403);
  } else {
    client.static();
  }
};

const apiws = async (client, message) => {
  const { connection, application } = client;
  const { semaphore } = application.server;
  const send = obj => connection.send(JSON.stringify(obj));
  try {
    await semaphore.enter();
  } catch {
    send({ result: 'error', reason: 'timeout' });
    return;
  }
  try {
    const { method: name, args } = JSON.parse(message);
    const session = await application.auth.restore(client);
    const sandbox = session ? session.sandbox : undefined;
    const context = session ? session.context : {};
    const exp = application.runScript(name, sandbox);
    const { method, access } = exp(context);
    if (!session && access !== 'public') {
      application.logger.error(`Forbidden: ${name}`);
      send({ result: 'error', reason: 'forbidden' });
      semaphore.leave();
      return;
    }
    const result = await method(args);
    if (!session && access === 'public') {
      const session = application.auth.start(client, result.userId);
      result.token = session.token;
    }
    send(result);
  } catch (err) {
    application.logger.error(err.stack);
    send({ result: 'error' });
  }
  semaphore.leave();
};

class Server {
  constructor(config, application) {
    this.config = config;
    this.application = application;
    const { ports, host, transport, concurrency, queue } = config;
    this.semaphore = new Semaphore(concurrency, queue.size, queue.timeout);
    const { threadId } = worker;
    const port = ports[threadId - 1];
    const lib = TRANSPORT[transport];
    const handler = listener(application);
    this.instance = lib.createServer({ ...application.cert }, handler);
    if (transport.startsWith('ws')) {
      this.ws = new WebSocket.Server({ server: this.instance });
      this.ws.on('connection', (connection, req) => {
        const client = new Client(req, null, application, connection);
        connection.on('message', message => {
          apiws(client, message);
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
    closeClients();
  }
}

module.exports = Server;
