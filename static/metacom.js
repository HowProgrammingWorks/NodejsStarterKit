export class Metacom {
  constructor(host) {
    this.socket = new WebSocket('wss://' + host);
    this.api = {};
    this.callId = 0;
    this.calls = new Map();
    this.socket.onmessage = ({ data }) => {
      try {
        const packet = JSON.parse(data);
        const { callback, event } = packet;
        const callId = callback || event;
        const promised = this.calls.get(callId);
        if (!promised) return;
        const [resolve, reject] = promised;
        if (packet.error) {
          const { code, message } = packet.error;
          const error = new Error(message);
          error.code = code;
          reject(error);
          return;
        }
        resolve(packet.result);
      } catch (err) {
        console.error(err);
      }
    };
  }

  async load(...methods) {
    for (const methodName of methods) {
      this.api[methodName] = this.socketCall(methodName);
    }
  }

  httpCall(methodName) {
    return (args = {}) => {
      const callId = ++this.callId;
      const packet = { call: callId, [methodName]: args };
      return fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packet),
      }).then(res => {
        if (res.status === 200) return res.json().then(({ result }) => result);
        throw new Error(`Status Code: ${res.status}`);
      });
    };
  }

  socketCall(methodName) {
    return (args = {}) => {
      const callId = ++this.callId;
      return new Promise((resolve, reject) => {
        this.calls.set(callId, [resolve, reject]);
        const packet = { call: callId, [methodName]: args };
        this.socket.send(JSON.stringify(packet));
      });
    };
  }
}
