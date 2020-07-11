'use strict';

const api = require('./dependencies.js');
const { path, events, vm, fs, fsp } = api;
const security = require('./security.js');

const SCRIPT_OPTIONS = { timeout: 5000 };
const EMPTY_CONTEXT = Object.freeze({});
const DIRS = ['static', 'domain', 'api'];

class Application extends events.EventEmitter {
  constructor() {
    super();
    this.finalization = false;
    this.namespaces = ['db'];
    this.path = process.cwd();
    this.staticPath = path.join(this.path, 'static');
  }

  async init() {
    this.createSandbox();
    for (const name of DIRS) {
      this[name] = new Map();
      await this.loadPlace(name, path.join(this.path, name));
    }
  }

  async shutdown() {
    this.finalization = true;
    await this.server.close();
  }

  createSandbox() {
    const introspect = async () => [...this.api.keys()];
    const application = { security, introspect };
    for (const name of this.namespaces) application[name] = this[name];
    const sandbox = {
      console: this.logger, Buffer, application, api,
      setTimeout, setImmediate, setInterval,
      clearTimeout, clearImmediate, clearInterval,
    };
    this.sandbox = vm.createContext(sandbox);
  }

  sandboxInject(name, module) {
    this[name] = Object.freeze(module);
    this.namespaces.push(name);
  }

  async createScript(fileName) {
    const code = await fsp.readFile(fileName, 'utf8');
    const src = '\'use strict\';\ncontext => ' + code;
    const options = { filename: fileName, lineOffset: -1 };
    try {
      const script = new vm.Script(src, options);
      return script.runInContext(this.sandbox, SCRIPT_OPTIONS);
    } catch (err) {
      this.logger.error(err.stack);
      return null;
    }
  }

  runScript(methodName, session) {
    const script = this.api.get(methodName);
    if (!script) return null;
    const exp = script(session ? session.context : EMPTY_CONTEXT);
    return typeof exp !== 'object' ? { access: 'logged', method: exp } : exp;
  }

  async loadFile(filePath) {
    const key = filePath.substring(this.staticPath.length);
    try {
      const data = await fsp.readFile(filePath);
      this.static.set(key, data);
    } catch (err) {
      this.logger.error(err.stack);
      if (err.code !== 'ENOENT') throw err;
    }
  }

  async loadScript(place, fileName) {
    const { name, ext } = path.parse(fileName);
    if (ext !== '.js' || name.startsWith('.')) return;
    const script = await this.createScript(fileName);
    const scripts = this[place];
    if (!script) {
      scripts.delete(name);
      return;
    }
    if (place === 'domain') {
      const config = this.config.sections[name];
      this.sandbox.application[name] = { config };
      const exp = script(EMPTY_CONTEXT);
      if (config) exp.config = config;
      this.sandbox.application[name] = exp;
      this.sandboxInject(name, exp);
      if (exp.start) exp.start();
    } else {
      scripts.set(name, script);
    }
  }

  async loadPlace(place, placePath) {
    const files = await fsp.readdir(placePath, { withFileTypes: true });
    for (const file of files) {
      const filePath = path.join(placePath, file.name);
      if (place !== 'static') await this.loadScript(place, filePath);
      else if (file.isDirectory()) await this.loadPlace(place, filePath);
      else await this.loadFile(filePath);
    }
    fs.watch(placePath, (event, fileName) => {
      const filePath = path.join(placePath, fileName);
      if (place === 'static') this.loadFile(filePath);
      else this.loadScript(place, filePath);
    });
  }
}

module.exports = new Application();
