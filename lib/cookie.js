'use strict';

const UNIX_EPOCH = 'Thu, 01 Jan 1970 00:00:00 GMT';
const COOKIE_EXPIRE = 'Fri, 01 Jan 2100 00:00:00 GMT';
const COOKIE_DELETE = `=deleted; Expires=${UNIX_EPOCH}; Path=/; Domain=`;

const parseCookies = headers => {
  const values = {};
  const { cookie } = headers;
  if (!cookie) return values;
  const items = cookie.split(';');
  for (const item of items) {
    const parts = item.split('=');
    const key = parts[0].trim();
    const val = parts[1] || '';
    values[key] = val.trim();
  }
  return values;
};

const setCookie = (name, val, httpOnly = false) => {
  const { host } = this;
  const expires = `expires=${COOKIE_EXPIRE}`;
  let cookie = `${name}=${val}; ${expires}; Path=/; Domain=${host}`;
  if (httpOnly) cookie += '; HttpOnly';
  return cookie;
};

const deleteCookie = (name, host) => name + COOKIE_DELETE + host;

module.exports = {
  parseCookies,
  setCookie,
  deleteCookie,
};
