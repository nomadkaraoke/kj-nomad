import { test as base, createBdd } from 'playwright-bdd';
import { _electron as electron, ElectronApplication, Page } from '@playwright/test';

export type MyFixtures = {
  electronApp: ElectronApplication;
  page: Page;
};

export const test = base.extend<MyFixtures>({
  electronApp: async ({}, use) => {
    const electronApp = await electron.launch({ args: ['electron/main.mjs'] });
    await use(electronApp);
    await electronApp.close();
  },
  page: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow();
    await use(page);
  },
});

export const { Given, When, Then, Before } = createBdd(test);
