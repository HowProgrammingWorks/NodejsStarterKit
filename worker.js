'use strict';

const PATH = process.cwd();

const { worker, fsp, path } = require('./lib/dependencies.js');
const { threadId } = worker;

const Application = require('./lib/application.js');
const Config = require('./lib/config.js');
const Logger = require('./lib/logger.js');
const Database = require('./lib/database.js');
const Server = require('./lib/server.js');
const initAuth = require('./lib/auth.js');
const resmon = require('./domain/resmon.js');
const utils = require('./domain/utils.js');
const startMonitoring = require('./init/logResources.js');

(async () => {
  const configPath = path.join(PATH, 'config');
  const config = await new Config(configPath);
  const logPath = path.join(PATH, 'log');
  const logger = await new Logger(logPath, threadId);
  const application = new Application();
  const certPath = path.join(PATH, 'cert');
  const key = await fsp.readFile(path.join(certPath, 'key.pem'));
  const cert = await fsp.readFile(path.join(certPath, 'cert.pem'));
  Object.assign(application, { config, logger, cert });
  application.cert = { key, cert };
  application.db = new Database(config.sections.database, application);
  application.server = new Server(config.sections.server, application);
  application.auth = initAuth(application);
  application.sandboxInject({ auth: application.auth, utils, resmon });
  application.sandbox = application.createSandbox();
  application.auth.fillPool();
  startMonitoring(application);
  logger.log(`Application started in worker ${threadId}`);

  worker.parentPort.on('message', async message => {
    if (message.name === 'stop') {
      if (application.finalization) return;
      logger.log(`Graceful shutdown in worker ${threadId}`);
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
