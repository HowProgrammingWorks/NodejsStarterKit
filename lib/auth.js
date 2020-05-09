'use strict';

const { crypto } = require('./dependencies.js');

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
const SANDBOX_POOL = 20;

const sessions = new Map();
const cache = new WeakMap();
const pool = [];

const generateToken = () => {
  const base = ALPHA_DIGIT.length;
  const bytes = crypto.randomBytes(base);
  let key = '';
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    const index = ((bytes[i] * base) / BYTE) | 0;
    key += ALPHA_DIGIT[index];
  }
  return key;
};

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

const parseHost = host => {
  const portOffset = host.indexOf(':');
  if (portOffset > -1) return host.substr(0, portOffset);
  return host;
};

module.exports = application => {
  let timer = null;
  const { db } = application;

  const fillPool = () => {
    const need = SANDBOX_POOL - pool.length;
    for (let i = 0; i < need; i++) {
      const sandbox = application.createSandbox();
      pool.push(sandbox);
    }
  };

  const getSandbox = () => {
    if (timer === null) {
      timer = setTimeout(() => {
        fillPool();
        timer = null;
      }, 0);
    }
    if (pool.length > 0) return pool.pop();
    return application.createSandbox();
  };

  const save = (token, context) => {
    const data = JSON.stringify(context);
    db.update('Session', { data }, { token });
  };

  class Session {
    constructor(token, cookie, sandbox, contextData = { token }) {
      const contextHandler = {
        set: (data, key, value) => {
          const res = Reflect.set(data, key, value);
          save(token, this.data);
          return res;
        }
      };
      this.token = token;
      this.cookie = cookie;
      this.sandbox = sandbox;
      this.data = contextData;
      this.context = new Proxy(contextData, contextHandler);
    }
  }

  const start = (req, ip, userId) => {
    const token = generateToken();
    const host = parseHost(req.headers.host);
    const cookie = `${TOKEN}=${token}; ${COOKIE_HOST}=${host}; HttpOnly`;
    const sandbox = getSandbox();
    const session = new Session(token, cookie, sandbox);
    sessions.set(token, session);
    cache.set(req, session);
    const data = JSON.stringify(session.data);
    db.insert('Session', { userId, token, ip, data });
    return session;
  };

  const restore = async req => {
    const cachedSession = cache.get(req);
    if (cachedSession) return cachedSession;
    const { cookie } = req.headers;
    if (!cookie) return null;
    const cookies = parseCookies(cookie);
    const token = cookies.token;
    if (!token) return null;
    let session = sessions.get(token);
    if (!session) {
      const [record] = await db.select('Session', ['Data'], { token });
      if (record.data) {
        const data = JSON.parse(record.data);
        const sandbox = getSandbox();
        session = new Session(token, cookie, sandbox, data);
        sessions.set(token, session);
      }
    }
    if (!session) return null;
    cache.set(req, session);
    return session;
  };

  const remove = (req, res, token) => {
    const host = parseHost(req.headers.host);
    res.setHeader('Set-Cookie', COOKIE_DELETE + host);
    sessions.delete(token);
    db.delete('Session', { token });
  };

  const registerUser = (login, password, fullName) => {
    db.insert('SystemUser', { login, password, fullName });
  };

  const getUser = login => db
    .select('SystemUser', ['Id', 'Password'], { login })
    .then(([user]) => user);

  return { fillPool, start, restore, remove, save, registerUser, getUser };
};
