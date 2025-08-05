import { test as base, createBdd } from 'playwright-bdd';
import { _electron as electron, ElectronApplication, Page } from '@playwright/test';

export type MyFixtures = {
  electronApp: ElectronApplication;
  page: Page;
};

export const test = base.extend<MyFixtures>({
  electronApp: async ({}, use) => {
    // Find the path to the electron executable
    const mainProcessPath = 'electron/main.mjs';
    const electronApp = await electron.launch({
      args: [mainProcessPath],
    });
    await use(electronApp);
    await electronApp.close();
  },
  page: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow();
    await use(page);
  },
});

export const { Given, When, Then, Before } = createBdd(test);
