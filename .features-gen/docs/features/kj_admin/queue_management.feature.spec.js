// Generated from: docs/features/kj_admin/queue_management.feature
import { test } from "playwright-bdd";

test.describe('KJ Queue Management', () => {

  test.beforeEach('Background', async ({ Given }) => {
    await Given('the KJ is logged into the Admin Interface'); 
  });
  
  test('KJ adds a singer request from a paper slip (Offline Mode)', { tag: ['@kj-admin', '@queue'] }, async ({ Given, And, When, Then }) => { 
    await Given('the KJ is running an offline session'); 
    await And('the KJ receives a paper slip with "Frank" and "My Way"'); 
    await When('the KJ uses the "Add Singer" form and enters "Frank" and searches for "My Way"'); 
    await And('selects the correct song from the local library'); 
    await Then('"Frank" with the song "My Way" should be added to the bottom of the queue'); 
  });

  test('KJ reorders the queue using drag-and-drop', { tag: ['@kj-admin', '@queue'] }, async ({ Given, When, Then, And }) => { 
    await Given('the singer queue is: 1. Alice, 2. Bob, 3. Charlie, 4. Diana'); 
    await When('the KJ drags "Charlie" from position 3 and drops them at position 1'); 
    await Then('the singer queue should be updated to: 1. Charlie, 2. Alice, 3. Bob, 4. Diana'); 
    await And('all connected clients should see the updated queue order in real-time'); 
  });

  test('KJ removes a singer from the queue', { tag: ['@kj-admin', '@queue'] }, async ({ Given, When, page, Then, And }) => { 
    await Given('the singer queue includes "Bob" at position 2'); 
    await When('the KJ removes "Bob" from the queue', null, { page }); 
    await Then('"Bob" should no longer be in the queue'); 
    await And('the queue order should be updated for all subsequent singers'); 
  });

  test('KJ sees a visual distinction for YouTube songs in the queue (Online Mode)', { tag: ['@kj-admin', '@queue'] }, async ({ Given, page, And, When, Then }) => { 
    await Given('the KJ is running an online session', null, { page }); 
    await And('a singer has requested "Never Gonna Give You Up" from YouTube'); 
    await When('the KJ views the singer queue'); 
    await Then('the entry for "Never Gonna Give You Up" should have a YouTube icon next to it'); 
  });

});

// == technical section ==

test.use({
  $test: ({}, use) => use(test),
  $uri: ({}, use) => use('docs/features/kj_admin/queue_management.feature'),
  $bddFileData: ({}, use) => use(bddFileData),
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":10,"tags":["@kj-admin","@queue"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ is logged into the Admin Interface","isBg":true,"stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":11,"keywordType":"Context","textWithKeyword":"Given the KJ is running an offline session","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Context","textWithKeyword":"And the KJ receives a paper slip with \"Frank\" and \"My Way\"","stepMatchArguments":[{"group":{"start":34,"value":"\"Frank\"","children":[{"start":35,"value":"Frank","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":46,"value":"\"My Way\"","children":[{"start":47,"value":"My Way","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"When the KJ uses the \"Add Singer\" form and enters \"Frank\" and searches for \"My Way\"","stepMatchArguments":[{"group":{"start":16,"value":"\"Add Singer\"","children":[{"start":17,"value":"Add Singer","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":45,"value":"\"Frank\"","children":[{"start":46,"value":"Frank","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":70,"value":"\"My Way\"","children":[{"start":71,"value":"My Way","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Action","textWithKeyword":"And selects the correct song from the local library","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then \"Frank\" with the song \"My Way\" should be added to the bottom of the queue","stepMatchArguments":[{"group":{"start":0,"value":"\"Frank\"","children":[{"start":1,"value":"Frank","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":22,"value":"\"My Way\"","children":[{"start":23,"value":"My Way","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":18,"pickleLine":17,"tags":["@kj-admin","@queue"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ is logged into the Admin Interface","isBg":true,"stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":18,"keywordType":"Context","textWithKeyword":"Given the singer queue is: 1. Alice, 2. Bob, 3. Charlie, 4. Diana","stepMatchArguments":[{"group":{"start":21,"value":"1","children":[]},"parameterTypeName":"int"},{"group":{"start":31,"value":"2","children":[]},"parameterTypeName":"int"},{"group":{"start":39,"value":"3","children":[]},"parameterTypeName":"int"},{"group":{"start":51,"value":"4","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":20,"gherkinStepLine":19,"keywordType":"Action","textWithKeyword":"When the KJ drags \"Charlie\" from position 3 and drops them at position 1","stepMatchArguments":[{"group":{"start":13,"value":"\"Charlie\"","children":[{"start":14,"value":"Charlie","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":37,"value":"3","children":[]},"parameterTypeName":"int"},{"group":{"start":66,"value":"1","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":21,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"Then the singer queue should be updated to: 1. Charlie, 2. Alice, 3. Bob, 4. Diana","stepMatchArguments":[{"group":{"start":39,"value":"1","children":[]},"parameterTypeName":"int"},{"group":{"start":51,"value":"2","children":[]},"parameterTypeName":"int"},{"group":{"start":61,"value":"3","children":[]},"parameterTypeName":"int"},{"group":{"start":69,"value":"4","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":22,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"And all connected clients should see the updated queue order in real-time","stepMatchArguments":[]}]},
  {"pwTestLine":25,"pickleLine":23,"tags":["@kj-admin","@queue"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ is logged into the Admin Interface","isBg":true,"stepMatchArguments":[]},{"pwStepLine":26,"gherkinStepLine":24,"keywordType":"Context","textWithKeyword":"Given the singer queue includes \"Bob\" at position 2","stepMatchArguments":[{"group":{"start":26,"value":"\"Bob\"","children":[{"start":27,"value":"Bob","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":44,"value":"2","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":27,"gherkinStepLine":25,"keywordType":"Action","textWithKeyword":"When the KJ removes \"Bob\" from the queue","stepMatchArguments":[{"group":{"start":15,"value":"\"Bob\"","children":[{"start":16,"value":"Bob","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":28,"gherkinStepLine":26,"keywordType":"Outcome","textWithKeyword":"Then \"Bob\" should no longer be in the queue","stepMatchArguments":[{"group":{"start":0,"value":"\"Bob\"","children":[{"start":1,"value":"Bob","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":29,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"And the queue order should be updated for all subsequent singers","stepMatchArguments":[]}]},
  {"pwTestLine":32,"pickleLine":29,"tags":["@kj-admin","@queue"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ is logged into the Admin Interface","isBg":true,"stepMatchArguments":[]},{"pwStepLine":33,"gherkinStepLine":30,"keywordType":"Context","textWithKeyword":"Given the KJ is running an online session","stepMatchArguments":[]},{"pwStepLine":34,"gherkinStepLine":31,"keywordType":"Context","textWithKeyword":"And a singer has requested \"Never Gonna Give You Up\" from YouTube","stepMatchArguments":[{"group":{"start":23,"value":"\"Never Gonna Give You Up\"","children":[{"start":24,"value":"Never Gonna Give You Up","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":35,"gherkinStepLine":32,"keywordType":"Action","textWithKeyword":"When the KJ views the singer queue","stepMatchArguments":[]},{"pwStepLine":36,"gherkinStepLine":33,"keywordType":"Outcome","textWithKeyword":"Then the entry for \"Never Gonna Give You Up\" should have a YouTube icon next to it","stepMatchArguments":[{"group":{"start":14,"value":"\"Never Gonna Give You Up\"","children":[{"start":15,"value":"Never Gonna Give You Up","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end