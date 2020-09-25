async () => {
  const loadavg = api.os.loadavg();
  const stats = application.resmon.getStatistics();
  const { heapTotal, heapUsed, external, contexts } = stats;
  const total = application.utils.bytesToSize(heapTotal);
  const used = application.utils.bytesToSize(heapUsed);
  const ext = application.utils.bytesToSize(external);
  return { total, used, ext, contexts, loadavg };
};
