@tipping @monetization
Feature: Tip to Skip the Queue
  As a KJ, I want to allow singers to tip for priority in the queue.
  As a singer, I want to be able to tip to sing sooner.

  Background:
    Given the KJ is running an online session
    And the "Tip to Skip" feature is enabled
    And the KJ has configured the following tiers:
      | tip_amount | spots_to_skip |
      | 5.00       | 3             |
      | 10.00      | 5             |
    And the cooldown period between skips is 2 songs
    And the per-singer skip limit is 1 per night

  Scenario: Singer tips to move up in the queue
    Given there are 10 singers in the queue
    And a singer named " impatient" is at position 8
    When "impatient" chooses to tip $5.00 to skip
    Then their position in the queue should change from 8 to 5
    And the KJ Admin Interface should reflect the new queue order

  Scenario: A singer attempts to skip beyond their limit
    Given a singer named "impatient" has already used their one skip for the night
    When "impatient" attempts to tip to skip again
    Then the UI should show a message "You have reached your skip limit for the night."
    And the tip should not be processed

  Scenario: A singer attempts to skip during the cooldown period
    Given a singer just tipped to skip in the previous turn
    And a singer named "eager" is at position 6
    When "eager" attempts to tip to skip
    Then the UI should show a message "The queue is currently on a cooldown. Please try again after the next singer."
    And the tip should not be processed
