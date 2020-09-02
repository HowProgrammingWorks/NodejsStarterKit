'use strict';

const api = require('./dependencies.js');
const { path, events, vm, fs, fsp } = api;
const security = require('./security.js');

const SCRIPT_OPTIONS = { timeout: 5000 };
const DIRS = ['static', 'domain', 'api'];

// This class created for managing static, 
// scripts and modules. All scripts run in sandboxes
// to provide safely script execution
class Application extends events.EventEmitter {  
  // Init emitter, add namespaceses, 
  // store current process path and static path 
  // for future use
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
    for (const name of DIRS) { // Create collection for each dir
      this[name] = new Map();  // Save reference for each
      await this.loadPlace(name, path.join(this.path, name)); // Load and watch folder
    }
  }

  // Shutdown server
  async shutdown() {
    this.finalization = true;
    await this.server.close(); // Server reference provided in Worker file
  }

  // Create Sandbox with limited context
  createSandbox() {
    const introspection = async () => [...this.api.keys()]; // Get all method names
    const context = Object.freeze({}); // Make context immutable
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
    this[name] = Object.freeze(module); // Make module immutable
    this.namespaces.push(name);
  }

  // Creates script from file 
  // adds 'use strict'; standart
  async createScript(fileName) {
    const code = await fsp.readFile(fileName, 'utf8'); // Async readFile to get code
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
    const { sandbox } = session || this; // If session specified use it as context
    const script = this.api.get(methodName); // Get api method loaded when server was started
    if (!script) return null; // Prevent appearence od non-existent script
    const exp = script.runInContext(sandbox, SCRIPT_OPTIONS); // Run script
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
    const { name, ext } = path.parse(fileName); // Get file name & extension
    if (ext !== '.js' || name.startsWith('.')) return; // Prevent loading non-script files
    const script = await this.createScript(fileName); // Creates script
    const scripts = this[place]; // Place where scipt stored
    if (!script) { // If no script provided delete empty value from collection
      scripts.delete(name);
      return;
    }
    if (place === 'domain') { // Adding specific context to functions from domain folder
      const config = this.config.sections[name]; // Get config for specific script
      const sandbox = this.domainSandbox; // Reference to domain collection loaded at the begining
      sandbox.application[name] = { config }; // Add config to application namespace
      const exp = script.runInContext(sandbox, SCRIPT_OPTIONS); // Run script 
      if (config) exp.config = config; // Add config to final object
      sandbox.application[name] = exp; // Add it to application namespace
      this.sandboxInject(name, exp); // Add module to application namespace
      if (exp.start) exp.start(); // Start if necessary
    } else {
      scripts.set(name, script); // Save script to collection
    }
  }

  // Load folder and watch for it's changes
  async loadPlace(place, placePath) {
    const files = await fsp.readdir(placePath, { withFileTypes: true }); // Get file list from dir
    for (const file of files) {
      const filePath = path.join(placePath, file.name); // Safely get full path
      if (place !== 'static') await this.loadScript(place, filePath); // Load script if it's api/domain folder
      else if (file.isDirectory()) await this.loadPlace(place, filePath); // Repeat for folder
      else await this.loadFile(filePath); // Load static file
    }
    fs.watch(placePath, (event, fileName) => { // Watch for changes
      const filePath = path.join(placePath, fileName); // Safely get full path
      if (place === 'static') this.loadFile(filePath); // Load static file
      else this.loadScript(place, filePath); // Load script from api/domain
    });
  }
}

module.exports = new Application(); // exports already initialized class
