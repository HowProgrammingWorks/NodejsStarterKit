'use strict';

module.exports = {
  host: '127.0.0.1',
  transport: 'http',
  port: 8000,
  timeout: 5000,
  concurrency: 1000,
  queue: {
    size: 2000,
    timeout: 3000,
  },
  api: {
    transport: 'http',
    ports: [8001, 8002, 8003, 8004],
  },
};
