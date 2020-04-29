'use strict';

const buildAPI = methods => {
  const api = {};
  for (const method of methods) {
    api[method] = (args = {}) => new Promise((resolve, reject) => {
      const url = `/api/${method}`;
      console.log(url, args);
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      }).then(res => {
        const { status } = res;
        if (status === 200) resolve(res.json());
        else reject(new Error(`Status Code: ${status}`));
      });
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

scenario();
