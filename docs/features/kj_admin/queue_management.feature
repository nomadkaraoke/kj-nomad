@skip
@kj-admin @queue
Feature: KJ Queue Management
  As a Karaoke Jockey (KJ)
  I want to efficiently manage the singer queue
  So that I can run a smooth and organized show.

  Background:
    Given the KJ is logged into the Admin Interface

  Scenario: KJ adds a singer request from a paper slip (Offline Mode)
    Given the KJ is running an offline session
    And the KJ receives a paper slip with "Frank" and "My Way"
    When the KJ uses the "Add Singer" form and enters "Frank" and searches for "My Way"
    And selects the correct song from the local library
    Then "Frank" with the song "My Way" should be added to the bottom of the queue

  Scenario: KJ reorders the queue using drag-and-drop
    Given the singer queue is: 1. Alice, 2. Bob, 3. Charlie, 4. Diana
    When the KJ drags "Charlie" from position 3 and drops them at position 1
    Then the singer queue should be updated to: 1. Charlie, 2. Alice, 3. Bob, 4. Diana
    And all connected clients should see the updated queue order in real-time

  Scenario: KJ removes a singer from the queue
    Given the singer queue includes "Bob" at position 2
    When the KJ removes "Bob" from the queue
    Then "Bob" should no longer be in the queue
    And the queue order should be updated for all subsequent singers

  Scenario: KJ sees a visual distinction for YouTube songs in the queue (Online Mode)
    Given the KJ is running an online session
    And a singer has requested "Never Gonna Give You Up" from YouTube
    When the KJ views the singer queue
    Then the entry for "Never Gonna Give You Up" should have a YouTube icon next to it
