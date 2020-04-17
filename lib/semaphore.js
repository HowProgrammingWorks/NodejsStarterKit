'use strict';

class CountingSemaphore {
  constructor(concurrency) {
    this.counter = concurrency;
    this.queue = [];
  }

  enter() {
    return new Promise(resolve => {
      if (this.counter > 0) {
        this.counter--;
        resolve();
        return;
      }
      this.queue.push(resolve);
    });
  }

  leave() {
    if (this.queue.length === 0) {
      this.counter++;
      return;
    }
    const resolve = this.queue.shift();
    resolve();
  }
}

module.exports = CountingSemaphore;
