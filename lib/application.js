'use strict';

const api = require('./dependencies.js');
const { path, events, vm, fs, fsp } = api;
const security = require('./security.js');

const PATH = process.cwd();
const API_PATH = path.join(PATH, 'api');
const STATIC_PATH = path.join(PATH, 'static');
const STATIC_PATH_LENGTH = STATIC_PATH.length;
const SCRIPT_OPTIONS = { timeout: 5000 };

class Application extends events.EventEmitter {
  constructor() {
    super();
    this.finalization = false;
    this.namespaces = ['db'];
    this.api = new Map();
    this.cache = new Map();
    this.path = PATH;
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
    const introspection = async () => [...this.api.keys()];
    const context = Object.freeze({});
    const application = { security, api: { introspection }, context };
    for (const name of this.namespaces) application[name] = this[name];
    const sandbox = { console: this.logger, application, Buffer, api };
    sandbox.global = sandbox;
    return vm.createContext(sandbox);
  }

  sandboxInject(namespaces) {
    const names = Object.keys(namespaces);
    for (const name of names) this[name] = Object.freeze(namespaces[name]);
    this.namespaces.push(...names);
  }

  async createScript(fileName) {
    const data = await fsp.readFile(fileName, 'utf8');
    const code = data.startsWith('({') ? data :
      `({ access: 'logged', method: ${data.trim().slice(0, -1)} });`;
    const src = `'use strict';\n${code}`;
    const options = { filename: fileName, lineOffset: -1 };
    try {
      return new vm.Script(src, options);
    } catch (err) {
      this.logger.error(err.stack);
      return null;
    }
  }

  runScript(methodName, session) {
    const sandbox = session ? session.sandbox : this.sandbox;
    const script = this.api.get(methodName);
    if (!script) return null;
    return script.runInContext(sandbox, SCRIPT_OPTIONS);
  }

  async cacheFile(filePath) {
    const key = filePath.substring(STATIC_PATH_LENGTH);
    try {
      const data = await fsp.readFile(filePath);
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
