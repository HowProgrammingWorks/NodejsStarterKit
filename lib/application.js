// Here declared class for managing static, 
// scripts and modules. All scripts run in sandboxes
// to provide safely script execution.
'use strict';

const api = require('./dependencies.js');
const { path, events, vm, fs, fsp } = api;
const security = require('./security.js');

const SCRIPT_OPTIONS = { timeout: 5000 };
const DIRS = ['static', 'domain', 'api'];


class Application extends events.EventEmitter {  
  constructor() {
    super();
    this.finalization = false;
    this.namespaces = ['db'];
    this.path = process.cwd();
    this.staticPath = path.join(this.path, 'static');
  }

  // Create collections for each directory,
  // load each file and watch any changes
  async init() {
    for (const name of DIRS) { 
      this[name] = new Map();  
      await this.loadPlace(name, path.join(this.path, name)); 
    }
  }

  // Shutdown server
  async shutdown() {
    this.finalization = true;
    await this.server.close(); // Server reference provided in Worker file
  }

  // Create Sandbox with limited context
  createSandbox() {
    const introspection = async () => [...this.api.keys()]; 
    const context = Object.freeze({}); 
    const application = { security, context, introspection }; // Add application namespace
    for (const name of this.namespaces) application[name] = this[name];
    const sandbox = { // Add basic functions
      console: this.logger, Buffer, application, api, // Replace console with our logger
      setTimeout, setImmediate, setInterval,
      clearTimeout, clearImmediate, clearInterval,
    };
    sandbox.global = sandbox; // Add circular reference to get props with global.prop
    return vm.createContext(sandbox); 
  }

  // Add new namespaces
  sandboxInject(name, module) {
    this[name] = Object.freeze(module); 
    this.namespaces.push(name);
  }

  // Creates script from file 
  async createScript(fileName) {
    const code = await fsp.readFile(fileName, 'utf8');
    const src = '\'use strict\';\n' + code; // Add 'use strict'; at the beginning
    const options = { filename: fileName, lineOffset: -1 };
    try {
      return new vm.Script(src, options);
    } catch (err) {
      this.logger.error(err.stack);
      return null;
    }
  }

  // Runs script
  runScript(methodName, session) {
    const { sandbox } = session || this; 
    const script = this.api.get(methodName); // Get api method loaded when server was started
    if (!script) return null;
    const exp = script.runInContext(sandbox, SCRIPT_OPTIONS);
    return typeof exp !== 'object' ? { access: 'logged', method: exp } : exp;
  }

  // Load file with fs.promises
  async loadFile(filePath) {
    const key = filePath.substring(this.staticPath.length); // Key for static collection
    try {
      const data = await fsp.readFile(filePath); // Recieved data
      this.static.set(key, data); // Save data to collection
    } catch (err) {
      this.logger.error(err.stack);
      if (err.code !== 'ENOENT') throw err;
    }
  }

  // Load script
  async loadScript(place, fileName) {
    const { name, ext } = path.parse(fileName); 
    if (ext !== '.js' || name.startsWith('.')) return; // Prevent loading non-script files
    const script = await this.createScript(fileName); 
    const scripts = this[place]; // Collection where script stored
    if (!script) { // If no script provided delete empty value from collection
      scripts.delete(name);
      return;
    }
    if (place === 'domain') { // Adding specific context to functions from domain folder
      const config = this.config.sections[name];
      const sandbox = this.domainSandbox; 
      sandbox.application[name] = { config };
      const exp = script.runInContext(sandbox, SCRIPT_OPTIONS); 
      if (config) exp.config = config; 
      sandbox.application[name] = exp; // Add it to application namespace
      this.sandboxInject(name, exp); // Add module to application namespace
      if (exp.start) exp.start(); 
    } else {
      scripts.set(name, script); // Save script to collection
    }
  }

  // Load folder and watch for it's changes
  async loadPlace(place, placePath) {
    const files = await fsp.readdir(placePath, { withFileTypes: true }); // Get file list from dir
    for (const file of files) {
      const filePath = path.join(placePath, file.name); 
      if (place !== 'static') await this.loadScript(place, filePath); 
      else if (file.isDirectory()) await this.loadPlace(place, filePath); 
      else await this.loadFile(filePath); 
    }
    fs.watch(placePath, (event, fileName) => { // Watch for changes
      const filePath = path.join(placePath, fileName); 
      if (place === 'static') this.loadFile(filePath); // Load static file
      else this.loadScript(place, filePath); // Load script from api/domain
    });
  }
}

module.exports = new Application();
