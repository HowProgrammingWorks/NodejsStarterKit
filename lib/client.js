'use strict';

const { http, path } = require('./dependencies.js');
const application = require('./application.js');

const MIME_TYPES = {
  html: 'text/html; charset=UTF-8',
  json: 'application/json; charset=UTF-8',
  js: 'application/javascript; charset=UTF-8',
  css: 'text/css',
  png: 'image/png',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
};

const HEADERS = {
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubdomains; preload',
  'Access-Control-Allow-Origin': '*',
  'Content-Security-Policy': [
    'default-src \'self\'',
    'style-src \'self\' https://fonts.googleapis.com',
    'font-src \'self\' https://fonts.gstatic.com',
  ].join('; '),
};

class Client {
  constructor(req, res, connection) {
    this.req = req;
    this.res = res;
    this.ip = req.socket.remoteAddress;
    this.connection = connection;
  }

  static() {
    const { req: { url }, res } = this;
    const filePath = url === '/' ? '/index.html' : url;
    const fileExt = path.extname(filePath).substring(1);
    const mimeType = MIME_TYPES[fileExt] || MIME_TYPES.html;
    res.writeHead(200, { ...HEADERS, 'Content-Type': mimeType });
    if (res.writableEnded) return;
    const data = application.static.get(filePath);
    if (data) res.end(data);
    else this.error(404);
  }

  redirect(location) {
    const { res } = this;
    if (res.headersSent) return;
    res.writeHead(302, { 'Location': location });
    res.end();
  }

  error(status, err, callId = err) {
    const { req: { url }, res, connection, ip } = this;
    const reason = http.STATUS_CODES[status];
    if (typeof err === 'number') err = undefined;
    const error = err ? err.stack : reason;
    const msg = status === 403 ? err.message : `${url}\t${error}\t${status}`;
    application.logger.error(`${ip}\t${msg}`);
    const packet = { callback: callId, error: { message: reason } };
    const result = JSON.stringify(packet);
    if (connection) {
      connection.send(result);
      return;
    }
    if (res.writableEnded) return;
    res.writeHead(status, { 'Content-Type': MIME_TYPES.json });
    res.end(result);
  }

  message(data) {
    try {
      const packet = JSON.parse(data);
      const [callType, methodName] = Object.keys(packet);
      const callId = packet[callType];
      const args = packet[methodName];
      this.rpc(callId, methodName, args);
    } catch (err) {
      application.logger.error(err.message);
    }
  }

  async rpc(callId, method, args) {
    const { res, connection } = this;
    const { semaphore } = application.server;
    try {
      await semaphore.enter();
    } catch {
      this.error(504, callId);
      return;
    }
    try {
      const session = await application.auth.restore(this);
      const proc = application.runMethod(method, session);
      if (!proc) {
        this.error(404, callId);
        return;
      }
      if (!session && proc.access !== 'public') {
        this.error(403, new Error(`Forbidden: /api/${method}`), callId);
        return;
      }
      const result = await proc.method(args);
      if (!session && proc.access === 'public') {
        const session = application.auth.start(this, result.userId);
        result.token = session.token;
      }
      const packet = { callback: callId, result };
      const data = JSON.stringify(packet);
      if (connection) connection.send(data);
      else res.end(data);
    } catch (err) {
      this.error(500, err, callId);
    } finally {
      semaphore.leave();
    }
  }
}

module.exports = Client;
