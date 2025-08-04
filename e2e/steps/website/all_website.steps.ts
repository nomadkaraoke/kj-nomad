import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

Given('a KJ navigates to https:\\/\\/kj.nomadkaraoke.com', async ({}) => {
  // Step: Given a KJ navigates to https://kj.nomadkaraoke.com
  // From: docs/features/website/landing_page.feature:8:5
});

When('the KJ clicks the "Download Offline App" button', async ({}) => {
  // Step: When the KJ clicks the "Download Offline App" button
  // From: docs/features/website/landing_page.feature:9:5
});

Then('a download of the appropriate KJ-Nomad desktop application installer should begin', async ({}) => {
  // Step: Then a download of the appropriate KJ-Nomad desktop application installer should begin
  // From: docs/features/website/landing_page.feature:10:5
});

Then('the KJ should be taken to the online session creation page', async ({}) => {
  // Step: Then the KJ should be taken to the online session creation page
  // From: docs/features/website/landing_page.feature:15:5
});

Then('they should be prompted to enter their KJ Name and Venue Name', async ({}) => {
  // Step: And they should be prompted to enter their KJ Name and Venue Name
  // From: docs/features/website/landing_page.feature:16:5
});

When('the KJ clicks the "Host Online Session" button', async ({}) => {
  // Step: When the KJ clicks the "Host Online Session" button
  // From: docs/features/website/landing_page.feature:14:5
});
