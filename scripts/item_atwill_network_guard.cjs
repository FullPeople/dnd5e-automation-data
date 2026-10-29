'use strict';
// Loaded by NODE_OPTIONS before Vitest or any test module, and inherited by
// Node subprocesses/workers. There is deliberately no teardown/restore API.
const deny = () => { throw new Error('ITEM_ATWILL_NETWORK_DENIED'); };
// Vite asks for localhost metadata during startup even with no listening API.
// Resolve that one literal in memory; never call native DNS or restore transport.
const localhost = (hostname, options) => {
  if (hostname !== 'localhost') return deny();
  const entry = {address: options?.family === 6 ? '::1' : '127.0.0.1', family: options?.family === 6 ? 6 : 4};
  return options?.all ? [entry] : entry;
};
Object.defineProperty(globalThis, 'fetch', {value: deny, writable: false, configurable: false});
for (const [name, methods] of Object.entries({
  'node:http': ['request', 'get'], 'node:https': ['request', 'get'],
  'node:http2': ['connect'], 'node:net': ['connect', 'createConnection'],
  'node:tls': ['connect'], 'node:dgram': ['createSocket'],
  'node:dns': ['resolve', 'resolve4', 'resolve6'],
})) {
  const api = require(name);
  for (const method of methods) Object.defineProperty(api, method, {value: deny, writable: false, configurable: false});
}
const net = require('node:net');
Object.defineProperty(net.Socket.prototype, 'connect', {value: deny, writable: false, configurable: false});
Object.defineProperty(require('node:dns'), 'lookup', {value: (hostname, options, callback) => {
  if (typeof options === 'function') { callback = options; options = {}; }
  const entry = localhost(hostname, options);
  queueMicrotask(() => options?.all ? callback(null, entry) : callback(null, entry.address, entry.family));
}, writable: false, configurable: false});
for (const name of ['node:dns/promises']) {
  const api = require(name);
  Object.defineProperty(api, 'lookup', {value: async (hostname, options) => localhost(hostname, options), writable: false, configurable: false});
  for (const method of ['resolve', 'resolve4', 'resolve6']) Object.defineProperty(api, method, {value: deny, writable: false, configurable: false});
}
require('node:module').syncBuiltinESMExports();
