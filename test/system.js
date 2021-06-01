'use strict';

require('../server.js');

const http = require('http');
const assert = require('assert').strict;

const HOST = '127.0.0.1';
const PORT = 8001;
const START_DELAY = 2000;
const TEST_DELAY = 100;
const TEST_TIMEOUT = 3000;

let callId = 0;

console.log('System test started');
setTimeout(async () => {
  console.log('System test finished');
  process.exit(0);
}, TEST_TIMEOUT);

const tasks = [
  { get: '/', port: 8000, status: 302 },
  { get: '/console.js' },
  {
    post: '/api',
    method: 'auth/signIn',
    args: { login: 'marcus', password: 'marcus' },
  },
];

const getRequest = (task) => {
  const request = {
    host: HOST,
    port: task.port || PORT,
    agent: false,
  };
  if (task.get) {
    request.method = 'GET';
    request.path = task.get;
  } else if (task.post) {
    request.method = 'POST';
    request.path = task.post;
  }
  if (task.args) {
    const packet = { call: ++callId, [task.method]: task.args };
    task.data = JSON.stringify(packet);
    request.headers = {
      'Content-Type': 'application/json',
      'Content-Length': task.data.length,
    };
  }
  return request;
};

setTimeout(() => {
  tasks.forEach((task) => {
    const name = task.get || task.post;
    console.log('HTTP request ' + name);
    const request = getRequest(task);
    const req = http.request(request);
    req.on('response', (res) => {
      const expectedStatus = task.status || 200;
      setTimeout(() => {
        assert.equal(res.statusCode, expectedStatus);
      }, TEST_DELAY);
    });
    req.on('error', (err) => {
      console.log(err.stack);
    });
    if (task.data) req.write(task.data);
    req.end();
  });
}, START_DELAY);
