'use strict';

const { Pool } = require('pg');

class Database {
  constructor(config) {
    this.pool = new Pool(config);
  }

  query(sql, values, callback = () => {}) {
    if (typeof values === 'function') {
      callback = values;
      values = [];
    }
    this.pool.query(sql, values, callback);
  }

  close() {
    this.pool.end();
  }
}

module.exports = Database;
