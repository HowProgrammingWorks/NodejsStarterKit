'use strict';

const Application = require('./lib/application.js');
const { Rect } = require('./domain/rect.js');

const domain = { Rect };
const application = new Application({ domain });

application.on('started', () => {
  application.logger.log('Application loaded');
});

process.on('SIGINT', async () => {
  console.log();
  application.logger.log('Graceful shutdown');
  await application.shutdown();
  application.logger.log('Bye');
  process.exit(0);
});
