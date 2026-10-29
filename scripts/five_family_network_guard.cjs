'use strict';
// Test children only. Never retain native transport or restore it at teardown.
// fetch stays replaceable solely for the frozen Web catalog-local test codec;
// its immutable startup marker always points to the rejecting baseline.
const key = Symbol.for('dnd.offlineCatalogFetch.v1');
if (Object.hasOwn(globalThis, key)) throw Error('FIVE_FAMILY_NETWORK_GUARD_ALREADY_INSTALLED');
const unexpected = [], transports = [];
const deny = async input => { unexpected.push(String(input)); throw Error('FIVE_FAMILY_NETWORK_DENIED'); };
Object.defineProperty(globalThis, 'fetch', {value: deny, writable: true, configurable: true});
Object.defineProperty(globalThis, key, {value: Object.freeze({version: 1, deny, unexpected}), writable: false, configurable: false});
const blocked = () => { transports.push(1); throw Error('FIVE_FAMILY_NETWORK_DENIED'); };
for (const [name, methods] of Object.entries({
 'node:http': ['request', 'get'], 'node:https': ['request', 'get'],
 'node:http2': ['connect'], 'node:net': ['connect', 'createConnection'],
 'node:tls': ['connect'], 'node:dgram': ['createSocket'],
 'node:dns': ['resolve', 'resolve4', 'resolve6', 'resolveAny', 'reverse'],
})) {
 const api = require(name);
 for (const method of methods) Object.defineProperty(api, method, {value: blocked, writable: false, configurable: false});
}
Object.defineProperty(require('node:net').Socket.prototype, 'connect', {value: blocked, writable: false, configurable: false});
Object.defineProperty(require('node:net').Server.prototype, 'listen', {value: blocked, writable: false, configurable: false});
const localhost = (hostname, options) => {
 if (hostname !== 'localhost') return blocked();
 const value = {address: options?.family === 6 ? '::1' : '127.0.0.1', family: options?.family === 6 ? 6 : 4};
 return options?.all ? [value] : value;
};
Object.defineProperty(require('node:dns'), 'lookup', {value: (hostname, options, callback) => {
 if (typeof options === 'function') { callback = options; options = {}; }
 const value = localhost(hostname, options);
 queueMicrotask(() => options?.all ? callback(null, value) : callback(null, value.address, value.family));
}, writable: false, configurable: false});
const promises = require('node:dns/promises');
Object.defineProperty(promises, 'lookup', {value: async (hostname, options) => localhost(hostname, options), writable: false, configurable: false});
for (const api of [require('node:dns'), promises, require('node:dns').Resolver.prototype, promises.Resolver.prototype])
 for (const method of Object.getOwnPropertyNames(api))
  if (/^(resolve|reverse|lookupService)/.test(method) && typeof api[method] === 'function') Object.defineProperty(api, method, {value: blocked, writable: false, configurable: false});
require('node:module').syncBuiltinESMExports();
process.on('exit', () => { if (unexpected.length || transports.length) { process.exitCode = 1; process.stderr.write('FIVE_FAMILY_NETWORK_GUARD_VIOLATION\n'); } });
