'use strict';

const http = require('http');
const fs = require('fs').promises;

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

const httpError = (res, status, message) => {
  res.statusCode = status;
  res.end(`<pre>HTTP ${status}: ${message}</pre>`);
};

const handler = async (req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url;
  const [first, second] = url.substring(1).split('/');
  if (first === 'api') {
    const method = application.api.get(second);
    const args = await receiveArgs(req);
    try {
      const result = await method(...args);
      if (!result) {
        httpError(res, 500, 'Server error');
        return;
      }
      res.end(JSON.stringify(result));
    } catch (err) {
      console.dir({ err });
      httpError(res, 500, 'Server error');
    }
  } else {
    const filePath = `./static/${first}`;
    try {
      const data = await fs.readFile(filePath);
      res.end(data);
    } catch (err) {
      httpError(res, 404, 'File is not found');
    }
  }
};

class Server {
  constructor(config) {
    this.config = config;
    const { port, host } = config;
    this.http = http.createServer(handler).listen(port, host);
  }
}

module.exports = Server;
