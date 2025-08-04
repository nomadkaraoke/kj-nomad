// Generated from: docs/features/singer_profiles/management.feature
import { test } from "playwright-bdd";

test.describe('Singer Profile Management', () => {

  test.beforeEach('Background', async ({ Given, page, And }) => {
    await Given('the KJ is running a session', null, { page }); 
    await And('a singer named "Regular Rita" has sung at previous events'); 
  });
  
  test('KJ views a singer\'s song history', { tag: ['@singer-profiles'] }, async ({ Given, When, Then, And }) => { 
    await Given('"Regular Rita" is in the current queue'); 
    await When('the KJ views the details for "Regular Rita"'); 
    await Then('the KJ should be able to see a list of songs "Regular Rita" has sung in the past'); 
    await And('the date each song was sung'); 
  });

  test('A singer\'s performance is added to their history', { tag: ['@singer-profiles'] }, async ({ Given, When, Then }) => { 
    await Given('"Regular Rita" is about to sing "Dancing Queen"'); 
    await When('"Regular Rita" finishes her performance'); 
    await Then('the song "Dancing Queen" should be added to her permanent song history'); 
  });

});

// == technical section ==

test.use({
  $test: ({}, use) => use(test),
  $uri: ({}, use) => use('docs/features/singer_profiles/management.feature'),
  $bddFileData: ({}, use) => use(bddFileData),
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":11,"pickleLine":11,"tags":["@singer-profiles"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ is running a session","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And a singer named \"Regular Rita\" has sung at previous events","isBg":true,"stepMatchArguments":[{"group":{"start":15,"value":"\"Regular Rita\"","children":[{"start":16,"value":"Regular Rita","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Context","textWithKeyword":"Given \"Regular Rita\" is in the current queue","stepMatchArguments":[{"group":{"start":0,"value":"\"Regular Rita\"","children":[{"start":1,"value":"Regular Rita","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"When the KJ views the details for \"Regular Rita\"","stepMatchArguments":[{"group":{"start":29,"value":"\"Regular Rita\"","children":[{"start":30,"value":"Regular Rita","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then the KJ should be able to see a list of songs \"Regular Rita\" has sung in the past","stepMatchArguments":[{"group":{"start":45,"value":"\"Regular Rita\"","children":[{"start":46,"value":"Regular Rita","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"And the date each song was sung","stepMatchArguments":[]}]},
  {"pwTestLine":18,"pickleLine":17,"tags":["@singer-profiles"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ is running a session","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And a singer named \"Regular Rita\" has sung at previous events","isBg":true,"stepMatchArguments":[{"group":{"start":15,"value":"\"Regular Rita\"","children":[{"start":16,"value":"Regular Rita","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":19,"gherkinStepLine":18,"keywordType":"Context","textWithKeyword":"Given \"Regular Rita\" is about to sing \"Dancing Queen\"","stepMatchArguments":[{"group":{"start":0,"value":"\"Regular Rita\"","children":[{"start":1,"value":"Regular Rita","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":32,"value":"\"Dancing Queen\"","children":[{"start":33,"value":"Dancing Queen","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":20,"gherkinStepLine":19,"keywordType":"Action","textWithKeyword":"When \"Regular Rita\" finishes her performance","stepMatchArguments":[{"group":{"start":0,"value":"\"Regular Rita\"","children":[{"start":1,"value":"Regular Rita","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":21,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"Then the song \"Dancing Queen\" should be added to her permanent song history","stepMatchArguments":[{"group":{"start":9,"value":"\"Dancing Queen\"","children":[{"start":10,"value":"Dancing Queen","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end