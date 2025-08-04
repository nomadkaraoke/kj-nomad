@tipping @monetization
Feature: Tip Prize Raffle
  As a KJ, I want to run a prize raffle for tippers
  So that I can gamify the experience and encourage more tips.

  Background:
    Given the KJ is running an online session with the "Tip Prize Raffle" enabled
    And the KJ has set the prize as "A $10 Bar Voucher"
    And three singers, "Alice", "Bob", and "Charlie", have tipped during the session

  Scenario: KJ draws the raffle winner
    Given the KJ is on the Admin Interface
    When the KJ clicks the "Draw Raffle" button
    Then a winner should be randomly selected from the list of tippers
    And a prominent overlay should be displayed on all player screens announcing the winner
    # For example: "Congratulations! Alice has won A $10 Bar Voucher!"

  Scenario: KJ re-draws the raffle if the winner is absent
    Given the KJ has just drawn "Charlie" as the winner
    And the KJ determines that "Charlie" has already left the venue
    When the KJ clicks the "Draw Raffle Again" button
    Then a new winner should be randomly selected from the remaining tippers ("Alice", "Bob")
    And the winner announcement overlay should be updated with the new winner's name
