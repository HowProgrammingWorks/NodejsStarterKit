'use strict';

const { Worker } = require('worker_threads');
const path = require('path');

const Config = require('./lib/config.js');

const PATH = process.cwd();
const CFG_PATH = path.join(PATH, 'application/config');

const options = { trackUnmanagedFds: true };

(async () => {
  const config = await new Config(CFG_PATH);
  const { balancer, ports = [], workers = {} } = config.server;
  const count = ports.length + (balancer ? 1 : 0) + (workers.pool || 0);
  let active = count;
  const threads = new Array(count);

  const start = id => {
    const worker = new Worker('./lib/worker.js', options);
    threads[id] = worker;
    worker.on('exit', code => {
      if (code !== 0) start(id);
      else if (--active === 0) process.exit(0);
    });
  };

  for (let id = 0; id < count; id++) start(id);

  const stop = async () => {
    console.log();
    for (const worker of threads) {
      worker.postMessage({ name: 'stop' });
    }
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
})();
