import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

Given('the KJ is on the Admin Interface', async ({ page }) => {
  // TODO: implement step
});

Given('a song is currently playing', async ({ page }) => {
  // TODO: implement step
});

Given('the song is playing at its original key \\({int})', async ({ page }, arg: number) => {
  // TODO: implement step
});

When('the KJ increases the key by {int} semitones', async ({ page }, arg: number) => {
  // TODO: implement step
});

Then('the pitch of the audio playback should be raised by {int} semitones without changing the speed', async ({ page }, arg: number) => {
  // TODO: implement step
});

Then('the player screen should display a small indicator, e.g., {string}', async ({ page }, arg: string) => {
  // TODO: implement step
});

Given('the song is playing at its original tempo \\({int}%)', async ({ page }, arg: number) => {
  // TODO: implement step
});

When('the KJ decreases the tempo by {int}%', async ({ page }, arg: number) => {
  // TODO: implement step
});

Then('the speed of the audio and video playback should be reduced to {int}% of the original without changing the pitch', async ({ page }, arg: number) => {
  // TODO: implement step
});

Given('a song is playing with Key: {float} and Tempo: {int}%', async ({ page }, arg: number, arg1: number) => {
  // TODO: implement step
});

When('the KJ clicks the "Reset Audio" button', async ({ page }) => {
  // TODO: implement step
});

Then('the key should return to {int}', async ({ page }, arg: number) => {
  // TODO: implement step
});

Then('the tempo should return to {int}%', async ({ page }, arg: number) => {
  // TODO: implement step
});

Then('the on-screen indicators should disappear', async ({ page }) => {
  // TODO: implement step
});
