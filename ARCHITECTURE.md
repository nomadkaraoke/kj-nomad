# KJ-Nomad: System Architecture and Implementation Plan

This document outlines the technical architecture and implementation roadmap for KJ-Nomad, an automated, offline-first karaoke hosting system. The plan is based on the "Karaoke-in-a-Box" PWA concept detailed in `INITIAL_CONTEXT.md`.

The summarised app description, essentially acting as a pitch to encourage other KJs using existing tech to try KJ-Nomad is:
"Modern, offline-first, beautiful but reliable KJ software. In online mode, can use both data from offline collection and YouTube together. Multiple screens in sync, scrolling ticker / notes, rotation tracking, tip-backed actions, etc. All of your KJ inputs and actions can be done easily from your phone, freeing you up to be a great host!"

## 1. Core Architecture: "Karaoke-in-a-Box" PWA

The system will run as a self-contained, local-network-native application. A single server application on the host's MacBook will serve a Progressive Web App (PWA) to all clients on the local network. No internet connection is required during an event.

### 1.1. Backend Server (Node.js)

The core of the system will be a Node.js application, packaged into a single, distributable executable for ease of use.

*   **Technology Stack:**
    *   **Runtime:** Node.js
    *   **Framework:** Express.js (for REST API and file serving)
    *   **Real-time Communication:** `ws` library for a high-performance WebSocket server.
    *   **Service Discovery:** `bonjour-service` (or similar) for zero-configuration network setup via mDNS/Bonjour.
    *   **Fuzzy Search:** `fuse.js` for robust searching of the song library.
    *   **Packaging:** `pkg` to create a single executable for macOS, Windows, and Linux.

*   **Responsibilities:**
    *   **Web Server:** Serve the static assets for the frontend PWA.
    *   **WebSocket Server:** Act as the real-time control plane, broadcasting state changes (playback control, queue updates) to all connected clients.
    *   **State Management:** Maintain the authoritative state for the singer queue, playback status, and filler music playlist.
    *   **Media Library:** Scan a local media directory, create a searchable song database (e.g., a JSON file or SQLite), and manage metadata.
    *   **Efficient File Serving:** Stream large video files to player clients using HTTP Range Requests to support seeking and minimize server memory usage.
    *   **Service Discovery:** Advertise its presence on the local network so clients can connect without knowing the server's IP address.

### 1.2. Frontend (React PWA)

A single Progressive Web App will serve as the interface for all users, adapting its UI based on the user's role (player, singer, or KJ).

*   **Technology Stack:**
    *   **Framework:** React (with TypeScript)
    *   **Build Tool:** Vite for a fast development experience.
    *   **State Management:** React Context or a lightweight library like Zustand.
    *   **Offline Storage:** Service Workers for caching assets and IndexedDB for storing application state like the singer queue.

*   **Interfaces:**
    *   **Player Interface:** Runs in a browser on the mini PCs (in kiosk mode). Displays the main video, lyrics, and scrolling ticker. It primarily listens for commands from the WebSocket server.
    *   **Singer Self-Service Interface:** A mobile-friendly view accessible via a QR code. Allows audience members to search the song library and add themselves to the queue.
    *   **KJ Control Interface:** A minimal UI, optimized for mobile phones, allowing the KJ to moderate the queue (reorder, skip, remove singers) and override playback controls.

### 1.3. Automation Engine

The server will house the logic to automate most of the KJ's traditional tasks.

*   **Automated Singer Rotation:** A fair-play algorithm will manage the singer queue. When a song ends, the next singer's song is automatically cued up.
*   **Automated Filler Music:** The system will automatically play from a "bumper music" playlist between karaoke tracks and fade it out when the next performance starts.

## 2. Implementation Roadmap

The project will be developed in phases.

### Phase 1: Project Setup & Core Backend (Current Phase)

*   [x] Set up a monorepo structure with `server` and `client` directories.
*   [ ] Initialize a Node.js project in `/server`.
*   [ ] Install core dependencies: `express`, `ws`.
*   [ ] Create a basic Express server and WebSocket server.
*   [ ] Initialize a React PWA in `/client` using Vite.

### Phase 2: Basic Playback Control

*   [ ] Implement the basic Player and KJ Control interfaces in the React app.
*   [ ] Establish WebSocket communication between the backend, player, and controller.
*   [ ] Implement basic playback control: the KJ controller can send play/pause commands that are executed on the player client.
*   [ ] Implement efficient video streaming from the server with HTTP Range Request support.

### Phase 3: Singer & Song Management

*   [ ] Implement media library scanning to build a song database.
*   [ ] Implement the Singer Self-Service interface.
*   [ ] Add fuzzy search (`fuse.js`) to the song request UI.
*   [ ] Implement the server-side singer queue logic.
*   [ ] Display the singer queue on the KJ Control and Player interfaces.

### Phase 4: Automation and Advanced Features

*   [ ] Implement the automated singer rotation logic.
*   [ ] Implement the automated filler music player.
*   [ ] Add a scrolling ticker to the Player interface, controllable from the KJ interface.
*   [ ] Refine the UI/UX for all interfaces.

### Phase 5: Polishing and Packaging

*   [ ] Implement PWA features: Service Worker for offline caching and Add-to-Homescreen functionality.
*   [ ] Implement Service Discovery (mDNS/Bonjour) for zero-conf networking.
*   [ ] Package the backend server into a single executable using `pkg`.
*   [ ] Conduct thorough testing and bug fixing.

## 3. Development Principles

To ensure the long-term success and quality of KJ-Nomad, the following principles will be adhered to throughout development:

*   **Code Quality:** All code will be written to be clean, readable, and maintainable. SOLID principles will be applied where appropriate to create a flexible and scalable architecture.
*   **Testing:** A strong emphasis will be placed on testing.
    *   **Unit Tests:** Business logic (e.g., the singer rotation algorithm, state management) will be thoroughly unit-tested using frameworks like Vitest.
    *   **Component Tests:** React components will be tested using React Testing Library to ensure they behave correctly from a user's perspective.
    *   **Integration Tests:** The communication between the client and server (especially WebSocket interactions) will be tested to ensure reliability.
*   **Modularity & Reusability:** The application will be broken down into small, single-responsibility modules and components. This applies to both the frontend (React components, custom hooks) and the backend (services, controllers).
*   **TypeScript Throughout:** TypeScript will be used in both the client and server projects to leverage static typing for improved code clarity, early error detection, and better developer experience.
*   **Scalable State Management:** The frontend will use a predictable and scalable state management solution, likely starting with React Context and `useReducer` and potentially moving to Zustand for more complex state to avoid prop-drilling and create a clear data flow.
*   **Component-Based UI:** The user interface will be built as a composition of well-defined React components, organized logically in the project structure.
