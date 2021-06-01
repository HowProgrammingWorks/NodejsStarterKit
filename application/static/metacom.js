class MetacomError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

class MetacomInterface {
  constructor() {
    this._events = new Map();
  }

  on(name, fn) {
    const event = this._events.get(name);
    if (event) event.add(fn);
    else this._events.set(name, new Set([fn]));
  }

  emit(name, ...args) {
    const event = this._events.get(name);
    if (!event) return;
    for (const fn of event.values()) fn(...args);
  }
}

export class Metacom {
  constructor(url) {
    this.url = url;
    this.socket = new WebSocket(url);
    this.api = {};
    this.callId = 0;
    this.calls = new Map();
    this.socket.addEventListener('message', ({ data }) => {
      this.message(data);
    });
  }

  message(data) {
    let packet;
    try {
      packet = JSON.parse(data);
    } catch (err) {
      console.error(err);
      return;
    }
    const [callType, target] = Object.keys(packet);
    const callId = packet[callType];
    const args = packet[target];
    if (callId && args) {
      if (callType === 'callback') {
        const promised = this.calls.get(callId);
        if (!promised) return;
        const [resolve, reject] = promised;
        if (packet.error) {
          const { message, code } = packet.error;
          const error = new MetacomError(message, code);
          reject(error);
          return;
        }
        resolve(args);
        return;
      }
      if (callType === 'event') {
        const [interfaceName, eventName] = target.split('/');
        const metacomInterface = this.api[interfaceName];
        metacomInterface.emit(eventName, args);
      }
    }
  }

  ready() {
    return new Promise((resolve) => {
      if (this.socket.readyState === WebSocket.OPEN) resolve();
      else this.socket.addEventListener('open', resolve);
    });
  }

  async load(...interfaces) {
    const introspect = this.httpCall('system')('introspect');
    const introspection = await introspect(interfaces);
    const available = Object.keys(introspection);
    for (const interfaceName of interfaces) {
      if (!available.includes(interfaceName)) continue;
      const methods = new MetacomInterface();
      const iface = introspection[interfaceName];
      const request = this.socketCall(interfaceName);
      const methodNames = Object.keys(iface);
      for (const methodName of methodNames) {
        methods[methodName] = request(methodName);
      }
      this.api[interfaceName] = methods;
    }
  }

  httpCall(iname, ver) {
    return (methodName) =>
      (args = {}) => {
        const callId = ++this.callId;
        const interfaceName = ver ? `${iname}.${ver}` : iname;
        const target = interfaceName + '/' + methodName;
        const packet = { call: callId, [target]: args };
        const dest = new URL(this.url);
        const protocol = dest.protocol === 'ws:' ? 'http' : 'https';
        const url = `${protocol}://${dest.host}/api`;
        return fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(packet),
        }).then((res) => {
          const { status } = res;
          if (status === 200) return res.json().then(({ result }) => result);
          throw new Error(`Status Code: ${status}`);
        });
      };
  }

  socketCall(iname, ver) {
    return (methodName) =>
      async (args = {}) => {
        const callId = ++this.callId;
        const interfaceName = ver ? `${iname}.${ver}` : iname;
        const target = interfaceName + '/' + methodName;
        await this.ready();
        return new Promise((resolve, reject) => {
          this.calls.set(callId, [resolve, reject]);
          const packet = { call: callId, [target]: args };
          this.socket.send(JSON.stringify(packet));
        });
      };
  }
}
