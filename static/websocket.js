'use strict';

const socket = new WebSocket('ws://127.0.0.1:8000/');

const buildAPI = methods => {
  const api = {};
  for (const method of methods) {
    api[method] = (args = {}) => new Promise(resolve => {
      console.log({ method, args });
      socket.send(JSON.stringify({ method, args }));
      socket.onmessage = event => {
        resolve(JSON.parse(event.data));
      };
    });
  }
  return api;
};

const api = buildAPI([
  'registerUser',
  'signIn',
  'citiesByCountry',
  'countries',
  'resmon',
  'counter',
]);

const scenario = async () => {
  await api.signIn({ login: 'marcus', password: 'marcus' });
  const data = await api.resmon();
  const output = document.getElementById('output');
  output.innerHTML = 'HTTP GET /api/resmon<br>' + JSON.stringify(data);
};

socket.onopen = scenario;
