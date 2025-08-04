// Generated from: docs/features/session_management/offline_session.feature
import { test } from "playwright-bdd";

test.describe('Offline Session Management', () => {

  test.beforeEach('Background', async ({ Given }) => {
    await Given('the KJ-Nomad application is installed'); 
  });
  
  test('First-time launch and setup wizard', { tag: ['@session', '@offline'] }, async ({ Given, page, When, Then, And }) => { 
    await Given('the KJ launches the application for the first time', null, { page }); 
    await When('the KJ completes the setup wizard by selecting a valid media library'); 
    await Then('the application should start the local server'); 
    await And('the main window should display the KJ Admin Interface'); 
    await And('the Admin Interface should show the local IP address for player screens to connect to'); 
  });

  test('Subsequent launch after setup', { tag: ['@session', '@offline'] }, async ({ Given, When, page, Then, And }) => { 
    await Given('the KJ has completed the setup wizard once before'); 
    await When('the KJ launches the application', null, { page }); 
    await Then('the application should bypass the setup wizard'); 
    await And('go directly to the KJ Admin Interface'); 
  });

  test('KJ manually rescans the media library', { tag: ['@session', '@offline'] }, async ({ Given, page, And, When, Then }) => { 
    await Given('the KJ is on the Admin Interface', null, { page }); 
    await And('new songs have been added to the media folder on the filesystem'); 
    await When('the KJ navigates to the media library management section'); 
    await And('clicks the "Rescan Library" button'); 
    await Then('the system should find and index the new songs'); 
    await And('the new songs should be available in the song search'); 
  });

  test('KJ changes the media library path', { tag: ['@session', '@offline'] }, async ({ Given, page, When, And, Then }) => { 
    await Given('the KJ is on the Admin Interface', null, { page }); 
    await When('the KJ navigates to the media library management section'); 
    await And('selects a new, valid media library path'); 
    await Then('the system should scan the new directory'); 
    await And('the song search should now use the new library'); 
  });

});

// == technical section ==

test.use({
  $test: ({}, use) => use(test),
  $uri: ({}, use) => use('docs/features/session_management/offline_session.feature'),
  $bddFileData: ({}, use) => use(bddFileData),
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":10,"tags":["@session","@offline"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ-Nomad application is installed","isBg":true,"stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":11,"keywordType":"Context","textWithKeyword":"Given the KJ launches the application for the first time","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Action","textWithKeyword":"When the KJ completes the setup wizard by selecting a valid media library","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"Then the application should start the local server","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"And the main window should display the KJ Admin Interface","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"And the Admin Interface should show the local IP address for player screens to connect to","stepMatchArguments":[]}]},
  {"pwTestLine":18,"pickleLine":17,"tags":["@session","@offline"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ-Nomad application is installed","isBg":true,"stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":18,"keywordType":"Context","textWithKeyword":"Given the KJ has completed the setup wizard once before","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":19,"keywordType":"Action","textWithKeyword":"When the KJ launches the application","stepMatchArguments":[]},{"pwStepLine":21,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"Then the application should bypass the setup wizard","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"And go directly to the KJ Admin Interface","stepMatchArguments":[]}]},
  {"pwTestLine":25,"pickleLine":23,"tags":["@session","@offline"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ-Nomad application is installed","isBg":true,"stepMatchArguments":[]},{"pwStepLine":26,"gherkinStepLine":24,"keywordType":"Context","textWithKeyword":"Given the KJ is on the Admin Interface","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":25,"keywordType":"Context","textWithKeyword":"And new songs have been added to the media folder on the filesystem","stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":26,"keywordType":"Action","textWithKeyword":"When the KJ navigates to the media library management section","stepMatchArguments":[]},{"pwStepLine":29,"gherkinStepLine":27,"keywordType":"Action","textWithKeyword":"And clicks the \"Rescan Library\" button","stepMatchArguments":[{"group":{"start":11,"value":"\"Rescan Library\"","children":[{"start":12,"value":"Rescan Library","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":30,"gherkinStepLine":28,"keywordType":"Outcome","textWithKeyword":"Then the system should find and index the new songs","stepMatchArguments":[]},{"pwStepLine":31,"gherkinStepLine":29,"keywordType":"Outcome","textWithKeyword":"And the new songs should be available in the song search","stepMatchArguments":[]}]},
  {"pwTestLine":34,"pickleLine":31,"tags":["@session","@offline"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ-Nomad application is installed","isBg":true,"stepMatchArguments":[]},{"pwStepLine":35,"gherkinStepLine":32,"keywordType":"Context","textWithKeyword":"Given the KJ is on the Admin Interface","stepMatchArguments":[]},{"pwStepLine":36,"gherkinStepLine":33,"keywordType":"Action","textWithKeyword":"When the KJ navigates to the media library management section","stepMatchArguments":[]},{"pwStepLine":37,"gherkinStepLine":34,"keywordType":"Action","textWithKeyword":"And selects a new, valid media library path","stepMatchArguments":[]},{"pwStepLine":38,"gherkinStepLine":35,"keywordType":"Outcome","textWithKeyword":"Then the system should scan the new directory","stepMatchArguments":[]},{"pwStepLine":39,"gherkinStepLine":36,"keywordType":"Outcome","textWithKeyword":"And the song search should now use the new library","stepMatchArguments":[]}]},
]; // bdd-data-end