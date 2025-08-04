import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

Given('the user is in the KJ Admin Interface', async ({}) => {
  // Step: Given the user is in the KJ Admin Interface
  // From: docs/features/ui/theming.feature:8:5
});

Given('the application is currently in light mode', async ({}) => {
  // Step: Given the application is currently in light mode
  // From: docs/features/ui/theming.feature:11:5
});

When('the user toggles the theme switch', async ({}) => {
  // Step: When the user toggles the theme switch
  // From: docs/features/ui/theming.feature:12:5
});

Then('the application interface should change to dark mode', async ({}) => {
  // Step: Then the application interface should change to dark mode
  // From: docs/features/ui/theming.feature:13:5
});

Then('this preference should be saved for future sessions', async ({}) => {
  // Step: And this preference should be saved for future sessions
  // From: docs/features/ui/theming.feature:14:5
});

Given('the application is currently in dark mode', async ({}) => {
  // Step: Given the application is currently in dark mode
  // From: docs/features/ui/theming.feature:17:5
});

Then('the application interface should change to light mode', async ({}) => {
  // Step: Then the application interface should change to light mode
  // From: docs/features/ui/theming.feature:19:5
});

Then('this preference should be saved', async ({}) => {
  // Step: And this preference should be saved
  // From: docs/features/ui/theming.feature:20:5
});
