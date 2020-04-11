'use strict';

const { Worker } = require('worker_threads');

const config = require('./config/server.js');

const workers = [];
for (let i = 0; i < config.ports.length; i++) {
  const worker = new Worker('./worker.js');
  workers.push(worker);
}

process.on('SIGINT', async () => {
  for (const worker of workers) {
    worker.postMessage({ name: 'stop' });
  }
});
