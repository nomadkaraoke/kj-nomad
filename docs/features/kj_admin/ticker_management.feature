@kj-admin @ticker
Feature: Scrolling Ticker Management
  As a Karaoke Jockey (KJ)
  I want to update the text of the scrolling ticker on the player screens
  So that I can display announcements or the list of upcoming singers.

  Background:
    Given the KJ is on the Admin Interface
    And at least one player screen is connected

  Scenario: KJ updates the ticker with static text
    Given the ticker text is currently empty
    When the KJ enters "Welcome to Karaoke Night!" into the ticker input
    And clicks "Update Ticker"
    Then the scrolling ticker on all connected player screens should display "Welcome to Karaoke Night!"

  Scenario: KJ updates the ticker with dynamic variables
    Given the next three singers in the rotation are "Alice", "Bob", and "Charlie"
    And the session's tipping URL is "https://tips.kjnomad.com/1234"
    When the KJ composes a ticker message using the template: "Next up: $ROTATION_NEXT_3 | Please tip your KJ! $TIP_URL"
    And saves the new ticker configuration
    Then the text displayed on the player screen tickers should be "Next up: Alice, Bob, Charlie | Please tip your KJ! https://tips.kjnomad.com/1234"

  Scenario: KJ clears the ticker text
    Given the ticker is displaying a message
    When the KJ clears the text from the ticker input
    And clicks "Update Ticker"
    Then the scrolling ticker on all player screens should become empty and stop scrolling
