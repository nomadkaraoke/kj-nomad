// Generated from: docs/features/player_screens/management.feature
import { test } from "playwright-bdd";

test.describe('Player Screen Management', () => {

  test.beforeEach('Background', async ({ Given }) => {
    await Given('the KJ has a session running on the local server'); 
  });
  
  test('A new player screen connects automatically', { tag: ['@player-screen', '@core-feature'] }, async ({ Given, When, Then, And }) => { 
    await Given('a player device is on the same local network as the KJ server'); 
    await When('the player device launches the KJ-Nomad application in player mode'); 
    await Then('it should automatically discover and connect to the KJ server'); 
    await And('the new player screen should appear in the "Player Screens" list in the KJ Admin Interface'); 
  });

  test('Player screen launches before the server is ready', { tag: ['@player-screen', '@core-feature'] }, async ({ Given, When, Then, And }) => { 
    await Given('a player device is on the same local network as the KJ server'); 
    await When('the player device launches in player mode before the KJ server is running'); 
    await Then('the player screen should display a "Searching for server..." message'); 
    await And('when the KJ server starts up'); 
    await Then('the player screen should automatically connect without user intervention'); 
  });

  test('KJ identifies a specific player screen', { tag: ['@player-screen', '@core-feature'] }, async ({ Given, When, Then, And }) => { 
    await Given('three player screens are connected to the server'); 
    await When('the KJ clicks the "Identify" button for "Screen 2" in the Admin Interface'); 
    await Then('a large overlay with the text "Screen 2" should appear on the corresponding physical screen'); 
    await And('the overlay should disappear automatically after 5 seconds'); 
  });

  test('Player screen temporarily disconnects and reconnects', { tag: ['@player-screen', '@core-feature'] }, async ({ Given, When, Then, And }) => { 
    await Given('a player screen named "Screen 1" is connected with the ticker turned off'); 
    await When('"Screen 1" loses its network connection for 15 seconds'); 
    await Then('the Admin Interface should show "Screen 1" as "Disconnected"'); 
    await And('when "Screen 1" reconnects to the network'); 
    await Then('it should reappear in the Admin Interface as "Screen 1"'); 
    await And('its ticker configuration should still be turned off'); 
  });

  test('KJ permanently removes a player screen', { tag: ['@player-screen', '@core-feature'] }, async ({ Given, When, Then, And }) => { 
    await Given('a player screen named "Screen 3" is connected'); 
    await When('the KJ clicks the "Disconnect" button for "Screen 3"'); 
    await Then('a signal is sent to "Screen 3" to shut down'); 
    await And('"Screen 3" displays a "Player Screen Disconnected" message'); 
    await And('"Screen 3" is permanently removed from the Admin Interface list'); 
  });

  test('A forgotten player screen tries to reconnect', { tag: ['@player-screen', '@core-feature'] }, async ({ Given, When, Then, And }) => { 
    await Given('the KJ has permanently disconnected "Screen 3"'); 
    await When('the device that was "Screen 3" restarts and connects to the server'); 
    await Then('it should be treated as a new screen'); 
    await And('appear in the Admin Interface as "Screen 4" with default settings'); 
  });

});

// == technical section ==

test.use({
  $test: ({}, use) => use(test),
  $uri: ({}, use) => use('docs/features/player_screens/management.feature'),
  $bddFileData: ({}, use) => use(bddFileData),
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":10,"tags":["@player-screen","@core-feature"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ has a session running on the local server","isBg":true,"stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":11,"keywordType":"Context","textWithKeyword":"Given a player device is on the same local network as the KJ server","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Action","textWithKeyword":"When the player device launches the KJ-Nomad application in player mode","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"Then it should automatically discover and connect to the KJ server","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"And the new player screen should appear in the \"Player Screens\" list in the KJ Admin Interface","stepMatchArguments":[{"group":{"start":43,"value":"\"Player Screens\"","children":[{"start":44,"value":"Player Screens","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":17,"pickleLine":16,"tags":["@player-screen","@core-feature"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ has a session running on the local server","isBg":true,"stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":17,"keywordType":"Context","textWithKeyword":"Given a player device is on the same local network as the KJ server","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When the player device launches in player mode before the KJ server is running","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then the player screen should display a \"Searching for server...\" message","stepMatchArguments":[{"group":{"start":35,"value":"\"Searching for server...\"","children":[{"start":36,"value":"Searching for server...","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":21,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"And when the KJ server starts up","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"Then the player screen should automatically connect without user intervention","stepMatchArguments":[]}]},
  {"pwTestLine":25,"pickleLine":23,"tags":["@player-screen","@core-feature"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ has a session running on the local server","isBg":true,"stepMatchArguments":[]},{"pwStepLine":26,"gherkinStepLine":24,"keywordType":"Context","textWithKeyword":"Given three player screens are connected to the server","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":25,"keywordType":"Action","textWithKeyword":"When the KJ clicks the \"Identify\" button for \"Screen 2\" in the Admin Interface","stepMatchArguments":[{"group":{"start":18,"value":"\"Identify\"","children":[{"start":19,"value":"Identify","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":40,"value":"\"Screen 2\"","children":[{"start":41,"value":"Screen 2","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":28,"gherkinStepLine":26,"keywordType":"Outcome","textWithKeyword":"Then a large overlay with the text \"Screen 2\" should appear on the corresponding physical screen","stepMatchArguments":[{"group":{"start":30,"value":"\"Screen 2\"","children":[{"start":31,"value":"Screen 2","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":29,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"And the overlay should disappear automatically after 5 seconds","stepMatchArguments":[{"group":{"start":49,"value":"5","children":[]},"parameterTypeName":"int"}]}]},
  {"pwTestLine":32,"pickleLine":29,"tags":["@player-screen","@core-feature"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ has a session running on the local server","isBg":true,"stepMatchArguments":[]},{"pwStepLine":33,"gherkinStepLine":30,"keywordType":"Context","textWithKeyword":"Given a player screen named \"Screen 1\" is connected with the ticker turned off","stepMatchArguments":[{"group":{"start":22,"value":"\"Screen 1\"","children":[{"start":23,"value":"Screen 1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":34,"gherkinStepLine":31,"keywordType":"Action","textWithKeyword":"When \"Screen 1\" loses its network connection for 15 seconds","stepMatchArguments":[{"group":{"start":0,"value":"\"Screen 1\"","children":[{"start":1,"value":"Screen 1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":44,"value":"15","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":35,"gherkinStepLine":32,"keywordType":"Outcome","textWithKeyword":"Then the Admin Interface should show \"Screen 1\" as \"Disconnected\"","stepMatchArguments":[{"group":{"start":32,"value":"\"Screen 1\"","children":[{"start":33,"value":"Screen 1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":46,"value":"\"Disconnected\"","children":[{"start":47,"value":"Disconnected","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":36,"gherkinStepLine":33,"keywordType":"Outcome","textWithKeyword":"And when \"Screen 1\" reconnects to the network","stepMatchArguments":[{"group":{"start":5,"value":"\"Screen 1\"","children":[{"start":6,"value":"Screen 1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":37,"gherkinStepLine":34,"keywordType":"Outcome","textWithKeyword":"Then it should reappear in the Admin Interface as \"Screen 1\"","stepMatchArguments":[{"group":{"start":45,"value":"\"Screen 1\"","children":[{"start":46,"value":"Screen 1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":38,"gherkinStepLine":35,"keywordType":"Outcome","textWithKeyword":"And its ticker configuration should still be turned off","stepMatchArguments":[]}]},
  {"pwTestLine":41,"pickleLine":37,"tags":["@player-screen","@core-feature"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ has a session running on the local server","isBg":true,"stepMatchArguments":[]},{"pwStepLine":42,"gherkinStepLine":38,"keywordType":"Context","textWithKeyword":"Given a player screen named \"Screen 3\" is connected","stepMatchArguments":[{"group":{"start":22,"value":"\"Screen 3\"","children":[{"start":23,"value":"Screen 3","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":43,"gherkinStepLine":39,"keywordType":"Action","textWithKeyword":"When the KJ clicks the \"Disconnect\" button for \"Screen 3\"","stepMatchArguments":[{"group":{"start":18,"value":"\"Disconnect\"","children":[{"start":19,"value":"Disconnect","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":42,"value":"\"Screen 3\"","children":[{"start":43,"value":"Screen 3","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":44,"gherkinStepLine":40,"keywordType":"Outcome","textWithKeyword":"Then a signal is sent to \"Screen 3\" to shut down","stepMatchArguments":[{"group":{"start":20,"value":"\"Screen 3\"","children":[{"start":21,"value":"Screen 3","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":45,"gherkinStepLine":41,"keywordType":"Outcome","textWithKeyword":"And \"Screen 3\" displays a \"Player Screen Disconnected\" message","stepMatchArguments":[{"group":{"start":0,"value":"\"Screen 3\"","children":[{"start":1,"value":"Screen 3","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":22,"value":"\"Player Screen Disconnected\"","children":[{"start":23,"value":"Player Screen Disconnected","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":46,"gherkinStepLine":42,"keywordType":"Outcome","textWithKeyword":"And \"Screen 3\" is permanently removed from the Admin Interface list","stepMatchArguments":[{"group":{"start":0,"value":"\"Screen 3\"","children":[{"start":1,"value":"Screen 3","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":49,"pickleLine":44,"tags":["@player-screen","@core-feature"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the KJ has a session running on the local server","isBg":true,"stepMatchArguments":[]},{"pwStepLine":50,"gherkinStepLine":45,"keywordType":"Context","textWithKeyword":"Given the KJ has permanently disconnected \"Screen 3\"","stepMatchArguments":[{"group":{"start":36,"value":"\"Screen 3\"","children":[{"start":37,"value":"Screen 3","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":51,"gherkinStepLine":46,"keywordType":"Action","textWithKeyword":"When the device that was \"Screen 3\" restarts and connects to the server","stepMatchArguments":[{"group":{"start":20,"value":"\"Screen 3\"","children":[{"start":21,"value":"Screen 3","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":52,"gherkinStepLine":47,"keywordType":"Outcome","textWithKeyword":"Then it should be treated as a new screen","stepMatchArguments":[]},{"pwStepLine":53,"gherkinStepLine":48,"keywordType":"Outcome","textWithKeyword":"And appear in the Admin Interface as \"Screen 4\" with default settings","stepMatchArguments":[{"group":{"start":33,"value":"\"Screen 4\"","children":[{"start":34,"value":"Screen 4","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end