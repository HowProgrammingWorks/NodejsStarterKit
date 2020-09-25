({
  parameters: {
    a: 'number',
    b: 'number',
  },

  method({ a, b }) {
    console.log({ a, b });
    return a + b;
  },

  returns: 'number',
});
