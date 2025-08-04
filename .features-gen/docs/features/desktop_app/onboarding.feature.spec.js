// Generated from: docs/features/desktop_app/onboarding.feature
import { test } from "playwright-bdd";

test.describe('Desktop Application Onboarding and Setup', () => {

  test.beforeEach('Background', async ({ Given }) => {
    await Given('the KJ has downloaded and installed the KJ-Nomad desktop application'); 
  });
  
  test('KJ launches the app and chooses to start an Offline Session', { tag: ['@desktop-app', '@onboarding'] }, async ({ Given, page, Then, When }) => { 
    await Given('the KJ launches the application for the first time', null, { page }); 
    await Then('they should see the "Welcome to KJ-Nomad" screen with three choices: "Start Offline Session", "Connect to Online Session", and "Set up as Player"', null, { page }); 
    await When('the KJ clicks "Start Offline Session"', null, { page }); 
    await Then('they should be taken to the multi-step Setup Wizard to configure their media library', null, { page }); 
  });

  test('KJ launches the app and chooses to connect to an Online Session', { tag: ['@desktop-app', '@onboarding'] }, async ({ Given, page, When, Then }) => { 
    await Given('the KJ launches the application for the first time', null, { page }); 
    await When('the KJ clicks "Connect to Online Session"', null, { page }); 
    await Then('they should be prompted to enter their private Admin Key', null, { page }); 
  });

  test('KJ launches the app and chooses to set it up as a Player', { tag: ['@desktop-app', '@onboarding'] }, async ({ Given, page, When, Then, And }) => { 
    await Given('the KJ launches the application for the first time', null, { page }); 
    await When('the KJ clicks "Set up as Player"', null, { page }); 
    await Then('the application should enter Player Mode', null, { page }); 
    await And('begin searching for a KJ server on the local network', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: ({}, use) => use(test),
  $uri: ({}, use) => use('docs/features/desktop_app/onboarding.feature'),
  $bddFileData: ({}, use) => use(bddFileData),
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":10,"tags":["@desktop-app","@onboarding"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ has downloaded and installed the KJ-Nomad desktop application","isBg":true,"stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":11,"keywordType":"Context","textWithKeyword":"Given the KJ launches the application for the first time","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"Then they should see the \"Welcome to KJ-Nomad\" screen with three choices: \"Start Offline Session\", \"Connect to Online Session\", and \"Set up as Player\"","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"When the KJ clicks \"Start Offline Session\"","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then they should be taken to the multi-step Setup Wizard to configure their media library","stepMatchArguments":[]}]},
  {"pwTestLine":17,"pickleLine":16,"tags":["@desktop-app","@onboarding"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ has downloaded and installed the KJ-Nomad desktop application","isBg":true,"stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":17,"keywordType":"Context","textWithKeyword":"Given the KJ launches the application for the first time","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When the KJ clicks \"Connect to Online Session\"","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then they should be prompted to enter their private Admin Key","stepMatchArguments":[]}]},
  {"pwTestLine":23,"pickleLine":21,"tags":["@desktop-app","@onboarding"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ has downloaded and installed the KJ-Nomad desktop application","isBg":true,"stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":22,"keywordType":"Context","textWithKeyword":"Given the KJ launches the application for the first time","stepMatchArguments":[]},{"pwStepLine":25,"gherkinStepLine":23,"keywordType":"Action","textWithKeyword":"When the KJ clicks \"Set up as Player\"","stepMatchArguments":[]},{"pwStepLine":26,"gherkinStepLine":24,"keywordType":"Outcome","textWithKeyword":"Then the application should enter Player Mode","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":25,"keywordType":"Outcome","textWithKeyword":"And begin searching for a KJ server on the local network","stepMatchArguments":[]}]},
]; // bdd-data-end