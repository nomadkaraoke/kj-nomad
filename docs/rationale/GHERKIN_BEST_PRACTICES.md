Here is a guide on how to structure your feature files, along with several best-practice examples and explanations of the principles behind them.

### How to Structure Your Feature Files

The most effective way to organize your `.feature` files is to mirror the functionality of your application. This is often called a "functional hierarchy".[1] Instead of organizing by user story or development sprint, you group files by the domain area or capability they describe. This makes the documentation intuitive to navigate and reflects how a user thinks about the product, not how it was built.[1]

For your karaoke project, a logical structure inside `/docs/features/` might look like this:

```
/docs/features/
├── authentication/
│   ├── login.feature
│   └── registration.feature
│
├── song_management/
│   ├── search_songs.feature
│   └── song_queue.feature
│
├── user_profile/
│   ├── manage_profile.feature
│   └── view_history.feature
│
└── karaoke_session/
    ├── start_session.feature
    └── manage_singers.feature
```

This approach keeps related behaviors together, making it easy to find the specification for any given part of the application.[2, 3]

### Writing Best-Practice Gherkin Files

The goal of Gherkin is to be clear, concise, and collaborative.[4] A well-written feature file should be easily understood by developers, testers, and non-technical stakeholders alike. The following principles are key to achieving this.

  * **Write Declaratively, Not Imperatively:** This is the most important principle. Your scenarios should describe *what* the user wants to achieve, not *how* they do it (e.g., which buttons they click).[5] This makes your specifications resilient to UI changes and focuses on the business value.[5, 6]
  * **One Scenario, One Behavior:** Each scenario should test a single, independent behavior or business rule.[3, 7] This makes scenarios easier to understand and ensures that a test failure points to a specific problem.[7]
  * **Use the Narrative:** Every feature file should begin with a `Feature` keyword and a short narrative that explains the business value in the format: `As a [persona], I want [feature], so that [benefit]`.[8]
  * **Use `Background` for Common Preconditions:** If multiple scenarios in the same file share the exact same setup steps (the `Given` steps), you can move them into a `Background` section to avoid repetition.[9, 10] Keep the `Background` short and relevant to what a reader needs to know.[11]
  * **Keep Scenarios and Steps Concise:** Aim for fewer than 10 steps per scenario and keep each step to a single, readable line.[12] This maintains clarity and focus.

-----

### Best-Practice Examples in Action

Here are three examples of `.feature` files that demonstrate these principles.

#### Example 1: User Authentication (with `Background`)

This example covers a core function (logging in) and uses a `Background` to set up the common precondition for both the success and failure scenarios.

`docs/features/authentication/login.feature`

```gherkin
# This comment explains the purpose of the file for other developers.
# It uses the recommended two-space indentation. [11]
@authentication @smoke-test
Feature: User Login
  As a registered user
  I want to log in to my account
  So that I can access my personalized content

  Background:
    Given a registered user named "Patty" exists with the password "validPassword123"
    And the user is on the login page

  Scenario: User logs in with valid credentials
    When "Patty" provides her valid credentials
    Then she should be logged in successfully
    And she should see her personalized dashboard

  Scenario: User attempts to log in with an invalid password
    When "Patty" provides an invalid password
    Then she should see an "Invalid password" error message
    And she should remain on the login page
```

**Why this is a good example:**

  * **Declarative Style:** The step `When "Patty" provides her valid credentials` describes the user's intent, not the implementation details like "fills in the username field" and "clicks the login button".[5] If the login method changes (e.g., to use a fingerprint), this feature file remains valid.
  * **Effective `Background`:** The two `Given` steps are identical for both scenarios. Placing them in a `Background` makes the feature file cleaner and easier to read.[9, 10]
  * **Clear Narrative and Titles:** The `Feature` block clearly states the business value, and each `Scenario` title describes a specific, singular behavior.[8, 13]
  * **Use of Tags:** The `@authentication` and `@smoke-test` tags allow for organizing and filtering test runs (e.g., running only the smoke tests).[3]

-----

#### Example 2: Song Search (with `Scenario Outline`)

This example shows how to test a feature with multiple data variations without writing repetitive scenarios. The `Scenario Outline` acts as a template, and the `Examples` table provides the data.

`docs/features/song_management/search_songs.feature`

```gherkin
@search @core-feature
Feature: Song Search
  As a user
  I want to search for songs in the catalog
  So that I can find a song to sing

  Scenario Outline: Search for songs by artist
    Given the song catalog contains songs by various artists
    When a user searches for the artist "<artist_name>"
    Then the search results should include "<song_title>"

    Examples:

| artist_name | song_title |
| "Queen" | "Bohemian Rhapsody" |
| "The Beatles" | "Hey Jude" |
| "Led Zeppelin" | "Stairway to Heaven" |

  Scenario: Search for a non-existent song
    Given the song catalog is available
    When a user searches for a song that does not exist
    Then they should see a "No results found" message
```

**Why this is a good example:**

  * **Efficient Data-Driven Testing:** The `Scenario Outline` avoids duplicating the same test logic for three different artists. This makes the feature file concise and easy to maintain.[14]
  * **Focus on a Single Behavior:** The outline focuses on one behavior (searching by artist), while a separate `Scenario` handles a different behavior (handling no results). This follows the "one scenario, one behavior" rule.[7]
  * **Concrete Examples:** The `Examples` table uses specific, concrete values, which makes the expected behavior unambiguous for everyone on the team.[3]

-----

#### Example 3: API Endpoint (CRUD Operations)

Gherkin is also excellent for defining the behavior of APIs. This example specifies the contract for creating and retrieving an entity via a REST API.

`docs/features/song_management/song_queue_api.feature`

```gherkin
@api @song-queue
Feature: Song Queue Management API
  As a client application
  I want to manage the song queue via the API
  So that I can integrate karaoke session management

  Background:
    Given the client is authenticated with the API

  Scenario: Add a song to the queue
    Given the song "Bohemian Rhapsody" exists in the catalog
    When the client sends a POST request to "/api/queue" with the song ID
    Then the response status code should be "201"
    And the response body should contain the queued song details

  Scenario: Attempt to add a non-existent song to the queue
    When the client sends a POST request to "/api/queue" with a non-existent song ID
    Then the response status code should be "404"
    And the response body should contain a "Song not found" error
```

**Why this is a good example:**

  * **Clear API Contract:** The scenarios explicitly define the expected HTTP status codes and response content for both success and failure cases. This serves as executable documentation for the API's contract.[13]
  * **Implementation Agnostic:** The steps describe API interactions (e.g., `sends a POST request`) without mentioning the underlying server technology (e.g., Node.js, Python, Java). This keeps the focus on the behavior.[5]
  * **Defines the Actor:** The narrative clearly identifies the "client application" as the actor, which is appropriate for an API feature.[13]

By following these structuring principles and writing styles, your Gherkin files will become a robust and reliable source of truth for your entire team.