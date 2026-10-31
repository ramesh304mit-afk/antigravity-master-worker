const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TEMP_USER_DATA = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_test_profile_' + Date.now());

async function runTabsTest() {
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9225',
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
      const res = await fetch('http://localhost:9225/json');
      const list = await res.json();
      const page = list.find(t => t.type === 'page' && t.url.includes('localhost:3000'));
      if (page && page.webSocketDebuggerUrl) {
        wsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
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

  await new Promise(r => setTimeout(r, 4000));

  // Click on Protocol Feed tab
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('[data-tab="feed"]');
      if (btn) btn.click();
    })()`
  });

  await new Promise(r => setTimeout(r, 1000));

  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  if (screenshot && screenshot.data) {
    const buffer = Buffer.from(screenshot.data, 'base64');
    fs.writeFileSync('public/terminal_feed_screenshot.png', buffer);
    console.log(`✅ Saved Feed screenshot (${buffer.length} bytes)`);
  }

  cdp.close();
  chrome.kill();
  try {
    fs.rmSync(TEMP_USER_DATA, { recursive: true, force: true });
  } catch (e) {}
}

runTabsTest();
