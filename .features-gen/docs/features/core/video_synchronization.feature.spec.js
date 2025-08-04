// Generated from: docs/features/core/video_synchronization.feature
import { test } from "playwright-bdd";

test.describe('Perfect Video Synchronization', () => {

  test.beforeEach('Background', async ({ Given, page, And }) => {
    await Given('the KJ is running a session', null, { page }); 
    await And('two player screens, "Player 1" and "Player 2", are connected', null, { page }); 
  });
  
  test('Player screens start and play in sync', { tag: ['@core', '@video-sync'] }, async ({ Given, page, When, Then, And }) => { 
    await Given('a karaoke video is ready to be played', null, { page }); 
    await When('the KJ starts the video playback', null, { page }); 
    await Then('the video should begin playing simultaneously on both "Player 1" and "Player 2"', null, { page }); 
    await And('at any point during playback, the `currentTime` of the video on "Player 1" should not differ from "Player 2" by more than 100 milliseconds', null, { page }); 
  });

  test('Player screens seek in sync', { tag: ['@core', '@video-sync'] }, async ({ Given, page, When, Then, And }) => { 
    await Given('a karaoke video is currently playing on both screens', null, { page }); 
    await When('the KJ seeks the video to the 1 minute and 30 second mark', null, { page }); 
    await Then('both "Player 1" and "Player 2" should jump to the new timestamp', null, { page }); 
    await And('resume playing in sync, with a time difference of less than 100 milliseconds', null, { page }); 
  });

  test('Player screens pause and resume in sync', { tag: ['@core', '@video-sync'] }, async ({ Given, page, When, Then, And }) => { 
    await Given('a karaoke video is currently playing on both screens', null, { page }); 
    await When('the KJ pauses the video', null, { page }); 
    await Then('both "Player 1" and "Player 2" should pause at the exact same frame', null, { page }); 
    await And('when the KJ resumes the video', null, { page }); 
    await Then('both players should resume playback simultaneously', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: ({}, use) => use(test),
  $uri: ({}, use) => use('docs/features/core/video_synchronization.feature'),
  $bddFileData: ({}, use) => use(bddFileData),
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":11,"pickleLine":11,"tags":["@core","@video-sync"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ is running a session","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And two player screens, \"Player 1\" and \"Player 2\", are connected","isBg":true,"stepMatchArguments":[{"group":{"start":20,"value":"\"Player 1\"","children":[{"start":21,"value":"Player 1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":35,"value":"\"Player 2\"","children":[{"start":36,"value":"Player 2","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Context","textWithKeyword":"Given a karaoke video is ready to be played","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"When the KJ starts the video playback","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then the video should begin playing simultaneously on both \"Player 1\" and \"Player 2\"","stepMatchArguments":[{"group":{"start":54,"value":"\"Player 1\"","children":[{"start":55,"value":"Player 1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":69,"value":"\"Player 2\"","children":[{"start":70,"value":"Player 2","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"And at any point during playback, the `currentTime` of the video on \"Player 1\" should not differ from \"Player 2\" by more than 100 milliseconds","stepMatchArguments":[{"group":{"start":64,"value":"\"Player 1\"","children":[{"start":65,"value":"Player 1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":98,"value":"\"Player 2\"","children":[{"start":99,"value":"Player 2","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":122,"value":"100","children":[]},"parameterTypeName":"int"}]}]},
  {"pwTestLine":18,"pickleLine":17,"tags":["@core","@video-sync"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ is running a session","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And two player screens, \"Player 1\" and \"Player 2\", are connected","isBg":true,"stepMatchArguments":[{"group":{"start":20,"value":"\"Player 1\"","children":[{"start":21,"value":"Player 1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":35,"value":"\"Player 2\"","children":[{"start":36,"value":"Player 2","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":19,"gherkinStepLine":18,"keywordType":"Context","textWithKeyword":"Given a karaoke video is currently playing on both screens","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":19,"keywordType":"Action","textWithKeyword":"When the KJ seeks the video to the 1 minute and 30 second mark","stepMatchArguments":[{"group":{"start":30,"value":"1","children":[]},"parameterTypeName":"int"},{"group":{"start":43,"value":"30","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":21,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"Then both \"Player 1\" and \"Player 2\" should jump to the new timestamp","stepMatchArguments":[{"group":{"start":5,"value":"\"Player 1\"","children":[{"start":6,"value":"Player 1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":20,"value":"\"Player 2\"","children":[{"start":21,"value":"Player 2","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":22,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"And resume playing in sync, with a time difference of less than 100 milliseconds","stepMatchArguments":[{"group":{"start":60,"value":"100","children":[]},"parameterTypeName":"int"}]}]},
  {"pwTestLine":25,"pickleLine":23,"tags":["@core","@video-sync"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ is running a session","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And two player screens, \"Player 1\" and \"Player 2\", are connected","isBg":true,"stepMatchArguments":[{"group":{"start":20,"value":"\"Player 1\"","children":[{"start":21,"value":"Player 1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":35,"value":"\"Player 2\"","children":[{"start":36,"value":"Player 2","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":26,"gherkinStepLine":24,"keywordType":"Context","textWithKeyword":"Given a karaoke video is currently playing on both screens","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":25,"keywordType":"Action","textWithKeyword":"When the KJ pauses the video","stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":26,"keywordType":"Outcome","textWithKeyword":"Then both \"Player 1\" and \"Player 2\" should pause at the exact same frame","stepMatchArguments":[{"group":{"start":5,"value":"\"Player 1\"","children":[{"start":6,"value":"Player 1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":20,"value":"\"Player 2\"","children":[{"start":21,"value":"Player 2","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":29,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"And when the KJ resumes the video","stepMatchArguments":[]},{"pwStepLine":30,"gherkinStepLine":28,"keywordType":"Outcome","textWithKeyword":"Then both players should resume playback simultaneously","stepMatchArguments":[]}]},
]; // bdd-data-end