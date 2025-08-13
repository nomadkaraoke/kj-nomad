# KJ-Nomad Feature Statuses

This document lists the status of BDD features based on current code implementation.

## Core Features

### Advanced Audio Controls (`docs/features/core/audio_controls.feature`)
- **Status**: Not Implemented
- **Notes**: The `VideoSyncEngine` does not include direct controls for audio key or tempo adjustments. The feature is tagged with `@skip` and `@future`.

### Perfect Video Synchronization (`docs/features/core/video_synchronization.feature`)
- **Status**: Implemented Fully
- **Notes**: The `server/src/videoSyncEngine.ts` comprehensively handles client registration, clock synchronization, synchronized play, pause, and drift correction, meeting the <100ms tolerance requirement.

## Desktop Application Features

### Desktop Application Onboarding and Setup (`docs/features/desktop_app/onboarding.feature`)
- **Status**: Implemented Fully
- **Notes**: The `electron/onboarding.html` and its embedded JavaScript, along with `electron/main.mjs` (for network scanning) and `client/src/pages/OnboardingPage.tsx` (for redirection), implement the initial mode selection and player setup flows.

## KJ Admin Features

### KJ Automation Engine (`docs/features/kj_admin/automation.feature`)
- **Status**: Not Implemented
- **Notes**: While `server/src/songQueue.ts` and `server/src/fillerMusic.ts` manage queue and filler music data, the higher-level automation logic for singer rotation and automatic filler music playback/fading is not present. The feature is tagged with `@skip`.

### KJ Queue Management (`docs/features/kj_admin/queue_management.feature`)
- **Status**: Implemented Fully
- **Notes**: `client/src/components/KjController/ManualRequestForm.tsx` handles adding requests. `client/src/components/QueueManager/DraggableQueue.tsx` and `server/src/songQueue.ts` provide full drag-and-drop reordering and removal functionality.

### Scrolling Ticker Management (`docs/features/kj_admin/ticker_management.feature`)
- **Status**: Partly Implemented
- **Notes**: The UI in `client/src/pages/HomePage.tsx` and the `updateTicker` action in `client/src/store/appStore.ts` allow updating and clearing static ticker text. However, the implementation does not support dynamic variables like `$ROTATION_NEXT_3` or `$TIP_URL` as described in one scenario.

### KJ YouTube Download Management (`docs/features/kj_admin/youtube_management.feature`)
- **Status**: Implemented Fully
- **Notes**: `server/src/youtubeIntegration.ts` provides robust backend functionality for YouTube search, on-demand downloading, real-time progress tracking, and error handling. The necessary data is available for frontend display.

## Player Screens Features

### Player Screen Configuration (`docs/features/player_screens/configuration.feature`)
- **Status**: Implemented Fully
- **Notes**: `server/src/deviceManager.ts` manages device state (audio, ticker, sidebar, video visibility) with default settings. `client/src/components/KjController/PlayerScreenManager.tsx` provides the UI for toggling these settings, which communicate with the server via API calls handled by `appStore.ts`.

### Player Screen Management (`docs/features/player_screens/management.feature`)
- **Status**: Implemented Fully
- **Notes**: The combination of `electron/main.mjs` (for client-side discovery/connection), `server/src/deviceManager.ts` (for server-side registration, heartbeats, and state management), and `client/src/components/KjController/PlayerScreenManager.tsx` (for UI display and control) fully implements all scenarios, including automatic connection, identification, disconnection/reconnection, and permanent removal.

## Session Management Features

### Offline Session Management (`docs/features/session_management/offline_session.feature`)
- **Status**: Implemented Fully
- **Notes**: `server/src/setupWizard.ts` handles setup configuration persistence, media directory validation, and provides API endpoints for setup status, config updates, media directory changes, and library rescans. This, along with the Electron app's initial flow, covers all scenarios.

### Online Session Management (`docs/features/session_management/online_session.feature`)
- **Status**: Partly Implemented
- **Notes**: Session creation, local server registration, and server disconnection/reconnection are implemented via `cloudflare/workers/src/index.ts` and `server/src/cloudConnector.ts`. However, there is no explicit mechanism found in the Cloudflare Worker code to automatically terminate sessions after 24 hours of inactivity, as specified in one scenario.

## Singer Flow Features

### QR Code Access for Singers (`docs/features/singer_flow/qr_code_access.feature`)
- **Status**: Not Implemented
- **Notes**: There is no UI or backend logic found to enable the display of a QR code overlay on player screens, which is a prerequisite for singers to scan and join a session.

### Singer Song Request Flow (`docs/features/singer_flow/song_requests.feature`)
- **Status**: Not Implemented
- **Notes**: While basic song requesting (search, select, submit) is implemented in `client/src/pages/SingerPage.tsx`, the functionality for singers to manage a *personal* song queue (requesting multiple songs, removing from personal queue) is explicitly prevented or missing. Additionally, the UI does not disable song request options when a singer is "next up".

## Singer Profiles Features

### Singer Profile Management (`docs/features/singer_profiles/management.feature`)
- **Status**: Implemented Fully
- **Notes**: `server/src/singerProfiles.ts` provides a robust backend for creating, updating, retrieving, and persistently storing singer profiles and their performance histories. It also includes functionality to record new performances and retrieve a singer's full history and statistics.

## Tipping Features

### General Tipping and Gated Features (`docs/features/tipping/general_tipping.feature`)
- **Status**: Not Implemented
- **Notes**: No implementation for payment processing (Stripe Connect), tipping mechanisms, or gated features based on tipping was found in the codebase.

### Tip Prize Raffle (`docs/features/tipping/prize_raffle.feature`)
- **Status**: Not Implemented
- **Notes**: This feature is dependent on the core tipping functionality, which is not implemented. No specific code for raffle drawing or winner announcement was found.

### Tip to Skip the Queue (`docs/features/tipping/tip_to_skip.feature`)
- **Status**: Not Implemented
- **Notes**: This feature is dependent on the core tipping functionality and advanced queue management, neither of which are implemented as described. No specific code for queue manipulation based on tips, skip limits, or cooldowns was found.

## UI Features

### UI Theme Management (`docs/features/ui/theming.feature`)
- **Status**: Implemented Fully
- **Notes**: The `electron/onboarding.html` contains JavaScript and CSS that correctly implement theme toggling (light/dark mode) and persistence of the user's preference in `localStorage`.

## Website Features

### Website Landing Page and Mode Selection (`docs/features/website/landing_page.feature`)
- **Status**: Partly Implemented
- **Notes**: The "Host Online Session" button correctly initiates session creation and redirects. However, the "Download Offline App" button's `showDownloadOptions()` function is not defined in `cloudflare/pages/landing/index.html`, meaning the actual download mechanism for the desktop app installer is not fully implemented or visible in the provided code.
