async () => {
  const loadavg = node.os.loadavg();
  const stats = lib.resmon.getStatistics();
  const { heapTotal, heapUsed, external, contexts } = stats;
  const total = lib.utils.bytesToSize(heapTotal);
  const used = lib.utils.bytesToSize(heapUsed);
  const ext = lib.utils.bytesToSize(external);
  return { total, used, ext, contexts, loadavg };
};
