'use strict';

const { Worker } = require('worker_threads');
const path = require('path');

const Config = require('./lib/config.js');

const PATH = process.cwd();
const CFG_PATH = path.join(PATH, 'config');

const options = { trackUnmanagedFds: true };

(async () => {
  const config = await new Config(CFG_PATH);
  const { sections } = config;
  const count = sections.server.ports.length;
  const workers = new Array(count);

  const start = id => {
    const worker = new Worker('./lib/worker.js', options);
    workers[id] = worker;
    worker.on('exit', code => {
      if (code !== 0) start(id);
    });
  };

  for (let id = 0; id < count; id++) start(id);

  const stop = async () => {
    console.log();
    for (const worker of workers) {
      worker.postMessage({ name: 'stop' });
    }
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
})();
