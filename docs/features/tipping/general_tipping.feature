@tipping @monetization
Feature: General Tipping and Gated Features
  As a KJ, I want to offer tipping features to increase my earnings.
  As a singer, I want to be able to tip the KJ and get recognized for it.

  Background:
    Given the KJ is running an online session with tipping enabled
    And the minimum tip for a "Love Heart" is $2.00
    And the KJ has configured "YouTube Access" as a gated feature for tippers only

  Scenario: Singer tips while making a song request
    Given a singer is requesting the song "Like a Rolling Stone"
    When the singer chooses to add a $5.00 tip during the request process
    Then the tip should be processed successfully
    And a "Love Heart" icon should be displayed next to the singer's name in the queue

  Scenario: Singer tips without making a request
    Given a singer is viewing the main singer interface
    When the singer uses the "Tip the KJ" feature to send a $10.00 tip
    Then the tip should be processed successfully
    And the KJ should see the tip in their admin dashboard's tipping breakdown

  Scenario: Singer's tip is below the threshold for a "Love Heart"
    Given a singer is making a song request
    When the singer adds a $1.00 tip
    Then the tip should be processed successfully
    But a "Love Heart" icon should not be displayed next to the singer's name

  Scenario: A non-tipping singer tries to access a gated feature
    Given a singer has not tipped during the session
    When the singer attempts to request a song from YouTube
    Then the UI should inform them that YouTube requests are for tippers only
    And prompt them to add a tip to unlock the feature

  Scenario: A tipping singer accesses a gated feature
    Given a singer has previously tipped $5.00 in the session
    When the singer searches for a song on YouTube
    Then they should be able to successfully request the YouTube song
