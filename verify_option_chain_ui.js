const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TEMP_USER_DATA = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_oc_test_' + Date.now());
const ARTIFACT_DIR = 'C:\\Users\\divya\\.gemini\\antigravity\\brain\\3ab16137-abd1-4f97-b34d-0eb0034165ec';

async function verifyOptionChain() {
  console.log('Launching headless Chrome...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--window-size=1920,1080',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${TEMP_USER_DATA}`,
    'http://localhost:3000'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 400));
    try {
      const res = await fetch('http://localhost:9226/json');
      const list = await res.json();
      const page = list.find(t => t.type === 'page' && t.url.includes('localhost:3000'));
      if (page && page.webSocketDebuggerUrl) {
        wsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('Failed to get CDP WebSocket URL');
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

  cdp.on('open', () => {
    cdp.send(JSON.stringify({ id: 9991, method: 'Runtime.enable' }));
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
    } catch (e) {}
  });

  await new Promise(r => setTimeout(r, 2000));

  // 1. Open the Option Chain Drawer
  console.log('Opening Option Chain Drawer...');
  await send('Runtime.evaluate', {
    expression: `
      const chainBtn = document.querySelector('.navButton_wrapper[data-tool="chain"]');
      if (chainBtn) chainBtn.click();
      else if (window.openTool) window.openTool('chain');
    `
  });

  await new Promise(r => setTimeout(r, 1500));

  // 2. Verify DOM elements inside Option Chain Drawer
  const evalResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const drawerTitle = document.getElementById('drawer-panel-title')?.innerText;
        const indexBtn = document.getElementById('oc-index-btn')?.innerText;
        const expirySelect = document.getElementById('oc-expiry-select')?.value;
        const greeksBtn = document.getElementById('oc-greeks-toggle-btn')?.innerText;
        const bannerVal = document.getElementById('oc-floating-spot-val')?.innerText;
        const bannerChg = document.getElementById('oc-floating-spot-chg')?.innerText;
        const rowsCount = document.querySelectorAll('.OptionChainRow_mainDiv__PnNIs').length;
        const firstRowCe = document.querySelector('.OptionChainRow_callCell')?.innerText;
        const firstRowPe = document.querySelector('.OptionChainRow_putCell')?.innerText;

        return {
          drawerTitle,
          indexBtn,
          expirySelect,
          greeksBtn,
          bannerVal,
          bannerChg,
          rowsCount,
          firstRowCe,
          firstRowPe
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Option Chain DOM state:', evalResult.result?.value);

  // 3. Capture screenshot of Standard % Change view
  console.log('Capturing Screenshot of Option Chain Exact UI...');
  const screenshot1 = await send('Page.captureScreenshot', { format: 'png' });
  const outPath1 = path.join(ARTIFACT_DIR, 'screenshot_exact_option_chain.png');
  fs.writeFileSync(outPath1, Buffer.from(screenshot1.data, 'base64'));
  fs.writeFileSync(path.join(__dirname, 'public', 'screenshot_exact_option_chain.png'), Buffer.from(screenshot1.data, 'base64'));
  console.log(`Saved Option Chain screenshot to ${outPath1}`);

  // 4. Toggle Greek Sigma (Σ) button to test Greeks mode
  console.log('Toggling Greeks Sigma (Σ) view...');
  await send('Runtime.evaluate', {
    expression: `
      const greeksBtn = document.getElementById('oc-greeks-toggle-btn');
      if (greeksBtn) greeksBtn.click();
    `
  });

  await new Promise(r => setTimeout(r, 600));

  const greeksResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const firstSub = document.querySelector('.OptionChainRow_callCell')?.innerText;
        const greeksActive = document.getElementById('oc-greeks-toggle-btn')?.classList.contains('GreeksToggle_toggleOn__BotgZ');
        return { firstSub, greeksActive };
      })()
    `,
    returnByValue: true
  });

  console.log('Greeks toggle state:', greeksResult.result?.value);

  // 5. Capture screenshot of Greeks View
  const screenshot2 = await send('Page.captureScreenshot', { format: 'png' });
  const outPath2 = path.join(ARTIFACT_DIR, 'screenshot_exact_option_chain_greeks.png');
  fs.writeFileSync(outPath2, Buffer.from(screenshot2.data, 'base64'));
  console.log(`Saved Greeks screenshot to ${outPath2}`);

  cdp.close();
  chrome.kill();
  console.log('Verification completed successfully!');
}

verifyOptionChain().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
