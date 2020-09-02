// This file for serving static,
// handling messages & errors from client.
// And make correct response.
'use strict';

const { http, path } = require('./dependencies.js');
const application = require('./application.js');

// Mime for static
const MIME_TYPES = {
  html: 'text/html; charset=UTF-8',
  json: 'application/json; charset=UTF-8',
  js: 'application/javascript; charset=UTF-8',
  css: 'text/css',
  png: 'image/png',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
};

// Security headers
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
  // Prepare useful references for future work
  constructor(req, res, connection) {
    this.req = req;
    this.res = res;
    this.ip = req.socket.remoteAddress;
    this.connection = connection;
  }

  // Get static by url from prepared collection 
  // when app was initializied
  static() {
    const { req: { url, method }, res, ip } = this;
    const filePath = url === '/' ? '/index.html' : url; // Serve home url
    const fileExt = path.extname(filePath).substring(1); // Get file extension for mime
    const mimeType = MIME_TYPES[fileExt] || MIME_TYPES.html; // Get correct mime
    res.writeHead(200, { ...HEADERS, 'Content-Type': mimeType }); // Write Header
    if (res.writableEnded) return;
    const data = application.static.get(filePath); // Get from collection
    if (data) { // Send data
      res.end(data);  
      application.logger.log(`${ip}\t${method}\t${url}`); 
      return;
    }
    this.error(404);
  }

  // Change location
  redirect(location) {
    const { res } = this;
    if (res.headersSent) return;
    res.writeHead(302, { 'Location': location });
    res.end();
  }

  // Right way to handle different errors
  error(code, err, callId = err) {
    const { req: { url, method }, res, connection, ip } = this;
    const status = http.STATUS_CODES[code];
    if (typeof err === 'number') err = undefined;
    const reason = err ? err.stack : status;
    application.logger.error(`${ip}\t${method}\t${url}\t${code}\t${reason}`);
    if (connection) { // Send error to client with websocket
      const packet = { callback: callId, error: { code, message: status } };
      connection.send(JSON.stringify(packet));
      return;
    }
    if (res.writableEnded) return; // Send error to client with http/s
    res.writeHead(code, { 'Content-Type': MIME_TYPES.json });
    const packet = { code, error: status };
    res.end(JSON.stringify(packet));
  }

  // Handle message from client 
  message(data) {
    let packet;
    try { // Parse JSON to object
      packet = JSON.parse(data); 
    } catch (err) {
      this.error(500, new Error('JSON parsing error'));
      return;
    }
    const [callType, methodName] = Object.keys(packet);
    const callId = packet[callType];  
    const args = packet[methodName];
    if (callId && args) {
      this.rpc(callId, methodName, args); // Execute method
      return;
    }
    this.error(500, new Error('Packet structure error'));
  }

  // RPC 
  // Methods can compete to change data
  // Simple example is update User or
  // it's files in database and data can be written simultaneously.
  // We need to illuminate possibility of data corruption.
  // Semaphore is one of the ways to solve this problem.
  // When data will be changed from one thread 
  // it will be impossible to change it from another
  // Discover how semaphore works here https://github.com/HowProgrammingWorks/Semaphore
  async rpc(callId, method, args) {
    const { res, connection, ip } = this;
    const { semaphore } = application.server; 
    try { // Try to enter if queue isn't full
      await semaphore.enter();
    } catch {
      this.error(504, callId);
      return;
    }
    try { // Authification
      let session = await application.auth.restore(this); 
      const proc = application.runMethod(method, session); 
      if (!proc) {
        this.error(404, callId);
        return;
      }
      if (!session && proc.access !== 'public') {
        this.error(403, callId);
        return;
      }
      const result = await proc.method(args); // Getting result
      if (!session && result && result.userId && proc.access === 'public') { // Check privacy
        session = application.auth.start(this, result.userId);
        result.token = session.token;
      }
      const packet = { callback: callId, result }; // Prepare packet to send it for user
      const data = JSON.stringify(packet);
      if (connection) connection.send(data); // Send packet ws/wss
      else res.end(data); // Send packet http/s
      const token = session ? session.token : 'anonymous';
      application.logger.log(`${ip}\t${token}\t${method}`);
    } catch (err) {
      this.error(500, err, callId);
    } finally {
      semaphore.leave(); // If all executed correctly leave 
    }
  }
}

module.exports = Client;
