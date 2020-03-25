'use strict';

const EventEmitter = require('events');
const path = require('path');
const fs = require('fs').promises;

class Config extends EventEmitter {
  constructor(configPath) {
    super();
    this.sections = {};
    this.path = configPath;
    this.load();
  }

  async load() {
    const files = await fs.readdir(this.path);
    for (const fileName of files) {
      this.loadFile(fileName);
    }
    this.emit('loaded');
  }

  loadFile(fileName) {
    const configFile = path.join(this.path, fileName);
    const sectionName = fileName.substring(0, fileName.indexOf('.'));
    const exports = require(configFile);
    this.sections[sectionName] = exports;
  }
}

module.exports = Config;
