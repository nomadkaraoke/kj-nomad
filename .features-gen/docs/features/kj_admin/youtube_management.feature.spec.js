// Generated from: docs/features/kj_admin/youtube_management.feature
import { test } from "playwright-bdd";

test.describe('KJ YouTube Download Management', () => {

  test.beforeEach('Background', async ({ Given }) => {
    await Given('the KJ is running an online session with YouTube integration enabled'); 
  });
  
  test('KJ views the download progress of a YouTube song', { tag: ['@kj-admin', '@youtube', '@online'] }, async ({ Given, And, When, Then }) => { 
    await Given('a singer has requested a song from YouTube'); 
    await And('the local server has started downloading it'); 
    await When('the KJ views the song in the Admin Interface queue'); 
    await Then('the song entry should display a real-time download progress indicator (e.g., "Downloading... 45%")'); 
  });

  test('A YouTube download fails', { tag: ['@kj-admin', '@youtube', '@online'] }, async ({ Given, When, Then, And }) => { 
    await Given('a requested YouTube song is currently downloading'); 
    await When('the download fails due to a network error or unavailable video'); 
    await Then('the song entry in the Admin Interface should show a "Download Failed" status'); 
    await And('the KJ should have an option to retry the download'); 
    await And('the singer should be notified on their device that there was an issue with their request'); 
  });

});

// == technical section ==

test.use({
  $test: ({}, use) => use(test),
  $uri: ({}, use) => use('docs/features/kj_admin/youtube_management.feature'),
  $bddFileData: ({}, use) => use(bddFileData),
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":10,"tags":["@kj-admin","@youtube","@online"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ is running an online session with YouTube integration enabled","isBg":true,"stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":11,"keywordType":"Context","textWithKeyword":"Given a singer has requested a song from YouTube","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Context","textWithKeyword":"And the local server has started downloading it","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"When the KJ views the song in the Admin Interface queue","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then the song entry should display a real-time download progress indicator (e.g., \"Downloading... 45%\")","stepMatchArguments":[{"group":{"start":77,"value":"\"Downloading... 45%\"","children":[{"start":78,"value":"Downloading... 45%","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":17,"pickleLine":16,"tags":["@kj-admin","@youtube","@online"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ is running an online session with YouTube integration enabled","isBg":true,"stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":17,"keywordType":"Context","textWithKeyword":"Given a requested YouTube song is currently downloading","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When the download fails due to a network error or unavailable video","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then the song entry in the Admin Interface should show a \"Download Failed\" status","stepMatchArguments":[{"group":{"start":52,"value":"\"Download Failed\"","children":[{"start":53,"value":"Download Failed","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":21,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"And the KJ should have an option to retry the download","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"And the singer should be notified on their device that there was an issue with their request","stepMatchArguments":[]}]},
]; // bdd-data-end