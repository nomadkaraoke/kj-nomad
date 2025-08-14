@kj-admin @settings
Feature: KJ Settings Page
  As a Karaoke Jockey (KJ)
  I want a dedicated Settings page
  So that the main KJ Control screen stays focused and uncluttered while rarely used configuration lives in one place.

  Background:
    Given the KJ is logged into the Admin Interface

  Scenario: Navigate to Settings from header
    When the KJ clicks the "Settings" link in the header
    Then the Settings page should be displayed
    And it should contain sections for Media Library, Filler Music, YouTube Downloads, Ticker Message, and Player Screens

  Scenario: Media Library path is optional
    Given the KJ is on the Settings page
    When the KJ leaves the Media Library path empty
    Then KJ‑Nomad should still function using YouTube downloads only

  Scenario: Configure Media Library and rescan
    Given the KJ is on the Settings page
    When the KJ sets a valid Media Library folder
    And specifies allowed extensions ".mp4,.mkv,.webm"
    And clicks "Set & Rescan"
    Then the system should scan the directory and report how many songs were indexed

  Scenario: Configure Filler Music and volume
    Given the KJ is on the Settings page
    When the KJ sets a valid Filler Music folder and sets volume to 40%
    And clicks Save
    Then the filler settings should persist across restarts

  Scenario: Manage YouTube downloads
    Given the KJ is on the Settings page
    When the KJ sets the YouTube cache folder and selects a quality option
    And clicks Save
    Then new downloads should use the chosen folder and quality
    When the KJ clicks "Delete All Downloads"
    Then the YouTube cache should be cleared

  Scenario: Choose YouTube filename pattern

  Scenario: Load media library from cached index
    Given the KJ is on the Settings page
    When the KJ enables "Use cached index when available"
    And later returns to the Admin Interface
    Then the media library should load from the cached index quickly without a full rescan
    Given the KJ is on the Settings page
    When the KJ selects the filename pattern "Title (Channel).mp4"
    And clicks Save
    Then subsequent YouTube downloads should be named like "<Title> (Channel).mp4"


