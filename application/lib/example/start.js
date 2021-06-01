({
  privateField: 100,

  async method() {
    console.log('Start example plugin');
    this.parent.cache.set({ key: 'keyName', val: this.privateField });
    const res = lib.example.cache.get({ key: 'keyName' });
    console.log({ res, cache: this.parent.cache.values });
  },
});
