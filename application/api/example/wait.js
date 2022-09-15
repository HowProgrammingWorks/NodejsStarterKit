async ({ delay }) =>
  new Promise((resolve) => {
    setTimeout(resolve, delay, 'done');
  });
