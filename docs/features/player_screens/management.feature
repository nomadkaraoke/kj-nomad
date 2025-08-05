@skip
@player-screen @core-feature
Feature: Player Screen Management
  As a Karaoke Jockey (KJ)
  I want to seamlessly connect and configure my player screens
  So that I can manage the visual experience for my singers and the audience.

  Background:
    Given the KJ has a session running on the local server

  Scenario: A new player screen connects automatically
    Given a player device is on the same local network as the KJ server
    When the player device launches the KJ-Nomad application in player mode
    Then it should automatically discover and connect to the KJ server
    And the new player screen should appear in the "Player Screens" list in the KJ Admin Interface

  Scenario: Player screen launches before the server is ready
    Given a player device is on the same local network as the KJ server
    When the player device launches in player mode before the KJ server is running
    Then the player screen should display a "Searching for server..." message
    And when the KJ server starts up
    Then the player screen should automatically connect without user intervention

  Scenario: KJ identifies a specific player screen
    Given three player screens are connected to the server
    When the KJ clicks the "Identify" button for "Screen 2" in the Admin Interface
    Then a large overlay with the text "Screen 2" should appear on the corresponding physical screen
    And the overlay should disappear automatically after 5 seconds

  Scenario: Player screen temporarily disconnects and reconnects
    Given a player screen named "Screen 1" is connected with the ticker turned off
    When "Screen 1" loses its network connection for 15 seconds
    Then the Admin Interface should show "Screen 1" as "Disconnected"
    And when "Screen 1" reconnects to the network
    Then it should reappear in the Admin Interface as "Screen 1"
    And its ticker configuration should still be turned off

  Scenario: KJ permanently removes a player screen
    Given a player screen named "Screen 3" is connected
    When the KJ clicks the "Disconnect" button for "Screen 3"
    Then a signal is sent to "Screen 3" to shut down
    And "Screen 3" displays a "Player Screen Disconnected" message
    And "Screen 3" is permanently removed from the Admin Interface list

  Scenario: A forgotten player screen tries to reconnect
    Given the KJ has permanently disconnected "Screen 3"
    When the device that was "Screen 3" restarts and connects to the server
    Then it should be treated as a new screen
    And appear in the Admin Interface as "Screen 4" with default settings
