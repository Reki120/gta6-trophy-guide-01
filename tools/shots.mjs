import { spawn } from 'node:child_process';
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '/home/hatch/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.mjs';
import trophyData from '../app/data/trophies.json' with { type: 'json' };

const root = new URL('../', import.meta.url);
const screenshotDir = new URL('../screenshots/', import.meta.url);
const server = spawn('node', ['serve.ts', '--port', '8123'], { cwd: root, stdio: ['ignore', 'pipe', 'inherit'] });
let browser;
let page;
try {
  await mkdir(screenshotDir, { recursive: true });
  for (const file of await readdir(screenshotDir)) await rm(new URL(file, screenshotDir), { recursive: true, force: true });
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { const response = await fetch('http://127.0.0.1:8123/'); if (response.ok) { ready = true; break; } } catch {}
    await delay(250);
  }
  if (!ready) throw new Error('The local app server did not start on port 8123.');

  browser = await chromium.launch({ executablePath: '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome', headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const earnedIds = [2,3,4,5,6,8,9,10,11,12,13,20,21,44];
  const earned = Object.fromEntries(earnedIds.map(id => [trophyData.trophies.find(trophy => trophy.id === id).name, true]));
  const counts = { 'The Shootist': 30, 'Cunning Stunts': 120 };
  await context.addInitScript(({ earned, counts }) => {
    localStorage.setItem('leonida-platinum-v1', JSON.stringify({ earned, counts, settings: { spoilers: false, hideEarned: false } }));
  }, { earned, counts });
  page = await context.newPage();
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  await page.goto('http://127.0.0.1:8123/#checklist', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.detail h2').waitFor({ state: 'visible' });
  if (!(await page.locator('.detail h2').innerText()).includes('Maximum Withdrawal')) throw new Error('Checklist detail did not open Maximum Withdrawal.');
  await page.evaluate(() => window.scrollTo(0, 0));
  await capture('1-checklist.jpg');

  await page.goto('http://127.0.0.1:8123/#roadmap', { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await capture('2-roadmap.jpg');

  await page.goto('http://127.0.0.1:8123/#missables', { waitUntil: 'networkidle' });
  await page.locator('.detail h2').waitFor({ state: 'visible' });
  if (!(await page.locator('.detail h2').innerText()).includes('Actions Speak Louder')) throw new Error('Missables detail did not open Actions Speak Louder.');
  await page.evaluate(() => window.scrollTo(0, 0));
  await capture('3-missables.jpg');

  await page.goto('http://127.0.0.1:8123/#checklist', { waitUntil: 'networkidle' });
  await page.locator('#spoilers').check({ force: true }); // styled switch span overlays the checkbox, so force the check
  await page.getByRole('button', { name: 'Story', exact: true }).click();
  if (!(await page.locator('.row-title').allInnerTexts()).includes('Hidden story trophy')) throw new Error('Spoiler filter did not mask an unearned story trophy.');
  await page.locator('.trophy-row').filter({ hasText: 'Hidden story trophy' }).first().click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await capture('4-spoilers.jpg');

  const shots = [
    { file: '1-checklist.jpg', view: 'Checklist — Maximum Withdrawal detail, guide, and sources', viewport: { width: 1280, height: 800 } },
    { file: '2-roadmap.jpg', view: 'Roadmap — top of the seven-stage route', viewport: { width: 1280, height: 800 } },
    { file: '3-missables.jpg', view: 'Missables — Actions Speak Louder detail and caution', viewport: { width: 1280, height: 800 } },
    { file: '4-spoilers.jpg', view: 'Checklist — story filter with spoilers enabled', viewport: { width: 1280, height: 800 } },
  ];
  await writeFile(new URL('../shots.json', import.meta.url), `${JSON.stringify(shots, null, 2)}\n`);
  for (const shot of shots) { const bytes = (await stat(new URL(shot.file, screenshotDir))).size; console.log(`${shot.file}: ${bytes} bytes`); if (bytes > 262144) throw new Error(`${shot.file} exceeds 256 KiB.`); }
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}

async function capture(file) {
  const path = new URL(file, screenshotDir).pathname;
  for (let quality = 82; quality >= 52; quality -= 5) {
    await page.screenshot({ path, type: 'jpeg', quality });
    if ((await stat(path)).size <= 262144) return;
  }
  throw new Error(`${file} exceeds 256 KiB even at reduced quality.`);
}
