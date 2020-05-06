({
  host: '127.0.0.1',
  transport: 'http',
  ports: [8000, 8001, 8002, 8003],
  timeout: 5000,
  concurrency: 1000,
  queue: {
    size: 2000,
    timeout: 3000,
  },
});
