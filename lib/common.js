'use strict';

const parseHost = host => {
  const portOffset = host.indexOf(':');
  if (portOffset > -1) return host.substr(0, portOffset);
  return host;
};

const timeout = msec =>
  new Promise(resolve => {
    setTimeout(resolve, msec);
  });

const sample = arr => arr[Math.floor(Math.random() * arr.length)];

const between = (s, prefix, suffix) => {
  let i = s.indexOf(prefix);
  if (i === -1) return '';
  s = s.substring(i + prefix.length);
  if (suffix) {
    i = s.indexOf(suffix);
    if (i === -1) return '';
    s = s.substring(0, i);
  }
  return s;
};

module.exports = { parseHost, timeout, sample, between };
