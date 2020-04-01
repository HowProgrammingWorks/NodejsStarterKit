'use strict';

const { Pool } = require('pg');

const OPERATORS = ['>=', '<=', '<>', '>', '<'];

const where = conditions => {
  const clause = [];
  const args = [];
  let i = 0;
  for (const key in conditions) {
    let operator = '=';
    let value = conditions[key];
    if (typeof value === 'string') {
      for (const op of OPERATORS) {
        const len = op.length;
        if (value.startsWith(op)) {
          operator = op;
          value = value.substring(len);
        }
      }
      if (value.includes('*') || value.includes('?')) {
        operator = 'LIKE';
        value = value.replace(/\*/g, '%').replace(/\?/g, '_');
      }
    }
    i++;
    clause.push(`${key} ${operator} $${i}`);
    args.push(value);
  }
  return { clause: clause.join(' AND '), args };
};

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
    return this.query(sql);
  }

  async select(table, fields = ['*'], conditions = null) {
    const keys = fields.join(', ');
    const sql = `SELECT ${keys} FROM ${table}`;
    let whereClause = '';
    let args = [];
    if (conditions) {
      const whereData = where(conditions);
      whereClause = ' WHERE ' + whereData.clause;
      args = whereData.args;
    }
    const res = await this.query(sql + whereClause, args);
    return res.rows;
  }

  close() {
    this.pool.end();
  }
}

module.exports = Database;
