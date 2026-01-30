import { chromium } from 'playwright';

async function collectConsole(url, modeTag, opts = {}) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const events = [];

  page.on('console', (m) => {
    const t = m.type();
    if (t === 'warning' || t === 'error') {
      events.push({ kind: 'console', type: t, text: m.text() });
    }
  });
  page.on('pageerror', (err) => {
    events.push({ kind: 'pageerror', type: 'error', text: String((err && err.stack) || err) });
  });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  if (opts.reload) {
    await page.waitForTimeout(1500);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  }
  await page.waitForTimeout(2500);

  const warn = events.filter((e) => e.type === 'warning').length;
  const err = events.filter((e) => e.type === 'error').length;

  console.log(`[${modeTag}] url=${url}`);
  console.log(`[${modeTag}] console_warning_count=${warn}`);
  console.log(`[${modeTag}] console_error_count=${err}`);
  for (const e of events.slice(0, 50)) {
    console.log(`[${modeTag}] ${e.kind}:${e.type}: ${e.text}`);
  }

  await browser.close();
  return { warn, err };
}

async function main() {
  const url = process.env.DSD_URL || 'http://127.0.0.1:3000/';
  const first = await collectConsole(url, 'FIRST_LOAD', { reload: false });
  const reload = await collectConsole(url, 'RELOAD', { reload: true });
  process.exit(first.err || reload.err ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});


