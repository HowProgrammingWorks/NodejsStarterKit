'use strict';

const { worker, fsp, path } = require('./dependencies.js');
const application = require('./application.js');

const Config = require('./config.js');
const Logger = require('./logger.js');
const Database = require('./database.js');
const Server = require('./server.js');
const initAuth = require('./auth.js');

(async () => {
  const configPath = path.join(application.path, 'config');
  const config = await new Config(configPath);
  const logPath = path.join(application.path, 'log');
  const logger = await new Logger(logPath, worker.threadId);
  const certPath = path.join(application.path, 'cert');
  Object.assign(application, { config, logger });
  try {
    const key = await fsp.readFile(path.join(certPath, 'key.pem'));
    const cert = await fsp.readFile(path.join(certPath, 'cert.pem'));
    application.cert = { key, cert };
  } catch {
    if (worker.threadId === 1) logger.log('Can not load TLS certificates');
  }
  application.db = new Database(config.sections.database);
  application.server = new Server(config.sections.server);
  application.auth = initAuth();
  application.sandboxInject('auth', application.auth);
  await application.init();
  logger.log(`Application started in worker ${worker.threadId}`);

  worker.parentPort.on('message', async message => {
    if (message.name === 'stop') {
      if (application.finalization) return;
      logger.log(`Graceful shutdown in worker ${worker.threadId}`);
      await application.shutdown();
      process.exit(0);
    }
  });

  const logError = err => {
    logger.error(err.stack);
  };

  process.on('uncaughtException', logError);
  process.on('warning', logError);
  process.on('unhandledRejection', logError);
})();
