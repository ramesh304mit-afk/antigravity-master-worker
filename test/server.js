/**
 * server.js
 * 
 * Personal Groww Terminal Server
 * - Serves the web dashboard (HTML5 + Tailwind + Lightweight Charts)
 * - Streams live decoded market data over WebSocket (ws://localhost:3000/ws)
 * - Supports Replay Mode (from groww_ws_messages.jsonl) & Live CDP Capture Mode
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');
const { decodeFrame } = require('./groww_decoder');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const RECORDED_FILE = path.join(__dirname, 'groww_ws_messages.jsonl');
const CHUNKS_DIR = path.join(__dirname, 'webtest', 'charting_library_bundles');
const TOOLS_DIR = path.join(__dirname, 'webtest', 'tools');
const CSS_DIR = path.join(__dirname, 'webtest', 'css');

// Index chunk IDs from charting_library_bundles and tools for dynamic routing
const chunkFileMap = new Map();
let nameToIdMap = {};
try {
  const runtimeMapPath = path.join(__dirname, 'scratch_runtime_map.json');
  if (fs.existsSync(runtimeMapPath)) {
    nameToIdMap = JSON.parse(fs.readFileSync(runtimeMapPath, 'utf8')).nameToId || {};
  }
} catch (e) {}

function indexChunksFromDir(dir) {
  if (!fs.existsSync(dir)) return;
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (!f.endsWith('.js')) continue;
      const fullPath = path.join(dir, f);
      const header = fs.readFileSync(fullPath, 'utf8').substring(0, 3000);
      const m = header.match(/\.push\(\[(\[[^\]]+\])/);
      if (m) {
        const idsStr = m[1].replace(/[\[\]\s]/g, '').split(',');
        for (const id of idsStr) {
          if (id) chunkFileMap.set(id, f);
        }
      }
      const rawId = f.split('.')[0];
      if (/^\d+$/.test(rawId)) {
        chunkFileMap.set(rawId, f);
      }
    }
  } catch (e) {
    console.error('Error indexing chunks:', e.message);
  }
}
indexChunksFromDir(CHUNKS_DIR);
indexChunksFromDir(TOOLS_DIR);

// Global In-Memory State
const state = {
  mode: 'replay', // 'replay' | 'live'
  replayStatus: 'playing', // 'playing' | 'paused'
  replaySpeed: 1, // multiplier: 1x, 2x, 5x, 10x
  indices: {
    'NIFTY 50': { symbol: 'NIFTY 50', value: 23071.45, prevClose: 23043.20, change: 28.25, changePct: 0.12, ts: Date.now() },
    'NIFTY BANK': { symbol: 'NIFTY BANK', value: 54908.20, prevClose: 54716.40, change: 191.80, changePct: 0.35, ts: Date.now() },
    'NIFTY FIN SERVICE': { symbol: 'NIFTY FIN SERVICE', value: 24752.25, prevClose: 24710.00, change: 42.25, changePct: 0.17, ts: Date.now() },
    'NIFTY MID SELECT': { symbol: 'NIFTY MID SELECT', value: 13253.55, prevClose: 13220.10, change: 33.45, changePct: 0.25, ts: Date.now() },
    'SENSEX': { symbol: 'SENSEX', value: 74618.14, prevClose: 74530.00, change: 88.14, changePct: 0.12, ts: Date.now() },
    'BSE BANKEX': { symbol: 'BSE BANKEX', value: 61709.84, prevClose: 61500.00, change: 209.84, changePct: 0.34, ts: Date.now() },
  },
  currentCandle: {
    time: 1793341140,
    open: 23068.60,
    high: 23073.05,
    low: 23065.45,
    close: 23071.45
  },
  candleHistory: [],
  optionChain: {},
  commodities: {},
  recentTicks: []
};

// Candle aggregation helper for multi-timeframe charting (1m, 3m, 5m, 15m, 30m, 60m, 1D)
function aggregateCandles(rawCandles, intervalMinutes) {
  if (!rawCandles || rawCandles.length === 0) return [];
  if (intervalMinutes === 1) {
    return rawCandles.map(c => ({
      time: Array.isArray(c) ? c[0] : c.time,
      open: Number(Array.isArray(c) ? c[1] : c.open),
      high: Number(Array.isArray(c) ? c[2] : c.high),
      low: Number(Array.isArray(c) ? c[3] : c.low),
      close: Number(Array.isArray(c) ? c[4] : c.close),
      volume: (Array.isArray(c) ? c[5] : c.volume) || 0
    }));
  }
  const intervalSec = intervalMinutes * 60;
  const map = new Map();
  for (const c of rawCandles) {
    const t = Array.isArray(c) ? c[0] : c.time;
    const o = Number(Array.isArray(c) ? c[1] : c.open);
    const h = Number(Array.isArray(c) ? c[2] : c.high);
    const l = Number(Array.isArray(c) ? c[3] : c.low);
    const cl = Number(Array.isArray(c) ? c[4] : c.close);
    const v = (Array.isArray(c) ? c[5] : c.volume) || 0;

    const bucket = Math.floor(t / intervalSec) * intervalSec;
    if (!map.has(bucket)) {
      map.set(bucket, { time: bucket, open: o, high: h, low: l, close: cl, volume: v });
    } else {
      const b = map.get(bucket);
      b.high = Math.max(b.high, h);
      b.low = Math.min(b.low, l);
      b.close = cl;
      b.volume += v;
    }
  }
  return Array.from(map.values()).sort((a, b) => a.time - b.time);
}

// Fetch historical candles from Groww REST API with local archive fallback
async function fetchGrowwCandles(symbol = 'NIFTY', intervalInMinutes = 1, startTimeInMillis, endTimeInMillis) {
  const cleanSymbol = symbol.replace(/^(NSE|BSE):/, '').toUpperCase();
  const isBSE = cleanSymbol === 'SENSEX' || cleanSymbol.includes('BSE');
  const exchange = isBSE ? 'BSE' : 'NSE';
  const segment = 'CASH';

  const endMs = endTimeInMillis || Date.now();
  const startMs = startTimeInMillis || (endMs - 5 * 24 * 60 * 60 * 1000);

  const url = `https://groww.in/v1/api/charting_service/v4/chart/exchange/${exchange}/segment/${segment}/${cleanSymbol}?endTimeInMillis=${endMs}&intervalInMinutes=${intervalInMinutes}&startTimeInMillis=${startMs}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://groww.in',
        'Referer': 'https://groww.in'
      },
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.candles) && json.candles.length > 0) {
        return json.candles.map(c => ({
          time: c[0],
          open: Number(c[1]),
          high: Number(c[2]),
          low: Number(c[3]),
          close: Number(c[4]),
          volume: c[5] || 0
        }));
      }
    }
  } catch (err) {
    console.warn(`[History] Groww API fetch for ${cleanSymbol} failed (${err.message}), using local archive.`);
  }

  // Local fallback from data/candles/nifty_1m.json
  const filePath = path.join(__dirname, 'data', 'candles', 'nifty_1m.json');
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const startSec = Math.floor(startMs / 1000);
      const endSec = Math.floor(endMs / 1000);
      const filtered = (data.candles || []).filter(c => c[0] >= startSec && c[0] <= endSec);
      return aggregateCandles(filtered.length > 0 ? filtered : data.candles, intervalInMinutes);
    } catch (e) {
      console.error('[History] Local archive fallback error:', e);
    }
  }
  return [];
}

// Load authentic Groww historical candles leading up to active session
function initCandleHistory() {
  const filePath = path.join(__dirname, 'data', 'candles', 'nifty_1m.json');
  state.candleHistory = [];

  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const targetTime = 1793341140; // Replay starting timestamp
      const candles = (data.candles || []).filter(c => c[0] < targetTime);

      state.candleHistory = candles.map(c => ({
        time: c[0],
        open: Number(c[1]),
        high: Number(c[2]),
        low: Number(c[3]),
        close: Number(c[4]),
        volume: c[5] || Math.round(1500 + Math.random() * 800)
      }));

      // Find candle at targetTime or last candle
      const cur = (data.candles || []).find(c => c[0] === targetTime) || data.candles[data.candles.length - 1];
      if (cur) {
        state.currentCandle = {
          time: cur[0],
          open: Number(cur[1]),
          high: Number(cur[2]),
          low: Number(cur[3]),
          close: Number(cur[4]),
          volume: cur[5] || 1500
        };
      }
      console.log(`[Candles] Loaded ${state.candleHistory.length} authentic Groww historical candles (from Oct 26). Current candle:`, state.currentCandle);
      return;
    } catch (e) {
      console.error('[Candles] Failed to parse nifty_1m.json:', e);
    }
  }

  // Fallback baseline if file not present
  const baseTime = 1793334900;
  const targetTime = 1793341140;
  let curPrice = 23050.0;
  for (let t = baseTime; t < targetTime; t += 60) {
    const delta = (Math.random() - 0.48) * 4.0;
    const open = curPrice;
    const close = +(open + delta).toFixed(2);
    const high = +(Math.max(open, close) + Math.random() * 2.0).toFixed(2);
    const low = +(Math.min(open, close) - Math.random() * 2.0).toFixed(2);
    state.candleHistory.push({ time: t, open, high, low, close, volume: 1500 });
    curPrice = close;
  }
}
initCandleHistory();

// Initialize Option Chain strikes matrix
function initOptionChain() {
  const strikes = [22800, 22850, 22900, 22950, 23000, 23050, 23100, 23150, 23200, 23250, 23300, 23350];
  const spot = 23071.45;

  strikes.forEach(strike => {
    const isATM = Math.abs(strike - spot) <= 25;
    const isITMC = strike < spot;
    const isITMP = strike > spot;

    // Approximate theoretical baseline values matching Groww option chain
    let ceLtp, peLtp, ceChange, peChange, ceOi, peOi;

    if (strike === 22950) {
      ceLtp = 157.30; ceChange = 6.70; peLtp = 86.15; peChange = -42.10;
      ceOi = 175000; peOi = 245000;
    } else if (strike === 23000) {
      ceLtp = 126.40; ceChange = 2.45; peLtp = 105.70; peChange = -45.10;
      ceOi = 195000; peOi = 285000;
    } else if (strike === 23050) {
      ceLtp = 101.15; ceChange = 1.10; peLtp = 130.05; peChange = -47.10;
      ceOi = 215000; peOi = 260000;
    } else if (strike === 23100) {
      ceLtp = 79.30; ceChange = -0.25; peLtp = 157.10; peChange = -49.90;
      ceOi = 290000; peOi = 180000;
    } else if (strike === 23150) {
      ceLtp = 60.00; ceChange = -2.00; peLtp = 187.05; peChange = -52.00;
      ceOi = 260000; peOi = 140000;
    } else if (strike === 23200) {
      ceLtp = 45.30; ceChange = -1.95; peLtp = 218.20; peChange = -56.30;
      ceOi = 240000; peOi = 90000;
    } else if (strike === 23250) {
      ceLtp = 33.40; ceChange = -1.80; peLtp = 254.90; peChange = -60.80;
      ceOi = 210000; peOi = 60000;
    } else {
      ceLtp = isITMC ? Math.round(spot - strike + 45) : Math.max(15, Math.round(180 - (strike - spot) * 0.7));
      peLtp = isITMP ? Math.round(strike - spot + 45) : Math.max(15, Math.round(180 - (spot - strike) * 0.7));
      ceChange = +(Math.random() * 6 - 3).toFixed(2);
      peChange = +(Math.random() * 6 - 3).toFixed(2);
      ceOi = Math.round(150000 + Math.random() * 80000);
      peOi = Math.round(130000 + Math.random() * 70000);
    }

    const ceChangePct = +((ceChange / (ceLtp - ceChange || ceLtp)) * 100).toFixed(2);
    const peChangePct = +((peChange / (peLtp - peChange || peLtp)) * 100).toFixed(2);
    const ceDelta = +(Math.max(0.05, Math.min(0.95, 0.5 + (spot - strike) / 400))).toFixed(2);
    const peDelta = +(-(1 - ceDelta)).toFixed(2);

    state.optionChain[strike] = {
      strike,
      isATM,
      ce: {
        symbol: `NIFTY26N03${strike}CE`,
        ltp: ceLtp,
        change: ceChange,
        changePct: ceChangePct,
        delta: ceDelta,
        oi: ceOi,
        volume: Math.round(450000 + Math.random() * 200000),
        iv: +(11.5 + Math.random() * 2.5).toFixed(1),
        lastUpdated: Date.now()
      },
      pe: {
        symbol: `NIFTY26N03${strike}PE`,
        ltp: peLtp,
        change: peChange,
        changePct: peChangePct,
        delta: peDelta,
        oi: peOi,
        volume: Math.round(380000 + Math.random() * 180000),
        iv: +(12.0 + Math.random() * 2.5).toFixed(1),
        lastUpdated: Date.now()
      }
    };
  });
}
initOptionChain();

// Generate dynamic 5-level Market Depth around spot price
function generateMarketDepth(spot) {
  const bids = [];
  const asks = [];
  let totalBuy = 0;
  let totalSell = 0;
  for (let i = 1; i <= 5; i++) {
    const bidPrice = +(spot - i * 0.05).toFixed(2);
    const bidQty = Math.round(450 + Math.sin(i) * 300 + Math.random() * 250);
    const bidOrders = Math.round(4 + i * 2 + Math.random() * 5);
    totalBuy += bidQty;
    bids.push({ price: bidPrice, qty: bidQty, orders: bidOrders });

    const askPrice = +(spot + (i - 1) * 0.05 + 0.05).toFixed(2);
    const askQty = Math.round(420 + Math.cos(i) * 280 + Math.random() * 260);
    const askOrders = Math.round(4 + i * 2 + Math.random() * 5);
    totalSell += askQty;
    asks.push({ price: askPrice, qty: askQty, orders: askOrders });
  }
  const total = totalBuy + totalSell;
  return {
    spot,
    bids,
    asks,
    totalBuy,
    totalSell,
    buyPct: +((totalBuy / total) * 100).toFixed(1),
    sellPct: +((totalSell / total) * 100).toFixed(1)
  };
}

state.depth = generateMarketDepth(23071.45);

state.commodities = {
  'Crude Oil 19 Nov Fut': { name: 'Crude Oil 19 Nov Fut', value: 9872.00, change: 163.00, changePct: 1.68 },
  'Natural Gas 24 Nov Fut': { name: 'Natural Gas 24 Nov Fut', value: 278.50, change: -3.30, changePct: -1.17 }
};

// Paper Trading Simulation Engine (Zero Risk & No Login Required)
state.balance = {
  availableCash: 95320.00,
  marginUsed: 4680.00,
  collateralMargin: 0.00,
  totalFunds: 100000.00,
  realizedPnl: 0.00
};

state.positions = [
  {
    id: 'POS-1',
    symbol: 'NIFTY 26NOV 23050 CE',
    strike: 23050,
    optionType: 'CE',
    product: 'MIS',
    qty: 75,
    avgPrice: 62.40,
    ltp: 66.00,
    pnl: 270.00,
    pnlPct: 5.77,
    time: '11:42:15'
  }
];

state.orders = [
  {
    id: 'ORD-8921',
    growwOrderId: 'GW17933418921',
    symbol: 'NIFTY 26NOV 23050 CE',
    strike: 23050,
    optionType: 'CE',
    type: 'BUY',
    orderType: 'LIMIT',
    product: 'MIS',
    qty: 75,
    price: 62.40,
    status: 'EXECUTED',
    time: '11:42:15'
  }
];

// Helper to recalculate margin and balance metrics
function updatePortfolioMetrics() {
  let usedMargin = 0;
  for (const pos of state.positions) {
    if (pos.qty > 0) {
      usedMargin += (pos.avgPrice * pos.qty);
    }
  }
  state.balance.marginUsed = +usedMargin.toFixed(2);
  state.balance.totalFunds = +(100000.00 + state.balance.realizedPnl).toFixed(2);
  state.balance.availableCash = +(state.balance.totalFunds - state.balance.marginUsed).toFixed(2);
}

// Dynamic real-time ticking P&L updater against live market feeds
function updatePositionsTick() {
  let changed = false;
  for (const pos of state.positions) {
    let currentLtp = null;
    if (pos.strike && pos.optionType && state.optionChain[pos.strike]) {
      const side = pos.optionType.toLowerCase();
      if (state.optionChain[pos.strike][side]?.ltp) {
        currentLtp = state.optionChain[pos.strike][side].ltp;
      }
    } else if (pos.symbol.includes('NIFTY 50') || pos.symbol === 'NIFTY') {
      currentLtp = state.indices['NIFTY 50']?.value;
    } else if (pos.symbol.includes('BANK')) {
      currentLtp = state.indices['NIFTY BANK']?.value;
    } else {
      const match = state.watchlist.find(w => pos.symbol.includes(w.symbol));
      if (match) currentLtp = match.ltp;
    }

    if (currentLtp !== null && currentLtp !== pos.ltp) {
      pos.ltp = currentLtp;
      const diff = pos.ltp - pos.avgPrice;
      pos.pnl = +(diff * pos.qty).toFixed(2);
      pos.pnlPct = +((diff / pos.avgPrice) * 100).toFixed(2);
      changed = true;
    }
  }

  if (changed) {
    broadcast({
      type: 'POSITIONS_TICK',
      data: {
        positions: state.positions,
        totalPnl: +state.positions.reduce((s, p) => s + (p.pnl || 0), 0).toFixed(2),
        balance: state.balance
      }
    });
  }
}
updatePortfolioMetrics();

// -------------------------------------------------------------
// HTTP & Static File Server
// -------------------------------------------------------------
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoints
  if (url.pathname === '/api/state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      mode: state.mode,
      replayStatus: state.replayStatus,
      replaySpeed: state.replaySpeed,
      indices: state.indices,
      currentCandle: state.currentCandle,
      candleCount: state.candleHistory.length,
      optionChain: state.optionChain,
      commodities: state.commodities
    }));
    return;
  }

  if (url.pathname === '/api/candles') {
    const symbol = url.searchParams.get('symbol') || 'NIFTY';
    const resolution = url.searchParams.get('resolution') || '1';
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    let intervalMinutes = 1;
    if (resolution === '3') intervalMinutes = 3;
    else if (resolution === '5') intervalMinutes = 5;
    else if (resolution === '10') intervalMinutes = 10;
    else if (resolution === '15') intervalMinutes = 15;
    else if (resolution === '30') intervalMinutes = 30;
    else if (resolution === '60') intervalMinutes = 60;
    else if (resolution === 'D' || resolution === '1D') intervalMinutes = 1440;

    const fromSec = from ? Number(from) : null;
    const toSec = to ? Number(to) : null;

    let candles = [];
    try {
      candles = await fetchGrowwCandles(
        symbol,
        intervalMinutes,
        fromSec ? fromSec * 1000 : null,
        toSec ? toSec * 1000 : null
      );
    } catch (e) {
      console.warn('[API Candles] Fetch failed:', e.message);
    }

    if (!candles || candles.length === 0) {
      const all1m = [...state.candleHistory, state.currentCandle];
      candles = aggregateCandles(all1m, intervalMinutes);
      if (fromSec && toSec) {
        candles = candles.filter(c => c.time >= fromSec && c.time <= toSec);
      }
    }

    // Attach active current candle if 1m and recently requested
    if (intervalMinutes === 1 && state.currentCandle) {
      const last = candles[candles.length - 1];
      if (last && last.time === state.currentCandle.time) {
        candles[candles.length - 1] = { ...state.currentCandle };
      } else if (!last || (last && last.time < state.currentCandle.time)) {
        candles.push({ ...state.currentCandle });
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(candles));
    return;
  }

  if (url.pathname === '/api/search') {
    const q = (url.searchParams.get('q') || '').trim();
    if (!q) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ content: [] }));
      return;
    }

    try {
      const growwUrl = `https://groww.in/v1/api/search/v3/query/global/st_query?from=0&query=${encodeURIComponent(q)}&size=10&web=true`;
      const response = await fetch(growwUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Origin': 'https://groww.in',
          'Referer': 'https://groww.in'
        },
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        const json = await response.json();
        if (json && json.data && Array.isArray(json.data.content)) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ content: json.data.content }));
          return;
        }
      }
    } catch (err) {
      console.warn(`[Search] Groww search API failed (${err.message}), falling back to local instruments.`);
    }

    // Local Fallback Search
    const qLower = q.toLowerCase();
    const localMatches = [];

    const indicesList = [
      { title: 'NIFTY 50', entity_type: 'Index', nse_scrip_code: 'NIFTY', groww_contract_id: 'GIDXNIFTY', desc: 'NSE Benchmark Index' },
      { title: 'NIFTY BANK', entity_type: 'Index', nse_scrip_code: 'BANKNIFTY', groww_contract_id: 'GIDXBANKNIFTY', desc: 'Banking Sector Index' },
      { title: 'S&P BSE SENSEX', entity_type: 'Index', nse_scrip_code: 'SENSEX', groww_contract_id: 'GIDXBSESENSEX', desc: 'BSE Benchmark Index' },
      { title: 'NIFTY FIN SERVICE', entity_type: 'Index', nse_scrip_code: 'FINNIFTY', groww_contract_id: 'GIDXFINNIFTY', desc: 'Financial Services Index' },
      { title: 'NIFTY MID SELECT', entity_type: 'Index', nse_scrip_code: 'NIFTYMIDSELECT', groww_contract_id: 'GIDXMIDSELECT', desc: 'Midcap Select Index' }
    ];

    const stocksList = [
      { title: 'Reliance Industries Ltd.', entity_type: 'Stocks', nse_scrip_code: 'RELIANCE', groww_contract_id: 'GSTK500325', desc: 'Energy & Petrochemicals' },
      { title: 'HDFC Bank Ltd.', entity_type: 'Stocks', nse_scrip_code: 'HDFCBANK', groww_contract_id: 'GSTK500180', desc: 'Private Sector Bank' },
      { title: 'Tata Consultancy Services Ltd.', entity_type: 'Stocks', nse_scrip_code: 'TCS', groww_contract_id: 'GSTK532540', desc: 'IT Services' },
      { title: 'Infosys Ltd.', entity_type: 'Stocks', nse_scrip_code: 'INFY', groww_contract_id: 'GSTK500209', desc: 'IT Consulting' },
      { title: 'Tata Motors Ltd.', entity_type: 'Stocks', nse_scrip_code: 'TATAMOTORS', groww_contract_id: 'GSTK500570', desc: 'Automotive' }
    ];

    [...indicesList, ...stocksList].forEach(item => {
      if (item.title.toLowerCase().includes(qLower) || (item.nse_scrip_code && item.nse_scrip_code.toLowerCase().includes(qLower))) {
        localMatches.push(item);
      }
    });

    if (state.optionChain) {
      Object.keys(state.optionChain).forEach(strike => {
        if (strike.includes(q)) {
          localMatches.push({
            title: `NIFTY 03 Nov ${strike} Call`,
            entity_type: 'Option',
            nse_scrip_code: `NIFTY26N03${strike}CE`,
            groww_contract_id: `NIFTY26N03${strike}CE`,
            strike: Number(strike),
            side: 'ce'
          });
          localMatches.push({
            title: `NIFTY 03 Nov ${strike} Put`,
            entity_type: 'Option',
            nse_scrip_code: `NIFTY26N03${strike}PE`,
            groww_contract_id: `NIFTY26N03${strike}PE`,
            strike: Number(strike),
            side: 'pe'
          });
        }
      });
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ content: localMatches.slice(0, 10) }));
    return;
  }

  if (url.pathname === '/api/control' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        if (payload.action === 'play') state.replayStatus = 'playing';
        if (payload.action === 'pause') state.replayStatus = 'paused';
        if (payload.action === 'toggle') state.replayStatus = state.replayStatus === 'playing' ? 'paused' : 'playing';
        if (payload.speed) state.replaySpeed = Number(payload.speed);
        if (payload.mode) state.mode = payload.mode;
        broadcast({ type: 'STATUS_UPDATE', replayStatus: state.replayStatus, replaySpeed: state.replaySpeed, mode: state.mode });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, state: { mode: state.mode, status: state.replayStatus, speed: state.replaySpeed } }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // -------------------------------------------------------------
  // Serve Groww Webtest CSS Assets
  // -------------------------------------------------------------
  if (url.pathname.startsWith('/css/')) {
    const filename = path.basename(url.pathname);
    const cssPath = path.join(CSS_DIR, filename);
    if (fs.existsSync(cssPath)) {
      res.writeHead(200, {
        'Content-Type': 'text/css',
        'Cache-Control': 'public, max-age=86400'
      });
      fs.createReadStream(cssPath).pipe(res);
      return;
    }
  }

  // -------------------------------------------------------------
  // 1. Order Placement (Official Groww Endpoints + Local Paper Trading Engine)
  // Endpoints:
  // - /v1/api/stocks_fo/fno/order-orchestrator/single-order (Groww F&O Bulk/Single Order)
  // - /invest/core/stocks_fo/stocks/v1/order (Groww F&O Core Order)
  // - /invest/core/stocks/v1/order (Groww Equity Order)
  // - /api/order/place (Direct Terminal Alias)
  // -------------------------------------------------------------
  if (
    (url.pathname === '/v1/api/stocks_fo/fno/order-orchestrator/single-order' ||
     url.pathname === '/invest/core/stocks_fo/stocks/v1/order' ||
     url.pathname === '/invest/core/stocks/v1/order' ||
     url.pathname === '/api/order/place') && req.method === 'POST'
  ) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const symbol = payload.symbol || payload.segment || 'NIFTY';
        const strike = payload.strike ? Number(payload.strike) : null;
        const optionType = payload.optionType || (payload.strikePrice ? (payload.callPut || 'CE') : null);
        const side = (payload.side || payload.buySell || payload.type || 'BUY').toUpperCase();
        const qty = Number(payload.qty || payload.quantity || 25);
        const orderType = (payload.orderType || 'MARKET').toUpperCase();
        const product = payload.product || payload.productType || 'MIS';

        // Determine price
        let price = Number(payload.price || 0);
        if (orderType === 'MARKET' || !price || price <= 0) {
          if (strike && optionType && state.optionChain[strike]) {
            price = state.optionChain[strike][optionType.toLowerCase()]?.ltp || 50;
          } else if (state.indices['NIFTY 50']) {
            price = state.indices['NIFTY 50'].value;
          } else {
            price = 100;
          }
        }

        const requiredMargin = price * qty;
        if (side === 'BUY' && requiredMargin > state.balance.availableCash) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'FAILED',
            error: `Insufficient margin! Required: ₹${requiredMargin.toFixed(2)}, Available: ₹${state.balance.availableCash.toFixed(2)}`
          }));
          return;
        }

        const orderId = `ORD-${Date.now().toString().slice(-6)}`;
        const growwOrderId = `GW${Date.now()}`;
        const nowTime = new Date().toLocaleTimeString('en-IN', { hour12: false });

        const order = {
          id: orderId,
          growwOrderId,
          symbol,
          strike,
          optionType,
          type: side,
          orderType,
          product,
          qty,
          price: +price.toFixed(2),
          status: 'EXECUTED',
          time: nowTime
        };

        state.orders.unshift(order);

        // Update or create position
        let existing = state.positions.find(p => p.symbol === symbol && p.product === product);
        if (existing) {
          if (side === 'BUY') {
            const newQty = existing.qty + qty;
            existing.avgPrice = +(((existing.avgPrice * existing.qty) + (price * qty)) / newQty).toFixed(2);
            existing.qty = newQty;
            existing.ltp = price;
            existing.pnl = +((existing.ltp - existing.avgPrice) * existing.qty).toFixed(2);
            existing.pnlPct = +(((existing.ltp - existing.avgPrice) / existing.avgPrice) * 100).toFixed(2);
          } else {
            // SELL side against existing long
            const closedQty = Math.min(existing.qty, qty);
            const realized = (price - existing.avgPrice) * closedQty;
            state.balance.realizedPnl = +(state.balance.realizedPnl + realized).toFixed(2);
            existing.qty -= closedQty;
            if (existing.qty <= 0) {
              state.positions = state.positions.filter(p => p !== existing);
            } else {
              existing.pnl = +((existing.ltp - existing.avgPrice) * existing.qty).toFixed(2);
              existing.pnlPct = +(((existing.ltp - existing.avgPrice) / existing.avgPrice) * 100).toFixed(2);
            }
          }
        } else {
          if (side === 'BUY') {
            const newPos = {
              id: `POS-${Date.now().toString().slice(-4)}`,
              symbol,
              strike,
              optionType,
              product,
              qty,
              avgPrice: +price.toFixed(2),
              ltp: +price.toFixed(2),
              pnl: 0.00,
              pnlPct: 0.00,
              time: nowTime
            };
            state.positions.unshift(newPos);
          }
        }

        updatePortfolioMetrics();

        // Broadcast state update
        broadcast({
          type: 'PORTFOLIO_UPDATE',
          data: {
            positions: state.positions,
            orders: state.orders,
            balance: state.balance
          }
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'SUCCESS',
          message: `Order ${orderId} executed: ${side} ${qty} ${symbol} @ ₹${price.toFixed(2)}`,
          growwOrderId,
          order,
          balance: state.balance
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'FAILED', error: err.message }));
      }
    });
    return;
  }

  // -------------------------------------------------------------
  // 2. Positions Exit (Close Position & Realize P&L)
  // Endpoints:
  // - /v1/api/stocks_fo/stocks_router/v1/positions/exit
  // - /api/order/exit
  // - /api/positions/exit
  // -------------------------------------------------------------
  if (
    (url.pathname === '/v1/api/stocks_fo/stocks_router/v1/positions/exit' ||
     url.pathname === '/api/order/exit' ||
     url.pathname === '/api/positions/exit') && req.method === 'POST'
  ) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const posId = payload.positionId || payload.id;
        const all = payload.all === true;
        const nowTime = new Date().toLocaleTimeString('en-IN', { hour12: false });
        let totalRealized = 0;

        const toClose = all ? [...state.positions] : state.positions.filter(p => p.id === posId || p.symbol === payload.symbol);
        if (toClose.length === 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'FAILED', error: 'Position not found' }));
          return;
        }

        for (const pos of toClose) {
          const exitPrice = pos.ltp;
          const realized = (exitPrice - pos.avgPrice) * pos.qty;
          totalRealized += realized;
          state.balance.realizedPnl = +(state.balance.realizedPnl + realized).toFixed(2);

          // Counter order
          state.orders.unshift({
            id: `ORD-${Date.now().toString().slice(-6)}`,
            growwOrderId: `GW${Date.now()}`,
            symbol: pos.symbol,
            strike: pos.strike,
            optionType: pos.optionType,
            type: pos.qty > 0 ? 'SELL' : 'BUY',
            orderType: 'MARKET',
            product: pos.product,
            qty: Math.abs(pos.qty),
            price: +exitPrice.toFixed(2),
            status: 'EXECUTED',
            time: nowTime
          });

          state.positions = state.positions.filter(p => p.id !== pos.id);
        }

        updatePortfolioMetrics();

        broadcast({
          type: 'PORTFOLIO_UPDATE',
          data: {
            positions: state.positions,
            orders: state.orders,
            balance: state.balance
          }
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'SUCCESS',
          message: `Closed ${toClose.length} position(s). Realized P&L: ₹${totalRealized.toFixed(2)}`,
          realizedPnl: +totalRealized.toFixed(2),
          balance: state.balance
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'FAILED', error: err.message }));
      }
    });
    return;
  }

  // -------------------------------------------------------------
  // 3. Positions List
  // Endpoints:
  // - /v1/api/stocks_fo/stocks_router/v1/positions (Groww F&O Positions)
  // - /v1/api/stocks_router/v5/dashboard/positions (Groww Equity Positions)
  // - /api/positions (Direct Alias)
  // -------------------------------------------------------------
  if (
    url.pathname === '/v1/api/stocks_fo/stocks_router/v1/positions' ||
    url.pathname === '/v1/api/stocks_router/v5/dashboard/positions' ||
    url.pathname === '/api/positions'
  ) {
    const totalPnl = +state.positions.reduce((s, p) => s + (p.pnl || 0), 0).toFixed(2);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      misPositions: state.positions.filter(p => p.product === 'MIS'),
      cfPositions: state.positions.filter(p => p.product !== 'MIS'),
      allPositions: state.positions,
      totalPnl,
      balance: state.balance
    }));
    return;
  }

  // -------------------------------------------------------------
  // 4. Orders List
  // Endpoints:
  // - /v1/api/stocks_router/v5/dashboard/orders (Groww Orders Dashboard)
  // - /v1/api/stocks_fo/stocks_router/v1/order/open (Groww Open Orders)
  // - /api/orders (Direct Alias)
  // -------------------------------------------------------------
  if (
    url.pathname === '/v1/api/stocks_router/v5/dashboard/orders' ||
    url.pathname === '/v1/api/stocks_fo/stocks_router/v1/order/open' ||
    url.pathname === '/api/orders'
  ) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      orders: state.orders,
      totalOrders: state.orders.length
    }));
    return;
  }

  // -------------------------------------------------------------
  // 5. Margin & Balance
  // Endpoints:
  // - /v1/api/bff/invest_money_ramp/v1/user_margin_details
  // - /v1/api/margin_advance/v2/margin/user_margin_details
  // - /v1/api/bff/invest_money/v1/withdrawable_balance
  // - /v1/api/invest/margin/x/aggregator/v1/p0/balance/details
  // - /api/balance
  // -------------------------------------------------------------
  if (
    url.pathname === '/v1/api/bff/invest_money_ramp/v1/user_margin_details' ||
    url.pathname === '/v1/api/margin_advance/v2/margin/user_margin_details' ||
    url.pathname === '/v1/api/bff/invest_money/v1/withdrawable_balance' ||
    url.pathname === '/v1/api/invest/margin/x/aggregator/v1/p0/balance/details' ||
    url.pathname === '/api/balance'
  ) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      availableMargin: state.balance.availableCash,
      usedMargin: state.balance.marginUsed,
      collateralMargin: state.balance.collateralMargin,
      totalFunds: state.balance.totalFunds,
      realizedPnl: state.balance.realizedPnl,
      unrealizedPnl: +state.positions.reduce((s, p) => s + (p.pnl || 0), 0).toFixed(2),
      withdrawableBalance: state.balance.availableCash
    }));
    return;
  }

  // -------------------------------------------------------------
  // 6. Reset Balance / Add Funds (Paper Trading Simulation Controls)
  // -------------------------------------------------------------
  if (url.pathname === '/api/balance/reset' && req.method === 'POST') {
    state.balance = {
      availableCash: 100000.00,
      marginUsed: 0.00,
      collateralMargin: 0.00,
      totalFunds: 100000.00,
      realizedPnl: 0.00
    };
    state.positions = [];
    broadcast({
      type: 'PORTFOLIO_UPDATE',
      data: {
        positions: state.positions,
        orders: state.orders,
        balance: state.balance
      }
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Balance reset to ₹1,00,000.00', balance: state.balance }));
    return;
  }

  if (url.pathname === '/api/balance/add' && req.method === 'POST') {
    state.balance.totalFunds += 50000;
    updatePortfolioMetrics();
    broadcast({
      type: 'PORTFOLIO_UPDATE',
      data: {
        positions: state.positions,
        orders: state.orders,
        balance: state.balance
      }
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Added ₹50,000 margin', balance: state.balance }));
    return;
  }

  // -------------------------------------------------------------
  // 7. Full Option Chain Derivatives API
  // Endpoints:
  // - /v1/api/stocks_fo_data/v1/derivatives (and /derivatives/:search_id)
  // - /api/option-chain
  // -------------------------------------------------------------
  if (url.pathname.startsWith('/v1/api/stocks_fo_data/v1/derivatives') || url.pathname === '/api/option-chain') {
    const spot = state.indices['NIFTY 50'] ? state.indices['NIFTY 50'].value : 23071.45;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      spot,
      symbol: 'NIFTY',
      expiry: '26-NOV-2026',
      lotSize: 25,
      optionChain: state.optionChain
    }));
    return;
  }

  // -------------------------------------------------------------
  // 8. Top Movers & Gainers (Watchlist / Explore)
  // Endpoints:
  // - /v1/api/stocks_data/v2/explore/list/top
  // - /api/top-movers
  // -------------------------------------------------------------
  if (url.pathname === '/v1/api/stocks_data/v2/explore/list/top' || url.pathname === '/api/top-movers') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      topMovers: state.watchlist,
      commodities: state.commodities
    }));
    return;
  }

  if (url.pathname === '/api/tick' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const raw = payload.payload_base64 || payload.raw;
        if (raw) {
          state.mode = 'live';
          const decoded = decodeFrame(raw);
          handleDecodedMessage(decoded);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // -------------------------------------------------------------
  // Serve Groww Webtest CSS Assets
  // -------------------------------------------------------------
  if (url.pathname.startsWith('/css/')) {
    const filename = path.basename(url.pathname);
    const cssPath = path.join(CSS_DIR, filename);
    if (fs.existsSync(cssPath)) {
      res.writeHead(200, {
        'Content-Type': 'text/css',
        'Cache-Control': 'public, max-age=86400'
      });
      fs.createReadStream(cssPath).pipe(res);
      return;
    }
  }

  // -------------------------------------------------------------
  // 1. Order Placement (Official Groww Endpoints + Local Paper Trading Engine)
  // Endpoints:
  // - /v1/api/stocks_fo/fno/order-orchestrator/single-order (Groww F&O Bulk/Single Order)
  // - /invest/core/stocks_fo/stocks/v1/order (Groww F&O Core Order)
  // - /invest/core/stocks/v1/order (Groww Equity Order)
  // - /api/order/place (Direct Terminal Alias)
  // -------------------------------------------------------------
  if (
    (url.pathname === '/v1/api/stocks_fo/fno/order-orchestrator/single-order' ||
     url.pathname === '/invest/core/stocks_fo/stocks/v1/order' ||
     url.pathname === '/invest/core/stocks/v1/order' ||
     url.pathname === '/api/order/place') && req.method === 'POST'
  ) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const symbol = payload.symbol || payload.segment || 'NIFTY';
        const strike = payload.strike ? Number(payload.strike) : null;
        const optionType = payload.optionType || (payload.strikePrice ? (payload.callPut || 'CE') : null);
        const side = (payload.side || payload.buySell || payload.type || 'BUY').toUpperCase();
        const qty = Number(payload.qty || payload.quantity || 25);
        const orderType = (payload.orderType || 'MARKET').toUpperCase();
        const product = payload.product || payload.productType || 'MIS';

        // Determine price
        let price = Number(payload.price || 0);
        if (orderType === 'MARKET' || !price || price <= 0) {
          if (strike && optionType && state.optionChain[strike]) {
            price = state.optionChain[strike][optionType.toLowerCase()]?.ltp || 50;
          } else if (state.indices['NIFTY 50']) {
            price = state.indices['NIFTY 50'].value;
          } else {
            price = 100;
          }
        }

        const requiredMargin = price * qty;
        if (side === 'BUY' && requiredMargin > state.balance.availableCash) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'FAILED',
            error: `Insufficient margin! Required: ₹${requiredMargin.toFixed(2)}, Available: ₹${state.balance.availableCash.toFixed(2)}`
          }));
          return;
        }

        const orderId = `ORD-${Date.now().toString().slice(-6)}`;
        const growwOrderId = `GW${Date.now()}`;
        const nowTime = new Date().toLocaleTimeString('en-IN', { hour12: false });

        const order = {
          id: orderId,
          growwOrderId,
          symbol,
          strike,
          optionType,
          type: side,
          orderType,
          product,
          qty,
          price: +price.toFixed(2),
          status: 'EXECUTED',
          time: nowTime
        };

        state.orders.unshift(order);

        // Update or create position
        let existing = state.positions.find(p => p.symbol === symbol && p.product === product);
        if (existing) {
          if (side === 'BUY') {
            const newQty = existing.qty + qty;
            existing.avgPrice = +(((existing.avgPrice * existing.qty) + (price * qty)) / newQty).toFixed(2);
            existing.qty = newQty;
            existing.ltp = price;
            existing.pnl = +((existing.ltp - existing.avgPrice) * existing.qty).toFixed(2);
            existing.pnlPct = +(((existing.ltp - existing.avgPrice) / existing.avgPrice) * 100).toFixed(2);
          } else {
            // SELL side against existing long
            const closedQty = Math.min(existing.qty, qty);
            const realized = (price - existing.avgPrice) * closedQty;
            state.balance.realizedPnl = +(state.balance.realizedPnl + realized).toFixed(2);
            existing.qty -= closedQty;
            if (existing.qty <= 0) {
              state.positions = state.positions.filter(p => p !== existing);
            } else {
              existing.pnl = +((existing.ltp - existing.avgPrice) * existing.qty).toFixed(2);
              existing.pnlPct = +(((existing.ltp - existing.avgPrice) / existing.avgPrice) * 100).toFixed(2);
            }
          }
        } else {
          if (side === 'BUY') {
            const newPos = {
              id: `POS-${Date.now().toString().slice(-4)}`,
              symbol,
              strike,
              optionType,
              product,
              qty,
              avgPrice: +price.toFixed(2),
              ltp: +price.toFixed(2),
              pnl: 0.00,
              pnlPct: 0.00,
              time: nowTime
            };
            state.positions.unshift(newPos);
          }
        }

        updatePortfolioMetrics();

        // Broadcast state update
        broadcast({
          type: 'PORTFOLIO_UPDATE',
          data: {
            positions: state.positions,
            orders: state.orders,
            balance: state.balance
          }
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'SUCCESS',
          message: `Order ${orderId} executed: ${side} ${qty} ${symbol} @ ₹${price.toFixed(2)}`,
          growwOrderId,
          order,
          balance: state.balance
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'FAILED', error: err.message }));
      }
    });
    return;
  }

  // -------------------------------------------------------------
  // 2. Positions Exit (Close Position & Realize P&L)
  // Endpoints:
  // - /v1/api/stocks_fo/stocks_router/v1/positions/exit
  // - /api/order/exit
  // - /api/positions/exit
  // -------------------------------------------------------------
  if (
    (url.pathname === '/v1/api/stocks_fo/stocks_router/v1/positions/exit' ||
     url.pathname === '/api/order/exit' ||
     url.pathname === '/api/positions/exit') && req.method === 'POST'
  ) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const posId = payload.positionId || payload.id;
        const all = payload.all === true;
        const nowTime = new Date().toLocaleTimeString('en-IN', { hour12: false });
        let totalRealized = 0;

        const toClose = all ? [...state.positions] : state.positions.filter(p => p.id === posId || p.symbol === payload.symbol);
        if (toClose.length === 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'FAILED', error: 'Position not found' }));
          return;
        }

        for (const pos of toClose) {
          const exitPrice = pos.ltp;
          const realized = (exitPrice - pos.avgPrice) * pos.qty;
          totalRealized += realized;
          state.balance.realizedPnl = +(state.balance.realizedPnl + realized).toFixed(2);

          // Counter order
          state.orders.unshift({
            id: `ORD-${Date.now().toString().slice(-6)}`,
            growwOrderId: `GW${Date.now()}`,
            symbol: pos.symbol,
            strike: pos.strike,
            optionType: pos.optionType,
            type: pos.qty > 0 ? 'SELL' : 'BUY',
            orderType: 'MARKET',
            product: pos.product,
            qty: Math.abs(pos.qty),
            price: +exitPrice.toFixed(2),
            status: 'EXECUTED',
            time: nowTime
          });

          state.positions = state.positions.filter(p => p.id !== pos.id);
        }

        updatePortfolioMetrics();

        broadcast({
          type: 'PORTFOLIO_UPDATE',
          data: {
            positions: state.positions,
            orders: state.orders,
            balance: state.balance
          }
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'SUCCESS',
          message: `Closed ${toClose.length} position(s). Realized P&L: ₹${totalRealized.toFixed(2)}`,
          realizedPnl: +totalRealized.toFixed(2),
          balance: state.balance
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'FAILED', error: err.message }));
      }
    });
    return;
  }

  // -------------------------------------------------------------
  // 3. Positions List
  // Endpoints:
  // - /v1/api/stocks_fo/stocks_router/v1/positions (Groww F&O Positions)
  // - /v1/api/stocks_router/v5/dashboard/positions (Groww Equity Positions)
  // - /api/positions (Direct Alias)
  // -------------------------------------------------------------
  if (
    url.pathname === '/v1/api/stocks_fo/stocks_router/v1/positions' ||
    url.pathname === '/v1/api/stocks_router/v5/dashboard/positions' ||
    url.pathname === '/api/positions'
  ) {
    const totalPnl = +state.positions.reduce((s, p) => s + (p.pnl || 0), 0).toFixed(2);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      misPositions: state.positions.filter(p => p.product === 'MIS'),
      cfPositions: state.positions.filter(p => p.product !== 'MIS'),
      allPositions: state.positions,
      totalPnl,
      balance: state.balance
    }));
    return;
  }

  // -------------------------------------------------------------
  // 4. Orders List
  // Endpoints:
  // - /v1/api/stocks_router/v5/dashboard/orders (Groww Orders Dashboard)
  // - /v1/api/stocks_fo/stocks_router/v1/order/open (Groww Open Orders)
  // - /api/orders (Direct Alias)
  // -------------------------------------------------------------
  if (
    url.pathname === '/v1/api/stocks_router/v5/dashboard/orders' ||
    url.pathname === '/v1/api/stocks_fo/stocks_router/v1/order/open' ||
    url.pathname === '/api/orders'
  ) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      orders: state.orders,
      totalOrders: state.orders.length
    }));
    return;
  }

  // -------------------------------------------------------------
  // 5. Margin & Balance
  // Endpoints:
  // - /v1/api/bff/invest_money_ramp/v1/user_margin_details
  // - /v1/api/margin_advance/v2/margin/user_margin_details
  // - /v1/api/bff/invest_money/v1/withdrawable_balance
  // - /v1/api/invest/margin/x/aggregator/v1/p0/balance/details
  // - /api/balance
  // -------------------------------------------------------------
  if (
    url.pathname === '/v1/api/bff/invest_money_ramp/v1/user_margin_details' ||
    url.pathname === '/v1/api/margin_advance/v2/margin/user_margin_details' ||
    url.pathname === '/v1/api/bff/invest_money/v1/withdrawable_balance' ||
    url.pathname === '/v1/api/invest/margin/x/aggregator/v1/p0/balance/details' ||
    url.pathname === '/api/balance'
  ) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      availableMargin: state.balance.availableCash,
      usedMargin: state.balance.marginUsed,
      collateralMargin: state.balance.collateralMargin,
      totalFunds: state.balance.totalFunds,
      realizedPnl: state.balance.realizedPnl,
      unrealizedPnl: +state.positions.reduce((s, p) => s + (p.pnl || 0), 0).toFixed(2),
      withdrawableBalance: state.balance.availableCash
    }));
    return;
  }

  // -------------------------------------------------------------
  // 6. Reset Balance / Add Funds (Paper Trading Simulation Controls)
  // -------------------------------------------------------------
  if (url.pathname === '/api/balance/reset' && req.method === 'POST') {
    state.balance = {
      availableCash: 100000.00,
      marginUsed: 0.00,
      collateralMargin: 0.00,
      totalFunds: 100000.00,
      realizedPnl: 0.00
    };
    state.positions = [];
    broadcast({
      type: 'PORTFOLIO_UPDATE',
      data: {
        positions: state.positions,
        orders: state.orders,
        balance: state.balance
      }
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Balance reset to ₹1,00,000.00', balance: state.balance }));
    return;
  }

  if (url.pathname === '/api/balance/add' && req.method === 'POST') {
    state.balance.totalFunds += 50000;
    updatePortfolioMetrics();
    broadcast({
      type: 'PORTFOLIO_UPDATE',
      data: {
        positions: state.positions,
        orders: state.orders,
        balance: state.balance
      }
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Added ₹50,000 margin', balance: state.balance }));
    return;
  }

  // -------------------------------------------------------------
  // 7. Full Option Chain Derivatives API
  // Endpoints:
  // - /v1/api/stocks_fo_data/v1/derivatives (and /derivatives/:search_id)
  // - /api/option-chain
  // -------------------------------------------------------------
  if (url.pathname.startsWith('/v1/api/stocks_fo_data/v1/derivatives') || url.pathname === '/api/option-chain') {
    const spot = state.indices['NIFTY 50'] ? state.indices['NIFTY 50'].value : 23071.45;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      spot,
      symbol: 'NIFTY',
      expiry: '26-NOV-2026',
      lotSize: 25,
      optionChain: state.optionChain
    }));
    return;
  }

  // -------------------------------------------------------------
  // 8. Top Movers & Gainers (Watchlist / Explore)
  // Endpoints:
  // - /v1/api/stocks_data/v2/explore/list/top
  // - /api/top-movers
  // -------------------------------------------------------------
  if (url.pathname === '/v1/api/stocks_data/v2/explore/list/top' || url.pathname === '/api/top-movers') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      topMovers: state.watchlist,
      commodities: state.commodities
    }));
    return;
  }

  // -------------------------------------------------------------
  // Serve TradingView Charting Library Bundles & Styles
  // -------------------------------------------------------------
  if (url.pathname.startsWith('/charting_library/') || url.pathname.startsWith('/webtest/charting_library_bundles/')) {
    if (url.pathname.includes('/bundles/') || url.pathname.startsWith('/webtest/charting_library_bundles/')) {
      const filename = path.basename(url.pathname);
      let targetFile = filename;
      let bundlePath = path.join(CHUNKS_DIR, targetFile);

      if (!fs.existsSync(bundlePath)) {
        const tPath = path.join(TOOLS_DIR, targetFile);
        if (fs.existsSync(tPath)) {
          bundlePath = tPath;
        }
      }

      if (!fs.existsSync(bundlePath)) {
        const parts = filename.split('.');
        let rawId = parts[0];
        if ((rawId === '__LANG__' || rawId === 'en') && parts[1]) rawId = parts[1];
        if (chunkFileMap.has(rawId)) {
          targetFile = chunkFileMap.get(rawId);
          bundlePath = path.join(CHUNKS_DIR, targetFile);
          if (!fs.existsSync(bundlePath)) {
            bundlePath = path.join(TOOLS_DIR, targetFile);
          }
        }
      }

      if (fs.existsSync(bundlePath)) {
        const ext = path.extname(bundlePath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': mimeTypes[ext] || 'application/javascript',
          'Cache-Control': 'public, max-age=86400'
        });
        fs.createReadStream(bundlePath).pipe(res);
        return;
      } else {
        // Fallback for optional/split chunks
        const ext = path.extname(filename).toLowerCase();
        if (ext === '.css') {
          res.writeHead(200, { 'Content-Type': 'text/css' });
          res.end('/* fallback empty css */\n');
          return;
        } else if (ext === '.js') {
          const parts = filename.split('.');
          let rawId = parts[0];
          if ((rawId === '__LANG__' || rawId === 'en') && parts[1]) rawId = parts[1];
          const chunkId = nameToIdMap[rawId] || (/^\d+$/.test(rawId) ? Number(rawId) : rawId);
          res.writeHead(200, { 'Content-Type': 'application/javascript' });
          res.end(`"use strict";(self.webpackChunktradingview=self.webpackChunktradingview||[]).push([[${JSON.stringify(chunkId)}],{}]);\n`);
          return;
        }
      }
    }

    if (url.pathname.includes('/charts/')) {
      const filename = path.basename(url.pathname);
      const chartPath = path.join(__dirname, 'webtest', 'charting_library_bundles', 'charts', filename);
      if (fs.existsSync(chartPath)) {
        const ext = path.extname(chartPath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': mimeTypes[ext] || 'text/css',
          'Cache-Control': 'public, max-age=86400'
        });
        fs.createReadStream(chartPath).pipe(res);
        return;
      }
    }

    if (url.pathname.endsWith('/charting_library.standalone.js')) {
      const standalonePath = path.join(PUBLIC_DIR, 'charting_library', 'charting_library.standalone.js');
      if (fs.existsSync(standalonePath)) {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        fs.createReadStream(standalonePath).pipe(res);
        return;
      }
    }

    // Default mock response for study_templates or internal storage endpoints
    if (url.pathname.includes('study_templates') || url.pathname.includes('charts_storage')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', data: [] }));
      return;
    }
  }

  // Favicon handler
  if (url.pathname === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Static file serving from /public
  let reqPath = url.pathname;
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(PUBLIC_DIR, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

// -------------------------------------------------------------
// WebSocket Server for Clients
// -------------------------------------------------------------
const wss = new WebSocketServer({ server, path: '/ws' });
const connectedClients = new Set();

wss.on('connection', (ws) => {
  connectedClients.add(ws);
  console.log(`[WS] Client connected. Total active clients: ${connectedClients.size}`);

  // Send full initial state snapshot immediately
  ws.send(JSON.stringify({
    type: 'INIT_STATE',
    data: {
      mode: state.mode,
      replayStatus: state.replayStatus,
      replaySpeed: state.replaySpeed,
      indices: state.indices,
      candleHistory: [...state.candleHistory, state.currentCandle],
      optionChain: state.optionChain,
      commodities: state.commodities,
      positions: state.positions,
      orders: state.orders,
      holdings: state.holdings,
      watchlist: state.watchlist,
      balance: state.balance,
      depth: state.depth,
      recentTicks: state.recentTicks.slice(-50)
    }
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'SET_SPEED') {
        state.replaySpeed = Number(data.speed) || 1;
        broadcast({ type: 'STATUS_UPDATE', replaySpeed: state.replaySpeed });
      } else if (data.type === 'SET_STATUS') {
        state.replayStatus = data.status;
        broadcast({ type: 'STATUS_UPDATE', replayStatus: state.replayStatus });
      }
    } catch {}
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
    console.log(`[WS] Client disconnected. Total active: ${connectedClients.size}`);
  });
});

function broadcast(msgObj) {
  if (connectedClients.size === 0) return;
  const payload = JSON.stringify(msgObj);
  for (const client of connectedClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// -------------------------------------------------------------
// Incoming Decoded Message Processing & State Updates
// -------------------------------------------------------------
function handleDecodedMessage(decodedFrame) {
  if (decodedFrame.type !== 'MSG' || !decodedFrame.data) return;

  const subject = decodedFrame.subject || '';
  const data = decodedFrame.data;

  // 1. Chart Candle Update (/topic/stocks/charting_candle.*)
  if (subject.includes('charting_candle')) {
    const candleTime = Math.floor(data.time / 1000);
    const updatedCandle = {
      time: candleTime,
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close
    };

    if (state.currentCandle.time === candleTime) {
      state.currentCandle = updatedCandle;
    } else if (candleTime > state.currentCandle.time) {
      state.candleHistory.push({ ...state.currentCandle });
      state.currentCandle = updatedCandle;
    }

    broadcast({
      type: 'CANDLE_UPDATE',
      data: updatedCandle
    });
  }

  // 2. Index Live Ticks (/topic/stocks/tr_live_indices/proto.*)
  else if (subject.includes('tr_live_indices')) {
    const rawSymbol = (data.symbol || '').toUpperCase().trim();
    let indexKey = null;

    if (rawSymbol.includes('NIFTY 50') || subject.endsWith('.NIFTY')) indexKey = 'NIFTY 50';
    else if (rawSymbol.includes('BANK') || subject.endsWith('.BANKNIFTY')) indexKey = 'NIFTY BANK';
    else if (rawSymbol.includes('FIN') || subject.endsWith('.FINNIFTY')) indexKey = 'NIFTY FIN SERVICE';
    else if (rawSymbol.includes('MID') || subject.endsWith('.NIFTYMIDSELECT')) indexKey = 'NIFTY MID SELECT';
    else if (rawSymbol.includes('SENSEX') || subject.endsWith('.SENSEX')) indexKey = 'SENSEX';
    else if (rawSymbol.includes('BANKEX') || subject.endsWith('.14')) indexKey = 'BSE BANKEX';

    if (indexKey && state.indices[indexKey] && data.livePoint) {
      const liveVal = data.livePoint.value;
      const prevClose = state.indices[indexKey].prevClose;
      const change = +(liveVal - prevClose).toFixed(2);
      const changePct = +((change / prevClose) * 100).toFixed(2);

      state.indices[indexKey] = {
        symbol: indexKey,
        value: liveVal,
        prevClose,
        change,
        changePct,
        ts: data.livePoint.tsInMillis || Date.now()
      };

      // Recalculate ATM strike for option chain if NIFTY 50 updated
      if (indexKey === 'NIFTY 50') {
        const spot = liveVal;

        // Keep current forming candle dynamically updated with live spot ticks
        if (state.currentCandle) {
          state.currentCandle.close = spot;
          if (spot > state.currentCandle.high) state.currentCandle.high = spot;
          if (spot < state.currentCandle.low) state.currentCandle.low = spot;
          broadcast({
            type: 'CANDLE_UPDATE',
            data: state.currentCandle
          });
        }

        Object.keys(state.optionChain).forEach(strike => {
          state.optionChain[strike].isATM = Math.abs(Number(strike) - spot) <= 25;
        });

        // Update Market Depth ladder
        state.depth = generateMarketDepth(spot);
        broadcast({
          type: 'DEPTH_UPDATE',
          data: state.depth
        });
      }

      broadcast({
        type: 'INDEX_UPDATE',
        indexKey,
        data: state.indices[indexKey]
      });

      updatePositionsTick();
    }
  }

  // 3. F&O Option Prices (/topic/stocks_fo/tr_live_prices/proto.*)
  else if (subject.includes('stocks_fo/tr_live_prices')) {
    const optSymbol = (data.symbol || subject.split('.').pop()).toUpperCase();
    // Parse strike and CE/PE: e.g. NIFTY26N0323050CE
    const match = optSymbol.match(/(\d{5})(CE|PE)$/);
    if (match) {
      const strike = parseInt(match[1], 10);
      const side = match[2].toLowerCase(); // 'ce' | 'pe'

      if (!state.optionChain[strike]) {
        state.optionChain[strike] = {
          strike,
          isATM: Math.abs(strike - state.indices['NIFTY 50'].value) <= 25,
          ce: { symbol: `NIFTY26N03${strike}CE`, ltp: 0, change: 0, oi: 0, volume: 0, iv: 0 },
          pe: { symbol: `NIFTY26N03${strike}PE`, ltp: 0, change: 0, oi: 0, volume: 0, iv: 0 }
        };
      }

      const ltp = data.livePoint ? data.livePoint.ltp : 0;
      if (ltp > 0) {
        const cur = state.optionChain[strike][side];
        const oldLtp = cur.ltp || ltp;
        const diff = +(ltp - oldLtp).toFixed(2);
        const change = +(cur.change + diff).toFixed(2);
        const changePct = +((change / (ltp - change || ltp)) * 100).toFixed(2);

        state.optionChain[strike][side] = {
          ...cur,
          symbol: optSymbol,
          ltp,
          change,
          changePct,
          lastUpdated: Date.now()
        };

        broadcast({
          type: 'OPTION_UPDATE',
          strike,
          side,
          data: state.optionChain[strike][side]
        });

        updatePositionsTick();
      }
    }
  }

  // 4. MCX Commodity Quotes (/topic/livedata/commodities/mcx/live_price_detailed.*)
  else if (subject.includes('commodities/mcx')) {
    const id = data.symbol || subject.split('.').pop();
    state.commodities[id] = {
      id,
      exchange: 'MCX',
      bidQty: data.livePoint?.bidQty || 0,
      offerQty: data.livePoint?.offerQty || 0,
      ts: data.livePoint?.tsInMillis || Date.now()
    };
    broadcast({
      type: 'COMMODITY_UPDATE',
      id,
      data: state.commodities[id]
    });
  }

  // Store in recent ticks buffer (max 100)
  state.recentTicks.push({
    time: Date.now(),
    subject,
    summary: summarizeTick(subject, data)
  });
  if (state.recentTicks.length > 100) state.recentTicks.shift();

  broadcast({
    type: 'TICK',
    data: {
      time: Date.now(),
      subject,
      summary: summarizeTick(subject, data)
    }
  });
}

function summarizeTick(subject, data) {
  if (subject.includes('charting_candle')) {
    return `Candle: Close=${data.close} (H=${data.high}, L=${data.low})`;
  }
  if (subject.includes('tr_live_indices')) {
    return `${data.symbol}: ${data.livePoint?.value}`;
  }
  if (subject.includes('stocks_fo')) {
    return `${data.symbol}: LTP ₹${data.livePoint?.ltp}`;
  }
  if (subject.includes('commodities')) {
    return `MCX ${data.symbol}: Bid=${data.livePoint?.bidQty}, Ask=${data.livePoint?.offerQty}`;
  }
  return subject;
}

// -------------------------------------------------------------
// Replay Engine (Streams captured messages continuously)
// -------------------------------------------------------------
let recordedLines = [];
let replayIndex = 0;

function loadRecordedLines() {
  if (fs.existsSync(RECORDED_FILE)) {
    recordedLines = fs.readFileSync(RECORDED_FILE, 'utf8')
      .split('\n')
      .filter(l => l.trim().length > 0);
    console.log(`[Replay] Loaded ${recordedLines.length} recorded frames for streaming.`);
  } else {
    console.warn(`[Replay] File ${RECORDED_FILE} not found.`);
  }
}
loadRecordedLines();

function scheduleNextReplayTick() {
  if (state.mode !== 'replay' || state.replayStatus !== 'playing' || recordedLines.length === 0) {
    setTimeout(scheduleNextReplayTick, 200);
    return;
  }

  const rawLine = recordedLines[replayIndex];
  replayIndex = (replayIndex + 1) % recordedLines.length;

  try {
    const record = JSON.parse(rawLine);
    const decoded = decodeFrame(record.payload_base64);
    handleDecodedMessage(decoded);
  } catch (err) {
    // skip bad frame
  }

  // Delay based on speed multiplier (base 80ms)
  const delay = Math.max(10, Math.floor(80 / state.replaySpeed));
  setTimeout(scheduleNextReplayTick, delay);
}

scheduleNextReplayTick();

// -------------------------------------------------------------
// Start Server
// -------------------------------------------------------------
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 GROWW PERSONAL TRADING TERMINAL`);
  console.log(`======================================================`);
  console.log(`• Web Dashboard : http://localhost:${PORT}`);
  console.log(`• Live WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`• Mode          : ${state.mode.toUpperCase()}`);
  console.log(`• Replay Speed  : ${state.replaySpeed}x`);
  console.log(`======================================================\n`);
});
