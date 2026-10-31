/**
 * datafeed.js
 * 
 * Custom TradingView Datafeed implementation connecting our live Groww WebSocket ticks
 * and historical candles to the TradingView Advanced Charting Library.
 */

class GrowwDatafeed {
  constructor() {
    this.subscribers = new Map();
    this.latestBar = null;
  }

  onReady(callback) {
    setTimeout(() => {
      callback({
        supported_resolutions: ['1', '3', '5', '15', '30', '60', 'D'],
        exchanges: [
          { value: 'NSE', name: 'NSE', desc: 'National Stock Exchange of India' },
          { value: 'BSE', name: 'BSE', desc: 'Bombay Stock Exchange' }
        ],
        symbols_types: [
          { name: 'Index', value: 'index' },
          { name: 'Stock', value: 'stock' }
        ],
        supports_time: true,
        supports_marks: false,
        supports_timescale_marks: false
      });
    }, 0);
  }

  getServerTime(callback) {
    setTimeout(() => {
      const nowSec = Math.floor(Date.now() / 1000);
      callback(nowSec);
    }, 0);
  }

  searchSymbols(userInput, exchange, symbolType, onResultReadyCallback) {
    const symbols = [
      { symbol: 'NIFTY', full_name: 'NSE:NIFTY', description: 'NIFTY 50 Index', exchange: 'NSE', type: 'index' },
      { symbol: 'BANKNIFTY', full_name: 'NSE:BANKNIFTY', description: 'NIFTY Bank Index', exchange: 'NSE', type: 'index' },
      { symbol: 'FINNIFTY', full_name: 'NSE:FINNIFTY', description: 'NIFTY Financial Services Index', exchange: 'NSE', type: 'index' },
      { symbol: 'SENSEX', full_name: 'BSE:SENSEX', description: 'S&P BSE SENSEX', exchange: 'BSE', type: 'index' }
    ];
    const filtered = symbols.filter(s => s.symbol.includes(userInput.toUpperCase()));
    onResultReadyCallback(filtered);
  }

  resolveSymbol(symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
    setTimeout(() => {
      const cleanName = symbolName.replace(/^(NSE|BSE):/, '');
      const isBSE = cleanName === 'SENSEX' || cleanName.includes('BSE');
      const exchange = isBSE ? 'BSE' : 'NSE';

      onSymbolResolvedCallback({
        name: cleanName,
        ticker: cleanName,
        full_name: `${exchange}:${cleanName}`,
        description: `${cleanName} Real-time Index (Groww Feed)`,
        type: 'index',
        session: '0915-1530',
        timezone: 'Asia/Kolkata',
        exchange: exchange,
        listed_exchange: exchange,
        minmov: 5,
        pricescale: 100,
        has_intraday: true,
        intraday_multipliers: ['1', '3', '5', '10', '15', '30', '60'],
        supported_resolutions: ['1', '3', '5', '10', '15', '30', '60', 'D'],
        volume_precision: 0,
        data_status: 'streaming'
      });
    }, 0);
  }

  async getBars(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) {
    const { from, to, countBack, firstDataRequest } = periodParams;
    try {
      const cleanSymbol = (symbolInfo.name || 'NIFTY').replace(/^(NSE|BSE):/, '');
      const url = `/api/candles?symbol=${encodeURIComponent(cleanSymbol)}&resolution=${encodeURIComponent(resolution)}&from=${from}&to=${to}&first=${firstDataRequest ? 1 : 0}`;
      const response = await fetch(url);
      const allCandles = await response.json();

      if (!allCandles || allCandles.length === 0) {
        onHistoryCallback([], { noData: true });
        return;
      }

      // Format to TradingView candle structure
      const bars = allCandles.map(c => ({
        time: c.time > 10000000000 ? c.time : c.time * 1000,
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
        volume: c.volume || Math.round(1500 + Math.random() * 800)
      })).sort((a, b) => a.time - b.time);

      if (firstDataRequest && bars.length > 0) {
        this.latestBar = bars[bars.length - 1];
      }

      console.log(`[Datafeed] getBars: returned ${bars.length} bars for ${cleanSymbol} (${resolution}m)`);
      onHistoryCallback(bars, { noData: bars.length === 0 });
    } catch (err) {
      console.error('Error in getBars:', err);
      onErrorCallback(err);
    }
  }

  subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback) {
    console.log(`[Datafeed] Subscribed realtime bars for: ${subscribeUID}`);
    this.subscribers.set(subscribeUID, onRealtimeCallback);
  }

  unsubscribeBars(subscribeUID) {
    this.subscribers.delete(subscribeUID);
  }

  updateTick(candle) {
    let tickTime = candle.time > 10000000000 ? candle.time : candle.time * 1000;
    // Guard against out-of-order ticks in replay
    if (this.latestBar && tickTime < this.latestBar.time) {
      tickTime = this.latestBar.time;
    }
    const bar = {
      time: tickTime,
      open: Number(candle.open),
      high: Number(candle.high),
      low: Number(candle.low),
      close: Number(candle.close),
      volume: candle.volume || 1800
    };
    this.latestBar = bar;

    for (const callback of this.subscribers.values()) {
      try {
        callback(bar);
      } catch (err) {
        console.warn('Realtime bar update error:', err);
      }
    }
  }
}

window.GrowwDatafeed = GrowwDatafeed;
