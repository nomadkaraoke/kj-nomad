@skip
@session @online
Feature: Online Session Management
  As a Karaoke Jockey (KJ)
  I want to manage a cloud-coordinated online session
  So that singers can request songs from their phones and I can manage the show from a web browser.

  Background:
    Given the KJ has a KJ-Nomad account

  Scenario: KJ creates a new online session
    Given the KJ is on the kj.nomadkaraoke.com website
    When the KJ creates a new session with venue name "The Local Pub"
    Then the system should generate a 4-digit Session ID
    And a private Admin Key
    And the KJ should be redirected to the web-based Admin Interface for the new session

  Scenario: KJ connects the local server to the online session
    Given a KJ has an active online session with a valid Session ID and Admin Key
    And the KJ-Nomad application is running on their local server
    When the KJ connects the local server using the Session ID and Admin Key
    Then the local server should establish a WebSocket connection to the cloud relay
    And the web-based Admin Interface should show the local server as "Connected"

  Scenario: Session expires after a period of inactivity
    Given an online session has been active
    When 24 hours pass with no activity
    Then the session should be automatically terminated
    And the Session ID should no longer be valid

  Scenario: KJ's local server disconnects and reconnects
    Given a KJ is running an online session with a connected local server
    And there are active player screens and singers connected
    When the KJ's local server loses its internet connection
    Then the player and singer apps should display a "KJ has disconnected, please wait" message
    And when the KJ's local server reconnects to the cloud relay
    Then the player and singer apps should automatically resume normal operation
