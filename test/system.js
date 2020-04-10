'use strict';

const { Worker } = require('worker_threads');
const worker = new Worker('./worker.js');

const TEST_TIMEOUT = 3000;

console.log('System test started');
setTimeout(async () => {
  worker.postMessage({ name: 'stop' });
}, TEST_TIMEOUT);

worker.on('exit', () => {
  console.log('System test finished');
});
