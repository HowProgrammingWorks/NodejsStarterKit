'use strict';

const { node, npm } = require('./dependencies.js');
const { http, https } = node;
const { common, ws } = npm;
const { Channel } = require('./channel.js');
const { application } = require('./application.js');

const SHUTDOWN_TIMEOUT = 5000;
const SHORT_TIMEOUT = 500;
const LONG_RESPONSE = 30000;

const receiveBody = async (req) => {
  const buffers = [];
  for await (const chunk of req) {
    buffers.push(chunk);
  }
  return Buffer.concat(buffers).toString();
};

class Server {
  constructor(config) {
    this.config = config;
    this.channels = new Map();
    const { port, host, protocol, cert } = config;
    this.port = port;
    this.host = host;
    this.protocol = protocol;
    const transport = protocol === 'http' ? http : https;
    const listener = this.listener.bind(this);
    this.server = transport.createServer(cert, listener);
    this.ws = new ws.Server({ server: this.server });
    this.ws.on('connection', async (connection, req) => {
      const channel = await new Channel(req, null, connection, application);
      connection.on('message', (data) => {
        channel.message(data);
      });
    });
    this.server.listen(this.port, host);
  }

  async listener(req, res) {
    let finished = false;
    const { url, connection } = req;
    const channel = await new Channel(req, res, null, application);
    this.channels.set(connection, channel);

    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      this.channels.delete(connection);
      channel.error(504);
    }, LONG_RESPONSE);

    res.on('close', () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      this.channels.delete(connection);
    });

    if (url.startsWith('/api')) this.request(channel);
    else channel.static();
  }

  request(channel) {
    const { req } = channel;
    if (req.method === 'OPTIONS') {
      channel.options();
      return;
    }
    if (req.method !== 'POST') {
      channel.error(403);
      return;
    }
    const body = receiveBody(req);
    if (req.url === '/api') {
      body.then((data) => {
        channel.message(data);
      });
    } else {
      body.then((data) => {
        const { pathname, searchParams } = new URL('http://' + req.url);
        const [, interfaceName, methodName] = pathname.split('/');
        const args = data ? JSON.parse(data) : Object.fromEntries(searchParams);
        channel.rpc(-1, interfaceName, methodName, args);
      });
    }
    body.catch((err) => {
      channel.error(500, err);
    });
  }

  closeChannels() {
    const { channels } = this;
    for (const [connection, channel] of channels.entries()) {
      channels.delete(connection);
      channel.error(503);
      connection.destroy();
    }
  }

  async close() {
    this.server.close((err) => {
      if (err) application.logger.error(err.stack);
    });
    if (this.channels.size === 0) {
      await common.timeout(SHORT_TIMEOUT);
      return;
    }
    await common.timeout(SHUTDOWN_TIMEOUT);
    this.closeChannels();
  }
}

module.exports = Server;
