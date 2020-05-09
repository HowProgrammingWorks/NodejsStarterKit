'use strict';

const { Worker } = require('worker_threads');
const path = require('path');

const Config = require('./lib/config.js');

const PATH = process.cwd();
const CFG_PATH = path.join(PATH, 'config');

const workers = [];

(async () => {
  const config = await new Config(CFG_PATH);
  const { sections } = config;
  for (let i = 0; i < sections.server.ports.length; i++) {
    const worker = new Worker('./worker.js');
    workers.push(worker);
  }
})();

const exit = async () => {
  console.log();
  for (const worker of workers) {
    worker.postMessage({ name: 'stop' });
  }
};

process.on('SIGINT', exit);
process.on('SIGTERM', exit);
