'use strict';

const vm = require('vm');
const fs = require('fs');
const fsp = fs.promises;
const EventEmitter = require('events');
const path = require('path');
const crypto = require('crypto');
const url = require('url');
const util = require('util');
const stream = require('stream');

const dns = require('dns');
const net = require('net');
const tls = require('tls');
const http = require('http');
const https = require('https');
const http2 = require('http2');
const dgram = require('dgram');

const security = require('./security.js');

const libs = [
  fs, path, crypto, url, util, stream, EventEmitter, Buffer, setTimeout,
  setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate,
  security, dns, net, tls, http, https, http2, dgram
];

for (const lib of libs) Object.freeze(lib);

const Config = require('./config.js');
const Logger = require('./logger.js');
const Database = require('./db.js');
const Server = require('./server.js');
const Sessions = require('./sessions.js');

const APP_PATH = process.cwd();
const API_PATH = path.join(APP_PATH, 'api');
const STATIC_PATH = path.join(APP_PATH, 'static');
const STATIC_PATH_LENGTH = STATIC_PATH.length;
const SCRIPT_OPTIONS = { timeout: 5000 };

const TLS_CERT = fs.readFileSync(path.join(APP_PATH, 'cert/cert.pem'));
const TLS_KEY = fs.readFileSync(path.join(APP_PATH, 'cert/key.pem'));

class Application extends EventEmitter {
  constructor(worker) {
    super();
    this.finalization = false;
    this.worker = worker;
    this.api = new Map();
    this.cache = new Map();
    this.path = APP_PATH;
    this.cert = { key: TLS_KEY, cert: TLS_CERT };
    const configPath = path.join(APP_PATH, 'config');
    this.config = new Config(configPath);
    const logPath = path.join(APP_PATH, 'log');
    this.logger = new Logger(logPath, this);
    this.sandbox = null;
    this.db = null;
    this.server = null;
    this.config.on('loaded', () => {
      const { sections } = this.config;
      this.db = new Database(sections.database, this);
      this.server = new Server(sections.server, this);
      this.sessions = new Sessions(this);
      this.sandbox = this.createSandbox();
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
      console: this.logger, application: { db: this.db },
      api: { fs, path, crypto, url, util, stream, security },
      EventEmitter, Buffer, setTimeout, setInterval, setImmediate,
      clearTimeout, clearInterval, clearImmediate,
      dns, net, tls, http, https, http2, dgram,
    };
    sandbox.global = sandbox;
    return vm.createContext(sandbox);
  }

  async createScript(fileName) {
    const code = await fsp.readFile(fileName, 'utf8');
    const src = `'use strict';\ncontext => ${code}`;
    try {
      return new vm.Script(src);
    } catch (err) {
      this.logger.error(err.stack);
      return null;
    }
  }

  runScript(methodName, sandbox = this.sandbox) {
    const script = this.api.get(methodName);
    if (!script) throw new Error('Not found');
    return script.runInContext(sandbox, SCRIPT_OPTIONS);
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
    if (ext !== '.js' || name.startsWith('.')) return;
    const script = await this.createScript(fileName);
    if (script) this.api.set(name, script);
    else this.api.delete(name);
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
