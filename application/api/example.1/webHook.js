({
  access: 'public',
  method: async ({ ...args }) => {
    console.debug({ webHook: args });
    return { result: 'success' };
  }
});
