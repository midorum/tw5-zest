const { test, expect } = require('@playwright/test');

test('smoke', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => !!window.$tw?.wiki, { timeout: 15000 });
    await expect(page).toHaveTitle(/tw5-zest — Mastering your knowledge!/, { timeout: 20000 });
    await expect(page.locator('.tc-story-river')).toBeVisible();
});