'use strict';

const api = {};
const internals = [
  'util', 'child_process', 'worker_threads', 'os', 'v8', 'vm', 'path', 'url',
  'timers', 'events', 'stream', 'fs', 'crypto', 'zlib',
  'dns', 'net', 'tls', 'http', 'https', 'http2', 'dgram',
];
for (const name of internals) api[name] = Object.freeze(require(name));
api.cp = api['child_process'];
api.worker = api['worker_threads'];
api.fsp = api.fs.promises;

module.exports = Object.freeze(api);
