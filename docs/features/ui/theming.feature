@ui @theming
Feature: UI Theme Management
  As a user
  I want to be able to switch between a light and dark theme
  So that I can use the application comfortably in different lighting conditions.

  Background:
    Given the user is in the KJ Admin Interface

  Scenario: User switches to dark mode
    Given the application is currently in light mode
    When the user toggles the theme switch
    Then the application interface should change to dark mode
    And this preference should be saved for future sessions

  Scenario: User switches back to light mode
    Given the application is currently in dark mode
    When the user toggles the theme switch
    Then the application interface should change to light mode
    And this preference should be saved
