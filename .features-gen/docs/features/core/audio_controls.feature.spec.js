// Generated from: docs/features/core/audio_controls.feature
import { test } from "playwright-bdd";

test.describe('Advanced Audio Controls', () => {

  test.beforeEach('Background', async ({ Given, page, And }) => {
    await Given('the KJ is on the Admin Interface', null, { page }); 
    await And('a song is currently playing', null, { page }); 
  });
  
  test('KJ adjusts the key of the current song', { tag: ['@core', '@audio-controls', '@future'] }, async ({ Given, page, When, Then, And }) => { 
    await Given('the song is playing at its original key (0)', null, { page }); 
    await When('the KJ increases the key by 2 semitones', null, { page }); 
    await Then('the pitch of the audio playback should be raised by 2 semitones without changing the speed', null, { page }); 
    await And('the player screen should display a small indicator, e.g., "Key: +2"', null, { page }); 
  });

  test('KJ adjusts the tempo of the current song', { tag: ['@core', '@audio-controls', '@future'] }, async ({ Given, page, When, Then, And }) => { 
    await Given('the song is playing at its original tempo (100%)', null, { page }); 
    await When('the KJ decreases the tempo by 10%', null, { page }); 
    await Then('the speed of the audio and video playback should be reduced to 90% of the original without changing the pitch', null, { page }); 
    await And('the player screen should display a small indicator, e.g., "Tempo: 90%"', null, { page }); 
  });

  test('KJ resets audio adjustments', { tag: ['@core', '@audio-controls', '@future'] }, async ({ Given, page, When, Then, And }) => { 
    await Given('a song is playing with Key: +2 and Tempo: 90%', null, { page }); 
    await When('the KJ clicks the "Reset Audio" button', null, { page }); 
    await Then('the key should return to 0', null, { page }); 
    await And('the tempo should return to 100%', null, { page }); 
    await And('the on-screen indicators should disappear', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: ({}, use) => use(test),
  $uri: ({}, use) => use('docs/features/core/audio_controls.feature'),
  $bddFileData: ({}, use) => use(bddFileData),
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":11,"pickleLine":11,"tags":["@core","@audio-controls","@future"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ is on the Admin Interface","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And a song is currently playing","isBg":true,"stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Context","textWithKeyword":"Given the song is playing at its original key (0)","stepMatchArguments":[{"group":{"start":41,"value":"0","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"When the KJ increases the key by 2 semitones","stepMatchArguments":[{"group":{"start":28,"value":"2","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then the pitch of the audio playback should be raised by 2 semitones without changing the speed","stepMatchArguments":[{"group":{"start":52,"value":"2","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"And the player screen should display a small indicator, e.g., \"Key: +2\"","stepMatchArguments":[{"group":{"start":58,"value":"\"Key: +2\"","children":[{"start":59,"value":"Key: +2","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":18,"pickleLine":17,"tags":["@core","@audio-controls","@future"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ is on the Admin Interface","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And a song is currently playing","isBg":true,"stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":18,"keywordType":"Context","textWithKeyword":"Given the song is playing at its original tempo (100%)","stepMatchArguments":[{"group":{"start":43,"value":"100","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":20,"gherkinStepLine":19,"keywordType":"Action","textWithKeyword":"When the KJ decreases the tempo by 10%","stepMatchArguments":[{"group":{"start":30,"value":"10","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":21,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"Then the speed of the audio and video playback should be reduced to 90% of the original without changing the pitch","stepMatchArguments":[{"group":{"start":63,"value":"90","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":22,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"And the player screen should display a small indicator, e.g., \"Tempo: 90%\"","stepMatchArguments":[{"group":{"start":58,"value":"\"Tempo: 90%\"","children":[{"start":59,"value":"Tempo: 90%","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":25,"pickleLine":23,"tags":["@core","@audio-controls","@future"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ is on the Admin Interface","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And a song is currently playing","isBg":true,"stepMatchArguments":[]},{"pwStepLine":26,"gherkinStepLine":24,"keywordType":"Context","textWithKeyword":"Given a song is playing with Key: +2 and Tempo: 90%","stepMatchArguments":[{"group":{"start":28,"value":"+2","children":[]},"parameterTypeName":"float"},{"group":{"start":42,"value":"90","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":27,"gherkinStepLine":25,"keywordType":"Action","textWithKeyword":"When the KJ clicks the \"Reset Audio\" button","stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":26,"keywordType":"Outcome","textWithKeyword":"Then the key should return to 0","stepMatchArguments":[{"group":{"start":25,"value":"0","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":29,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"And the tempo should return to 100%","stepMatchArguments":[{"group":{"start":27,"value":"100","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":30,"gherkinStepLine":28,"keywordType":"Outcome","textWithKeyword":"And the on-screen indicators should disappear","stepMatchArguments":[]}]},
]; // bdd-data-end