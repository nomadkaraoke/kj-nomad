@skip
@singer-flow @online @qr-code
Feature: QR Code Access for Singers
  As a KJ, I want a QR code to be displayed for singers.
  As a singer, I want to scan a QR code to easily access the song request page.

  Background:
    Given the KJ is running an online session with ID "5678"

  Scenario: KJ enables the QR code display
    Given the KJ is on the Admin Interface
    When the KJ enables the "Show QR Code" option for player screens
    Then a unique QR code for the session should be displayed as an overlay on all player screens

  Scenario: Singer joins a session by scanning the QR code
    Given a QR code for session "5678" is displayed on a player screen
    When a singer scans the QR code with their mobile device
    Then their device's web browser should open directly to the singer request page for session "5678"
    And they should not need to manually enter the Session ID
