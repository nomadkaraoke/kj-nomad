// Generated from: docs/features/kj_admin/automation.feature
import { test } from "playwright-bdd";

test.describe('KJ Automation Engine', () => {

  test.beforeEach('Background', async ({ Given, page, And }) => {
    await Given('the KJ is running a session with automation features enabled', null, { page }); 
    await And('the singer queue is: 1. Alice, 2. Bob, 3. Charlie', null, { page }); 
  });
  
  test('Automated singer rotation', { tag: ['@kj-admin', '@automation'] }, async ({ Given, When, Then, And }) => { 
    await Given('"Alice" is currently singing'); 
    await When('"Alice\'s" song finishes playing'); 
    await Then('the system should automatically start playing the next song in the queue for "Bob"'); 
    await And('"Alice" should be moved to the bottom of the rotation'); 
    await And('the new queue order should be: 1. Bob, 2. Charlie, 3. Alice'); 
  });

  test('Automated filler music between singers', { tag: ['@kj-admin', '@automation'] }, async ({ Given, And, When, Then }) => { 
    await Given('the song queue is empty'); 
    await And('the filler music playlist is enabled'); 
    await When('the last singer\'s song finishes'); 
    await Then('the system should automatically start playing a track from the filler music library'); 
    await And('the player screens should display a "Up next..." message with the next scheduled singer if available'); 
  });

  test('Filler music fades out when a new singer starts', { tag: ['@kj-admin', '@automation'] }, async ({ Given, And, When, Then }) => { 
    await Given('filler music is currently playing'); 
    await And('the KJ manually adds a new singer, "Diana", to the now-empty queue'); 
    await When('the system prepares to play "Diana\'s" song'); 
    await Then('the filler music volume should automatically fade out'); 
    await And('"Diana\'s" karaoke track should start playing at full volume'); 
  });

});

// == technical section ==

test.use({
  $test: ({}, use) => use(test),
  $uri: ({}, use) => use('docs/features/kj_admin/automation.feature'),
  $bddFileData: ({}, use) => use(bddFileData),
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":11,"pickleLine":11,"tags":["@kj-admin","@automation"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ is running a session with automation features enabled","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the singer queue is: 1. Alice, 2. Bob, 3. Charlie","isBg":true,"stepMatchArguments":[{"group":{"start":21,"value":"1","children":[]},"parameterTypeName":"int"},{"group":{"start":31,"value":"2","children":[]},"parameterTypeName":"int"},{"group":{"start":39,"value":"3","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Context","textWithKeyword":"Given \"Alice\" is currently singing","stepMatchArguments":[{"group":{"start":0,"value":"\"Alice\"","children":[{"start":1,"value":"Alice","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"When \"Alice's\" song finishes playing","stepMatchArguments":[{"group":{"start":0,"value":"\"Alice's\"","children":[{"start":1,"value":"Alice's","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then the system should automatically start playing the next song in the queue for \"Bob\"","stepMatchArguments":[{"group":{"start":77,"value":"\"Bob\"","children":[{"start":78,"value":"Bob","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"And \"Alice\" should be moved to the bottom of the rotation","stepMatchArguments":[{"group":{"start":0,"value":"\"Alice\"","children":[{"start":1,"value":"Alice","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":16,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"And the new queue order should be: 1. Bob, 2. Charlie, 3. Alice","stepMatchArguments":[{"group":{"start":31,"value":"1","children":[]},"parameterTypeName":"int"},{"group":{"start":39,"value":"2","children":[]},"parameterTypeName":"int"},{"group":{"start":51,"value":"3","children":[]},"parameterTypeName":"int"}]}]},
  {"pwTestLine":19,"pickleLine":18,"tags":["@kj-admin","@automation"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ is running a session with automation features enabled","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the singer queue is: 1. Alice, 2. Bob, 3. Charlie","isBg":true,"stepMatchArguments":[{"group":{"start":21,"value":"1","children":[]},"parameterTypeName":"int"},{"group":{"start":31,"value":"2","children":[]},"parameterTypeName":"int"},{"group":{"start":39,"value":"3","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":20,"gherkinStepLine":19,"keywordType":"Context","textWithKeyword":"Given the song queue is empty","stepMatchArguments":[]},{"pwStepLine":21,"gherkinStepLine":20,"keywordType":"Context","textWithKeyword":"And the filler music playlist is enabled","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":21,"keywordType":"Action","textWithKeyword":"When the last singer's song finishes","stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":22,"keywordType":"Outcome","textWithKeyword":"Then the system should automatically start playing a track from the filler music library","stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":23,"keywordType":"Outcome","textWithKeyword":"And the player screens should display a \"Up next...\" message with the next scheduled singer if available","stepMatchArguments":[{"group":{"start":36,"value":"\"Up next...\"","children":[{"start":37,"value":"Up next...","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":27,"pickleLine":25,"tags":["@kj-admin","@automation"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ is running a session with automation features enabled","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the singer queue is: 1. Alice, 2. Bob, 3. Charlie","isBg":true,"stepMatchArguments":[{"group":{"start":21,"value":"1","children":[]},"parameterTypeName":"int"},{"group":{"start":31,"value":"2","children":[]},"parameterTypeName":"int"},{"group":{"start":39,"value":"3","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":28,"gherkinStepLine":26,"keywordType":"Context","textWithKeyword":"Given filler music is currently playing","stepMatchArguments":[]},{"pwStepLine":29,"gherkinStepLine":27,"keywordType":"Context","textWithKeyword":"And the KJ manually adds a new singer, \"Diana\", to the now-empty queue","stepMatchArguments":[{"group":{"start":35,"value":"\"Diana\"","children":[{"start":36,"value":"Diana","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":30,"gherkinStepLine":28,"keywordType":"Action","textWithKeyword":"When the system prepares to play \"Diana's\" song","stepMatchArguments":[{"group":{"start":28,"value":"\"Diana's\"","children":[{"start":29,"value":"Diana's","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":31,"gherkinStepLine":29,"keywordType":"Outcome","textWithKeyword":"Then the filler music volume should automatically fade out","stepMatchArguments":[]},{"pwStepLine":32,"gherkinStepLine":30,"keywordType":"Outcome","textWithKeyword":"And \"Diana's\" karaoke track should start playing at full volume","stepMatchArguments":[{"group":{"start":0,"value":"\"Diana's\"","children":[{"start":1,"value":"Diana's","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end