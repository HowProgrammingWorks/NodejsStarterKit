'use strict';

const v8 = require('v8');

module.exports = application => {
  const config = application.config.sections.resmon;
  setInterval(() => {
    const { heapTotal, heapUsed, external } = process.memoryUsage();
    const total = application.utils.bytesToSize(heapTotal);
    const used = application.utils.bytesToSize(heapUsed);
    const ext = application.utils.bytesToSize(external);
    application.logger.log(`Heap: ${used} of ${total}, ext: ${ext}`);
    const hs = v8.getHeapStatistics();
    const nonc = hs.number_of_native_contexts;
    const nodc = hs.number_of_detached_contexts;
    application.logger.log(`Contexts: ${nonc}, detached: ${nodc}`);
  }, config.interval);
};
