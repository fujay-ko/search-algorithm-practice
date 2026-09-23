const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: /live\.spec\.js/,
  timeout: 120000,
  expect: { timeout: 15000 },
  use: {
    baseURL: 'https://fujay-ko.github.io/search-algorithm-practice/',
    trace: 'off'
  }
});