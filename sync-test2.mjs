import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const hasBanner = () => p.evaluate(() => document.body.innerText.includes('Help improve the Dojo'));
await p.goto('http://localhost:3215/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
console.log('banner:', await hasBanner());
// list button texts to find the help/stats path
const btns = await p.evaluate(() => [...document.querySelectorAll('button')].map(b => b.textContent?.trim()).filter(Boolean).slice(0, 40));
console.log('buttons:', JSON.stringify(btns));
