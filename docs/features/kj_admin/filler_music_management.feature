@kj-admin @filler
Feature: Filler Music Management
  As a Karaoke Jockey (KJ)
  I want to configure and control filler music from the Admin UI
  So that I can keep the room entertained between singers.

  Background:
    Given the KJ is logged into the Admin Interface
    And the KJ opens the Settings page

  Scenario: Configure filler music directory and volume
    And sets the filler directory to a valid folder
    And sets the filler volume to 60%
    And saves the settings
    Then the filler settings should persist across server restarts and page reloads

  Scenario: Upload a new filler track
    Given the filler directory is configured
    When the KJ uploads a new filler music file
    Then the file should appear in the filler track list

  Scenario: Manually play and stop a filler track
    Given at least one filler track is available
    When the KJ plays the track "Intermission Tune.mp4"
    Then player screens should start playing that filler track
    When the KJ stops the filler track
    Then player screens should stop the filler track

  Scenario: Stop filler from Settings
    Given a filler track is currently playing
    When the KJ clicks Stop in Settings
    Then player screens should stop the filler track


