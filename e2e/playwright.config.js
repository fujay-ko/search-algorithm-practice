const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 180000,
  expect: { timeout: 10000 },
  use: {
    baseURL: 'http://127.0.0.1:8080',
    trace: 'off'
  },
  webServer: {
    command: 'node server.js .. 8080',
    port: 8080,
    reuseExistingServer: true,
    cwd: __dirname
  }
});
