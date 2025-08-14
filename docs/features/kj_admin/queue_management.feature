@kj-admin @queue
Feature: KJ Queue Management
  As a Karaoke Jockey (KJ)
  I want to efficiently manage the singer queue
  So that I can run a smooth and organized show.

  Background:
    Given the KJ is logged into the Admin Interface
  Scenario: KJ queues a YouTube song from Admin UI using pasted link
    Given the queue is empty
    When the KJ pastes a YouTube URL for singer "Andrew"
    Then the queue should contain a YouTube entry for "Andrew" in queue spec


  Scenario: KJ adds a singer request from a paper slip (Offline Mode)
    Given the KJ is running an offline session
    And the KJ receives a paper slip with "Test Singer" and "Fake Song Title"
    When the KJ uses the "Add Singer" form and enters "Test Singer" and searches for "Fake Song Title"
    And selects the correct song from the local library
    Then "Test Singer" with the song "Fake Song Title" should be added to the bottom of the queue

  Scenario: KJ reorders the queue using drag-and-drop
    Given the singer queue is: 1. "Singer A", 2. "Singer B", 3. "Singer C", 4. "Singer D"
    When the KJ drags "Singer C" from position 3 and drops them at position 1
    Then the singer queue should be updated to: 1. "Singer C", 2. "Singer A", 3. "Singer B", 4. "Singer D"
    And all connected clients should see the updated queue order in real-time

  Scenario: KJ removes a singer from the queue
    Given the singer queue includes "Singer B" at position 2
    When the KJ removes "Singer B" from the queue
    Then "Singer B" should no longer be in the queue
    And the queue order should be updated for all subsequent singers

  @skip
  Scenario: KJ sees a visual distinction for YouTube songs in the queue (Online Mode)
    Given the KJ is running an online session
    And a singer has requested "Fake YouTube Song" from YouTube
    When the KJ views the singer queue
    Then the entry for "Fake YouTube Song" should have a YouTube icon next to it
