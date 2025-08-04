// Generated from: docs/features/ui/theming.feature
import { test } from "playwright-bdd";

test.describe('UI Theme Management', () => {

  test.beforeEach('Background', async ({ Given }) => {
    await Given('the user is in the KJ Admin Interface'); 
  });
  
  test('User switches to dark mode', { tag: ['@ui', '@theming'] }, async ({ Given, When, Then, And }) => { 
    await Given('the application is currently in light mode'); 
    await When('the user toggles the theme switch'); 
    await Then('the application interface should change to dark mode'); 
    await And('this preference should be saved for future sessions'); 
  });

  test('User switches back to light mode', { tag: ['@ui', '@theming'] }, async ({ Given, When, Then, And }) => { 
    await Given('the application is currently in dark mode'); 
    await When('the user toggles the theme switch'); 
    await Then('the application interface should change to light mode'); 
    await And('this preference should be saved'); 
  });

});

// == technical section ==

test.use({
  $test: ({}, use) => use(test),
  $uri: ({}, use) => use('docs/features/ui/theming.feature'),
  $bddFileData: ({}, use) => use(bddFileData),
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":10,"tags":["@ui","@theming"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the user is in the KJ Admin Interface","isBg":true,"stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":11,"keywordType":"Context","textWithKeyword":"Given the application is currently in light mode","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Action","textWithKeyword":"When the user toggles the theme switch","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"Then the application interface should change to dark mode","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"And this preference should be saved for future sessions","stepMatchArguments":[]}]},
  {"pwTestLine":17,"pickleLine":16,"tags":["@ui","@theming"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the user is in the KJ Admin Interface","isBg":true,"stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":17,"keywordType":"Context","textWithKeyword":"Given the application is currently in dark mode","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When the user toggles the theme switch","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then the application interface should change to light mode","stepMatchArguments":[]},{"pwStepLine":21,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"And this preference should be saved","stepMatchArguments":[]}]},
]; // bdd-data-end