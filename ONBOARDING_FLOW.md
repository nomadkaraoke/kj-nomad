# KJ-Nomad: User Onboarding Flow

This document outlines the intended user journey for a Karaoke Jockey (KJ) setting up and running a karaoke session in both Offline and Online modes. This flow is designed to be intuitive, secure, and aligned with the project's architecture.

## 1. The Core Problem This Solves

Currently, the user journey is broken. The landing page incorrectly prompts a download for "Online Mode," and the application launches into a test screen. This document defines the correct, intended flow.

---

## 2. Offline Mode Onboarding

The Offline Mode is designed for simplicity and reliability in environments without stable internet. The entire experience is self-contained within the KJ-Nomad desktop application.

**Target:** A KJ who has downloaded the `KJ-Nomad-Setup.exe` (Windows), `KJ-Nomad.dmg` (Mac), or `.AppImage` (Linux) installer.

### Step 1: First-Time Launch & Setup Wizard

1.  The KJ launches the installed KJ-Nomad application for the first time.
2.  A **Setup Wizard** appears, guiding the KJ through the initial configuration.
3.  **Screen 1: Welcome**
    *   A brief welcome message explaining that the wizard will help set up the local media library.
4.  **Screen 2: Media Library Selection**
    *   The KJ is prompted to select the folder on their computer that contains their karaoke video files (e.g., `C:\Users\KJ\Music\Karaoke`).
    *   The application validates the selected directory, ensuring it exists and contains valid media files.
5.  **Screen 3: Library Scan & Indexing**
    *   The application scans the directory, parsing filenames to identify artist and title.
    *   A progress bar shows the scanning process.
    *   Upon completion, a summary is displayed: "✅ Success! Found 5,432 songs in your library."
6.  **Screen 4: Setup Complete**
    *   The wizard confirms that the setup is complete.
    *   It informs the KJ that the local server is starting.

### Step 2: Launching the Admin Interface

1.  After the wizard closes, the main application window transitions to the **KJ Admin Interface**. This is the primary control panel for the show.
2.  A prominent, non-dismissible notification displays the local network information required for connecting player screens:
    > **Connect Your Player Screens**
    >
    > On your TV or projector's web browser, navigate to:
    >
    > ### `http://192.168.1.105:8080/player`

### Step 3: Running the Show

1.  **Player Connection:** The KJ connects their display screens (TVs, projectors) by navigating their browsers to the provided URL. The screens automatically connect to the local server.
2.  **Manual Request Entry:** The KJ takes song requests from singers via paper slips or verbally.
3.  **Queue Management:** Using the Admin Interface on their laptop, the KJ searches for the requested songs in the library and adds them to the queue.
4.  **Show Control:** The KJ manages the entire show—playing songs, managing the singer rotation, and sending messages to the ticker—from their laptop.

---

## 3. Online Mode Onboarding

The Online Mode leverages the cloud for a modern, interactive experience where singers can request songs from their phones. The journey begins on the web.

### Step 1: Session Creation (Web-Based)

1.  The KJ navigates to `https://kj.nomadkaraoke.com`.
2.  The KJ clicks the **"Host an Online Session"** button.
    *   *Correction: This button should NOT trigger an application download.*
3.  The KJ is taken to a session creation page on the website.
4.  The KJ enters basic session details:
    *   **KJ Name:** (e.g., "DJ Jazzy Jeff")
    *   **Venue Name:** (e.g., "The Local Pub")
5.  The KJ configures the session rules:
    *   [✓] Allow song requests from local library
    *   [✓] Allow song requests from YouTube
    *   (Optional) Configure tipping features as defined in `MONETIZATION.md`.
6.  The KJ clicks **"Create Session"**.
7.  The website communicates with the Cloudflare backend, which generates:
    *   A public, 4-digit **Session ID** (e.g., `1234`).
    *   A private, secure **Admin Key** (e.g., `kj-admin-aBcDeFgHiJkLmNoP`).
8.  The page updates to a "Session Live" dashboard, displaying both keys.

    > **Your Session is Live!**
    >
    > **Session ID:** `1234` (Share this with your singers and for player screens)
    >
    > **Admin Key:** `kj-admin-aBcDeFgHiJkLmNoP` (Keep this secret! Needed for your local server.)
    >
    > ---
    >
    > **Next Step:** Download and run the KJ-Nomad Local Server app to connect your media.

### Step 2: Connecting the Local Server (Desktop App)

1.  The KJ downloads and installs the KJ-Nomad desktop application if they haven't already.
2.  The KJ launches the app. A startup screen asks:
    *   [ Start an Offline Session ]
    *   [ Connect to an Online Session ]
3.  The KJ selects **"Connect to an Online Session"**.
4.  The app prompts for the credentials from the website:
    *   **Enter Session ID:** `1234`
    *   **Enter Admin Key:** `kj-admin-aBcDeFgHiJkLmNoP`
5.  If the KJ enabled "local library" access, the app runs the same **Setup Wizard** from the offline flow to select and scan their media folder. If not, this step is skipped.
6.  The app starts its local server and uses the credentials to establish a persistent WebSocket connection to the Cloudflare relay for that session. It is now successfully bridged to the cloud.

### Step 3: Running the Show (Web & App)

1.  **KJ Admin Control (Web):**
    *   The KJ manages the entire show from the web-based admin interface, which is now active at a URL like `https://kj.nomadkaraoke.com/admin/1234`.
    *   Access to this admin page is secured by the **Admin Key**, which would be stored in the KJ's browser session.
2.  **Singer Access (Web):**
    *   Singers navigate to `https://sing.nomadkaraoke.com`.
    *   They are prompted to enter the 4-digit **Session ID** (`1234`).
    *   Once entered, they can search the available song library (local + YouTube) and submit requests.
3.  **Player Screen Access (Web):**
    *   The KJ navigates their display screens' browsers to `https://kj.nomadkaraoke.com/player`.
    *   The player page prompts for the 4-digit **Session ID** (`1234`).
    *   Once entered, the player connects to the session via the Cloudflare relay and is ready to display video and ticker information.

This hybrid flow correctly utilizes the web for coordination and the local app for its specific purpose: serving local files and processing downloads, fulfilling the vision laid out in the architecture documents.
