import { chromium } from 'playwright';

const BASE_URL = process.env.SELFTEST_URL || 'http://localhost:3000/?selftest=1';
const TIMEOUT_MS = Number(process.env.SELFTEST_TIMEOUT_MS || 120000);

function now() {
  return new Date().toISOString();
}

async function main() {
  console.log(`[uiSelftest] ${now()} starting: ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleLines = [];
  page.on('console', (msg) => {
    const line = `[browser:${msg.type()}] ${msg.text()}`;
    consoleLines.push(line);
    // echo through
    console.log(line);
  });
  page.on('pageerror', (err) => {
    console.log(`[browser:pageerror] ${String(err)}`);
  });

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  // Wait for selftest completion marker
  const start = Date.now();
  while (Date.now() - start < TIMEOUT_MS) {
    const status = await page.getAttribute('[data-selftest-status]', 'data-selftest-status').catch(() => null);
    if (status === 'done') break;
    await page.waitForTimeout(250);
  }

  const status = await page.getAttribute('[data-selftest-status]', 'data-selftest-status').catch(() => null);
  if (status !== 'done') {
    console.log(`[uiSelftest] ${now()} FAIL: timeout waiting for selftest completion (${TIMEOUT_MS}ms)`);
    await page.screenshot({ path: 'selftest-timeout.png', fullPage: true });
    process.exitCode = 1;
  } else {
    console.log(`[uiSelftest] ${now()} DONE`);
  }

  // Print panel text as final summary
  const panelText = await page.textContent('[data-selftest-status] pre').catch(() => '');
  if (panelText) {
    console.log('----- SELFTEST PANEL LOGS -----');
    console.log(panelText.trim());
    console.log('-------------------------------');
  }

  await browser.close();
}

await main();




