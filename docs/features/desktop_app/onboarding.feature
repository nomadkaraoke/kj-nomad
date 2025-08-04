@desktop-app @onboarding
Feature: Desktop Application Onboarding and Setup
  As a Karaoke Jockey (KJ) using the desktop app for the first time
  I want a clear and guided setup process
  So that I can configure the application correctly for my chosen mode.

  Background:
    Given the KJ has downloaded and installed the KJ-Nomad desktop application

  Scenario: KJ launches the app and chooses to start an Offline Session
    Given the KJ launches the application for the first time
    Then they should see the "Welcome to KJ-Nomad" screen with three choices: "Start Offline Session", "Connect to Online Session", and "Set up as Player"
    When the KJ clicks "Start Offline Session"
    Then they should be taken to the multi-step Setup Wizard to configure their media library

  Scenario: KJ launches the app and chooses to connect to an Online Session
    Given the KJ launches the application for the first time
    When the KJ clicks "Connect to Online Session"
    Then they should be prompted to enter their private Admin Key

  Scenario: KJ launches the app and chooses to set it up as a Player
    Given the KJ launches the application for the first time
    When the KJ clicks "Set up as Player"
    Then the application should enter Player Mode
    And begin searching for a KJ server on the local network
