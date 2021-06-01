({
  values: new Map(),

  set({ key, val }) {
    console.log({ set: { key, val } });
    return this.values.set(key, val);
  },

  get({ key }) {
    console.log({ get: key });
    const res = this.values.get(key);
    console.log({ return: res });
    return res;
  },
});
