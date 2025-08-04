@kj-admin @youtube @online
Feature: KJ YouTube Download Management
  As a Karaoke Jockey (KJ)
  I want to manage on-demand YouTube downloads
  So that I can provide a seamless experience even with songs from the internet.

  Background:
    Given the KJ is running an online session with YouTube integration enabled

  Scenario: KJ views the download progress of a YouTube song
    Given a singer has requested a song from YouTube
    And the local server has started downloading it
    When the KJ views the song in the Admin Interface queue
    Then the song entry should display a real-time download progress indicator (e.g., "Downloading... 45%")

  Scenario: A YouTube download fails
    Given a requested YouTube song is currently downloading
    When the download fails due to a network error or unavailable video
    Then the song entry in the Admin Interface should show a "Download Failed" status
    And the KJ should have an option to retry the download
    And the singer should be notified on their device that there was an issue with their request
