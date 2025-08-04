@core @audio-controls @future
Feature: Advanced Audio Controls
  As a Karaoke Jockey (KJ)
  I want to adjust the key and tempo of karaoke tracks
  So that I can better accommodate the vocal range and style of each singer.

  Background:
    Given the KJ is on the Admin Interface
    And a song is currently playing

  Scenario: KJ adjusts the key of the current song
    Given the song is playing at its original key (0)
    When the KJ increases the key by 2 semitones
    Then the pitch of the audio playback should be raised by 2 semitones without changing the speed
    And the player screen should display a small indicator, e.g., "Key: +2"

  Scenario: KJ adjusts the tempo of the current song
    Given the song is playing at its original tempo (100%)
    When the KJ decreases the tempo by 10%
    Then the speed of the audio and video playback should be reduced to 90% of the original without changing the pitch
    And the player screen should display a small indicator, e.g., "Tempo: 90%"

  Scenario: KJ resets audio adjustments
    Given a song is playing with Key: +2 and Tempo: 90%
    When the KJ clicks the "Reset Audio" button
    Then the key should return to 0
    And the tempo should return to 100%
    And the on-screen indicators should disappear
