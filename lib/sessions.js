'use strict';

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

const sessions = new Map();

const generateToken = () => {
  const base = ALPHA_DIGIT.length;
  let key = '';
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    const index = Math.floor(Math.random() * base);
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

class Session extends Map {
  constructor(token, cookie, sandbox) {
    super();
    this.token = token;
    this.cookie = cookie;
    this.sandbox = sandbox;
  }
}

class Sessions {
  constructor(application) {
    this.application = application;
    this.db = application.db;
  }

  start(req) {
    const token = generateToken();
    const host = parseHost(req.headers.host);
    const cookie = `${TOKEN}=${token}; ${COOKIE_HOST}=${host}; HttpOnly`;
    const sandbox = this.application.createSandbox();
    const session = new Session(token, cookie, sandbox);
    sessions.set(token, session);
    return session;
  }

  restore(req) {
    const { cookie } = req.headers;
    if (!cookie) return null;
    const cookies = parseCookies(cookie);
    const token = cookies.token;
    if (!token) return null;
    const session = sessions.get(token);
    if (!session) return null;
    return session;
  }

  delete(req, res, token) {
    const host = parseHost(req.headers.host);
    res.setHeader('Set-Cookie', COOKIE_DELETE + host);
    sessions.delete(token);
  }
}

module.exports = Sessions;
