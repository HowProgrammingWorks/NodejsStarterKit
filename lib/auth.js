// This file is for Sessions & user authification
// And everything which is necessary for it
'use strict';

const { crypto, common } = require('./dependencies.js');
const application = require('./application.js');

const BYTE  = 256;
const TOKEN = 'token';
const TOKEN_LENGTH = 32;
const ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHA_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const ALPHA = ALPHA_UPPER + ALPHA_LOWER;
const DIGIT = '0123456789';
const ALPHA_DIGIT = ALPHA + DIGIT;
const EPOCH = 'Thu, 01 Jan 1970 00:00:00 GMT';
const FUTURE = 'Fri, 01 Jan 2100 00:00:00 GMT';
const LOCATION = 'Path=/; Domain';
const COOKIE_DELETE = `${TOKEN}=deleted; Expires=${EPOCH}; ${LOCATION}=`;
const COOKIE_HOST = `Expires=${FUTURE}; ${LOCATION}`;

// Create collections for session & cache
const sessions = new Map();
const cache = new WeakMap();

// Create Token
const generateToken = () => {
  const base = ALPHA_DIGIT.length; // Number of bytes to generate
  const bytes = crypto.randomBytes(base); // Generates cryptographically strong pseudo-random data
  let key = '';
  for (let i = 0; i < TOKEN_LENGTH; i++) { // Create key
    const index = ((bytes[i] * base) / BYTE) | 0;
    key += ALPHA_DIGIT[index];
  }
  return key;
};

// Parse cookies
const parseCookies = cookie => {
  const values = {};
  const items = cookie.split(';');
  for (const item of items) {
    const parts = item.split('=');
    const key = parts[0].trim();
    const val = parts[1] || '';
    values[key] = val.trim();
  }
  return values;
};

module.exports = () => {
  // Reference to class which handle database
  const { db } = application;

  // Save token to PostgreSQL; Table: Session
  const save = (token, context) => {
    const data = JSON.stringify(context);
    db.update('Session', { data }, { token });
  };

  class Session {
    constructor(token, contextData = { token }) {
      // Handler for Proxy 
      const contextHandler = {
        get: (data, key) => {
          if (key === 'token') return this.token;
          return Reflect.get(data, key); // Get data by key in provided object
        },
        set: (data, key, value) => { 
          const res = Reflect.set(data, key, value); // Set data by key in provided object
          save(token, this.data); // Save token
          return res;
        }
      };
      this.token = token; 
      this.data = contextData;
      this.context = new Proxy(contextData, contextHandler); // Set up Proxy
    }
  }

  // Start session
  // Create Session and save it in
  // database and cache. 
  const start = (client, userId) => {
    const token = generateToken(); 
    const host = common.parseHost(client.req.headers.host); 
    const ip = client.req.connection.remoteAddress;
    const cookie = `${TOKEN}=${token}; ${COOKIE_HOST}=${host}; HttpOnly`; 
    const session = new Session(token);
    sessions.set(token, session); 
    cache.set(client.req, session); 
    const data = JSON.stringify(session.data);
    db.insert('Session', { userId, token, ip, data }); // Save user's session to database
    if (client.res) client.res.setHeader('Set-Cookie', cookie); // Set header for cookie
    return session;
  };

  // Restore session
  // If user want to reconnect
  // until server shutdowns he restores from cache
  // else if server restarts/shutdowns/crashs by the accident
  // session can be restored from database.
  const restore = async client => {
    const cachedSession = cache.get(client.req); // Search for session in cache
    if (cachedSession) return cachedSession;
    const { cookie } = client.req.headers; // Search on cookies 
    if (!cookie) return null;
    const cookies = parseCookies(cookie);
    const { token } = cookies; // Get token to restore session from collection
    if (!token) return null;
    let session = sessions.get(token);
    if (!session) { // If session still not found go in database for it
      const [record] = await db.select('Session', ['Data'], { token });
      if (record && record.data) {
        const data = JSON.parse(record.data);
        session = new Session(token, data);
        sessions.set(token, session);
      }
    }
    if (!session) return null;
    cache.set(client.req, session);
    return session;
  };

  // Delete Session
  const remove = (client, token) => {
    const host = common.parseHost(client.req.headers.host);
    client.res.setHeader('Set-Cookie', COOKIE_DELETE + host);
    sessions.delete(token);
    db.delete('Session', { token });
  };

  // Register User
  const registerUser = (login, password, fullName) => {
    db.insert('SystemUser', { login, password, fullName }); // Simply insert new user to database
  };

  // Get User
  const getUser = login => db // Simply insert get user to database
    .select('SystemUser', ['Id', 'Password'], { login })
    .then(([user]) => user);

  return Object.freeze({ start, restore, remove, save, registerUser, getUser });
};
