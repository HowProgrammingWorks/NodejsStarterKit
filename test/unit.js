'use strict';

const tests = ['config', 'logger', 'db', 'server', 'sessions', 'application'];

for (const name of tests) {
  console.log(`Test unit: ${name}`);
  require(`./unit.${name}.js`);
}
