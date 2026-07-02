import puppeteer from 'puppeteer';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import { existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const APP_URL = 'http://localhost:5175';
const OUTPUT_DIR = resolve('./recordings');
const OUTPUT_FILE = resolve(OUTPUT_DIR, 'belgium-egypt-scout.mp4');

const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true };

const RECORDER_CONFIG = {
  followNewTab: false,
  fps: 30,
  videoFrame: { width: 390, height: 844 },
  videoCrf: 18,
  videoCodec: 'libx264',
  videoPreset: 'ultrafast',
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function smoothScroll(page, totalPx, durationMs) {
  const steps = 120;
  const stepPx = totalPx / steps;
  const stepMs = durationMs / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate(y => window.scrollBy({ top: y, behavior: 'instant' }), stepPx);
    await sleep(stepMs);
  }
}

// Scroll slowly with pauses at key moments
async function cinematicScroll(page, pauseSelectors = []) {
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  const viewportHeight = VIEWPORT.height;
  let scrolled = 0;

  while (scrolled < totalHeight - viewportHeight) {
    // Check if we're near a section heading — pause if so
    const nearSection = await page.evaluate((s) => {
      const els = [...document.querySelectorAll('.scout-section')];
      for (const el of els) {
        const rect = el.getBoundingClientRect();
        if (rect.top >= 0 && rect.top < 150) return true;
      }
      return false;
    }, pauseSelectors);

    if (nearSection) await sleep(2500); // pause to let viewer read section heading

    await page.evaluate(y => window.scrollBy({ top: y, behavior: 'instant' }), 4);
    scrolled += 4;
    await sleep(35); // ~2px per frame at 30fps = slow cinematic
  }
}

(async () => {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('🎬 Launching browser…');
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--window-size=${VIEWPORT.width},${VIEWPORT.height + 120}`,
    ],
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  const recorder = new PuppeteerScreenRecorder(page, RECORDER_CONFIG);

  try {
    console.log(`📡 Opening ${APP_URL}…`);
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    console.log('⏺  Starting recording…');
    await recorder.start(OUTPUT_FILE);

    // ── Scene 1: Dashboard landing (8s) ──
    console.log('🏟  Scene 1: Dashboard');
    await sleep(8000);

    // ── Scene 2: Slow scroll down through matches (8s) ──
    console.log('📋 Scene 2: Scrolling matches');
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('.tab-btn')];
      const tab = btns.find(b => b.textContent.toLowerCase().includes('match'));
      if (tab) tab.click();
    });
    await sleep(2000);
    await smoothScroll(page, 600, 6000);
    await sleep(1500);

    // ── Scene 3: Find Belgium vs Egypt and scroll to it ──
    console.log('🇧🇪 Scene 3: Finding Belgium vs Egypt');
    const cardFound = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.match-card')];
      for (const card of cards) {
        if (card.textContent.toLowerCase().includes('belgium') &&
            card.textContent.toLowerCase().includes('egypt')) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return true;
        }
      }
      return false;
    });
    console.log(cardFound ? '✅ Found Belgium vs Egypt' : '⚠️  Not found, continuing');
    await sleep(3000);

    // ── Scene 4: Click Scout button ──
    console.log('🔍 Scene 4: Clicking Scout this match');
    await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.match-card')];
      for (const card of cards) {
        if (card.textContent.toLowerCase().includes('belgium') &&
            card.textContent.toLowerCase().includes('egypt')) {
          const btn = card.querySelector('.scout-btn');
          if (btn) { btn.style.opacity = '1'; btn.click(); return; }
        }
      }
      // fallback — any scout button
      const btn = document.querySelector('.scout-btn');
      if (btn) { btn.style.opacity = '1'; btn.click(); }
    });
    await sleep(1000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));

    // ── Scene 5: Watch Agent 1 (Scout) run ──
    console.log('⚙️  Scene 5: Waiting for agents… (up to 2 minutes)');
    await sleep(5000); // show the loading spinner

    // Wait for the report to actually appear
    try {
      await page.waitForSelector('.scout-section', { timeout: 120000 });
      console.log('✅ Report is rendered');
    } catch {
      console.log('⏳ Agents still running — proceeding with scroll anyway');
    }
    await sleep(4000); // let viewer see the top of the report

    // ── Scene 6: Full cinematic scroll through the entire report ──
    console.log('📜 Scene 6: Cinematic scroll through full report');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await sleep(2000);
    await cinematicScroll(page);
    await sleep(3000);

    // ── Scene 7: Scroll back up slowly ──
    console.log('🔝 Scene 7: Scroll back to top');
    const currentPos = await page.evaluate(() => window.scrollY);
    await smoothScroll(page, -currentPos, 4000);
    await sleep(3000);

    console.log('⏹  Stopping recording…');
    await recorder.stop();

    console.log(`\n✅ Done! Saved to:\n   ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    await recorder.stop().catch(() => {});
  } finally {
    await browser.close();
  }
})();
