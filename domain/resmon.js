'use strict';

const getStatistics = () => {
  const { heapTotal, heapUsed, external } = api.process.memoryUsage();
  const hs = api.v8.getHeapStatistics();
  const contexts = hs.number_of_native_contexts;
  const detached = hs.number_of_detached_contexts;
  return { heapTotal, heapUsed, external, contexts, detached };
};

const start = () => {
  const { config } = application.resmon;
  setInterval(() => {
    const stats = application.resmon.getStatistics();
    const { heapTotal, heapUsed, external, contexts, detached } = stats;
    const total = application.utils.bytesToSize(heapTotal);
    const used = application.utils.bytesToSize(heapUsed);
    const ext = application.utils.bytesToSize(external);
    application.logger.log(`Heap: ${used} of ${total}, ext: ${ext}`);
    application.logger.log(`Contexts: ${contexts}, detached: ${detached}`);
  }, config.interval);
};

module.exports = { getStatistics, start };
