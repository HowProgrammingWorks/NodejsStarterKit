async () => {
  if (!context.counter) context.counter = 1;
  else context.counter++;
  return { result: context.counter };
};
