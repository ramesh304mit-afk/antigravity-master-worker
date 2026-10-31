/**
 * app.js
 * 
 * Frontend Client for Groww Terminal
 * Powers the full TradingView chart, 64px right sidebar tools, live indices ticker,
 * and real-time streaming drawers for Option Chain, Watchlist, Market Depth,
 * Positions, Orders, Holdings, and Balance.
 */

// State
let ws = null;
let tvWidget = null;
let datafeed = null;
let lastLtpCache = new Map();
let isPlaying = true;
let activeTool = null;
let currentSymbol = 'NSE:NIFTY';

// DOM Elements
const wsStatusDot = document.getElementById('ws-status-dot');
const wsModeBadge = document.getElementById('ws-mode-badge');
const indicesTickerRow = document.getElementById('indices-ticker-row');
const btnTogglePlay = document.getElementById('btn-toggle-play');
const btnPlayIcon = document.getElementById('btn-play-icon');
const btnPlayLabel = document.getElementById('btn-play-label');
const selectSpeed = document.getElementById('select-speed');

// Drawer & Right Sidebar
const drawerPanel = document.getElementById('drawer-panel');
const drawerPanelTitle = document.getElementById('drawer-panel-title');
const drawerPanelIcon = document.getElementById('drawer-panel-icon');
const btnCloseDrawer = document.getElementById('btn-close-drawer');
const navButtons = document.querySelectorAll('.navButton_wrapper');

// Layout Popover
const btnLayoutMenuTrigger = document.getElementById('btn-layout-menu-trigger');
const layoutPopoverMenu = document.getElementById('layout-popover-menu');
const layoutSingleBtn = document.getElementById('layout-single-btn');
const layoutSplitBtn = document.getElementById('layout-split-btn');
const layoutFeedBtn = document.getElementById('layout-feed-btn');

// Panels
const panelChain = document.getElementById('panel-chain');
const panelWatchlist = document.getElementById('panel-watchlist');
const panelPositions = document.getElementById('panel-positions');
const panelOrders = document.getElementById('panel-orders');
const panelDepth = document.getElementById('panel-depth');
const panelHoldings = document.getElementById('panel-holdings');
const panelBalance = document.getElementById('panel-balance');
const panelFeed = document.getElementById('panel-feed');

// Option Chain elements
const optionChainContainer = document.getElementById('option-chain-scroll-container') || document.getElementById('option-chain-body');
const ocSpotVal = document.getElementById('oc-spot-val');
const ocGreeksToggleBtn = document.getElementById('oc-greeks-toggle-btn');
const ocExpirySelect = document.getElementById('oc-expiry-select');
let showGreeks = false;
let cachedChainData = null;
let currentNiftySpot = 23071.45;
let currentNiftyChange = 116.35;
let currentNiftyChangePct = 0.51;

// Market Depth elements
const depthSpot = document.getElementById('depth-spot');
const depthTotalBuy = document.getElementById('depth-total-buy');
const depthTotalSell = document.getElementById('depth-total-sell');
const depthBuyRatio = document.getElementById('depth-buy-ratio');
const depthSellRatio = document.getElementById('depth-sell-ratio');
const depthTableBody = document.getElementById('depth-table-body');

// Watchlist elements
const watchlistItemsList = document.getElementById('watchlist-items-list');
const watchlistFilter = document.getElementById('watchlist-filter');

// Positions & Orders elements
const positionsItemsList = document.getElementById('positions-items-list');
const posTotalPnl = document.getElementById('pos-total-pnl');
const ordersItemsList = document.getElementById('orders-items-list');
const holdingsItemsList = document.getElementById('holdings-items-list');

// Feed elements
const feedLog = document.getElementById('feed-log');
const btnClearFeed = document.getElementById('btn-clear-feed');

// Global Search
const globalSearchInput = document.getElementById('global-search-input');
const searchDropdown = document.getElementById('search-dropdown');
const searchResultsList = document.getElementById('search-results-list');

// Tool Metadata
const toolMeta = {
  chain: { title: 'Chain', panel: panelChain, icon: '#' },
  positions: { title: 'Positions & P&L', panel: panelPositions, icon: '📊' },
  orders: { title: 'Orders Book', panel: panelOrders, icon: '📋' },
  watchlist: { title: 'Watchlist', panel: panelWatchlist, icon: '🔖' },
  depth: { title: 'Market Depth (Level 2)', panel: panelDepth, icon: '🪜' },
  holdings: { title: 'Demat Holdings', panel: panelHoldings, icon: '💼' },
  balance: { title: 'Funds & Margin', panel: panelBalance, icon: '👛' },
  feed: { title: 'Protocol Feed & Ticks', panel: panelFeed, icon: '⚡' }
};

// -------------------------------------------------------------
// 1. Initialize TradingView Advanced Charting Library (v31)
// -------------------------------------------------------------
function initTradingViewChart() {
  const container = document.getElementById('tv-chart-container');
  if (!container) return;

  datafeed = new GrowwDatafeed();

  const widgetOptions = {
    symbol: currentSymbol,
    interval: '1',
    container: 'tv-chart-container',
    datafeed: datafeed,
    library_path: '/charting_library/',
    locale: 'en',
    theme: 'dark',
    timezone: 'Asia/Kolkata',
    autosize: true,
    fullscreen: false,
    custom_css_url: '/charting_library/charts/customStylesDesktop_v01.css',
    loading_screen: { backgroundColor: '#121622', foregroundColor: '#00d09c' },
    disabled_features: [
      'trading_account_manager',
      'right_toolbar',
      'border_around_the_chart',
      'drawing_templates',
      'header_fullscreen_button',
      'display_market_status',
      'save_shortcut',
      'trading_notifications',
      'show_trading_notifications_history',
      'study_templates',
      'header_saveload',
      'use_localstorage_for_settings'
    ],
    enabled_features: [
      'use_symbol_name_for_header_toolbar',
      'side_toolbar_in_fullscreen_mode',
      'header_in_fullscreen_mode'
    ],
    overrides: {
      'paneProperties.background': '#121622',
      'paneProperties.backgroundType': 'solid',
      'paneProperties.vertGridProperties.color': 'rgba(30, 41, 59, 0.3)',
      'paneProperties.horzGridProperties.color': 'rgba(30, 41, 59, 0.3)',
      'scalesProperties.textColor': '#dcdcdd',
      'scalesProperties.fontSize': 12,
      'mainSeriesProperties.candleStyle.upColor': '#00d09c',
      'mainSeriesProperties.candleStyle.downColor': '#eb5b3c',
      'mainSeriesProperties.candleStyle.borderUpColor': '#00d09c',
      'mainSeriesProperties.candleStyle.borderDownColor': '#eb5b3c',
      'mainSeriesProperties.candleStyle.wickUpColor': '#00d09c',
      'mainSeriesProperties.candleStyle.wickDownColor': '#eb5b3c',
      'volume.volume.color.0': '#eb5b3c',
      'volume.volume.color.1': '#00d09c'
    }
  };

  try {
    tvWidget = new TradingView.widget(widgetOptions);
    window.tvWidget = tvWidget;
    window.datafeed = datafeed;
    tvWidget.onChartReady(() => {
      console.log('[TradingView Pro] Chart widget is ready!');
    });
  } catch (err) {
    console.error('Failed to initialize TradingView widget:', err);
  }
}

// -------------------------------------------------------------
// 2. Right Sidebar & Drawer Navigation Logic
// -------------------------------------------------------------
function openTool(toolKey) {
  window.openDrawerTool = openTool;
  if (activeTool === toolKey) {
    // Toggle close if already open
    closeDrawer();
    return;
  }

  const meta = toolMeta[toolKey];
  if (!meta) return;

  activeTool = toolKey;

  // Update button active state
  navButtons.forEach(btn => {
    if (btn.dataset.tool === toolKey) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update Drawer Title & Icon
  const titleTextEl = document.getElementById('drawer-panel-title-text');
  if (titleTextEl) {
    titleTextEl.textContent = meta.title;
  } else if (drawerPanelTitle) {
    drawerPanelTitle.textContent = meta.title;
  }
  if (drawerPanelIcon) drawerPanelIcon.textContent = meta.icon;

  // Show correct panel view
  document.querySelectorAll('.panel-view').forEach(p => p.classList.add('hidden'));
  if (meta.panel) meta.panel.classList.remove('hidden');

  // Reveal Drawer
  if (drawerPanel) drawerPanel.classList.remove('hidden');

  // Trigger chart auto-resize
  setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
}

function closeDrawer() {
  activeTool = null;
  navButtons.forEach(btn => btn.classList.remove('active'));
  if (drawerPanel) drawerPanel.classList.add('hidden');
  setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
}

function setupRightSidebar() {
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const toolKey = btn.dataset.tool;
      openTool(toolKey);
    });
  });

  if (btnCloseDrawer) {
    btnCloseDrawer.addEventListener('click', closeDrawer);
  }

  // Layout Menu Trigger
  if (btnLayoutMenuTrigger && layoutPopoverMenu) {
    btnLayoutMenuTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      layoutPopoverMenu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!layoutPopoverMenu.contains(e.target) && e.target !== btnLayoutMenuTrigger) {
        layoutPopoverMenu.classList.remove('show');
      }
    });
  }

  if (layoutFeedBtn) {
    layoutFeedBtn.addEventListener('click', () => {
      layoutPopoverMenu.classList.remove('show');
      openTool('feed');
    });
  }

  if (layoutSingleBtn) {
    layoutSingleBtn.addEventListener('click', () => {
      layoutSingleBtn.className = 'flex-1 py-1.5 px-2 rounded bg-[#00d09c]/20 text-[#00d09c] border border-[#00d09c]/40 text-xs font-semibold';
      if (layoutSplitBtn) layoutSplitBtn.className = 'flex-1 py-1.5 px-2 rounded bg-[#232a3d] text-slate-300 text-xs font-semibold hover:bg-[#2d3748]';
      layoutPopoverMenu.classList.remove('show');
      closeDrawer();
    });
  }

  if (layoutSplitBtn) {
    layoutSplitBtn.addEventListener('click', () => {
      layoutSplitBtn.className = 'flex-1 py-1.5 px-2 rounded bg-[#00d09c]/20 text-[#00d09c] border border-[#00d09c]/40 text-xs font-semibold';
      if (layoutSingleBtn) layoutSingleBtn.className = 'flex-1 py-1.5 px-2 rounded bg-[#232a3d] text-slate-300 text-xs font-semibold hover:bg-[#2d3748]';
      layoutPopoverMenu.classList.remove('show');
      openTool('chain');
    });
  }

  // Option Chain Greek Sigma (Σ) Toggle & Expiry
  if (ocGreeksToggleBtn) {
    ocGreeksToggleBtn.addEventListener('click', () => {
      showGreeks = !showGreeks;
      if (showGreeks) {
        ocGreeksToggleBtn.classList.add('GreeksToggle_toggleOn__BotgZ');
      } else {
        ocGreeksToggleBtn.classList.remove('GreeksToggle_toggleOn__BotgZ');
      }
      if (cachedChainData) {
        renderOptionChain(cachedChainData);
      }
    });
  }

  if (ocExpirySelect) {
    ocExpirySelect.addEventListener('change', () => {
      if (cachedChainData) {
        renderOptionChain(cachedChainData);
      }
    });
  }
}

// -------------------------------------------------------------
// 3. WebSocket Streaming Client
// -------------------------------------------------------------
function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  if (wsStatusDot) wsStatusDot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    if (wsStatusDot) wsStatusDot.className = 'w-2 h-2 rounded-full bg-emerald-400';
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      handleServerMessage(msg);
    } catch (err) {
      console.error('WS Parse Error:', err);
    }
  };

  ws.onclose = () => {
    if (wsStatusDot) wsStatusDot.className = 'w-2 h-2 rounded-full bg-rose-500';
    setTimeout(connectWebSocket, 2000);
  };

  ws.onerror = () => ws.close();
}

function handleServerMessage(msg) {
  switch (msg.type) {
    case 'INIT_STATE':
      renderAllState(msg.data);
      break;

    case 'INDEX_UPDATE':
      updateSingleIndex(msg.indexKey, msg.data);
      break;

    case 'CANDLE_UPDATE':
      if (datafeed) datafeed.updateTick(msg.data);
      break;

    case 'OPTION_UPDATE':
      updateOptionStrike(msg.strike, msg.side, msg.data);
      break;

    case 'DEPTH_UPDATE':
      renderMarketDepth(msg.data);
      break;

    case 'PORTFOLIO_UPDATE':
      if (msg.data) {
        if (msg.data.positions) renderPositions(msg.data.positions);
        if (msg.data.orders) renderOrders(msg.data.orders);
        if (msg.data.balance) renderBalance(msg.data.balance);
      }
      break;

    case 'POSITIONS_TICK':
      if (msg.data) {
        if (msg.data.positions) renderPositions(msg.data.positions);
        if (msg.data.balance) renderBalance(msg.data.balance);
      }
      break;

    case 'STATUS_UPDATE':
      updatePlaybackStatus(msg);
      break;

    case 'TICK_LOG':
      appendFeedLog(msg.data);
      break;
  }
}

// -------------------------------------------------------------
// 4. State Renderers
// -------------------------------------------------------------
function renderAllState(data) {
  if (data.mode && wsModeBadge) {
    wsModeBadge.textContent = `${data.mode.toUpperCase()} ${data.replaySpeed || 1}X`;
  }
  if (data.indices) renderIndicesTicker(data.indices, data.commodities);
  if (data.optionChain) renderOptionChain(data.optionChain);
  if (data.depth) renderMarketDepth(data.depth);
  if (data.watchlist) renderWatchlist(data.watchlist);
  if (data.positions) renderPositions(data.positions);
  if (data.orders) renderOrders(data.orders);
  if (data.holdings) renderHoldings(data.holdings);
  if (data.balance) renderBalance(data.balance);
}

// -------------------------------------------------------------
// 5. Indices Ticker Row (Matching Image 1 Clean Style)
// -------------------------------------------------------------
function renderIndicesTicker(indices, commodities) {
  if (!indicesTickerRow) return;
  indicesTickerRow.innerHTML = '';

  // 1. Core Stock Indices
  Object.values(indices).forEach(idx => {
    const isUp = idx.change >= 0;
    const sign = isUp ? '+' : '';
    const colorCls = isUp ? 'text-[#00d09c]' : 'text-[#eb5b3c]';

    const div = document.createElement('div');
    div.id = `idx-pill-${idx.symbol.replace(/\s+/g, '_')}`;
    div.className = 'flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition py-0.5';
    div.onclick = () => switchChartSymbol(`NSE:${idx.symbol.replace(/\s+/g, '')}`);

    div.innerHTML = `
      <span class="text-slate-400 font-semibold tracking-tight text-[11px]">${idx.symbol}</span>
      <span class="font-bold text-white font-mono text-[11px] idx-val">${Number(idx.value).toFixed(2)}</span>
      <span class="${colorCls} font-mono font-medium text-[11px] idx-chg">${sign}${Number(idx.change).toFixed(2)} (${sign}${Number(idx.changePct).toFixed(2)}%)</span>
    `;
    indicesTickerRow.appendChild(div);
  });

  // 2. Commodities (Crude Oil, Natural Gas)
  if (commodities) {
    Object.values(commodities).forEach(cmd => {
      if (!cmd.name || cmd.value === undefined) return;
      const isUp = (cmd.change || 0) >= 0;
      const sign = isUp ? '+' : '';
      const colorCls = isUp ? 'text-[#00d09c]' : 'text-[#eb5b3c]';

      const div = document.createElement('div');
      div.className = 'flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition py-0.5';
      div.innerHTML = `
        <span class="text-slate-400 font-semibold tracking-tight text-[11px]">${cmd.name}</span>
        <span class="font-bold text-white font-mono text-[11px]">₹${Number(cmd.value).toFixed(2)}</span>
        <span class="${colorCls} font-mono font-medium text-[11px]">${sign}${Number(cmd.change).toFixed(2)} (${sign}${Number(cmd.changePct).toFixed(2)}%)</span>
      `;
      indicesTickerRow.appendChild(div);
    });
  }
}

function updateSingleIndex(indexKey, data) {
  const pill = document.getElementById(`idx-pill-${indexKey.replace(/\s+/g, '_')}`);
  if (!pill) return;

  const valEl = pill.querySelector('.idx-val');
  const chgEl = pill.querySelector('.idx-chg');

  const oldVal = parseFloat(valEl?.textContent || '0');
  const newVal = data.value;
  const isUp = data.change >= 0;
  const sign = isUp ? '+' : '';
  const colorCls = isUp ? 'text-[#00d09c]' : 'text-[#eb5b3c]';

  if (valEl) {
    valEl.textContent = Number(newVal).toFixed(2);
    if (newVal > oldVal) valEl.className = 'font-bold text-[#00d09c] font-mono text-[11px] idx-val';
    else if (newVal < oldVal) valEl.className = 'font-bold text-[#eb5b3c] font-mono text-[11px] idx-val';
    setTimeout(() => { if (valEl) valEl.className = 'font-bold text-white font-mono text-[11px] idx-val'; }, 600);
  }

  if (chgEl) {
    chgEl.className = `${colorCls} font-mono font-medium text-[11px] idx-chg`;
    chgEl.textContent = `${sign}${Number(data.change).toFixed(2)} (${sign}${Number(data.changePct).toFixed(2)}%)`;
  }

  if (indexKey === 'NIFTY 50') {
    if (ocSpotVal) ocSpotVal.textContent = Number(newVal).toFixed(2);
    if (depthSpot) depthSpot.textContent = Number(newVal).toFixed(2);
    updateFloatingSpot(newVal, data.change, data.changePct);
  }
}

// -------------------------------------------------------------
// 6. Option Chain View (Groww Exact 3-Column Matrix)
// -------------------------------------------------------------
function formatStrikePrice(strike) {
  return Number(strike).toLocaleString('en-IN');
}

function createFloatingSpotBanner(spot, change, changePct) {
  const isUp = change >= 0;
  const sign = isUp ? '+' : '';
  const colorCls = isUp ? 'text-[#00d09c]' : 'text-[#eb5b3c]';
  const banner = document.createElement('div');
  banner.id = 'oc-spot-price-banner';
  banner.className = 'SpotPrice_container__yraDG';
  banner.innerHTML = `
    <div class="SpotPrice_lineIndicator__uVj6F"></div>
    <div class="SpotPrice_priceContainer__aQAJa">
      <span id="oc-floating-spot-val" class="text-slate-900 font-bold">${Number(spot).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      <span class="SpotPrice_divider__GRyIu"></span>
      <span id="oc-floating-spot-chg" class="${colorCls} font-bold">${sign}${Number(change).toFixed(2)} (${sign}${Number(changePct).toFixed(2)}%)</span>
    </div>
  `;
  return banner;
}

function updateFloatingSpot(spot, change, changePct) {
  currentNiftySpot = spot;
  currentNiftyChange = change;
  currentNiftyChangePct = changePct;

  const spotValEl = document.getElementById('oc-floating-spot-val');
  const spotChgEl = document.getElementById('oc-floating-spot-chg');

  if (spotValEl) {
    spotValEl.textContent = Number(spot).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  if (spotChgEl) {
    const isUp = change >= 0;
    const sign = isUp ? '+' : '';
    spotChgEl.className = `${isUp ? 'text-[#00d09c]' : 'text-[#eb5b3c]'} font-bold`;
    spotChgEl.textContent = `${sign}${Number(change).toFixed(2)} (${sign}${Number(changePct).toFixed(2)}%)`;
  }
}

function renderOptionChain(chainData) {
  if (!chainData) return;
  cachedChainData = chainData;
  if (!optionChainContainer) return;

  optionChainContainer.innerHTML = '';

  const strikes = Object.keys(chainData).map(Number).sort((a, b) => a - b);
  if (strikes.length === 0) return;

  // Calculate max OI across all strikes for proportional bar widths
  let maxOi = 1;
  strikes.forEach(s => {
    const row = chainData[s];
    if (row.ce?.oi && row.ce.oi > maxOi) maxOi = row.ce.oi;
    if (row.pe?.oi && row.pe.oi > maxOi) maxOi = row.pe.oi;
  });

  const spot = currentNiftySpot;
  let spotBannerInserted = false;

  strikes.forEach((strike) => {
    // Insert floating spot price indicator where spot lies between strikes
    if (!spotBannerInserted && spot < strike) {
      optionChainContainer.appendChild(createFloatingSpotBanner(spot, currentNiftyChange, currentNiftyChangePct));
      spotBannerInserted = true;
    }

    const row = chainData[strike];
    const isATM = row.isATM || (Math.abs(strike - spot) <= 25);
    const isITMC = strike < spot;
    const isITMP = strike > spot;

    const ceLtpVal = row.ce?.ltp ? Number(row.ce.ltp).toFixed(2) : '--';
    const peLtpVal = row.pe?.ltp ? Number(row.pe.ltp).toFixed(2) : '--';

    const ceChg = row.ce?.change ?? 0;
    const ceChgPct = row.ce?.changePct ?? 0;
    const isCeUp = ceChg >= 0;
    const ceSign = isCeUp ? '+' : '';
    const ceColor = isCeUp ? 'text-[#00d09c]' : 'text-[#eb5b3c]';

    const peChg = row.pe?.change ?? 0;
    const peChgPct = row.pe?.changePct ?? 0;
    const isPeUp = peChg >= 0;
    const peSign = isPeUp ? '+' : '';
    const peColor = isPeUp ? 'text-[#00d09c]' : 'text-[#eb5b3c]';

    const ceOi = row.ce?.oi || 0;
    const peOi = row.pe?.oi || 0;
    const ceBarWidthPct = Math.min(50, Math.max(4, (ceOi / maxOi) * 50));
    const peBarWidthPct = Math.min(50, Math.max(4, (peOi / maxOi) * 50));

    const rowEl = document.createElement('div');
    rowEl.id = `oc-row-${strike}`;
    rowEl.className = `OptionChainRow_mainDiv__PnNIs group cursor-pointer ${isITMC ? 'OptionChainRow_callITM' : ''} ${isITMP ? 'OptionChainRow_putITM' : ''}`;

    // Sub-text for Call and Put (Percentage or Greeks)
    let ceSubHtml, peSubHtml;
    if (showGreeks) {
      const ceIv = row.ce?.iv ? `${row.ce.iv}%` : '--';
      const ceDelta = row.ce?.delta !== undefined ? row.ce.delta : '--';
      ceSubHtml = `<span id="oc-ce-sub-${strike}" class="text-slate-400 font-mono text-[10px]">IV ${ceIv} • Δ ${ceDelta}</span>`;

      const peIv = row.pe?.iv ? `${row.pe.iv}%` : '--';
      const peDelta = row.pe?.delta !== undefined ? row.pe.delta : '--';
      peSubHtml = `<span id="oc-pe-sub-${strike}" class="text-slate-400 font-mono text-[10px]">IV ${peIv} • Δ ${peDelta}</span>`;
    } else {
      ceSubHtml = `<span id="oc-ce-sub-${strike}" class="${ceColor} font-mono text-[10.5px]">${ceSign}${Number(ceChgPct).toFixed(2)}%</span>`;
      peSubHtml = `<span id="oc-pe-sub-${strike}" class="${peColor} font-mono text-[10.5px]">${peSign}${Number(peChgPct).toFixed(2)}%</span>`;
    }

    const expiryText = ocExpirySelect ? ocExpirySelect.value.replace(' ⌵', '') : '03 Nov';

    rowEl.innerHTML = `
      <!-- 1. Left Column: Call LTP -->
      <div class="OptionChainRow_callCell">
        <div class="oc-action-btn-ce absolute left-2 gap-1 items-center">
          <button class="OptionChainRow_overlayButton__wiUyW oc-btn-buy" onclick="event.stopPropagation(); quickTrade('NIFTY ${expiryText} ${strike} CE', ${strike}, 'BUY', 'CE', ${row.ce?.ltp || 50}, 25)" title="Buy Call">B</button>
          <button class="OptionChainRow_overlayButton__wiUyW oc-btn-sell" onclick="event.stopPropagation(); quickTrade('NIFTY ${expiryText} ${strike} CE', ${strike}, 'SELL', 'CE', ${row.ce?.ltp || 50}, 25)" title="Sell Call">S</button>
        </div>
        <div class="flex items-baseline gap-0.5">
          <span class="text-slate-400 font-mono text-xs">₹</span>
          <span id="oc-ce-ltp-${strike}" class="font-mono text-xs font-bold text-white">${ceLtpVal}</span>
        </div>
        ${ceSubHtml}
      </div>

      <!-- 2. Middle Column: Strike & OI Bars -->
      <div class="StrikeWithBars_strikeWithBarsRoot__ono24 select-none">
        <span class="font-mono text-[13px] font-bold text-slate-100 tracking-tight">${formatStrikePrice(strike)}</span>
        <div class="StrikeWithBars_strikeBarWrapper__rTXzH" title="Call OI: ${formatOI(ceOi)} | Put OI: ${formatOI(peOi)}">
          <div class="StrikeWithBars_callBar__0myiv" style="width: ${ceBarWidthPct}%;"></div>
          <div class="StrikeWithBars_putBar__bORAY" style="width: ${peBarWidthPct}%;"></div>
        </div>
      </div>

      <!-- 3. Right Column: Put LTP -->
      <div class="OptionChainRow_putCell">
        <div class="flex items-baseline gap-0.5">
          <span class="text-slate-400 font-mono text-xs">₹</span>
          <span id="oc-pe-ltp-${strike}" class="font-mono text-xs font-bold text-white">${peLtpVal}</span>
        </div>
        ${peSubHtml}
        <div class="oc-action-btn-pe absolute right-2 gap-1 items-center">
          <button class="OptionChainRow_overlayButton__wiUyW oc-btn-buy" onclick="event.stopPropagation(); quickTrade('NIFTY ${expiryText} ${strike} PE', ${strike}, 'BUY', 'PE', ${row.pe?.ltp || 50}, 25)" title="Buy Put">B</button>
          <button class="OptionChainRow_overlayButton__wiUyW oc-btn-sell" onclick="event.stopPropagation(); quickTrade('NIFTY ${expiryText} ${strike} PE', ${strike}, 'SELL', 'PE', ${row.pe?.ltp || 50}, 25)" title="Sell Put">S</button>
        </div>
      </div>
    `;

    optionChainContainer.appendChild(rowEl);
  });

  // If spot was higher than all strikes, place at the end
  if (!spotBannerInserted) {
    optionChainContainer.appendChild(createFloatingSpotBanner(spot, currentNiftyChange, currentNiftyChangePct));
  }
}

function updateOptionStrike(strike, side, data) {
  if (cachedChainData && cachedChainData[strike] && cachedChainData[strike][side]) {
    cachedChainData[strike][side] = { ...cachedChainData[strike][side], ...data };
  }

  const ltpEl = document.getElementById(`oc-${side}-ltp-${strike}`);
  if (!ltpEl) return;

  const oldLtp = lastLtpCache.get(`${strike}-${side}`) || data.ltp;
  const newLtp = data.ltp;
  lastLtpCache.set(`${strike}-${side}`, newLtp);

  ltpEl.textContent = Number(newLtp).toFixed(2);
  ltpEl.classList.remove('flash-up', 'flash-down');
  void ltpEl.offsetWidth;
  ltpEl.classList.add(newLtp >= oldLtp ? 'flash-up' : 'flash-down');

  // Update sub-text (percentage change or greeks)
  const subEl = document.getElementById(`oc-${side}-sub-${strike}`);
  if (subEl) {
    if (showGreeks) {
      const iv = data.iv ? `${data.iv}%` : '--';
      const delta = data.delta !== undefined ? data.delta : '--';
      subEl.textContent = `IV ${iv} • Δ ${delta}`;
    } else {
      const chg = data.change ?? 0;
      const chgPct = data.changePct ?? 0;
      const isUp = chg >= 0;
      const sign = isUp ? '+' : '';
      subEl.className = `${isUp ? 'text-[#00d09c]' : 'text-[#eb5b3c]'} font-mono text-[10.5px]`;
      subEl.textContent = `${sign}${Number(chgPct).toFixed(2)}%`;
    }
  }
}

function formatOI(val) {
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
  if (val >= 1000) return Math.round(val / 1000) + 'k';
  return String(val);
}

// -------------------------------------------------------------
// 7. Market Depth (Level 2) View
// -------------------------------------------------------------
function renderMarketDepth(depthData) {
  if (!depthTableBody) return;
  depthTableBody.innerHTML = '';

  if (depthTotalBuy) depthTotalBuy.textContent = `Buy: ${depthData.buyPct}%`;
  if (depthTotalSell) depthTotalSell.textContent = `Sell: ${depthData.sellPct}%`;
  if (depthBuyRatio) depthBuyRatio.style.width = `${depthData.buyPct}%`;
  if (depthSellRatio) depthSellRatio.style.width = `${depthData.sellPct}%`;

  for (let i = 0; i < 5; i++) {
    const bid = depthData.bids[i] || { price: 0, qty: 0, orders: 0 };
    const ask = depthData.asks[i] || { price: 0, qty: 0, orders: 0 };

    const tr = document.createElement('tr');
    tr.className = 'py-1 border-b border-[#1e2433]';
    tr.innerHTML = `
      <td class="py-1 text-left text-slate-400 text-[10.5px]">${bid.orders}</td>
      <td class="py-1 text-left text-slate-300 text-[11px]">${bid.qty}</td>
      <td class="py-1 text-right text-[#00d09c] font-bold text-[11px]">${Number(bid.price).toFixed(2)}</td>
      <td class="py-1 text-left text-[#eb5b3c] font-bold text-[11px] pl-4">${Number(ask.price).toFixed(2)}</td>
      <td class="py-1 text-right text-slate-300 text-[11px]">${ask.qty}</td>
      <td class="py-1 text-right text-slate-400 text-[10.5px]">${ask.orders}</td>
    `;
    depthTableBody.appendChild(tr);
  }
}

// -------------------------------------------------------------
// 8. Watchlist View
// -------------------------------------------------------------
function renderWatchlist(watchlist) {
  if (!watchlistItemsList) return;
  watchlistItemsList.innerHTML = '';

  watchlist.forEach(item => {
    const isUp = item.change >= 0;
    const sign = isUp ? '+' : '';
    const colorCls = isUp ? 'text-[#00d09c]' : 'text-[#eb5b3c]';

    const div = document.createElement('div');
    div.className = 'p-3 hover:bg-[#1b2130] cursor-pointer flex items-center justify-between transition group';
    div.onclick = () => switchChartSymbol(`NSE:${item.symbol.replace(/\s+/g, '')}`);

    div.innerHTML = `
      <div>
        <div class="flex items-center gap-2">
          <span class="font-bold text-xs text-white">${item.symbol}</span>
          <button class="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-[#00d09c]/10 hover:bg-[#00d09c]/20 text-[#00d09c] border border-[#00d09c]/30 opacity-0 group-hover:opacity-100 transition cursor-pointer" onclick="event.stopPropagation(); quickTrade('${item.symbol}', null, 'BUY', null, ${item.ltp}, 1)">
            + Trade
          </button>
        </div>
        <span class="text-[10px] text-slate-400 uppercase font-mono">${item.type}</span>
      </div>
      <div class="text-right font-mono">
        <span class="font-bold text-xs text-white block">₹${Number(item.ltp).toFixed(2)}</span>
        <span class="${colorCls} text-[10.5px]">${sign}${Number(item.change).toFixed(2)} (${sign}${Number(item.changePct).toFixed(2)}%)</span>
      </div>
    `;
    watchlistItemsList.appendChild(div);
  });
}

// -------------------------------------------------------------
// 9. Positions & Orders Views (Groww Official Table System)
// -------------------------------------------------------------
function renderPositions(positions) {
  if (!positionsItemsList) return;
  positionsItemsList.innerHTML = '';

  if (!positions || positions.length === 0) {
    positionsItemsList.innerHTML = `
      <div class="tp23EmptyState p-8 text-center text-slate-400">
        <svg class="w-10 h-10 mx-auto text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p class="text-xs font-semibold">No open positions</p>
        <p class="text-[11px] text-slate-500 mt-1">Trade from Option Chain or Search to practice simulation</p>
      </div>
    `;
    if (posTotalPnl) {
      posTotalPnl.textContent = '₹0.00';
      posTotalPnl.className = 'text-base font-bold text-slate-400 font-mono';
    }
    return;
  }

  let totalPnl = 0;
  positions.forEach(pos => {
    totalPnl += (pos.pnl || 0);
    const isUp = (pos.pnl || 0) >= 0;
    const sign = isUp ? '+' : '';
    const colorCls = isUp ? 'text-[#00d09c]' : 'text-[#eb5b3c]';

    const card = document.createElement('div');
    card.id = `pos-card-${pos.id}`;
    card.className = 'p-3 bg-[#181e2b] border border-[#1e2433] rounded-xl flex items-center justify-between font-mono hover:border-slate-700 transition';
    card.innerHTML = `
      <div class="flex-1 min-w-0 mr-3">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-white truncate">${pos.symbol}</span>
          <span class="text-[9px] bg-slate-800 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">${pos.product || 'MIS'}</span>
        </div>
        <div class="text-[10.5px] text-slate-400 mt-1 flex items-center gap-2">
          <span>Qty: <b class="text-white">${pos.qty}</b></span>
          <span>Avg: <b class="text-white">₹${Number(pos.avgPrice).toFixed(2)}</b></span>
          <span>LTP: <b id="pos-ltp-${pos.id}" class="text-white">₹${Number(pos.ltp).toFixed(2)}</b></span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-right">
          <span id="pos-pnl-${pos.id}" class="${colorCls} font-bold text-xs block">${sign}₹${Number(pos.pnl).toFixed(2)}</span>
          <span id="pos-pnlpct-${pos.id}" class="${colorCls} text-[10px]">${sign}${Number(pos.pnlPct).toFixed(2)}%</span>
        </div>
        <button class="mint-btn-default mint-btn-small py-1 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-[#eb5b3c] border border-rose-500/30 text-[11px] font-bold transition cursor-pointer" onclick="exitPosition('${pos.id}')">
          Exit
        </button>
      </div>
    `;
    positionsItemsList.appendChild(card);
  });

  if (posTotalPnl) {
    const isUp = totalPnl >= 0;
    const sign = isUp ? '+' : '';
    const colorCls = isUp ? 'text-[#00d09c]' : 'text-[#eb5b3c]';
    posTotalPnl.className = `text-base font-bold ${colorCls} font-mono`;
    posTotalPnl.textContent = `${sign}₹${Number(totalPnl).toFixed(2)}`;
  }
}

function renderOrders(orders) {
  if (!ordersItemsList) return;
  ordersItemsList.innerHTML = '';

  if (!orders || orders.length === 0) {
    ordersItemsList.innerHTML = `
      <div class="tp23EmptyState p-8 text-center text-slate-400">
        <p class="text-xs">No orders placed yet</p>
      </div>
    `;
    return;
  }

  orders.forEach(ord => {
    const isBuy = ord.type === 'BUY';
    const typeColor = isBuy ? 'text-[#00d09c] bg-[#00d09c]/10 border-[#00d09c]/30' : 'text-[#eb5b3c] bg-[#eb5b3c]/10 border-[#eb5b3c]/30';
    const statusColor = ord.status === 'EXECUTED' ? 'text-emerald-400' : 'text-amber-400';

    const card = document.createElement('div');
    card.className = 'p-3 bg-[#181e2b] border border-[#1e2433] rounded-xl flex items-center justify-between font-mono';
    card.innerHTML = `
      <div>
        <div class="flex items-center gap-2">
          <span class="text-[10px] px-2 py-0.5 rounded border font-bold ${typeColor}">${ord.type}</span>
          <span class="text-xs font-bold text-white">${ord.symbol}</span>
          <span class="text-[9px] text-slate-500 font-sans">${ord.growwOrderId || ord.id}</span>
        </div>
        <div class="text-[10.5px] text-slate-400 mt-1">
          Qty: <b class="text-white">${ord.qty}</b> · Price: <b class="text-white">₹${Number(ord.price).toFixed(2)}</b> · ${ord.orderType} · ${ord.product || 'MIS'}
        </div>
      </div>
      <div class="text-right text-[11px]">
        <span class="${statusColor} font-bold block">${ord.status}</span>
        <span class="text-slate-400 text-[10px]">${ord.time}</span>
      </div>
    `;
    ordersItemsList.appendChild(card);
  });
}

function renderBalance(balance) {
  const elAvailable = document.getElementById('balance-available-margin');
  const elUsed = document.getElementById('balance-used-margin');
  const elRealized = document.getElementById('balance-realized-pnl');
  const elTotal = document.getElementById('balance-total-funds');

  if (balance.availableCash !== undefined) {
    currentBalanceState.availableCash = balance.availableCash;
    if (elAvailable) elAvailable.textContent = `₹${Number(balance.availableCash).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (balance.marginUsed !== undefined) {
    currentBalanceState.marginUsed = balance.marginUsed;
    if (elUsed) elUsed.textContent = `₹${Number(balance.marginUsed).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (balance.realizedPnl !== undefined) {
    currentBalanceState.realizedPnl = balance.realizedPnl;
    if (elRealized) {
      const isUp = balance.realizedPnl >= 0;
      const sign = isUp ? '+' : '';
      elRealized.textContent = `${sign}₹${Number(balance.realizedPnl).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      elRealized.className = `${isUp ? 'text-emerald-400' : 'text-rose-400'} font-bold`;
    }
  }
  if (balance.totalFunds !== undefined) {
    currentBalanceState.totalFunds = balance.totalFunds;
    if (elTotal) elTotal.textContent = `₹${Number(balance.totalFunds).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

function renderHoldings(holdings) {
  if (!holdingsItemsList) return;
  holdingsItemsList.innerHTML = '';

  holdings.forEach(h => {
    const isUp = h.pnl >= 0;
    const sign = isUp ? '+' : '';
    const colorCls = isUp ? 'text-[#00d09c]' : 'text-[#eb5b3c]';

    const card = document.createElement('div');
    card.className = 'p-3 bg-[#181e2b] border border-[#1e2433] rounded-lg flex items-center justify-between font-mono cursor-pointer hover:border-slate-700 transition';
    card.onclick = () => switchChartSymbol(`NSE:${h.symbol}`);

    card.innerHTML = `
      <div>
        <span class="text-xs font-bold text-white block">${h.symbol}</span>
        <span class="text-[10px] text-slate-400">Qty: ${h.qty} · Avg: ₹${Number(h.avgPrice).toFixed(2)}</span>
      </div>
      <div class="text-right">
        <span class="text-xs font-bold text-white block">₹${Number(h.ltp).toFixed(2)}</span>
        <span class="${colorCls} text-[10.5px]">${sign}₹${Number(h.pnl).toFixed(2)} (${sign}${Number(h.pnlPct).toFixed(2)}%)</span>
      </div>
    `;
    holdingsItemsList.appendChild(card);
  });
}

// -------------------------------------------------------------
// 10. Switch Chart Symbol
// -------------------------------------------------------------
function switchChartSymbol(newSymbol) {
  currentSymbol = newSymbol;
  if (tvWidget && tvWidget.activeChart) {
    try {
      tvWidget.activeChart().setSymbol(newSymbol);
      console.log(`[TradingView] Switched active chart symbol to: ${newSymbol}`);
    } catch (e) {
      console.warn('setSymbol error:', e);
    }
  }
}

// -------------------------------------------------------------
// 11. Global Search Suggestions (Groww Official st_query API)
// -------------------------------------------------------------
function setupSearch() {
  if (!globalSearchInput || !searchDropdown || !searchResultsList) return;

  let debounceTimer = null;
  let activeIndex = -1;
  let currentResults = [];

  function getBadgeClass(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('index')) return 'badge-index';
    if (t.includes('stock') || t.includes('equity')) return 'badge-stocks';
    if (t.includes('opt')) return 'badge-option';
    if (t.includes('etf')) return 'badge-etf';
    if (t.includes('commodity')) return 'badge-commodity';
    return 'badge-stocks';
  }

  function getInitials(title, type) {
    if ((type || '').toLowerCase().includes('opt')) {
      return title.includes('Call') ? 'CE' : 'PE';
    }
    const words = (title || '').trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return (title || 'GR').substring(0, 2).toUpperCase();
  }

  function renderResults(items) {
    currentResults = items;
    activeIndex = -1;
    searchResultsList.innerHTML = '';

    if (!items || items.length === 0) {
      searchResultsList.innerHTML = `
        <div class="se27SearchLoader">
          <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>No matching instruments found</span>
        </div>
      `;
      searchDropdown.classList.remove('hidden');
      return;
    }

    items.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'se27SeSuggestion sic17SeSuggestion';
      row.dataset.index = idx;

      const entityType = item.entity_type || 'Stock';
      const badgeCls = getBadgeClass(entityType);
      const initials = getInitials(item.title, entityType);
      const subInfo = item.nse_scrip_code || item.bse_scrip_code || item.groww_contract_id || item.desc || '';

      row.innerHTML = `
        <div class="css23SuggestionRow">
          <div class="css23IconCircle">${initials}</div>
          <div class="css23SuggestionText">
            <span class="suggestion-title">${item.title}</span>
            <span class="suggestion-sub">
              <span>${subInfo}</span>
              ${item.lot_qty ? `<span>• Lot: ${item.lot_qty}</span>` : ''}
            </span>
          </div>
        </div>
        <span class="sf54SearchFilterChips ${badgeCls}">${entityType}</span>
      `;

      row.onclick = () => selectItem(item);
      searchResultsList.appendChild(row);
    });

    searchDropdown.classList.remove('hidden');
  }

  function selectItem(item) {
    if (!item) return;

    // 1. If Option contract clicked
    if ((item.entity_type || '').toLowerCase().includes('opt') || item.groww_contract_id?.includes('CE') || item.groww_contract_id?.includes('PE')) {
      const match = (item.groww_contract_id || item.title || '').match(/(\d{5})/);
      if (match) {
        const strike = parseInt(match[1], 10);
        openTool('chain');
        // Scroll strike into view if available
        setTimeout(() => {
          const row = document.querySelector(`tr[data-strike="${strike}"]`);
          if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.classList.add('bg-emerald-500/20');
            setTimeout(() => row.classList.remove('bg-emerald-500/20'), 1500);
          }
        }, 300);
      }
    } 
    // 2. If Stock or Index clicked
    else {
      let sym = item.nse_scrip_code || item.title;
      let isBse = item.entity_type === 'Index' && (sym === 'SENSEX' || sym.includes('BSE'));
      let fullSym = `${isBse ? 'BSE' : 'NSE'}:${sym.replace(/\s+/g, '')}`;
      switchChartSymbol(fullSym);
    }

    globalSearchInput.value = item.title;
    searchDropdown.classList.add('hidden');
  }

  globalSearchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (!val) {
      searchDropdown.classList.add('hidden');
      searchResultsList.innerHTML = '';
      return;
    }

    clearTimeout(debounceTimer);
    searchResultsList.innerHTML = `
      <div class="se27SearchLoader">
        <svg class="animate-spin w-4 h-4 text-[#00d09c]" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <span>Searching Groww instruments...</span>
      </div>
    `;
    searchDropdown.classList.remove('hidden');

    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        renderResults(data.content || []);
      } catch (err) {
        console.warn('Search request error:', err);
        renderResults([]);
      }
    }, 180);
  });

  // Keyboard navigation (Arrow Up, Down, Enter, Escape)
  globalSearchInput.addEventListener('keydown', (e) => {
    if (searchDropdown.classList.contains('hidden') || !currentResults.length) return;

    const rows = searchResultsList.querySelectorAll('.se27SeSuggestion');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % rows.length;
      updateActiveRow(rows);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + rows.length) % rows.length;
      updateActiveRow(rows);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < currentResults.length) {
        selectItem(currentResults[activeIndex]);
      } else if (currentResults.length > 0) {
        selectItem(currentResults[0]);
      }
    } else if (e.key === 'Escape') {
      searchDropdown.classList.add('hidden');
    }
  });

  function updateActiveRow(rows) {
    rows.forEach((r, idx) => {
      if (idx === activeIndex) {
        r.classList.add('active');
        r.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        r.classList.remove('active');
      }
    });
  }

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!globalSearchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      searchDropdown.classList.add('hidden');
    }
  });

  // Re-open on focus if query present
  globalSearchInput.addEventListener('focus', () => {
    if (globalSearchInput.value.trim() && currentResults.length > 0) {
      searchDropdown.classList.remove('hidden');
    }
  });
}

// -------------------------------------------------------------
// 12. Protocol Feed & Log
// -------------------------------------------------------------
function appendFeedLog(frame) {
  if (!feedLog) return;
  const div = document.createElement('div');
  div.className = 'p-1.5 rounded bg-[#181e2b] border border-[#1e2433] text-[10.5px] font-mono leading-tight';

  const timeStr = frame.timeStr || new Date().toLocaleTimeString();
  const subject = frame.subject || frame.topic || '';
  const data = frame.data || {};

  div.innerHTML = `
    <div class="flex items-center justify-between text-slate-400 text-[9.5px]">
      <span class="text-emerald-400 font-bold">${frame.type || 'MSG'}</span>
      <span>${timeStr}</span>
    </div>
    <div class="text-slate-300 truncate mt-0.5">${subject}</div>
    <div class="text-[#00d09c] text-[10px] truncate mt-0.5">${JSON.stringify(data)}</div>
  `;

  feedLog.prepend(div);
  if (feedLog.children.length > 50) {
    feedLog.removeChild(feedLog.lastChild);
  }
}

if (btnClearFeed) {
  btnClearFeed.addEventListener('click', () => {
    if (feedLog) feedLog.innerHTML = '';
  });
}

// -------------------------------------------------------------
// 13. Playback Controls
// -------------------------------------------------------------
function setupPlaybackControls() {
  if (btnTogglePlay) {
    btnTogglePlay.addEventListener('click', () => {
      fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' })
      });
    });
  }

  if (selectSpeed) {
    selectSpeed.addEventListener('change', (e) => {
      const speed = Number(e.target.value);
      fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed })
      });
    });
  }
}

function updatePlaybackStatus(msg) {
  if (msg.replayStatus) {
    isPlaying = msg.replayStatus === 'playing';
    if (btnPlayIcon) btnPlayIcon.textContent = isPlaying ? '⏸' : '▶';
    if (btnPlayLabel) btnPlayLabel.textContent = isPlaying ? 'Pause' : 'Play';
  }
  if (msg.replaySpeed && selectSpeed) {
    selectSpeed.value = String(msg.replaySpeed);
    if (wsModeBadge) wsModeBadge.textContent = `REPLAY ${msg.replaySpeed}X`;
  }
}

// -------------------------------------------------------------
// 14. Paper Trading Engine & Interactive Place Order Modal
// -------------------------------------------------------------
let currentOrderState = {
  symbol: 'NIFTY 26NOV 23100 CE',
  strike: 23100,
  side: 'BUY',
  optionType: 'CE',
  ltp: 54.20,
  lotSize: 25,
  qty: 25,
  orderType: 'MARKET',
  price: 54.20,
  product: 'MIS'
};

let currentBalanceState = {
  availableCash: 95320.00,
  marginUsed: 4680.00,
  totalFunds: 100000.00,
  realizedPnl: 0.00
};

let snackbarTimeout = null;
function showSnackbar(msg, isError = false) {
  const snackbar = document.getElementById('groww-snackbar');
  const snackbarMsg = document.getElementById('snackbar-msg');
  const snackbarIcon = document.getElementById('snackbar-icon');
  if (!snackbar || !snackbarMsg) return;

  snackbarMsg.textContent = msg;
  if (snackbarIcon) {
    snackbarIcon.textContent = isError ? '✕' : '✓';
    snackbarIcon.className = isError ? 'text-rose-400 font-bold text-sm' : 'text-emerald-400 font-bold text-sm';
  }
  snackbar.classList.add('snackBar_snackBarShow__x8ZxJ');
  if (snackbarTimeout) clearTimeout(snackbarTimeout);
  snackbarTimeout = setTimeout(() => {
    snackbar.classList.remove('snackBar_snackBarShow__x8ZxJ');
  }, 4000);
}
window.showSnackbar = showSnackbar;

function openOrderModal(params = {}) {
  const modal = document.getElementById('place-order-modal');
  if (!modal) return;

  currentOrderState.symbol = params.symbol || 'NIFTY 26NOV 23100 CE';
  currentOrderState.strike = params.strike || 23100;
  currentOrderState.side = (params.side || 'BUY').toUpperCase();
  currentOrderState.optionType = params.optionType || 'CE';
  currentOrderState.ltp = Number(params.ltp || 54.20);
  currentOrderState.lotSize = Number(params.lotSize || (currentOrderState.symbol.includes('BANK') ? 15 : 25));
  currentOrderState.qty = currentOrderState.lotSize;
  currentOrderState.price = currentOrderState.ltp;
  currentOrderState.orderType = 'MARKET';
  currentOrderState.product = 'MIS';

  updateOrderModalUI();
  modal.classList.remove('hidden');
}
window.quickTrade = function(symbol, strike, side, optionType, ltp, lotSize) {
  openOrderModal({ symbol, strike, side, optionType, ltp, lotSize });
};

function closeOrderModal() {
  const modal = document.getElementById('place-order-modal');
  if (modal) modal.classList.add('hidden');
}

function updateOrderModalUI() {
  const elSymbol = document.getElementById('modal-order-symbol');
  const elLtp = document.getElementById('modal-order-ltp');
  const elLotHint = document.getElementById('modal-lot-size-hint');
  const elQty = document.getElementById('modal-qty-input');
  const elPrice = document.getElementById('modal-price-input');
  const elReqMargin = document.getElementById('modal-required-margin');
  const elAvailMargin = document.getElementById('modal-available-margin');
  const btnSide = document.getElementById('btn-submit-order-side');
  const btnLabel = document.getElementById('btn-submit-order-label');
  const btnSubmit = document.getElementById('btn-submit-order');
  const tabBuy = document.getElementById('tab-order-buy');
  const tabSell = document.getElementById('tab-order-sell');
  const tabIndicator = document.getElementById('tab-order-indicator');

  if (elSymbol) elSymbol.textContent = currentOrderState.symbol;
  if (elLtp) elLtp.textContent = `₹${currentOrderState.ltp.toFixed(2)}`;
  if (elLotHint) elLotHint.textContent = `Lot Size: ${currentOrderState.lotSize}`;
  if (elQty) {
    elQty.value = currentOrderState.qty;
    elQty.step = currentOrderState.lotSize;
    elQty.min = currentOrderState.lotSize;
  }
  if (elPrice) {
    elPrice.value = currentOrderState.price.toFixed(2);
    elPrice.disabled = currentOrderState.orderType === 'MARKET';
  }

  // Margin calculation
  const effPrice = currentOrderState.orderType === 'MARKET' ? currentOrderState.ltp : currentOrderState.price;
  const reqMargin = effPrice * currentOrderState.qty;
  if (elReqMargin) elReqMargin.textContent = `₹${reqMargin.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (elAvailMargin) elAvailMargin.textContent = `₹${Number(currentBalanceState.availableCash).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Tab & Button coloring
  const isBuy = currentOrderState.side === 'BUY';
  if (tabBuy && tabSell && tabIndicator) {
    if (isBuy) {
      tabBuy.className = 'flex-1 py-3 text-center text-sm font-bold text-[#00d09c] transition';
      tabSell.className = 'flex-1 py-3 text-center text-sm font-bold text-slate-400 hover:text-slate-200 transition';
      tabIndicator.className = 'placeOrderScreen_greenLine__CVpTQ absolute w-1/2 bottom-0 left-0 transition-all duration-300';
    } else {
      tabBuy.className = 'flex-1 py-3 text-center text-sm font-bold text-slate-400 hover:text-slate-200 transition';
      tabSell.className = 'flex-1 py-3 text-center text-sm font-bold text-[#eb5b3c] transition';
      tabIndicator.className = 'placeOrderScreen_orangeLine__34GEo absolute w-1/2 bottom-0 left-1/2 transition-all duration-300';
    }
  }

  if (btnSide) btnSide.textContent = currentOrderState.side;
  if (btnLabel) btnLabel.textContent = currentOrderState.symbol;
  if (btnSubmit) {
    if (isBuy) {
      btnSubmit.className = 'mint-btn-default mint-btn-primary mint-btn-large mint-btn-full-width py-3.5 rounded-xl bg-[#00d09c] hover:bg-emerald-400 text-[#121622] font-bold text-sm uppercase tracking-wide transition shadow-lg mt-1 flex items-center justify-center gap-2 cursor-pointer';
    } else {
      btnSubmit.className = 'mint-btn-default mint-btn-negative mint-btn-large mint-btn-full-width py-3.5 rounded-xl bg-[#eb5b3c] hover:bg-rose-500 text-white font-bold text-sm uppercase tracking-wide transition shadow-lg mt-1 flex items-center justify-center gap-2 cursor-pointer';
    }
  }
}

async function submitOrder() {
  const effPrice = currentOrderState.orderType === 'MARKET' ? currentOrderState.ltp : currentOrderState.price;
  const payload = {
    symbol: currentOrderState.symbol,
    strike: currentOrderState.strike,
    optionType: currentOrderState.optionType,
    side: currentOrderState.side,
    orderType: currentOrderState.orderType,
    product: currentOrderState.product,
    qty: currentOrderState.qty,
    price: effPrice
  };

  try {
    const res = await fetch('/v1/api/stocks_fo/fno/order-orchestrator/single-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.status === 'SUCCESS') {
      showSnackbar(data.message || `Order Executed: ${currentOrderState.side} ${currentOrderState.qty} @ ₹${effPrice.toFixed(2)}`);
      closeOrderModal();
      openTool('positions');
    } else {
      showSnackbar(data.error || 'Order execution failed', true);
    }
  } catch (err) {
    showSnackbar('Order error: ' + err.message, true);
  }
}

async function exitPosition(positionId) {
  try {
    const res = await fetch('/v1/api/stocks_fo/stocks_router/v1/positions/exit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positionId })
    });
    const data = await res.json();
    if (data.status === 'SUCCESS') {
      showSnackbar(data.message || `Position closed. Realized P&L: ₹${data.realizedPnl}`);
    } else {
      showSnackbar(data.error || 'Failed to exit position', true);
    }
  } catch (err) {
    showSnackbar('Exit error: ' + err.message, true);
  }
}
window.exitPosition = exitPosition;

async function exitAllPositions() {
  try {
    const res = await fetch('/v1/api/stocks_fo/stocks_router/v1/positions/exit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true })
    });
    const data = await res.json();
    if (data.status === 'SUCCESS') {
      showSnackbar(data.message || `All positions closed. Realized P&L: ₹${data.realizedPnl}`);
    } else {
      showSnackbar(data.error || 'Failed to close positions', true);
    }
  } catch (err) {
    showSnackbar('Exit all error: ' + err.message, true);
  }
}
window.exitAllPositions = exitAllPositions;

async function resetBalance() {
  try {
    const res = await fetch('/api/balance/reset', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showSnackbar('Simulated balance reset to ₹1,00,000.00');
    }
  } catch (err) {
    showSnackbar('Reset balance error: ' + err.message, true);
  }
}
window.resetBalance = resetBalance;

async function addFunds() {
  try {
    const res = await fetch('/api/balance/add', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showSnackbar('Added ₹50,000 simulated margin');
    }
  } catch (err) {
    showSnackbar('Add funds error: ' + err.message, true);
  }
}
window.addFunds = addFunds;

function setupOrderModal() {
  const modalClose = document.getElementById('modal-order-close');
  const tabBuy = document.getElementById('tab-order-buy');
  const tabSell = document.getElementById('tab-order-sell');
  const prodMis = document.getElementById('product-mis-btn');
  const prodCnc = document.getElementById('product-cnc-btn');
  const qtyMinus = document.getElementById('btn-qty-minus');
  const qtyPlus = document.getElementById('btn-qty-plus');
  const qtyInput = document.getElementById('modal-qty-input');
  const typeMarket = document.getElementById('order-type-market-btn');
  const typeLimit = document.getElementById('order-type-limit-btn');
  const priceInput = document.getElementById('modal-price-input');
  const btnSubmit = document.getElementById('btn-submit-order');
  const btnExitAll = document.getElementById('btn-exit-all-positions');
  const btnReset = document.getElementById('btn-reset-balance');
  const btnAdd = document.getElementById('btn-add-funds');
  const snackClose = document.getElementById('snackbar-close');

  if (modalClose) modalClose.onclick = closeOrderModal;

  if (tabBuy) {
    tabBuy.onclick = () => {
      currentOrderState.side = 'BUY';
      updateOrderModalUI();
    };
  }
  if (tabSell) {
    tabSell.onclick = () => {
      currentOrderState.side = 'SELL';
      updateOrderModalUI();
    };
  }

  if (prodMis && prodCnc) {
    prodMis.onclick = () => {
      currentOrderState.product = 'MIS';
      prodMis.className = 'placeOrderScreen_productOption___novo active-product text-xs font-semibold px-3 py-1.5 rounded-full border border-[#00d09c] bg-[#00d09c]/10 text-[#00d09c] transition';
      prodCnc.className = 'placeOrderScreen_productOption___novo text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-700 text-slate-400 hover:border-slate-500 transition';
    };
    prodCnc.onclick = () => {
      currentOrderState.product = 'NRML';
      prodCnc.className = 'placeOrderScreen_productOption___novo active-product text-xs font-semibold px-3 py-1.5 rounded-full border border-[#00d09c] bg-[#00d09c]/10 text-[#00d09c] transition';
      prodMis.className = 'placeOrderScreen_productOption___novo text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-700 text-slate-400 hover:border-slate-500 transition';
    };
  }

  if (qtyMinus) {
    qtyMinus.onclick = () => {
      if (currentOrderState.qty > currentOrderState.lotSize) {
        currentOrderState.qty -= currentOrderState.lotSize;
        updateOrderModalUI();
      }
    };
  }
  if (qtyPlus) {
    qtyPlus.onclick = () => {
      currentOrderState.qty += currentOrderState.lotSize;
      updateOrderModalUI();
    };
  }
  if (qtyInput) {
    qtyInput.onchange = (e) => {
      const val = parseInt(e.target.value, 10);
      if (val >= currentOrderState.lotSize) {
        currentOrderState.qty = Math.round(val / currentOrderState.lotSize) * currentOrderState.lotSize;
      } else {
        currentOrderState.qty = currentOrderState.lotSize;
      }
      updateOrderModalUI();
    };
  }

  if (typeMarket && typeLimit && priceInput) {
    typeMarket.onclick = () => {
      currentOrderState.orderType = 'MARKET';
      typeMarket.className = 'px-2.5 py-1 rounded-md font-bold bg-[#1b2130] text-emerald-400 border border-emerald-500/30';
      typeLimit.className = 'px-2.5 py-1 rounded-md font-semibold text-slate-400 hover:text-white';
      updateOrderModalUI();
    };
    typeLimit.onclick = () => {
      currentOrderState.orderType = 'LIMIT';
      typeLimit.className = 'px-2.5 py-1 rounded-md font-bold bg-[#1b2130] text-emerald-400 border border-emerald-500/30';
      typeMarket.className = 'px-2.5 py-1 rounded-md font-semibold text-slate-400 hover:text-white';
      updateOrderModalUI();
    };
    priceInput.oninput = (e) => {
      const p = parseFloat(e.target.value);
      if (!isNaN(p) && p > 0) {
        currentOrderState.price = p;
        updateOrderModalUI();
      }
    };
  }

  if (btnSubmit) btnSubmit.onclick = submitOrder;
  if (btnExitAll) btnExitAll.onclick = exitAllPositions;
  if (btnReset) btnReset.onclick = resetBalance;
  if (btnAdd) btnAdd.onclick = addFunds;
  if (snackClose) {
    snackClose.onclick = () => {
      const s = document.getElementById('groww-snackbar');
      if (s) s.classList.remove('snackBar_snackBarShow__x8ZxJ');
    };
  }
}

// -------------------------------------------------------------
// 15. Initialization
// -------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  initTradingViewChart();
  setupRightSidebar();
  setupSearch();
  setupPlaybackControls();
  setupOrderModal();
  connectWebSocket();
});
