'use strict';

const registerServiceWorker = () => {
  if (!Reflect.has(navigator, 'serviceWorker')) {
    console.log('Service workers are not supported');
    return;
  }
  const { serviceWorker } = navigator;
  serviceWorker.register('/worker.js').then(registration => {
    if (registration.installing) {
      console.log('Service worker installing');
      console.log(registration.installing);
      return;
    }
    if (registration.waiting) {
      console.log('Service worker installed');
      console.log(registration.waiting);
      return;
    }
    if (registration.active) {
      console.log('Service worker active');
      console.log(registration.active);
      return;
    }
  }).catch(error => {
    console.log('Registration failed');
    console.log(error);
  });
};

window.addEventListener('load', registerServiceWorker);

// API Builder

const buildAPI = (methods, socket = null) => {
  const api = {};
  for (const method of methods) {
    api[method] = (args = {}) => new Promise((resolve, reject) => {
      console.log({ method, args });
      if (socket) {
        socket.send(JSON.stringify({ method, args }));
        socket.onmessage = event => {
          const obj = JSON.parse(event.data);
          if (obj.result !== 'error') resolve(obj);
          else reject(new Error(`Status Code: ${status}`));
        };
      } else {
        fetch(`/api/${method}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args),
        }).then(res => {
          const { status } = res;
          if (status === 200) resolve(res.json());
          else reject(new Error(`Status Code: ${status}`));
        });
      }
    });
  }
  return api;
};

const socket = new WebSocket('ws://127.0.0.1:8000/');

const api = buildAPI([
  'registerUser',
  'signIn',
  'status',
  'citiesByCountry',
  'countries',
  'resmon',
  'counter',
], socket);

// Console Emulation

const ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHA_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const ALPHA = ALPHA_UPPER + ALPHA_LOWER;
const DIGIT = '0123456789';
const CHARS = ALPHA + DIGIT;
const TIME_LINE = 300;
const TIME_CHAR = 20;

const KEY_CODE = {
  BACKSPACE: 8, TAB: 9, ENTER: 13, PAUSE: 19, ESC: 27, SPACE: 32,
  PGUP: 33, PGDN: 34, END: 35, HOME: 36,
  LT: 37, UP: 38, RT: 39, DN: 40, INS: 45, DEL: 46,
  F1: 112, F2: 113, F3: 114, F4: 115, F5: 116, F6: 117,
  F7: 118, F8: 119, F9: 120, F10: 121, F11: 122, F12: 123,
  ACCENT: 192,
};

const KEY_NAME = {};
for (const keyName in KEY_CODE) KEY_NAME[KEY_CODE[keyName]] = keyName;

let controlKeyboard, panelScroll;
let controlInput, controlBrowse, controlScroll;

const pad = (padChar, length) => new Array(length + 1).join(padChar);

const isMobile = () => (
  navigator.userAgent.match(/Android/i) ||
  navigator.userAgent.match(/webOS/i) ||
  navigator.userAgent.match(/iPhone/i) ||
  navigator.userAgent.match(/iPad/i) ||
  navigator.userAgent.match(/iPod/i) ||
  navigator.userAgent.match(/BlackBerry/i) ||
  navigator.userAgent.match(/Windows Phone/i)
);

let viewportHeight, viewableRatio;
let contentHeight, scrollHeight;
let thumbHeight, thumbPosition;

const refreshScroll = () => {
  viewportHeight = controlBrowse.offsetHeight;
  contentHeight = controlBrowse.scrollHeight;
  viewableRatio = viewportHeight / contentHeight;
  scrollHeight = panelScroll.offsetHeight;
  thumbHeight = scrollHeight * viewableRatio;
  thumbPosition = controlBrowse.scrollTop * thumbHeight / viewportHeight;
  controlScroll.style.top = thumbPosition + 'px';
  controlScroll.style.height = thumbHeight + 'px';
};

const scrollBottom = () => {
  refreshScroll();
  controlBrowse.scrollTop = controlBrowse.scrollHeight;
};

const initScroll = () => {
  controlBrowse.scrollTop = controlBrowse.scrollHeight;
  controlBrowse.addEventListener('scroll', refreshScroll);
  window.addEventListener('orientationchange', () => {
    setTimeout(scrollBottom, 0);
  });
};

const showKeyboard = () => {
  if (!isMobile()) return;
  controlKeyboard.style.display = 'block';
  controlBrowse.style.bottom = controlKeyboard.offsetHeight + 'px';
};

const inputSetValue = value => {
  controlInput.inputValue = value;
  if (controlInput.inputType === 'masked') {
    value = pad('*', value.length);
  }
  value = value.replace(/ /g, '&nbsp;');
  controlInput.innerHTML = (
    controlInput.inputPrompt + value + '<span>&block;</span>'
  );
};

const input = (type, prompt, callback) => {
  showKeyboard();
  controlInput.style.display = 'none';
  controlBrowse.removeChild(controlInput);
  controlInput.inputActive = true;
  controlInput.inputPrompt = prompt;
  inputSetValue('');
  controlInput.inputType = type;
  controlInput.inputCallback = callback;
  controlBrowse.appendChild(controlInput);
  controlInput.style.display = 'block';
  setTimeout(scrollBottom, 0);
};

const clear = () => {
  const elements = controlBrowse.children;
  for (let i = elements.length - 2; i > 1; i--) {
    const element = elements[i];
    controlBrowse.removeChild(element);
  }
};

const print = s => {
  const list = Array.isArray(s);
  let line = list ? s.shift() : s;
  if (!line) line = '';
  const element = document.createElement('div');
  if (!line) line = '\xa0';
  if (line.charAt(0) === '<') {
    element.innerHTML += line;
  } else {
    const timer = setInterval(() => {
      const char = line.charAt(0);
      element.innerHTML += char;
      line = line.substr(1);
      if (!line) clearInterval(timer);
      controlBrowse.scrollTop = controlBrowse.scrollHeight;
      scrollBottom();
    }, TIME_CHAR);
  }
  if (list && s.length) setTimeout(print, TIME_LINE, s);
  controlBrowse.insertBefore(element, controlInput);
  controlBrowse.scrollTop = controlBrowse.scrollHeight;
  scrollBottom();
};

const inputKeyboardEvents = {
  ESC() {
    clear();
    inputSetValue('');
  },
  BACKSPACE() {
    let value = controlInput.inputValue;
    value = value.slice(0, -1);
    inputSetValue(value);
  },
  ENTER() {
    const result = controlInput.inputValue;
    let value = result;
    if (controlInput.inputType === 'masked') {
      value = pad('*', value.length);
    }
    print(controlInput.inputPrompt + value);
    controlInput.style.display = 'none';
    controlInput.inputActive = false;
    controlInput.inputCallback(null, value);
  },
  CAPS() {
    if (controlKeyboard.className === 'caps') {
      controlKeyboard.className = '';
    } else {
      controlKeyboard.className = 'caps';
    }
  },
  KEY(char) { // Alpha or Digit
    if (controlKeyboard.className === 'caps') {
      char = char.toUpperCase();
    }
    let value = controlInput.inputValue;
    value += char;
    inputSetValue(value);
  }
};

const makeKeyboardClick = char => e => {
  char = e.target.inputChar;
  if (char === '_') char = ' ';
  let keyName = 'KEY';
  if (char === '<') keyName = 'BACKSPACE';
  if (char === '>') keyName = 'ENTER';
  if (char === '^') keyName = 'CAPS';
  const fn = inputKeyboardEvents[keyName];
  if (fn) fn(char);
  e.stopPropagation();
  return false;
};

const initKeyboard = () => {
  if (!isMobile()) return;
  controlKeyboard.style.display = 'block';
  const KEYBOARD_LAYOUT = [
    '1234567890',
    'qwertyuiop',
    'asdfghjkl<',
    '^zxcvbnm_>'
  ];
  let i, j, char, keyboardClick;
  let keyboardLine, elementKey, elementLine;
  for (i = 0; i < KEYBOARD_LAYOUT.length; i++) {
    keyboardLine = KEYBOARD_LAYOUT[i];
    elementLine = document.createElement('div');
    controlKeyboard.appendChild(elementLine);
    for (j = 0; j < keyboardLine.length; j++) {
      char = keyboardLine[j];
      if (char === ' ') char = '&nbsp;';
      elementKey = document.createElement('div');
      elementKey.innerHTML = char;
      elementKey.inputChar = char;
      elementKey.className = 'key';
      elementKey.style.opacity = ((i + j) % 2) ? 0.8 : 1;
      keyboardClick = makeKeyboardClick(char);
      elementKey.addEventListener('click', keyboardClick);
      elementLine.appendChild(elementKey);
    }
  }
  controlBrowse.style.bottom = controlKeyboard.offsetHeight + 'px';
};

document.onkeydown = event => {
  let keyName, fn;
  if (controlInput.inputActive) {
    keyName = KEY_NAME[event.keyCode];
    fn = inputKeyboardEvents[keyName];
    if (fn) {
      fn();
      return false;
    }
  }
};

document.onkeypress = event => {
  if (controlInput.inputActive) {
    const fn = inputKeyboardEvents['KEY'];
    const char = String.fromCharCode(event.keyCode);
    if (CHARS.includes(char) && fn) {
      fn(char);
      return false;
    }
  }
};

const help = [
  '', 'Commands: about, fields, team, links, stack, contacts'
];

const exec = async line => {
  const args = line.split(' ');
  const cmd = args.shift();
  const data = await api[cmd](args);
  print(data);
  commandLoop();
};

function commandLoop() {
  input('command', '.', (err, line) => {
    exec(line);
    commandLoop();
  });
}

const scenario = async () => {
  try {
    await api.status();
  } catch (err) {
    await api.signIn({ login: 'marcus', password: 'marcus' });
  }
  const data = await api.resmon();
  print('HTTP GET /api/resmon ' + JSON.stringify(data));
};

window.addEventListener('load', () => {
  panelScroll = document.getElementById('panelScroll');
  controlInput = document.getElementById('controlInput');
  controlKeyboard = document.getElementById('controlKeyboard');
  controlBrowse = document.getElementById('controlBrowse');
  controlScroll = document.getElementById('controlScroll');
  initKeyboard();
  initScroll();
  const path = window.location.pathname.substring(1);
  print([
    'Metarhia/KPI is a Research & Development Center',
    'in Kiev Polytechnic Institute (ICT faculty)',
  ].concat(help));
  if (path) {
    setTimeout(() => {
      exec('contacts ' + path);
      window.history.replaceState(null, '', '/');
    }, TIME_LINE * 3);
  }
  scenario();
  commandLoop();
});
