'use strict';

const { Pool } = require('pg');

class Database {
  constructor(config) {
    this.pool = new Pool(config);
  }

  query(sql, values) {
    return this.pool.query(sql, values);
  }

  insert(table, record) {
    const keys = Object.keys(record);
    const data = new Array(keys.length);
    let i = 0;
    for (const key of keys) {
      const value = record[key];
      const type = typeof value;
      data[i++] = type === 'string' ? `'${value}'` : value.toString();
    }
    const fields = keys.join(', ');
    const values = data.join(', ');
    const sql = `INSERT INTO ${table} (${fields}) VALUES (${values})`;
    return this.pool.query(sql);
  }

  async select(table, fields = ['*'], conditions = null) {
    const keys = fields.join(', ');
    const sql = `SELECT ${keys} FROM ${table}`;
    const where = [];
    if (conditions) {
      const fields = Object.keys(conditions);
      for (const field of fields) {
        const value = conditions[field];
        const type = typeof value;
        const data = type === 'string' ? `'${value}'` : value.toString();
        where.push(`{field} = ${data}`);
      }
    }
    const res = await this.pool.query(sql + where.join(' AND '));
    return res.rows;
  }

  close() {
    this.pool.end();
  }
}

module.exports = Database;
