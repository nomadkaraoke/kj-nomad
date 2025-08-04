// Generated from: docs/features/tipping/prize_raffle.feature
import { test } from "playwright-bdd";

test.describe('Tip Prize Raffle', () => {

  test.beforeEach('Background', async ({ Given, page, And }) => {
    await Given('the KJ is running an online session with the "Tip Prize Raffle" enabled', null, { page }); 
    await And('the KJ has set the prize as "A $10 Bar Voucher"', null, { page }); 
    await And('three singers, "Alice", "Bob", and "Charlie", have tipped during the session', null, { page }); 
  });
  
  test('KJ draws the raffle winner', { tag: ['@tipping', '@monetization'] }, async ({ Given, page, When, Then, And }) => { 
    await Given('the KJ is on the Admin Interface', null, { page }); 
    await When('the KJ clicks the "Draw Raffle" button', null, { page }); 
    await Then('a winner should be randomly selected from the list of tippers', null, { page }); 
    await And('a prominent overlay should be displayed on all player screens announcing the winner', null, { page }); 
  });

  test('KJ re-draws the raffle if the winner is absent', { tag: ['@tipping', '@monetization'] }, async ({ Given, page, And, When, Then }) => { 
    await Given('the KJ has just drawn "Charlie" as the winner', null, { page }); 
    await And('the KJ determines that "Charlie" has already left the venue', null, { page }); 
    await When('the KJ clicks the "Draw Raffle Again" button', null, { page }); 
    await Then('a new winner should be randomly selected from the remaining tippers ("Alice", "Bob")', null, { page }); 
    await And('the winner announcement overlay should be updated with the new winner\'s name', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: ({}, use) => use(test),
  $uri: ({}, use) => use('docs/features/tipping/prize_raffle.feature'),
  $bddFileData: ({}, use) => use(bddFileData),
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":12,"pickleLine":11,"tags":["@tipping","@monetization"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given the KJ is running an online session with the \"Tip Prize Raffle\" enabled","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"And the KJ has set the prize as \"A $10 Bar Voucher\"","isBg":true,"stepMatchArguments":[{"group":{"start":32,"value":"10","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":9,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And three singers, \"Alice\", \"Bob\", and \"Charlie\", have tipped during the session","isBg":true,"stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":12,"keywordType":"Context","textWithKeyword":"Given the KJ is on the Admin Interface","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"When the KJ clicks the \"Draw Raffle\" button","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then a winner should be randomly selected from the list of tippers","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"And a prominent overlay should be displayed on all player screens announcing the winner","stepMatchArguments":[]}]},
  {"pwTestLine":19,"pickleLine":18,"tags":["@tipping","@monetization"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given the KJ is running an online session with the \"Tip Prize Raffle\" enabled","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"And the KJ has set the prize as \"A $10 Bar Voucher\"","isBg":true,"stepMatchArguments":[{"group":{"start":32,"value":"10","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":9,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And three singers, \"Alice\", \"Bob\", and \"Charlie\", have tipped during the session","isBg":true,"stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":19,"keywordType":"Context","textWithKeyword":"Given the KJ has just drawn \"Charlie\" as the winner","stepMatchArguments":[]},{"pwStepLine":21,"gherkinStepLine":20,"keywordType":"Context","textWithKeyword":"And the KJ determines that \"Charlie\" has already left the venue","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":21,"keywordType":"Action","textWithKeyword":"When the KJ clicks the \"Draw Raffle Again\" button","stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":22,"keywordType":"Outcome","textWithKeyword":"Then a new winner should be randomly selected from the remaining tippers (\"Alice\", \"Bob\")","stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":23,"keywordType":"Outcome","textWithKeyword":"And the winner announcement overlay should be updated with the new winner's name","stepMatchArguments":[]}]},
]; // bdd-data-end