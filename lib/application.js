'use strict';

const vm = require('vm');
const fs = require('fs').promises;
const EventEmitter = require('events');
const path = require('path');

const curDir = process.cwd();

const Config = require('./config.js');
const Logger = require('./logger.js');
const Database = require('./db.js');
const Server = require('./server.js');
const Sessions = require('./sessions.js');

const SCRIPT_OPTIONS = { timeout: 5000 };

class Application extends EventEmitter {
  constructor({ domain = null }) {
    super();
    this.finalization = false;
    this.path = curDir;
    this.domain = domain;
    const configPath = path.join(curDir, 'config');
    this.config = new Config(configPath);
    const logPath = path.join(curDir, 'application.log');
    this.logger = new Logger(logPath);
    this.sandbox = this.createSandbox();
    this.db = null;
    this.server = null;
    this.state = new Map();
    this.config.on('loaded', () => {
      const { sections } = this.config;
      this.db = new Database(sections.database, this);
      this.server = new Server(sections.server, this);
      this.sessions = new Sessions(this.db);
      this.emit('started');
    });
    global.application = this;
  }

  async shutdown() {
    this.finalization = true;
    await this.server.close();
    await this.freeResources();
  }

  async freeResources() {
    application.logger.log('Free resources');
  }

  createSandbox() {
    const sandbox = {
      console: this.logger,
      application: this,
    };
    sandbox.global = sandbox;
    return vm.createContext(sandbox);
  }

  async createScript(fileName) {
    const code = await fs.readFile(fileName, 'utf8');
    const src = `'use strict';\ncontext => ${code}`;
    let script;
    try {
      script = new vm.Script(src);
    } catch (err) {
      console.dir(err);
      return null;
    }
    try {
      return script.runInContext(this.sandbox, SCRIPT_OPTIONS);
    } catch (err) {
      console.dir(err);
      return null;
    }
  }
}

module.exports = Application;
