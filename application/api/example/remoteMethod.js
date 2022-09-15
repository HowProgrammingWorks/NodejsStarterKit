({
  access: 'public',
  method: async ({ ...args }) => {
    console.debug({ remoteMethod: args });
    return { result: 'success' };
  },
});
