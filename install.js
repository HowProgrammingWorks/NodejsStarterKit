'use strict';

const fs = require('fs').promises;
const { Client } = require('pg');
const config = require('./config/database.js');

(async () => {
  console.log('Create database structure...');
  const client = new Client(config);
  client.connect();
  const query = await fs.readFile('./database.sql', 'utf8');
  client.query(query, err => {
    if (err) console.log('Error: ' + err.message);
    console.log('Done');
    client.end();
  });
})();
