'use strict';

const { node } = require('./lib/dependencies.js');
const { fsp, path } = node;
const application = require('./lib/application.js');
const Config = require('./lib/config.js');
const Logger = require('./lib/logger.js');
const Database = require('./lib/database.js');
const Server = require('./lib/server.js');
const Channel = require('./lib/channel.js');
const initAuth = require('./lib/auth.js');

const loadCert = async (certPath) => {
  const key = await fsp.readFile(path.join(certPath, 'key.pem'));
  const cert = await fsp.readFile(path.join(certPath, 'cert.pem'));
  return { key, cert };
};

const main = async () => {
  const configPath = path.join(application.path, 'config');
  const config = await new Config(configPath);
  const logPath = path.join(application.root, 'log');
  const logger = await new Logger(logPath);
  Object.assign(application, { config, logger });

  const logError = (err) => {
    logger.error(err ? err.stack : 'No exception stack available');
  };

  process.on('uncaughtException', logError);
  process.on('warning', logError);
  process.on('unhandledRejection', logError);

  const certPath = path.join(application.path, 'cert');
  const cert = await loadCert(certPath).catch(() => {
    logError(new Error('Can not load TLS certificates'));
  });

  application.db = new Database(config.database);
  application.auth = initAuth();
  application.sandboxInject('auth', application.auth);

  const { ports } = config.server;
  const options = { cert, application, Channel };
  for (const port of ports) {
    application.server = new Server(config.server, options);
    logger.system(`Listen port ${port}`);
  }

  await application.init();
  logger.system('Application started');

  const stop = () => {
    process.exit(0);
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
};

main();
