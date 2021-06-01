async () => {
  if (config.resmon.active) {
    setInterval(() => {
      const stats = lib.resmon.getStatistics();
      const { heapTotal, heapUsed, external, contexts, detached } = stats;
      const total = lib.utils.bytesToSize(heapTotal);
      const used = lib.utils.bytesToSize(heapUsed);
      const ext = lib.utils.bytesToSize(external);
      console.debug(`Heap: ${used} of ${total}, ext: ${ext}`);
      console.debug(`Contexts: ${contexts}, detached: ${detached}`);
    }, config.resmon.interval);
  }
};
