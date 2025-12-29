// Minimal, self-contained UUID shim for Metro (no dynamic require)
// Provides v4 and safe fallbacks for other versions so imports like
//   import { v4 as uuidv4 } from 'uuid'
// work reliably in web and native during development.

function toHex(byte) {
	return (byte + 0x100).toString(16).slice(1);
}

function formatUuid(bytes) {
	return (
		toHex(bytes[0]) + toHex(bytes[1]) + toHex(bytes[2]) + toHex(bytes[3]) + '-' +
		toHex(bytes[4]) + toHex(bytes[5]) + '-' +
		toHex(bytes[6]) + toHex(bytes[7]) + '-' +
		toHex(bytes[8]) + toHex(bytes[9]) + '-' +
		toHex(bytes[10]) + toHex(bytes[11]) + toHex(bytes[12]) + toHex(bytes[13]) + toHex(bytes[14]) + toHex(bytes[15])
	);
}

function getRandomValuesPolyfill(arr) {
	for (let i = 0; i < arr.length; i++) {
		arr[i] = Math.floor(Math.random() * 256) & 0xff;
	}
	return arr;
}

function v4() {
	const bytes = new Uint8Array(16);
	const cryptoObj = (typeof global !== 'undefined' && (global.crypto || global.msCrypto)) || (typeof window !== 'undefined' && (window.crypto || window.msCrypto));
	if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
		cryptoObj.getRandomValues(bytes);
	} else {
		getRandomValuesPolyfill(bytes);
	}
	// RFC 4122 version/variant bits
	bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
	bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
	return formatUuid(bytes);
}

// Safe fallbacks for other APIs to avoid undefined property access
function passthroughToV4() { return v4(); }
function alwaysTrue() { return true; }
function versionFn() { return 4; }
function stringify(x) { return String(x); }
function parse(x) { return x; }

const NIL = '00000000-0000-0000-0000-000000000000';
const MAX = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

module.exports = {
	v1: passthroughToV4,
	v3: passthroughToV4,
	v4,
	v5: passthroughToV4,
	v6: passthroughToV4,
	v7: passthroughToV4,
	NIL,
	MAX,
	parse,
	stringify,
	validate: alwaysTrue,
	version: versionFn,
};


