// Generated from: docs/features/kj_admin/ticker_management.feature
import { test } from "playwright-bdd";

test.describe('Scrolling Ticker Management', () => {

  test.beforeEach('Background', async ({ Given, page, And }) => {
    await Given('the KJ is on the Admin Interface', null, { page }); 
    await And('at least one player screen is connected'); 
  });
  
  test('KJ updates the ticker with static text', { tag: ['@kj-admin', '@ticker'] }, async ({ Given, When, And, Then }) => { 
    await Given('the ticker text is currently empty'); 
    await When('the KJ enters "Welcome to Karaoke Night!" into the ticker input'); 
    await And('clicks "Update Ticker"'); 
    await Then('the scrolling ticker on all connected player screens should display "Welcome to Karaoke Night!"'); 
  });

  test('KJ updates the ticker with dynamic variables', { tag: ['@kj-admin', '@ticker'] }, async ({ Given, And, When, Then }) => { 
    await Given('the next three singers in the rotation are "Alice", "Bob", and "Charlie"'); 
    await And('the session\'s tipping URL is "https://tips.kjnomad.com/1234"'); 
    await When('the KJ composes a ticker message using the template: "Next up: $ROTATION_NEXT_3 | Please tip your KJ! $TIP_URL"'); 
    await And('saves the new ticker configuration'); 
    await Then('the text displayed on the player screen tickers should be "Next up: Alice, Bob, Charlie | Please tip your KJ! https://tips.kjnomad.com/1234"'); 
  });

  test('KJ clears the ticker text', { tag: ['@kj-admin', '@ticker'] }, async ({ Given, When, And, Then }) => { 
    await Given('the ticker is displaying a message'); 
    await When('the KJ clears the text from the ticker input'); 
    await And('clicks "Update Ticker"'); 
    await Then('the scrolling ticker on all player screens should become empty and stop scrolling'); 
  });

});

// == technical section ==

test.use({
  $test: ({}, use) => use(test),
  $uri: ({}, use) => use('docs/features/kj_admin/ticker_management.feature'),
  $bddFileData: ({}, use) => use(bddFileData),
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":11,"pickleLine":11,"tags":["@kj-admin","@ticker"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ is on the Admin Interface","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And at least one player screen is connected","isBg":true,"stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Context","textWithKeyword":"Given the ticker text is currently empty","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"When the KJ enters \"Welcome to Karaoke Night!\" into the ticker input","stepMatchArguments":[{"group":{"start":14,"value":"\"Welcome to Karaoke Night!\"","children":[{"start":15,"value":"Welcome to Karaoke Night!","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Action","textWithKeyword":"And clicks \"Update Ticker\"","stepMatchArguments":[{"group":{"start":7,"value":"\"Update Ticker\"","children":[{"start":8,"value":"Update Ticker","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then the scrolling ticker on all connected player screens should display \"Welcome to Karaoke Night!\"","stepMatchArguments":[{"group":{"start":68,"value":"\"Welcome to Karaoke Night!\"","children":[{"start":69,"value":"Welcome to Karaoke Night!","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":18,"pickleLine":17,"tags":["@kj-admin","@ticker"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ is on the Admin Interface","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And at least one player screen is connected","isBg":true,"stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":18,"keywordType":"Context","textWithKeyword":"Given the next three singers in the rotation are \"Alice\", \"Bob\", and \"Charlie\"","stepMatchArguments":[{"group":{"start":43,"value":"\"Alice\"","children":[{"start":44,"value":"Alice","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":52,"value":"\"Bob\"","children":[{"start":53,"value":"Bob","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":63,"value":"\"Charlie\"","children":[{"start":64,"value":"Charlie","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":20,"gherkinStepLine":19,"keywordType":"Context","textWithKeyword":"And the session's tipping URL is \"https://tips.kjnomad.com/1234\"","stepMatchArguments":[{"group":{"start":29,"value":"\"https://tips.kjnomad.com/1234\"","children":[{"start":30,"value":"https://tips.kjnomad.com/1234","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":21,"gherkinStepLine":20,"keywordType":"Action","textWithKeyword":"When the KJ composes a ticker message using the template: \"Next up: $ROTATION_NEXT_3 | Please tip your KJ! $TIP_URL\"","stepMatchArguments":[{"group":{"start":53,"value":"\"Next up: $ROTATION_NEXT_3 | Please tip your KJ! $TIP_URL\"","children":[{"start":54,"value":"Next up: $ROTATION_NEXT_3 | Please tip your KJ! $TIP_URL","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":22,"gherkinStepLine":21,"keywordType":"Action","textWithKeyword":"And saves the new ticker configuration","stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":22,"keywordType":"Outcome","textWithKeyword":"Then the text displayed on the player screen tickers should be \"Next up: Alice, Bob, Charlie | Please tip your KJ! https://tips.kjnomad.com/1234\"","stepMatchArguments":[{"group":{"start":58,"value":"\"Next up: Alice, Bob, Charlie | Please tip your KJ! https://tips.kjnomad.com/1234\"","children":[{"start":59,"value":"Next up: Alice, Bob, Charlie | Please tip your KJ! https://tips.kjnomad.com/1234","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":26,"pickleLine":24,"tags":["@kj-admin","@ticker"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ is on the Admin Interface","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And at least one player screen is connected","isBg":true,"stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":25,"keywordType":"Context","textWithKeyword":"Given the ticker is displaying a message","stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":26,"keywordType":"Action","textWithKeyword":"When the KJ clears the text from the ticker input","stepMatchArguments":[]},{"pwStepLine":29,"gherkinStepLine":27,"keywordType":"Action","textWithKeyword":"And clicks \"Update Ticker\"","stepMatchArguments":[{"group":{"start":7,"value":"\"Update Ticker\"","children":[{"start":8,"value":"Update Ticker","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":30,"gherkinStepLine":28,"keywordType":"Outcome","textWithKeyword":"Then the scrolling ticker on all player screens should become empty and stop scrolling","stepMatchArguments":[]}]},
]; // bdd-data-end