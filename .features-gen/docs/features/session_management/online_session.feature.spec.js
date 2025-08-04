// Generated from: docs/features/session_management/online_session.feature
import { test } from "playwright-bdd";

test.describe('Online Session Management', () => {

  test.beforeEach('Background', async ({ Given }) => {
    await Given('the KJ has a KJ-Nomad account'); 
  });
  
  test('KJ creates a new online session', { tag: ['@session', '@online'] }, async ({ Given, When, Then, And }) => { 
    await Given('the KJ is on the kj.nomadkaraoke.com website'); 
    await When('the KJ creates a new session with venue name "The Local Pub"'); 
    await Then('the system should generate a 4-digit Session ID'); 
    await And('a private Admin Key'); 
    await And('the KJ should be redirected to the web-based Admin Interface for the new session'); 
  });

  test('KJ connects the local server to the online session', { tag: ['@session', '@online'] }, async ({ Given, And, When, Then }) => { 
    await Given('a KJ has an active online session with a valid Session ID and Admin Key'); 
    await And('the KJ-Nomad application is running on their local server'); 
    await When('the KJ connects the local server using the Session ID and Admin Key'); 
    await Then('the local server should establish a WebSocket connection to the cloud relay'); 
    await And('the web-based Admin Interface should show the local server as "Connected"'); 
  });

  test('Session expires after a period of inactivity', { tag: ['@session', '@online'] }, async ({ Given, When, Then, And }) => { 
    await Given('an online session has been active'); 
    await When('24 hours pass with no activity'); 
    await Then('the session should be automatically terminated'); 
    await And('the Session ID should no longer be valid'); 
  });

  test('KJ\'s local server disconnects and reconnects', { tag: ['@session', '@online'] }, async ({ Given, And, When, Then }) => { 
    await Given('a KJ is running an online session with a connected local server'); 
    await And('there are active player screens and singers connected'); 
    await When('the KJ\'s local server loses its internet connection'); 
    await Then('the player and singer apps should display a "KJ has disconnected, please wait" message'); 
    await And('when the KJ\'s local server reconnects to the cloud relay'); 
    await Then('the player and singer apps should automatically resume normal operation'); 
  });

});

// == technical section ==

test.use({
  $test: ({}, use) => use(test),
  $uri: ({}, use) => use('docs/features/session_management/online_session.feature'),
  $bddFileData: ({}, use) => use(bddFileData),
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":10,"tags":["@session","@online"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ has a KJ-Nomad account","isBg":true,"stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":11,"keywordType":"Context","textWithKeyword":"Given the KJ is on the kj.nomadkaraoke.com website","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Action","textWithKeyword":"When the KJ creates a new session with venue name \"The Local Pub\"","stepMatchArguments":[{"group":{"start":45,"value":"\"The Local Pub\"","children":[{"start":46,"value":"The Local Pub","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"Then the system should generate a 4-digit Session ID","stepMatchArguments":[{"group":{"start":29,"value":"4","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"And a private Admin Key","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"And the KJ should be redirected to the web-based Admin Interface for the new session","stepMatchArguments":[]}]},
  {"pwTestLine":18,"pickleLine":17,"tags":["@session","@online"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ has a KJ-Nomad account","isBg":true,"stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":18,"keywordType":"Context","textWithKeyword":"Given a KJ has an active online session with a valid Session ID and Admin Key","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":19,"keywordType":"Context","textWithKeyword":"And the KJ-Nomad application is running on their local server","stepMatchArguments":[]},{"pwStepLine":21,"gherkinStepLine":20,"keywordType":"Action","textWithKeyword":"When the KJ connects the local server using the Session ID and Admin Key","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"Then the local server should establish a WebSocket connection to the cloud relay","stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":22,"keywordType":"Outcome","textWithKeyword":"And the web-based Admin Interface should show the local server as \"Connected\"","stepMatchArguments":[{"group":{"start":62,"value":"\"Connected\"","children":[{"start":63,"value":"Connected","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":26,"pickleLine":24,"tags":["@session","@online"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ has a KJ-Nomad account","isBg":true,"stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":25,"keywordType":"Context","textWithKeyword":"Given an online session has been active","stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":26,"keywordType":"Action","textWithKeyword":"When 24 hours pass with no activity","stepMatchArguments":[{"group":{"start":0,"value":"24","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":29,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"Then the session should be automatically terminated","stepMatchArguments":[]},{"pwStepLine":30,"gherkinStepLine":28,"keywordType":"Outcome","textWithKeyword":"And the Session ID should no longer be valid","stepMatchArguments":[]}]},
  {"pwTestLine":33,"pickleLine":30,"tags":["@session","@online"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ has a KJ-Nomad account","isBg":true,"stepMatchArguments":[]},{"pwStepLine":34,"gherkinStepLine":31,"keywordType":"Context","textWithKeyword":"Given a KJ is running an online session with a connected local server","stepMatchArguments":[]},{"pwStepLine":35,"gherkinStepLine":32,"keywordType":"Context","textWithKeyword":"And there are active player screens and singers connected","stepMatchArguments":[]},{"pwStepLine":36,"gherkinStepLine":33,"keywordType":"Action","textWithKeyword":"When the KJ's local server loses its internet connection","stepMatchArguments":[]},{"pwStepLine":37,"gherkinStepLine":34,"keywordType":"Outcome","textWithKeyword":"Then the player and singer apps should display a \"KJ has disconnected, please wait\" message","stepMatchArguments":[{"group":{"start":44,"value":"\"KJ has disconnected, please wait\"","children":[{"start":45,"value":"KJ has disconnected, please wait","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":38,"gherkinStepLine":35,"keywordType":"Outcome","textWithKeyword":"And when the KJ's local server reconnects to the cloud relay","stepMatchArguments":[]},{"pwStepLine":39,"gherkinStepLine":36,"keywordType":"Outcome","textWithKeyword":"Then the player and singer apps should automatically resume normal operation","stepMatchArguments":[]}]},
]; // bdd-data-end