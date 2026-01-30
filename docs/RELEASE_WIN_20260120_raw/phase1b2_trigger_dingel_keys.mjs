import { chromium } from 'playwright';

async function main() {
  const url = process.env.DSD_URL || 'http://127.0.0.1:3000/';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1200);

  // 1) Trigger marquee save once (dingel:calendarMarquee:YYYY-MM)
  await page.waitForSelector('[data-ui=calendar-marquee]', { timeout: 15000 });
  await page.locator('[data-ui=calendar-marquee]').click({ timeout: 15000 });
  const marqueeInput = page.locator('[data-ui=calendar-marquee] input');
  await marqueeInput.waitFor({ timeout: 5000 });
  await marqueeInput.fill('WIN_RELEASE_20260120');
  await marqueeInput.press('Enter');
  await page.waitForTimeout(300);

  // 2) Trigger OhaAsa sign select once (dingel:ohaasa:selectedSign)
  await page.waitForSelector('[data-widget=ohaasa] button[data-widget-bar]', { timeout: 15000 });
  await page.locator('[data-widget=ohaasa] button[data-widget-bar]').click();
  await page.waitForTimeout(200);
  const firstSign = page.locator('[data-widget=ohaasa] div.absolute button').first();
  await firstSign.click({ timeout: 5000 });
  await page.waitForTimeout(300);

  // 3) Collect dingel:* keys
  const snap = await page.evaluate(() => {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('dingel:')).sort();
    const sample = keys.slice(0, 5).map((k) => {
      let v = null;
      try {
        v = localStorage.getItem(k);
      } catch {
        // ignore
      }
      return { k, len: v == null ? null : v.length, v: v == null ? null : v.slice(0, 120) };
    });
    return { count: keys.length, keys, sample };
  });

  console.log('RUNTIME url=' + url);
  console.log('RUNTIME after_trigger dingel_key_count=' + snap.count);
  console.log('RUNTIME after_trigger dingel_key_examples=' + JSON.stringify(snap.sample));
  console.log('RUNTIME after_trigger dingel_key_list_first20=' + JSON.stringify(snap.keys.slice(0, 20)));
  process.exit(0);
}

main().catch((e) => {
  console.error('RUNTIME_FATAL', (e && e.stack) || String(e));
  process.exit(1);
});


