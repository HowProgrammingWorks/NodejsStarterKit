'use strict';

const { join } = require('path');
const { readdir } = require('fs').promises;

class Config {
  constructor(path) {
    this.sections = {};
    this.path = path;
    return this.load();
  }

  async load() {
    const files = await readdir(this.path);
    const sections = files.map(file => this.loadFile(file));
    await Promise.all(sections);
    return this;
  }

  async loadFile(file) {
    const configFile = join(this.path, file);
    const sectionName = file.substring(0, file.indexOf('.'));
    const exports = require(configFile);
    this.sections[sectionName] = exports;
  }
}

module.exports = Config;
