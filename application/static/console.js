import { Metacom } from './metacom.js';

const protocol = location.protocol === 'http:' ? 'ws' : 'wss';
const metacom = new Metacom(`${protocol}://${location.host}`);
const { api } = metacom;
window.api = api;

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

const { userAgent } = navigator;

const isMobile = () => (
  userAgent.match(/Android/i) ||
  userAgent.match(/webOS/i) ||
  userAgent.match(/iPhone/i) ||
  userAgent.match(/iPad/i) ||
  userAgent.match(/iPod/i) ||
  userAgent.match(/BlackBerry/i) ||
  userAgent.match(/Windows Phone/i)
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
    inputSetValue(controlInput.inputValue.slice(0, -1));
  },
  ENTER() {
    let value = controlInput.inputValue;
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
    inputSetValue(controlInput.inputValue + char);
  }
};

const keyboardClick = e => {
  let char = e.target.inputChar;
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
  for (let i = 0; i < KEYBOARD_LAYOUT.length; i++) {
    const keyboardLine = KEYBOARD_LAYOUT[i];
    const elementLine = document.createElement('div');
    controlKeyboard.appendChild(elementLine);
    for (let j = 0; j < keyboardLine.length; j++) {
      let char = keyboardLine[j];
      if (char === ' ') char = '&nbsp;';
      const elementKey = document.createElement('div');
      elementKey.innerHTML = char;
      elementKey.inputChar = char;
      elementKey.className = 'key';
      elementKey.style.opacity = ((i + j) % 2) ? 0.8 : 1;
      elementKey.addEventListener('click', keyboardClick);
      elementLine.appendChild(elementKey);
    }
  }
  controlBrowse.style.bottom = controlKeyboard.offsetHeight + 'px';
};

document.onkeydown = event => {
  if (controlInput.inputActive) {
    const keyName = KEY_NAME[event.keyCode];
    const fn = inputKeyboardEvents[keyName];
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

const blobToBase64 = blob => {
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  return new Promise(resolve => {
    reader.onloadend = () => {
      resolve(reader.result);
    };
  });
};

const uploadFile = (file, done) => {
  blobToBase64(file)
    .then(url => {
      const data = url.substring(url.indexOf(',') + 1);
      api.example.uploadFile({ name: file.name, data }).then(done);
    });
};

const upload = () => {
  const element = document.createElement('form');
  element.style.visibility = 'hidden';
  element.innerHTML = '<input id="fileSelect" type="file" multiple />';
  document.body.appendChild(element);
  const fileSelect = document.getElementById('fileSelect');
  fileSelect.click();
  fileSelect.onchange = () => {
    const files = Array.from(fileSelect.files);
    print('Uploading ' + files.length + ' file(s)');
    files.sort((a, b) => a.size - b.size);
    let i = 0;
    const uploadNext = () => {
      const file = files[i];
      uploadFile(file, () => {
        print(`name: ${file.name}, size: ${file.size} done`);
        i++;
        if (i < files.length) {
          return uploadNext();
        }
        document.body.removeChild(element);
        commandLoop();
      });
    };
    uploadNext();
  };
};

const exec = async line => {
  const args = line.split(' ');
  if (args[0] === 'upload') {
    upload();
  } else {
    const data = await api.cms.content(args);
    print(data);
  }
  commandLoop();
};

function commandLoop() {
  input('command', '.', (err, line) => {
    exec(line);
    commandLoop();
  });
}

const signIn = async () => {
  try {
    await metacom.load('auth');
    await api.auth.status();
  } catch (err) {
    await api.auth.signIn({ login: 'marcus', password: 'marcus' });
  }
  await metacom.load('example');
  api.example.on('resmon', data => print(JSON.stringify(data)));
  api.example.subscribe();
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
    'Metarhia is a Community, Technology Stack and R&D Center',
    'for Cloud Computing and Distributed Database Systems',
    '',
    'Commands: about, fields, team, links, stack, contacts',
  ]);
  if (path) {
    setTimeout(() => {
      exec('contacts ' + path);
      window.history.replaceState(null, '', '/');
    }, TIME_LINE * 3);
  }
  signIn();
  commandLoop();
});
