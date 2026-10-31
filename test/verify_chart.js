const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TEMP_USER_DATA = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_test_profile_' + Date.now());

async function runDetailedTest() {
  console.log('[Test] Starting headless Chrome for deep verification & screenshot...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--window-size=1920,1080',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${TEMP_USER_DATA}`,
    'http://localhost:3000'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const res = await fetch('http://localhost:9224/json');
      const list = await res.json();
      const page = list.find(t => t.type === 'page' && t.url.includes('localhost:3000'));
      if (page && page.webSocketDebuggerUrl) {
        wsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('[Test] Could not connect to Chrome on port 9224');
    chrome.kill();
    return;
  }

  const cdp = new WebSocket(wsUrl);
  let msgId = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      cdp.send(JSON.stringify({ id, method, params }));
    });
  }

  const consoleLogs = [];
  const errors = [];

  cdp.on('open', async () => {
    cdp.send(JSON.stringify({ id: 9991, method: 'Runtime.enable' }));
    cdp.send(JSON.stringify({ id: 9992, method: 'Console.enable' }));
    cdp.send(JSON.stringify({ id: 9993, method: 'Page.enable' }));
  });

  cdp.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.id && pending.has(msg.id)) {
        const { resolve } = pending.get(msg.id);
        pending.delete(msg.id);
        resolve(msg.result);
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
        consoleLogs.push(`[Console ${msg.params.type}] ${text}`);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        errors.push(`[Exception] ${msg.params.exceptionDetails.text} - ${msg.params.exceptionDetails.exception?.description || ''}`);
      }
    } catch (e) {}
  });

  // Wait 8 seconds for TradingView chart to load historical bars and start tick streaming
  console.log('[Test] Waiting 8s for chart initialization, datafeed resolution, and candle rendering...');
  await new Promise(r => setTimeout(r, 8000));

  // Inspect DOM and widget state
  const evalResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const iframe = document.querySelector('#tv-chart-container iframe');
      const widgetExists = typeof window.tvWidget !== 'undefined';
      const feedExists = typeof window.datafeed !== 'undefined';
      const ocRows = document.querySelectorAll('#option-chain-body tr').length;
      const spotText = document.getElementById('nifty-spot-display')?.textContent;
      const ticksCount = document.getElementById('chart-update-counter')?.textContent;
      
      let iframeDocReady = false;
      let chartCanvasFound = false;
      if (iframe && iframe.contentDocument) {
        iframeDocReady = iframe.contentDocument.readyState === 'complete';
        chartCanvasFound = iframe.contentDocument.querySelectorAll('canvas').length > 0;
      }

      return {
        iframeFound: !!iframe,
        iframeSrc: iframe ? iframe.src.substring(0, 50) + '...' : null,
        iframeDocReady,
        chartCanvasFound,
        widgetExists,
        feedExists,
        ocRows,
        spotText,
        ticksCount
      };
    })()`,
    returnByValue: true
  });

  console.log('\n--- TERMINAL STATE VERIFICATION ---');
  console.log(evalResult.result.value);

  // Take screenshot
  console.log('\n[Test] Capturing screenshot of entire dashboard...');
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  if (screenshot && screenshot.data) {
    const buffer = Buffer.from(screenshot.data, 'base64');
    fs.writeFileSync('public/terminal_screenshot.png', buffer);
    console.log(`✅ Saved screenshot to public/terminal_screenshot.png (${buffer.length} bytes)`);
  }

  console.log('\n--- BROWSER CONSOLE LOGS ---');
  consoleLogs.forEach(l => console.log(l));

  if (errors.length > 0) {
    console.log('\n--- JS EXCEPTIONS ---');
    errors.forEach(e => console.log('❌', e));
  } else {
    console.log('\n✅ 0 JS exceptions in browser context!');
  }

  cdp.close();
  chrome.kill();
  try {
    fs.rmSync(TEMP_USER_DATA, { recursive: true, force: true });
  } catch (e) {}
}

runDetailedTest();
