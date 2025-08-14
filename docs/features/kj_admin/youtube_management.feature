@kj-admin @youtube @online
Feature: KJ YouTube Download Management
  As a Karaoke Jockey (KJ)
  I want to manage on-demand YouTube downloads
  So that I can provide a seamless experience even with songs from the internet.

  Background:
    Given the KJ is running an online session with YouTube integration enabled

  Scenario: KJ requests YouTube song from Admin UI using search
    Given the KJ is logged into the Admin Interface
    When the KJ searches YouTube for "Bloc Party Hunting for Witches"
    Then a concise list of results should be displayed as "<channel>: <title>"
    When the KJ adds the first result to the queue for "Andrew"
    Then the queue should contain a YouTube entry for "Andrew"

  Scenario: KJ requests YouTube song from Admin UI using a pasted link
    Given the KJ is logged into the Admin Interface
    When the KJ pastes the YouTube URL "https://www.youtube.com/watch?v=dQw4w9WgXcQ" and adds for "Andrew"
    Then the queue should contain a YouTube entry for "Andrew"

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

  Scenario: Configure YouTube cache directory and quality in Settings
    Given the KJ opens the Settings page
    When the KJ sets the YouTube download folder path
    And selects the quality "Auto best ≤720p (default)"
    And saves the YouTube settings
    Then subsequent downloads should use the selected folder and quality

  Scenario: Choose YouTube filename pattern
    Given the KJ opens the Settings page
    When the KJ selects the filename pattern "Title (Channel).mp4"
    And saves the YouTube settings
    Then downloaded files should be named like "Rick Astley - Never Gonna Give You Up (Karaoke Version) (Sing King).mp4"
    When the KJ changes the filename pattern to "Title - Channel.mp4" and saves
    Then subsequent downloads should be named like "Rick Astley - Never Gonna Give You Up (Karaoke Version) - Sing King.mp4"

  Scenario: Delete all downloaded YouTube videos
    Given the KJ opens the Settings page
    And there are downloaded YouTube videos in the cache
    When the KJ clicks "Delete All Downloads"
    Then the YouTube cache should be emptied
