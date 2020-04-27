'use strict';

const tests = ['config', 'logger', 'db', 'security', 'semaphore'];

for (const name of tests) {
  console.log(`Test unit: ${name}`);
  require(`./unit.${name}.js`);
}
