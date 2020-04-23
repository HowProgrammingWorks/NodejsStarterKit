'use strict';

const http = require('http');
const assert = require('assert').strict;
const { Worker } = require('worker_threads');

const worker = new Worker('./worker.js');
const config = require('../config/server.js');

const START_TIMEOUT = 500;
const TEST_TIMEOUT = 3000;

console.log('System test started');
setTimeout(async () => {
  worker.postMessage({ name: 'stop' });
}, TEST_TIMEOUT);

worker.on('exit', () => {
  console.log('System test finished');
});

const tasks = [
  { get: '/' },
  { get: '/websocket.js' },
  {
    post: '/api/signIn',
    data: { login: 'marcus', password: 'marcus' }
  }
];

const getRequest = task => {
  const request = {
    host: config.host,
    port: config.ports[0],
    agent: false
  };
  if (task.get) {
    request.method = 'GET';
    request.path = task.get;
  } else if (task.post) {
    request.method = 'POST';
    request.path = task.post;
  }
  if (task.data) {
    task.data = JSON.stringify(task.data);
    request.headers = {
      'Content-Type': 'application/json',
      'Content-Length': task.data.length
    };
  }
  return request;
};

setTimeout(() => {
  tasks.forEach(task => {
    const name = task.get || task.post;
    console.log('HTTP request ' + name);
    const request = getRequest(task);
    const req = http.request(request);
    req.on('response', res => {
      assert.equal(res.statusCode, 200);
    });
    req.on('error', err => {
      console.log(err.stack);
      process.exit(1);
    });
    if (task.data) req.write(task.data);
    req.end();
  });
}, START_TIMEOUT);
