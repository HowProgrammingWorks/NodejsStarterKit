'use strict';

const v8 = require('v8');

const SIZE_UNITS = ['', ' Kb', ' Mb', ' Gb', ' Tb', ' Pb', ' Eb', ' Zb', ' Yb'];

const bytesToSize = bytes => {
  if (bytes === 0) return '0';
  const exp = Math.floor(Math.log(bytes) / Math.log(1000));
  const size = bytes / 1000 ** exp;
  const short = Math.round(size, 2);
  const unit = SIZE_UNITS[exp];
  return short + unit;
};

module.exports = application => {
  const config = application.config.sections.resmon;
  setInterval(() => {
    const { heapTotal, heapUsed, external } = process.memoryUsage();
    const total = bytesToSize(heapTotal);
    const used = bytesToSize(heapUsed);
    const ext = bytesToSize(external);
    application.logger.log(`Heap: ${used} of ${total}, ext: ${ext}`);
    const hs = v8.getHeapStatistics();
    const nonc = hs.number_of_native_contexts;
    const nodc = hs.number_of_detached_contexts;
    application.logger.log(`Contexts: ${nonc}, detached: ${nodc}`);
  }, config.interval);
};
