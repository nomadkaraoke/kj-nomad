@website @onboarding
Feature: Website Landing Page and Mode Selection
  As a new or returning Karaoke Jockey (KJ)
  I want to understand the product and choose my desired session mode from the website
  So that I can get started with hosting my event.

  Scenario: KJ visits the landing page and chooses to host an Offline session
    Given a KJ navigates to https://kj.nomadkaraoke.com
    When the KJ clicks the "Download Offline App" button
    Then a download of the appropriate KJ-Nomad desktop application installer should begin

  Scenario: KJ visits the landing page and chooses to host an Online session
    Given a KJ navigates to https://kj.nomadkaraoke.com
    When the KJ clicks the "Host Online Session" button
    Then the KJ should be taken to the online session creation page
    And they should be prompted to enter their KJ Name and Venue Name
