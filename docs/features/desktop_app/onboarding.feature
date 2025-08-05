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
    Then the application should display a "Searching for KJ-Nomad server on your network..." screen
    And it should scan the local network for servers on ports 8080-8090

  Scenario: Player successfully discovers a single server
    Given the application is searching for a server
    And a KJ-Nomad server is running on the local network at 192.168.1.100:8080
    When the application detects the server
    Then it should automatically connect to the server's player interface at "http://192.168.1.100:8080/player"
    And display the player screen content

  Scenario: Player does not discover a server and uses manual entry
    Given the application is searching for a server
    And no KJ-Nomad servers are running on the local network
    When the search times out
    Then the application should display a "No server found" message
    And provide a button to "Retry Auto-Scan"
    And provide an input field to manually enter a server address
    When the user enters "192.168.1.100:8080" into the manual entry field
    And clicks "Connect"
    Then the application should attempt to connect to "http://192.168.1.100:8080/player"

  Scenario: Player discovers multiple servers
    Given the application is searching for a server
    And two KJ-Nomad servers are running on the local network
    When the application detects both servers
    Then it should display a list of discovered servers (e.g., "KJ-Nomad at 192.168.1.100:8080", "KJ-Nomad at 192.168.1.101:8081")
    And prompt the user to select which one to connect to
