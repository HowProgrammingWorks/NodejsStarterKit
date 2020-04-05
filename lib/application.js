'use strict';

const vm = require('vm');
const fs = require('fs');
const fsp = fs.promises;
const EventEmitter = require('events');
const path = require('path');

const Config = require('./config.js');
const Logger = require('./logger.js');
const Database = require('./db.js');
const Server = require('./server.js');
const Sessions = require('./sessions.js');

const curDir = process.cwd();
const API_PATH = path.join(curDir, './api');
const STATIC_PATH = path.join(curDir, './static');
const STATIC_PATH_LENGTH = STATIC_PATH.length;
const SCRIPT_OPTIONS = { timeout: 5000 };

class Application extends EventEmitter {
  constructor({ domain = null }) {
    super();
    this.finalization = false;
    this.api = new Map();
    this.cache = new Map();
    this.path = curDir;
    this.domain = domain;
    const configPath = path.join(curDir, 'config');
    this.config = new Config(configPath);
    const logPath = path.join(curDir, 'application.log');
    this.logger = new Logger(logPath);
    this.sandbox = this.createSandbox();
    this.db = null;
    this.server = null;
    this.config.on('loaded', () => {
      const { sections } = this.config;
      this.db = new Database(sections.database, this);
      this.server = new Server(sections.server, this);
      this.sessions = new Sessions(this.db);
      this.emit('started');
    });
    this.cacheDirectory(STATIC_PATH);
    this.cacheMethods();
  }

  async shutdown() {
    this.finalization = true;
    await this.server.close();
    await this.freeResources();
  }

  async freeResources() {
    this.logger.log('Free resources');
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
    const code = await fsp.readFile(fileName, 'utf8');
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

  async cacheFile(filePath) {
    const key = filePath.substring(STATIC_PATH_LENGTH);
    try {
      const data = await fsp.readFile(filePath, 'utf8');
      this.cache.set(key, data);
    } catch (err) {
      this.logger.error(err.stack);
      if (err.code !== 'ENOENT') throw err;
    }
  }

  async cacheDirectory(directoryPath) {
    const files = await fsp.readdir(directoryPath, { withFileTypes: true });
    for (const file of files) {
      const filePath = path.join(directoryPath, file.name);
      if (file.isDirectory()) await this.cacheDirectory(filePath);
      else await this.cacheFile(filePath);
    }
    fs.watch(directoryPath, (event, fileName) => {
      const filePath = path.join(directoryPath, fileName);
      this.cacheFile(filePath);
    });
  }

  async cacheMethod(fileName) {
    const { name, ext } = path.parse(fileName);
    if (ext !== '.js') return;
    try {
      const method = await this.createScript(fileName);
      this.api.set(name, method);
    } catch (err) {
      this.logger.error(err.stack);
      this.api.delete(name);
    }
  }

  async cacheMethods() {
    const files = await fsp.readdir(API_PATH);
    for (const fileName of files) {
      const filePath = path.join(API_PATH, fileName);
      await this.cacheMethod(filePath);
    }
    fs.watch(API_PATH, (event, fileName) => {
      const filePath = path.join(API_PATH, fileName);
      this.cacheMethod(filePath);
    });
  }
}

module.exports = Application;
