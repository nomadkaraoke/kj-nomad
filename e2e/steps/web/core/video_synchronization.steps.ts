import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

Given('the KJ has a primary display and a secondary display connected', async ({ page }) => {
  // TODO: implement step
});

Given('a video is playing on the primary display', async ({ page }) => {
  // TODO: implement step
});

When('the KJ drags the video window to the secondary display', async ({ page }) => {
  // TODO: implement step
});

Then('the video should continue to play smoothly without interruption', async ({ page }) => {
  // TODO: implement step
});

Then('the audio should remain synchronized with the video', async ({ page }) => {
  // TODO: implement step
});

Given('the application is in a multi-screen setup', async ({ page }) => {
  // TODO: implement step
});

When('the KJ initiates a "resync" command', async ({ page }) => {
  // TODO: implement step
});

Then('all connected player screens should reset their video playback to match the current time of the master video', async ({ page }) => {
  // TODO: implement step
});

Given('the KJ is running a session', async ({ page }) => {
  // TODO: implement step
});

Given('two player screens, {string} and {string}, are connected', async ({ page }, arg: string, arg1: string) => {
  // TODO: implement step
});

Given('a karaoke video is ready to be played', async ({ page }) => {
  // TODO: implement step
});

When('the KJ starts the video playback', async ({ page }) => {
  // TODO: implement step
});

Then('the video should begin playing simultaneously on both {string} and {string}', async ({ page }, arg: string, arg1: string) => {
  // TODO: implement step
});

Then('at any point during playback, the `currentTime` of the video on {string} should not differ from {string} by more than {int} milliseconds', async ({ page }, arg: string, arg1: string, arg2: number) => {
  // TODO: implement step
});

Given('a karaoke video is currently playing on both screens', async ({ page }) => {
  // TODO: implement step
});

When('the KJ seeks the video to the {int} minute and {int} second mark', async ({ page }, arg: number, arg1: number) => {
  // TODO: implement step
});

Then('both {string} and {string} should jump to the new timestamp', async ({ page }, arg: string, arg1: string) => {
  // TODO: implement step
});

Then('resume playing in sync, with a time difference of less than {int} milliseconds', async ({ page }, arg: number) => {
  // TODO: implement step
});

When('the KJ pauses the video', async ({ page }) => {
  // TODO: implement step
});

Then('both {string} and {string} should pause at the exact same frame', async ({ page }, arg: string, arg1: string) => {
  // TODO: implement step
});

Then('when the KJ resumes the video', async ({ page }) => {
  // TODO: implement step
});

Then('both players should resume playback simultaneously', async ({ page }) => {
  // TODO: implement step
});
