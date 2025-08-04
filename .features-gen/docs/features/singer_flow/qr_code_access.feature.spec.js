// Generated from: docs/features/singer_flow/qr_code_access.feature
import { test } from "playwright-bdd";

test.describe('QR Code Access for Singers', () => {

  test.beforeEach('Background', async ({ Given }) => {
    await Given('the KJ is running an online session with ID "5678"'); 
  });
  
  test('KJ enables the QR code display', { tag: ['@singer-flow', '@online', '@qr-code'] }, async ({ Given, page, When, Then }) => { 
    await Given('the KJ is on the Admin Interface', null, { page }); 
    await When('the KJ enables the "Show QR Code" option for player screens'); 
    await Then('a unique QR code for the session should be displayed as an overlay on all player screens'); 
  });

  test('Singer joins a session by scanning the QR code', { tag: ['@singer-flow', '@online', '@qr-code'] }, async ({ Given, When, Then, And }) => { 
    await Given('a QR code for session "5678" is displayed on a player screen'); 
    await When('a singer scans the QR code with their mobile device'); 
    await Then('their device\'s web browser should open directly to the singer request page for session "5678"'); 
    await And('they should not need to manually enter the Session ID'); 
  });

});

// == technical section ==

test.use({
  $test: ({}, use) => use(test),
  $uri: ({}, use) => use('docs/features/singer_flow/qr_code_access.feature'),
  $bddFileData: ({}, use) => use(bddFileData),
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":9,"tags":["@singer-flow","@online","@qr-code"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given the KJ is running an online session with ID \"5678\"","isBg":true,"stepMatchArguments":[{"group":{"start":44,"value":"\"5678\"","children":[{"start":45,"value":"5678","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":11,"gherkinStepLine":10,"keywordType":"Context","textWithKeyword":"Given the KJ is on the Admin Interface","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":11,"keywordType":"Action","textWithKeyword":"When the KJ enables the \"Show QR Code\" option for player screens","stepMatchArguments":[{"group":{"start":19,"value":"\"Show QR Code\"","children":[{"start":20,"value":"Show QR Code","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":13,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"Then a unique QR code for the session should be displayed as an overlay on all player screens","stepMatchArguments":[]}]},
  {"pwTestLine":16,"pickleLine":14,"tags":["@singer-flow","@online","@qr-code"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given the KJ is running an online session with ID \"5678\"","isBg":true,"stepMatchArguments":[{"group":{"start":44,"value":"\"5678\"","children":[{"start":45,"value":"5678","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":17,"gherkinStepLine":15,"keywordType":"Context","textWithKeyword":"Given a QR code for session \"5678\" is displayed on a player screen","stepMatchArguments":[{"group":{"start":22,"value":"\"5678\"","children":[{"start":23,"value":"5678","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":18,"gherkinStepLine":16,"keywordType":"Action","textWithKeyword":"When a singer scans the QR code with their mobile device","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"Then their device's web browser should open directly to the singer request page for session \"5678\"","stepMatchArguments":[{"group":{"start":87,"value":"\"5678\"","children":[{"start":88,"value":"5678","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":20,"gherkinStepLine":18,"keywordType":"Outcome","textWithKeyword":"And they should not need to manually enter the Session ID","stepMatchArguments":[]}]},
]; // bdd-data-end