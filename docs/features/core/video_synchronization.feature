@core @video-sync
Feature: Perfect Video Synchronization
  As a Karaoke Jockey (KJ)
  I need all player screens to display the same video content in perfect synchronization
  So that the experience is professional for both the singer and the audience.

  Background:
    Given the KJ is running a session
    And two player screens, "Player 1" and "Player 2", are connected

  @skip
  Scenario: Player screens start and play in sync
    Given a karaoke video is ready to be played
    When the KJ starts the video playback
    Then the video should begin playing simultaneously on both "Player 1" and "Player 2"
    And at any point during playback, the difference between both screens must remain below 100 milliseconds

  @skip
  Scenario: Player screens seek in sync
    Given a karaoke video is currently playing on both screens
    When the KJ seeks the video to the 1 minute and 30 second mark
    Then both "Player 1" and "Player 2" should jump to the new timestamp
    And resume playing in sync, with a time difference of less than 100 milliseconds

  @skip
  Scenario: Player screens pause and resume from the exact frame
    Given a karaoke video is currently playing on both screens
    When the KJ pauses the video
    Then both "Player 1" and "Player 2" should pause at the same frame
    And the system's playback clock must not advance while paused
    When the KJ resumes the video
    Then playback must resume from the paused timestamp on both screens within 50 milliseconds

  @skip
  Scenario: A reloaded player catches up to the current timestamp
    Given a karaoke video is currently playing and both screens are in sync
    When "Player 2" reloads and reconnects
    Then "Player 2" should begin playback at the current position within 500 milliseconds
    And the difference between both screens must drop below 100 milliseconds thereafter

  @skip
  Scenario: Automatic drift correction realigns a muted screen without affecting anchor audio
    Given a karaoke video is currently playing on two screens
    And automatic drift correction is enabled
    And the KJ has set "Player 1" as the audio anchor
    And "Player 2" is muted
    And the playback drift between the two screens exceeds 200 milliseconds
    When the system evaluates synchronization
    Then the system must not interrupt playback on "Player 1"
    And the system must realign "Player 2" to match "Player 1" within 1 second
    And the difference between both screens must return below 100 milliseconds

  @skip
  Scenario: Automatic drift correction can be disabled
    Given a karaoke video is currently playing on two screens
    And automatic drift correction is disabled
    And the playback drift between the two screens exceeds 200 milliseconds
    When the system evaluates synchronization
    Then no automatic realignment should occur
    And the drift should remain above 200 milliseconds for at least 3 seconds

  @skip
  Scenario: End of song returns players to Ready with no audio
    Given a karaoke video is currently playing on two screens
    When the song reaches the end
    Then both players should stop playback and unload the video
    And both players should display the Ready screen
    And no audio should continue playing from any screen
