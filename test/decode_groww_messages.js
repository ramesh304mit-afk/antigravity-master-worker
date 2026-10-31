/**
 * decode_groww_messages.js
 * 
 * Uses the Next.js bundle in webtest/pages/2690.54cd5b6de317c058.js
 * to decode NATS WebSocket binary messages captured from Groww.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const protobufMinimal = require('protobufjs/minimal');

// Paths
const BASE_DIR = __dirname;
const JS_BUNDLE_PATH = path.join(BASE_DIR, 'webtest', 'pages', '2690.54cd5b6de317c058.js');
const DEFAULT_INPUT_FILE = path.join(BASE_DIR, 'groww_ws_messages.jsonl');
const DEFAULT_OUTPUT_FILE = path.join(BASE_DIR, 'test.json');

// 1. Load webpack chunk and extract modules
console.log('Loading Groww decoder module from JS bundle...');
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

// 2. Setup webpack require emulation
const installedModules = {};

function webpackRequire(moduleId) {
  if (installedModules[moduleId]) {
    return installedModules[moduleId].exports;
  }

  // Supply protobufjs/minimal for webpack module 76594
  if (moduleId === 76594 || moduleId === '76594') {
    return protobufMinimal;
  }

  const moduleFn = capturedModules[moduleId];
  if (!moduleFn) {
    return {};
  }

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

// Load router & protobuf modules
const mod8495 = webpackRequire(8495);
const getDecoderClass = mod8495.$v;

// Cache instantiated decoders
const decoderCache = new Map();

function getDecoder(subject) {
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

// Helper to convert protobufjs Long / complex values into clean JSON
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
 * Decode a single raw NATS WebSocket buffer.
 */
function decodeNatsFrame(rawBuffer) {
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
    // MSG <subject> <sid> [reply-to] <#bytes>\r\n[payload]\r\n
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
      decodeError = 'No decoder found for subject prefix';
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

/**
 * Main function: reads JSONL, decodes all records, writes output JSON.
 */
function main() {
  const inputFile = process.argv[2] || DEFAULT_INPUT_FILE;
  const outputFile = process.argv[3] || DEFAULT_OUTPUT_FILE;

  console.log(`Reading input from: ${inputFile}`);
  if (!fs.existsSync(inputFile)) {
    console.error(`Input file not found: ${inputFile}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(inputFile, 'utf8');
  const lines = fileContent.split('\n').filter(l => l.trim().length > 0);
  console.log(`Processing ${lines.length} recorded frames...`);

  const results = [];
  let msgCount = 0;
  let decodedSuccessCount = 0;
  let errorCount = 0;

  for (let idx = 0; idx < lines.length; idx++) {
    try {
      const record = JSON.parse(lines[idx]);
      const raw = Buffer.from(record.payload_base64, 'base64');
      const decodedFrame = decodeNatsFrame(raw);

      const entry = {
        line_number: idx + 1,
        received_at: record.received_at,
        url: record.url,
        ...decodedFrame
      };

      if (entry.type === 'MSG') {
        msgCount++;
        if (entry.data && !entry.error) {
          decodedSuccessCount++;
        } else {
          errorCount++;
        }
      }

      results.push(entry);
    } catch (err) {
      console.error(`Error processing line ${idx + 1}:`, err);
      results.push({
        line_number: idx + 1,
        error: err.message
      });
      errorCount++;
    }
  }

  console.log(`\nDecoding summary:`);
  console.log(`- Total frames processed: ${results.length}`);
  console.log(`- NATS MSG frames: ${msgCount}`);
  console.log(`- Successfully decoded: ${decodedSuccessCount}`);
  console.log(`- Errors: ${errorCount}`);

  console.log(`\nWriting results to ${outputFile}...`);
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Finished successfully! Output size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
}

if (require.main === module) {
  main();
}

module.exports = {
  decodeNatsFrame,
  getDecoder,
  webpackRequire,
  cleanObject
};
