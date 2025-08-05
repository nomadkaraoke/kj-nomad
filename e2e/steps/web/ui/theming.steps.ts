import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { Page } from 'playwright';

const { Given, When, Then } = createBdd();

const getTheme = async (page: Page) => {
  return await page.evaluate(() => {
    const isDark = document.documentElement.classList.contains('dark');
    return isDark ? 'dark' : 'light';
  });
};

const setTheme = async (page: Page, theme: 'light' | 'dark' | 'system') => {
  await page.evaluate(t => {
    localStorage.setItem('kj-nomad-theme', t);
    window.location.reload();
  }, theme);
  await page.waitForNavigation();
};


Given('the application is currently in {string} mode', async ({ page }, mode: 'light' | 'dark') => {
  const currentTheme = await getTheme(page);
  if (currentTheme !== mode) {
    await setTheme(page, mode);
  }
  expect(await getTheme(page)).toBe(mode);
});


Then('the application interface should change to {string} mode', async ({ page }, mode: 'light' | 'dark') => {
  await expect(page.locator('html')).toHaveClass(mode === 'dark' ? /dark/ : /(?!dark)/);
});
