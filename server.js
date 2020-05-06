'use strict';

const { Worker } = require('worker_threads');
const path = require('path');

const Config = require('./lib/config.js');

const APP_PATH = process.cwd();
const CFG_PATH = path.join(APP_PATH, 'config');

const workers = [];

new Config(CFG_PATH).then(config => {
  const { sections } = config;
  for (let i = 0; i < sections.server.ports.length; i++) {
    const worker = new Worker('./worker.js');
    workers.push(worker);
  }
});

const exit = async () => {
  console.log();
  for (const worker of workers) {
    worker.postMessage({ name: 'stop' });
  }
};

process.on('SIGINT', exit);
process.on('SIGTERM', exit);
