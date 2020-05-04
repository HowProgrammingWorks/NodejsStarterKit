'use strict';

const { Worker } = require('worker_threads');

const config = require('./config/server.js');

const workers = [];
for (let i = 0; i < config.ports.length; i++) {
  const worker = new Worker('./worker.js');
  workers.push(worker);
}

const exit = async () => {
  console.log();
  for (const worker of workers) {
    worker.postMessage({ name: 'stop' });
  }
};

process.on('SIGINT', exit);
process.on('SIGTERM', exit);
