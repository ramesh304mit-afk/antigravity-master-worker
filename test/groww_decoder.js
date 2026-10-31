/**
 * groww_decoder.js
 * 
 * Reusable module that loads the Groww Next.js webpack bundle
 * (webtest/pages/2690.54cd5b6de317c058.js) and decodes incoming NATS binary frames.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const protobufMinimal = require('protobufjs/minimal');

const JS_BUNDLE_PATH = path.join(__dirname, 'webtest', 'pages', '2690.54cd5b6de317c058.js');

let getDecoderClass = null;
const decoderCache = new Map();

function initDecoder() {
  if (getDecoderClass) return;

  const bundleCode = fs.readFileSync(JS_BUNDLE_PATH, 'utf8');

  let capturedModules = null;
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    self: {},
    window: {},
    global: {},
    globalThis: {},
    Error,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Date,
    Math,
    RegExp,
    Map,
    Set,
    Uint8Array,
  };
  sandbox.self = sandbox.window = sandbox.global = sandbox.globalThis = sandbox;
  sandbox.webpackChunk_N_E = {
    push: function (chunkData) {
      capturedModules = chunkData[1];
    }
  };

  vm.createContext(sandbox);
  vm.runInContext(bundleCode, sandbox);

  if (!capturedModules) {
    throw new Error('Failed to capture modules from ' + JS_BUNDLE_PATH);
  }

  const installedModules = {};

  function webpackRequire(moduleId) {
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }
    if (moduleId === 76594 || moduleId === '76594') {
      return protobufMinimal;
    }
    const moduleFn = capturedModules[moduleId];
    if (!moduleFn) return {};

    const module = installedModules[moduleId] = {
      id: moduleId,
      loaded: false,
      exports: {}
    };

    function defineExport(obj, props) {
      for (let key in props) {
        if (Object.prototype.hasOwnProperty.call(props, key) && !Object.prototype.hasOwnProperty.call(obj, key)) {
          Object.defineProperty(obj, key, { enumerable: true, get: props[key] });
        }
      }
    }
    webpackRequire.d = defineExport;
    webpackRequire.n = (mod) => {
      const getter = mod && mod.__esModule ? () => mod.default : () => mod;
      defineExport(getter, { a: getter });
      return getter;
    };

    moduleFn(module, module.exports, webpackRequire);
    module.loaded = true;
    return module.exports;
  }

  const mod8495 = webpackRequire(8495);
  getDecoderClass = mod8495.$v;
}

function getDecoder(subject) {
  initDecoder();
  const prefix = subject.split('.')[0];
  if (!decoderCache.has(prefix)) {
    const DecoderClass = getDecoderClass(subject);
    if (DecoderClass) {
      decoderCache.set(prefix, new DecoderClass());
    } else {
      decoderCache.set(prefix, null);
    }
  }
  return decoderCache.get(prefix);
}

function cleanObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (protobufMinimal.util.Long && protobufMinimal.util.Long.isLong(obj)) {
    return obj.toNumber();
  }
  if (typeof obj === 'object') {
    if (typeof obj.toNumber === 'function') {
      return obj.toNumber();
    }
    if (Array.isArray(obj)) {
      return obj.map(cleanObject);
    }
    const clean = {};
    for (const key of Object.keys(obj)) {
      clean[key] = cleanObject(obj[key]);
    }
    return clean;
  }
  return obj;
}

/**
 * Decodes a raw buffer or base64 string into structured NATS message.
 */
function decodeFrame(raw) {
  initDecoder();

  const rawBuffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw, 'base64');
  const asciiHeaderEnd = rawBuffer.indexOf(Buffer.from('\r\n'));
  if (asciiHeaderEnd === -1) {
    return { type: 'UNKNOWN', raw: rawBuffer.toString('utf8') };
  }

  const headerLine = rawBuffer.slice(0, asciiHeaderEnd).toString('ascii').trim();
  const headerParts = headerLine.split(/\s+/);
  const command = headerParts[0].toUpperCase();

  if (command === 'INFO') {
    const jsonStr = rawBuffer.slice(asciiHeaderEnd + 2).toString('utf8').trim() || headerLine.slice(5).trim();
    try {
      return { type: 'INFO', data: JSON.parse(jsonStr) };
    } catch {
      return { type: 'INFO', raw: jsonStr };
    }
  }

  if (command === 'PING') return { type: 'PING' };
  if (command === 'PONG') return { type: 'PONG' };
  if (command === '+OK') return { type: 'OK' };

  if (command === 'MSG') {
    const subject = headerParts[1];
    const sid = headerParts[2];
    const payloadBytesLen = parseInt(headerParts[headerParts.length - 1], 10);
    const payloadStart = asciiHeaderEnd + 2;
    const payload = rawBuffer.slice(payloadStart, payloadStart + payloadBytesLen);

    const decoder = getDecoder(subject);
    let decodedData = null;
    let decodeError = null;

    if (decoder && typeof decoder.decrypt === 'function') {
      try {
        decodedData = cleanObject(decoder.decrypt(new Uint8Array(payload)));
      } catch (err) {
        decodeError = err.message;
      }
    } else {
      decodeError = 'No decoder for topic';
    }

    return {
      type: 'MSG',
      subject,
      sid,
      byte_length: payloadBytesLen,
      data: decodedData,
      ...(decodeError ? { error: decodeError } : {})
    };
  }

  return { type: 'UNKNOWN', header: headerLine };
}

module.exports = {
  initDecoder,
  decodeFrame,
  cleanObject
};
