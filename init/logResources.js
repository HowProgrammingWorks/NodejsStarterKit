'use strict';

const startMonitoring = application => {
  const config = application.config.sections.resmon;
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

module.exports = startMonitoring;
