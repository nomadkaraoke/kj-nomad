@session @offline
Feature: Offline Session Management
  As a Karaoke Jockey (KJ)
  I want to run a fully offline karaoke session
  So that I can host an event without relying on an internet connection.

  Background:
    Given the KJ-Nomad application is installed

  Scenario: First-time launch and setup wizard
    Given the KJ launches the application for the first time
    When the KJ completes the setup wizard by selecting a valid media library
    Then the application should start the local server
    And the main window should display the KJ Admin Interface
    And the Admin Interface should show the local IP address for player screens to connect to

  Scenario: Subsequent launch after setup
    Given the KJ has completed the setup wizard once before
    When the KJ launches the application
    Then the application should bypass the setup wizard
    And go directly to the KJ Admin Interface

  Scenario: KJ manually rescans the media library
    Given the KJ is on the Admin Interface
    And new songs have been added to the media folder on the filesystem
    When the KJ navigates to the Settings page
    And chooses the allowed file extensions for scanning
    And clicks the "Rescan Library" button
    Then the system should find and index the new songs
    And the new songs should be available in the song search

  Scenario: KJ changes the media library path
    Given the KJ is on the Admin Interface
    When the KJ navigates to the Settings page
    And selects a new, valid media library path
    And sets extensions to ".mp4,.mkv,.webm"
    Then the system should scan the new directory
    And the song search should now use the new library

  Scenario: KJ loads media library from cached index
    Given a large media library has previously been scanned and saved as an index file
    When the KJ enables "Use cached index when available" in Settings
    And opens the Admin Interface later
    Then the media library should load from the cached index without rescanning
