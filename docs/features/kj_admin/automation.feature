@kj-admin @automation
Feature: KJ Automation Engine
  As a Karaoke Jockey (KJ)
  I want the system to automate repetitive tasks
  So that I can focus on hosting and engaging with the crowd.

  Background:
    Given the KJ is running a session with automation features enabled
    And the singer queue is: 1. Alice, 2. Bob, 3. Charlie
    And the KJ knows they can adjust media and filler settings from the Settings page

  Scenario: Automated singer rotation
    Given "Alice" is currently singing
    When "Alice's" song finishes playing
    Then the system should automatically start playing the next song in the queue for "Bob"
    And "Alice" should be moved to the bottom of the rotation
    And the new queue order should be: 1. Bob, 2. Charlie, 3. Alice

  Scenario: Automated filler music between singers
    Given the song queue is empty
    And the filler music playlist is enabled
    When the last singer's song finishes
    Then the system should automatically start playing a track from the filler music library
    And the player screens should display a "Up next..." message with the next scheduled singer if available

  Scenario: Filler music fades out when a new singer starts
    Given filler music is currently playing
    And the KJ manually adds a new singer, "Diana", to the now-empty queue
    When the system prepares to play "Diana's" song
    Then the filler music volume should automatically fade out
    And "Diana's" karaoke track should start playing at full volume
