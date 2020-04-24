'use strict';

class CountingSemaphore {
  constructor(concurrency, timeout) {
    this.counter = concurrency;
    this.timeout = timeout;
    this.queue = [];
  }

  enter() {
    return new Promise((resolve, reject) => {
      if (this.counter > 0) {
        this.counter--;
        resolve();
        return;
      }
      const timer = setTimeout(reject, this.timeout);
      this.queue.push({ resolve, timer });
    });
  }

  leave() {
    if (this.queue.length === 0) {
      this.counter++;
      return;
    }
    const { resolve, timer } = this.queue.shift();
    clearTimeout(timer);
    resolve();
  }
}

module.exports = CountingSemaphore;
