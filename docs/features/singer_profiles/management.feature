@skip
@singer-profiles
Feature: Singer Profile Management
  As a Karaoke Jockey (KJ)
  I want to be able to see a singer's history
  So that I can personalize the experience and manage my regulars.

  Background:
    Given the KJ is running a session
    And a singer named "Regular Rita" has sung at previous events

  Scenario: KJ views a singer's song history
    Given "Regular Rita" is in the current queue
    When the KJ views the details for "Regular Rita"
    Then the KJ should be able to see a list of songs "Regular Rita" has sung in the past
    And the date each song was sung

  Scenario: A singer's performance is added to their history
    Given "Regular Rita" is about to sing "Dancing Queen"
    When "Regular Rita" finishes her performance
    Then the song "Dancing Queen" should be added to her permanent song history
