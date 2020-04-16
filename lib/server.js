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

const closeConnections = () => {
  for (const [connection, res] of connections.entries()) {
    connections.delete(connection);
    res.end('Server stopped');
    connection.destroy();
  }
};

const error = (res, status, message) => {
  res.statusCode = status;
  res.end(`<pre>HTTP ${status}: ${message}</pre>`);
};

module.exports = application => {
  const { config, logger, cache, sessions } = application;
  const { ports, host, transport } = config.sections.server;
  const { threadId } = application.worker;
  const port = ports[threadId - 1];
  const lib = TRANSPORT[transport];

  const api = async (req, res) => {
    const { url } = req;
    const methodName = url.substring(METHOD_OFFSET);
    const session = sessions.restore(req);
    if (!session && methodName !== 'signIn') {
      logger.error(`Forbidden ${url}`);
      error(res, 403, 'Forbidden');
      return;
    }
    const args = await receiveArgs(req);
    const sandbox =  session ? session.sandbox : undefined;
    try {
      const method = application.runScript(methodName, sandbox);
      const result = await method({})(args);
      if (methodName === 'signIn') {
        const session = sessions.start(req);
        res.setHeader('Set-Cookie', session.cookie);
      }
      res.end(JSON.stringify(result));
    } catch (err) {
      logger.error(err.stack);
      if (err.message === 'Not found') {
        error(res, 404, 'File is not found');
      } else {
        error(res, 500, 'Server error');
      }
    }
  };

  const apiws = async (connection, message) => {
    const { method, args } = JSON.parse(message);
    try {
      const fn = application.runScript(method);
      const result = await fn({})(args);
      connection.send(JSON.stringify(result));
    } catch (err) {
      logger.error(err.stack);
      connection.send(JSON.stringify({ result: 'error' }));
    }
  };

  const staticFile = (req, res) => {
    const { url } = req;
    const filePath = url === '/' ? '/index.html' : url;
    const fileExt = path.extname(filePath).substring(1);
    const mimeType = MIME_TYPES[fileExt] || MIME_TYPES.html;
    res.writeHead(200, { 'Content-Type': mimeType });
    const data = cache.get(filePath);
    if (data) res.end(data);
    else error(res, 404, 'File is not found');
  };

  const handler = (req, res) => {
    connections.set(res.connection, res);
    const { method, url } = req;
    logger.log(`${method}\t${url}`);
    if (url.startsWith('/api/')) {
      if (method === 'POST') api(req, res);
      else error(res, 403, 'Forbidden');
    } else {
      staticFile(req, res);
    }
  };

  const instance = lib.createServer({ ...application.cert }, handler);
  instance.listen(port, host);

  if (transport.startsWith('ws')) {
    const ws = new WebSocket.Server({ server: instance });
    ws.on('connection', connection => {
      connection.on('message', apiws);
    });
  } else {
    instance.on('connection', connection => {
      const timeout = setTimeout(() => {
        const res = connections.get(connection);
        error(res, 504, 'Gateway Timeout');
      }, LONG_RESPONSE);
      connection.on('close', () => {
        clearTimeout(timeout);
        connections.delete(connection);
      });
    });
  }

  const close = async () => {
    instance.close(err => {
      if (err) logger.error(err.stack);
    });
    await timeout(SHUTDOWN_TIMEOUT);
    closeConnections();
  };

  return { close };
};
