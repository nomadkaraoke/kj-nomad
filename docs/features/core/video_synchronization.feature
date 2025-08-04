@core @video-sync
Feature: Perfect Video Synchronization
  As a Karaoke Jockey (KJ)
  I need all player screens to display the same video content in perfect synchronization
  So that the experience is professional for both the singer and the audience.

  Background:
    Given the KJ is running a session
    And two player screens, "Player 1" and "Player 2", are connected

  Scenario: Player screens start and play in sync
    Given a karaoke video is ready to be played
    When the KJ starts the video playback
    Then the video should begin playing simultaneously on both "Player 1" and "Player 2"
    And at any point during playback, the `currentTime` of the video on "Player 1" should not differ from "Player 2" by more than 100 milliseconds

  Scenario: Player screens seek in sync
    Given a karaoke video is currently playing on both screens
    When the KJ seeks the video to the 1 minute and 30 second mark
    Then both "Player 1" and "Player 2" should jump to the new timestamp
    And resume playing in sync, with a time difference of less than 100 milliseconds

  Scenario: Player screens pause and resume in sync
    Given a karaoke video is currently playing on both screens
    When the KJ pauses the video
    Then both "Player 1" and "Player 2" should pause at the exact same frame
    And when the KJ resumes the video
    Then both players should resume playback simultaneously
