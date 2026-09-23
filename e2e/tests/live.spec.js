// Live-site smoke test (GitHub Pages). Run:
//   npx playwright test live.spec.js --config=playwright.live.config.js
const { test, expect } = require('@playwright/test');

test('index + 4 cards load on GitHub Pages', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('');
  await expect(page.locator('h1')).toBeVisible();
  const hrefs = await page.locator('a.card').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  expect(hrefs).toHaveLength(5);
  for (const h of hrefs) {
    const r = await page.goto(h);
    expect(r.status(), h).toBe(200);
  }
  expect(errors).toEqual([]);
});