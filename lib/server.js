'use strict';

const { http, https, path, worker } = require('./dependencies.js');

const WebSocket = require('ws');
const Semaphore = require('./semaphore.js');

const TRANSPORT = { http, https, ws: http, wss: https };

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
    const { url } = this.req;
    const filePath = url === '/' ? '/index.html' : url;
    const fileExt = path.extname(filePath).substring(1);
    const mimeType = MIME_TYPES[fileExt] || MIME_TYPES.html;
    this.res.writeHead(200, { 'Content-Type': mimeType });
    const data = this.application.cache.get(filePath);
    if (data) this.res.end(data);
    else this.error(404);
  }

  error(status, err) {
    const { application, req, res, connection } = this;
    const reason = http.STATUS_CODES[status];
    const message = err ? err.stack : reason;
    application.logger.error(`${req.url} - ${message} - ${status}`);
    const result = JSON.stringify({ result: 'error', reason });
    if (connection) {
      connection.send(result);
      return;
    }
    if (res.finished) return;
    res.writeHead(status, { 'Content-Type': MIME_TYPES.json });
    res.end(result);
  }

  async execute(method, args) {
    const { application } = this;
    const { semaphore } = application.server;
    await semaphore.enter();
    try {
      const session = await application.auth.restore(this);
      const sandbox = session ? session.sandbox : undefined;
      const context = session ? session.context : {};
      const exp = application.runScript(method, sandbox);
      const proc = exp(context);
      if (!session && proc.access !== 'public') {
        semaphore.leave();
        throw new Error(`Forbidden: ${method}`);
      }
      const result = await proc.method(args);
      if (!session && proc.access === 'public') {
        const session = application.auth.start(this, result.userId);
        result.token = session.token;
      }
      return JSON.stringify(result);
    } finally {
      semaphore.leave();
    }
  }

  async rpc(method, args) {
    const { res, connection } = this;
    try {
      const result = await this.execute(method, args);
      if (connection) connection.send(result);
      else res.end(result);
    } catch (err) {
      if (err.message === 'Not found') this.error(404);
      else if (err.message === 'Semaphore timeout') this.error(504);
      else if (err.message.startsWith('Forbidden:')) this.error(403);
      else this.error(500, err);
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
    if (method !== 'POST') {
      client.error(403);
      return;
    }
    receiveArgs(req).then(args => {
      const method = url.substring(METHOD_OFFSET);
      client.rpc(method, args);
    });
  } else {
    client.static();
  }
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
          const { method, args } = JSON.parse(message);
          client.rpc(method, args);
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
