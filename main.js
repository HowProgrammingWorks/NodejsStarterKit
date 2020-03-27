'use strict';

const Application = require('./lib/application.js');
const { Rect } = require('./domain/rect.js');

const domain = { Rect };
const application = new Application({ domain });

application.on('started', () => {
  application.logger.log('Application loaded');
});
