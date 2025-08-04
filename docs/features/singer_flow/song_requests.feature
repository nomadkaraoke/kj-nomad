@singer-flow @online
Feature: Singer Song Request Flow
  As a singer at a karaoke venue
  I want to easily find and request songs from my phone
  So that I can participate in the show without leaving my seat.

  Background:
    Given the KJ is running an online session with ID "1234"
    And the session allows requests from the local library and YouTube

  Scenario: Singer joins a session and requests a song from the local library
    Given a singer navigates to sing.nomadkaraoke.com
    When the singer enters the session ID "1234"
    And searches for the song "Bohemian Rhapsody"
    And selects it from the search results
    And enters their name as "Freddie"
    And submits the request
    Then "Freddie" should be added to the singer queue with "Bohemian Rhapsody"
    And the singer's phone should show their position in the queue

  Scenario: Singer requests a song from YouTube
    Given a singer named "Freddie" is in an online session
    When "Freddie" searches for a song that is only on YouTube
    And selects the YouTube result
    And submits the request
    Then the song should be added to the KJ's queue
    And the singer's UI should confirm the request was successful without indicating a download is in progress

  Scenario: Singer manages their personal song queue
    Given a singer named "Freddie" has already requested "Don't Stop Me Now"
    When "Freddie" requests a second song, "Somebody to Love"
    Then "Somebody to Love" should be added to Freddie's personal queue
    And when "Freddie" views their queue
    Then they should see both songs listed
    And they should have an option to remove "Somebody to Love"

  Scenario: Singer removes a song from their queue
    Given a singer named "Freddie" has "Don't Stop Me Now" in the main rotation and "Somebody to Love" in their personal queue
    When "Freddie" chooses to remove "Somebody to Love" from their queue
    Then "Somebody to Love" should be removed from their personal list
    And it should not be added to the main rotation

  Scenario: Singer's ability to change song is locked when they are next
    Given a singer named "Freddie" is next up in the rotation with the song "Bohemian Rhapsody"
    When "Freddie" views their queue on their phone
    Then the option to change or remove "Bohemian Rhapsody" should be disabled
