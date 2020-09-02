// Save way to load config using sandboxes
'use strict';

const { path, fsp, vm } = require('./dependencies.js');

const SCRIPT_OPTIONS = { timeout: 5000 };

class Config {
  // Prepare sandbox
  constructor(configPath) {
    this.sections = {};
    this.path = configPath;
    this.sandbox = vm.createContext({});
    return this.load();
  }

  // Load files from dir
  async load() {
    const files = await fsp.readdir(this.path);
    for (const fileName of files) {
      await this.loadFile(fileName);
    }
    return this;
  }

  // Get data from Config
  async loadFile(fileName) {
    const { name, ext } = path.parse(fileName);
    if (ext !== '.js') return; // Prevent reading wrong files
    const configFile = path.join(this.path, fileName);
    const code = await fsp.readFile(configFile, 'utf8'); // Read file
    const src = `'use strict';\n${code}`; 
    const options = { filename: configFile, lineOffset: -1 };
    const script = new vm.Script(src, options); // Create sctipt
    const exports = script.runInContext(this.sandbox, SCRIPT_OPTIONS); // Get data
    this.sections[name] = exports;
  }
}

module.exports = Config;
