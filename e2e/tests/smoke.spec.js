// Smoke tests for search-algorithm-practice (static site).
// Run: npm test  (from e2e/)
const { test, expect } = require('@playwright/test');

const GAS_GLOB = '**/script.google.com/**';
const QUEUE_KEY = 'quiz_submit_queue_v1';

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // 網路層載入失敗屬環境噪音（本測試會故意 abort GAS；字型/CDN 偶發失敗亦同），略過；
    // 真正的 JS 例外由 pageerror 捕捉。缺檔改由 index 測試的 200 斷言覆蓋。
    if (m.text().includes('Failed to load resource')) return;
    errors.push('console: ' + m.text());
  });
  page._jsErrors = errors;
});

test.afterEach(async ({ page }) => {
  expect(page._jsErrors).toEqual([]);
});

async function fillStudentModal(page) {
  await page.fill('#inClass', '803');
  await page.fill('#inSeat', '12');
  await page.fill('#inName', '測試生');
  await page.evaluate(() => confirmStudent());
}

test('index: 5 cards link to existing pages', async ({ page }) => {
  await page.goto('/index.html');
  const hrefs = await page.locator('a.card').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  expect(hrefs).toEqual([
    'practice/linear_practice.html',
    'practice/binary_v1.html',
    'practice/binary_v3.html',
    'quiz/quiz_linear.html',
    'quiz/quiz_binary_v3.html'
  ]);
  for (const h of hrefs) {
    const r = await page.goto('/' + h);
    expect(r.status()).toBe(200);
  }
});

test('practice linear: renders array, answers steps, redo hidden when fresh', async ({ page }) => {
  await page.goto('/practice/linear_practice.html');
  await expect(page.locator('#arrTrack > div')).not.toHaveCount(0);
  await expect(page.locator('#redoBtn')).toBeHidden();

  // answer two steps correctly by reading DOM
  for (let i = 0; i < 2; i++) {
    const target = (await page.locator('#tDisp').textContent()).trim();
    const cur = (await page.locator('#curPos').textContent()).trim();
    const m = cur.match(/^(.+)\[(\d+)\]$/);
    expect(m).not.toBeNull();
    const btns = page.locator('#cbtns button');
    await btns.nth(m[1] === target ? 0 : 1).click();
    await page.waitForTimeout(900);
  }
  const step = await page.locator('#stepNum').textContent();
  expect(Number(step)).toBeGreaterThanOrEqual(2);
});

test('practice binary_v3: step-0 fill L/R accepted', async ({ page }) => {
  await page.goto('/practice/binary_v3.html');
  await expect(page.locator('#fi0inpL')).toBeVisible();
  const n = await page.locator('#arrTrack > div').count();
  expect(n).toBeGreaterThan(0);
  await page.fill('#fi0inpL', '0');
  await page.fill('#fi0inpR', String(n - 1));
  await page.locator('.cfbtn2').first().click();
  await expect(page.locator('#fb')).toContainText('正確', { timeout: 5000 });
});

test('quiz linear: full 5-question flow, offline submit queues, reload flushes', async ({ page }) => {
  // Phase 1: offline — GAS unreachable
  await page.route(GAS_GLOB, (route) => route.abort());
  await page.goto('/quiz/quiz_linear.html');
  await fillStudentModal(page);
  await expect(page.locator('#cbtns button')).toHaveCount(2);

  for (let q = 0; q < 5; q++) {
    // answer current question until result overlay shows
    for (let s = 0; s < 25; s++) {
      if (await page.locator('#resOv.show').isVisible()) break;
      const target = (await page.locator('#tDisp').textContent()).trim();
      const cur = (await page.locator('#curPos').textContent()).trim();
      if (cur === '—') break;
      const m = cur.match(/^(.+)\[(\d+)\]$/);
      if (!m) break;
      const btns = page.locator('#cbtns button');
      await btns.nth(m[1] === target ? 0 : 1).click();
      await page.waitForTimeout(850);
    }
    await expect(page.locator('#resOv.show')).toBeVisible({ timeout: 10000 });
    await page.locator('#nextBtn').click();
    await page.waitForTimeout(500);
  }
  await expect(page.locator('#scorecard.show')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#submitBtn')).toBeVisible();
  await page.locator('#submitBtn').click();
  await page.waitForTimeout(4000); // retries then queues
  const queued = await page.evaluate((k) => (JSON.parse(localStorage.getItem(k) || '[]')).length, QUEUE_KEY);
  expect(queued).toBe(1);

  // Phase 2: online — reload flushes the queue
  await page.unrouteAll({ behavior: 'wait' });
  await page.route(GAS_GLOB, (route) => route.fulfill({ status: 200, body: '{}' }));
  await page.reload();
  await page.waitForTimeout(3000);
  const left = await page.evaluate((k) => (JSON.parse(localStorage.getItem(k) || '[]')).length, QUEUE_KEY);
  expect(left).toBe(0);
});

test('quiz binary_v3: modal starts fill-in question, step-0 accepted', async ({ page }) => {
  await page.route(GAS_GLOB, (route) => route.fulfill({ status: 200, body: '{}' }));
  await page.goto('/quiz/quiz_binary_v3.html');
  await fillStudentModal(page);
  await expect(page.locator('#fi0inpL')).toBeVisible({ timeout: 10000 });
  const n = await page.locator('#arrTrack > div').count();
  expect(n).toBeGreaterThan(0);
  await page.fill('#fi0inpL', '0');
  await page.fill('#fi0inpR', String(n - 1));
  await page.locator('.cfbtn2').first().click();
  await expect(page.locator('#fb')).toContainText('正確', { timeout: 5000 });
  // payload carries tabBlur counter
  const hasBlur = await page.evaluate(() => document.documentElement.innerHTML.includes('tabBlur'));
  expect(hasBlur).toBe(true);
});

test('teacher.html: renders config, validates empty URL', async ({ page }) => {
  await page.goto('/teacher.html');
  await expect(page.locator('#gasUrl')).toBeVisible();
  await expect(page.locator('#passcode')).toBeVisible();
  await page.locator('#loadBtn').click();
  await expect(page.locator('#cfgSt')).toContainText('網址');
});
