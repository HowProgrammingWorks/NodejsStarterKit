'use strict';

const { Worker } = require('worker_threads');

const worker = new Worker('./worker.js');

process.on('SIGINT', async () => {
  worker.postMessage({ name: 'stop' });
});
