({
  host: '127.0.0.1',
  balancer: 3330,
  protocol: 'http',
  ports: [3331, 3332],
  timeout: 5000,
  concurrency: 1000,
  queue: {
    size: 2000,
    timeout: 3000,
  },
  workers: {
    pool: 2,
    timeout: 3000,
  },
});
