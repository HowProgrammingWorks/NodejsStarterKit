'use strict';

const { http, https, worker, common } = require('./dependencies.js');
const application = require('./application.js');

const WebSocket = require('ws');
const Semaphore = require('./semaphore.js');
const Client = require('./client.js');

const SHUTDOWN_TIMEOUT = 5000;
const LONG_RESPONSE = 30000;

// Prepare collection for clients
const clients = new Map();

const receiveBody = async req => {
  const buffers = [];
  for await (const chunk of req) {
    buffers.push(chunk);
  }
  return Buffer.concat(buffers).toString();
};

// Go through clients and close connections
const closeClients = () => {
  for (const [connection, client] of clients.entries()) {
    clients.delete(connection);
    client.error(503);
    connection.destroy();
  }
};

const listener = (req, res) => {
  let finished = false;
  const { method, url, connection } = req;
  const client = new Client(req, res); 
  clients.set(connection, client); // Save Client

  const timer = setTimeout(() => { // Set timeout for long response
    if (finished) return;
    finished = true;
    clients.delete(connection);
    client.error(504);
  }, LONG_RESPONSE);

  res.on('close', () => { // Listen close event and delete connection
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    clients.delete(connection);
  });

  if (url === '/api') { // Send api request
    if (method !== 'POST') {
      client.error(403);
      return;
    }
    receiveBody(req).then(data => {
      client.message(data);
    }, err => {
      client.error(500, err);
    });
  } else { 
    if (url === '/' && !req.connection.encrypted) {
      const host = common.parseHost(req.headers.host);
      const port = common.sample(application.server.ports);
      client.redirect(`https://${host}:${port}/`); // Redirect to home '/'
    }
    client.static(); // Serve static
  }
};

class Server {
  constructor(config) {
    this.config = config;
    const { ports, host, concurrency, queue } = config;
    this.semaphore = new Semaphore(concurrency, queue.size, queue.timeout); 
    const { threadId } = worker;
    const port = ports[threadId - 1];
    this.ports = config.ports.slice(1);
    const transport = threadId === 1 ? http : https;
    this.instance = transport.createServer({ ...application.cert }, listener); // https require certificate
    this.ws = new WebSocket.Server({ server: this.instance });
    this.ws.on('connection', (connection, req) => {
      const client = new Client(req, null, connection);
      connection.on('message', data => {
        client.message(data);
      });
    });
    this.instance.listen(port, host);
  }

  async close() {
    this.instance.close(err => {
      if (err) application.logger.error(err.stack);
    });
    await common.timeout(SHUTDOWN_TIMEOUT);
    closeClients();
  }
}

module.exports = Server;
