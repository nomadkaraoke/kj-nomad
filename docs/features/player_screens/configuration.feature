@player-screen @configuration
Feature: Player Screen Configuration
  As a Karaoke Jockey (KJ)
  I want to configure the content displayed on each player screen individually
  So that I can tailor the visual output for different purposes (e.g., singer view vs. audience view).

  Background:
    Given the KJ has a session running
    And a player screen named "Screen 1" is connected

  @skip
  Scenario: New player screen has default settings
    When a new player screen connects to the server
    Then its audio output should be enabled by default
    And its ticker bar should be enabled by default
    And its full-height sidebar should be disabled by default
    And its video player should be visible by default

  @skip
  Scenario: KJ mutes and unmutes a player screen's audio
    Given the audio on "Screen 1" is enabled
    When the KJ toggles the audio setting for "Screen 1"
    Then the audio output on "Screen 1" should be muted
    And when the KJ toggles the audio setting for "Screen 1" again
    Then the audio output on "Screen 1" should be unmuted

  @skip
  Scenario: KJ toggles the ticker bar
    Given the ticker bar on "Screen 1" is enabled
    When the KJ toggles the ticker setting for "Screen 1"
    Then the ticker bar should be hidden on "Screen 1"
    And when the KJ toggles the ticker setting for "Screen 1" again
    Then the ticker bar should be visible on "Screen 1"

  @skip
  Scenario: KJ toggles the full-height sidebar
    Given the sidebar on "Screen 1" is disabled
    When the KJ toggles the sidebar setting for "Screen 1"
    Then the sidebar showing the singer rotation should be visible on "Screen 1"
    And the main video player area should be resized to accommodate the sidebar
    And when the KJ toggles the sidebar setting for "Screen 1" again
    Then the sidebar should be hidden on "Screen 1"

  @skip
  Scenario: KJ sets a screen to be an information-only display
    Given "Screen 1" is displaying the karaoke video
    When the KJ disables the video player for "Screen 1"
    Then the video player on "Screen 1" should be hidden
    And the screen should only display informational components like the sidebar and ticker

  Scenario: Toggle debug overlay for all players from Player Screens
    Given at least one player screen is connected
    And the debug overlay is currently hidden on all screens
    When the KJ toggles the global debug overlay in the Player Screens section
    Then the debug overlay should be visible on all connected player screens
    When the KJ toggles the global debug overlay again
    Then the debug overlay should be hidden on all connected player screens
