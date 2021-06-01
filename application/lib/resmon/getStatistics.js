() => {
  const { heapTotal, heapUsed, external } = node.process.memoryUsage();
  const hs = node.v8.getHeapStatistics();
  const contexts = hs.number_of_native_contexts;
  const detached = hs.number_of_detached_contexts;
  return { heapTotal, heapUsed, external, contexts, detached };
};
