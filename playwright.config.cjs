const { defineConfig, devices } = require('@playwright/test');

const PORT = process.env.PLAYWRIGHT_PORT || 8092;
const BASE_URL = `http://127.0.0.1:${PORT}`;

module.exports = defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    timeout: 45_000,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? 'github' : 'list',
    expect: {
        timeout: 10_000,
    },
    use: {
        baseURL: BASE_URL,
        viewport: { width: 1280, height: 800 },
        ignoreHTTPSErrors: true,
    },
    projects: [
        {
            name: 'headless',
            use: {
                ...devices['Desktop Chrome'],
                headless: true,
                actionTimeout: 15_000,
                video: 'on-first-retry',
            },
        },
        {
            name: 'chrome',
            use: {
                ...devices['Desktop Chrome'],
                headless: false,
                actionTimeout: 30_000,
                video: 'retain-on-failure',
                launchOptions: process.env.PLAYWRIGHT_SLOW_MO ? { slowMo: Number(process.env.PLAYWRIGHT_SLOW_MO) } : undefined
            },
        },
        {
            name: 'chrome-slow',
            timeout: 300_000,
            use: {
                ...devices['Desktop Chrome'],
                headless: false,
                actionTimeout: 60_000,
                launchOptions: { slowMo: process.env.PLAYWRIGHT_SLOW_MO ? Number(process.env.PLAYWRIGHT_SLOW_MO) : 2_000 }
            },
        },
        {
            name: 'firefox',
            use: {
                ...devices['Desktop Firefox'],
                headless: false,
                launchOptions: process.env.PLAYWRIGHT_SLOW_MO ? { slowMo: Number(process.env.PLAYWRIGHT_SLOW_MO) } : undefined
            },
        },
        {
            name: 'firefox-slow',
            timeout: 300_000,
            use: {
                ...devices['Desktop Firefox'],
                headless: false,
                actionTimeout: 60_000,
                launchOptions: { slowMo: process.env.PLAYWRIGHT_SLOW_MO ? Number(process.env.PLAYWRIGHT_SLOW_MO) : 2_000 }
            },
        },
        // {
        //   name: 'webkit',
        //   use: { ...devices['Desktop Safari'] },
        // },
    ],
    webServer: {
        command: `npx tiddlywiki . --listen port=${PORT}`,
        port: Number(PORT),
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
    },
})