async () => {
  setInterval(() => {
    const stats = lib.resmon.getStatistics();
    context.client.emit('example/resmon', stats);
  }, config.resmon.interval);
  return { subscribed: 'resmon' };
};
