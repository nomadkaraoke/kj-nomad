// Generated from: docs/features/website/landing_page.feature
import { test } from "playwright-bdd";

test.describe('Website Landing Page and Mode Selection', () => {

  test('KJ visits the landing page and chooses to host an Offline session', { tag: ['@website', '@onboarding'] }, async ({ Given, When, Then }) => { 
    await Given('a KJ navigates to https://kj.nomadkaraoke.com'); 
    await When('the KJ clicks the "Download Offline App" button'); 
    await Then('a download of the appropriate KJ-Nomad desktop application installer should begin'); 
  });

  test('KJ visits the landing page and chooses to host an Online session', { tag: ['@website', '@onboarding'] }, async ({ Given, When, Then, And }) => { 
    await Given('a KJ navigates to https://kj.nomadkaraoke.com'); 
    await When('the KJ clicks the "Host Online Session" button'); 
    await Then('the KJ should be taken to the online session creation page'); 
    await And('they should be prompted to enter their KJ Name and Venue Name'); 
  });

});

// == technical section ==

test.use({
  $test: ({}, use) => use(test),
  $uri: ({}, use) => use('docs/features/website/landing_page.feature'),
  $bddFileData: ({}, use) => use(bddFileData),
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":7,"tags":["@website","@onboarding"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given a KJ navigates to https://kj.nomadkaraoke.com","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Action","textWithKeyword":"When the KJ clicks the \"Download Offline App\" button","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":10,"keywordType":"Outcome","textWithKeyword":"Then a download of the appropriate KJ-Nomad desktop application installer should begin","stepMatchArguments":[]}]},
  {"pwTestLine":12,"pickleLine":12,"tags":["@website","@onboarding"],"steps":[{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Context","textWithKeyword":"Given a KJ navigates to https://kj.nomadkaraoke.com","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Action","textWithKeyword":"When the KJ clicks the \"Host Online Session\" button","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then the KJ should be taken to the online session creation page","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"And they should be prompted to enter their KJ Name and Venue Name","stepMatchArguments":[]}]},
]; // bdd-data-end