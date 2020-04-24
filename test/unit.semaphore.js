'use strict';

const assert = require('assert').strict;

const CountingSemaphore = require('../lib/semaphore.js');

const sleep = msec => new Promise(resolve => {
  setTimeout(() => {
    resolve();
  }, msec);
});

assert(CountingSemaphore);
const semaphore = new CountingSemaphore(2, 1000);
assert(semaphore);

let step = 0;

(async () => {
  assert.equal(step++, 0);
  await semaphore.enter();
  assert.equal(step++, 1);
  await sleep(100);
  assert.equal(step++, 3);
  semaphore.leave();
  assert.equal(step++, 4);
})();

(async () => {
  await semaphore.enter();
  assert.equal(step++, 2);
  await sleep(200);
  assert.equal(step++, 6);
  semaphore.leave();
  assert.equal(step++, 7);
})();

(async () => {
  await semaphore.enter();
  assert.equal(step++, 5);
  await sleep(300);
  assert.equal(step++, 9);
  await sleep(2000);
})();

(async () => {
  await semaphore.enter();
  assert.equal(step++, 8);
  try {
    await semaphore.enter();
    assert.equal(step++, 12);
    assert.faile('Should not enter here');
    process.exit(1);
  } catch (err) {
    assert.equal(step++, 10);
  }
  assert.equal(step++, 11);
})();
