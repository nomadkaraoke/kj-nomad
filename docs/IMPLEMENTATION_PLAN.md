# KJ‑Nomad: Feature Completion Implementation Plan

This document outlines the concrete engineering plan to complete all features specified in `ARCHITECTURE.md`, `FEATURE_STATUSES.md`, and `ROADMAP.md`. Each section includes scope, BDD alignment to `docs/features/**`, key edits (files/modules), acceptance criteria, and tests to add.

## 1) Core: Perfect Video Synchronization (Client-Side Completion)

Status recap: Server `videoSyncEngine` is fully implemented and tested; client sync handlers implemented; KJ Play Next now invokes sync engine; admin Player Screens shows drift.

- Scope
  - Implement client handlers for sync protocol and schedule precise playback in the Player UI.
- BDD alignment
  - `docs/features/core/video_synchronization.feature` — synchronized start, pause, drift checks, <100ms tolerance.
- Key edits
  - `client/src/services/websocketService.ts`
    - Handle: `clock_sync_ping`, `sync_preload`, `sync_play`, `sync_pause`, `sync_check_position`.
    - Respond with: `clock_sync_response`, `sync_ready` (include buffer level, duration), and current position for sync checks.
  - `client/src/components/Player/Player.tsx`
    - Add preload logic, buffer monitoring, and precise `scheduledTime` start using `setTimeout` corrected by clock offset.
    - Expose a minimal sync HUD (latency/offset/drift) for debugging.
- Acceptance criteria
  - Two `/player` tabs start within <100ms of each other for the same `sync_play` command. [Met]
  - Drift checks are answered; pause schedules are honored within <100ms. [Met]
  - KJ Play Next triggers `/api/sync/play` automatically; drift visible in Player Screens. [Met]
- Tests
  - Unit: websocket handlers and time calculations.
  - E2E: spin up two browser contexts and verify start-time delta <100ms.

## 2) KJ Admin: Automation Engine

Implements higher-level rotation and filler rules per `docs/features/kj_admin/automation.feature`.

- Scope
  - Scheduler that advances queue, fades filler music in/out, and enforces rotation/fair-play.
- BDD alignment
  - `docs/features/kj_admin/automation.feature` — rotation automation, filler transitions, rule toggles.
- Key edits
  - `server/src/automation.ts` (new) — state machine + timers; integrates with `songQueue.ts` and `fillerMusic.ts`.
  - `server/src/index.ts` — REST: enable/disable, status, settings.
  - `client/src/pages/HomePage.tsx` — simple controls (toggle automation, aggressiveness, view status).
- Acceptance criteria
  - With automation on, ending a song advances to next according to rotation; filler music is managed automatically.
- Tests
  - Unit: rule evaluation and scheduler transitions.
  - Integration: end-to-end through WebSocket messages.

## 3) KJ Admin: Dynamic Ticker Variables

Support variable substitution like `$ROTATION_NEXT_3`, `$TIP_URL`.

- Key edits
  - `server/src/ticker.ts` (new) — formatter that renders ticker text using session/queue state.
  - `server/src/index.ts` — on `ticker_updated`, render via formatter then broadcast.
  - `client/src/pages/HomePage.tsx` — live preview of resolved ticker.
- BDD alignment
  - `docs/features/kj_admin/ticker_management.feature` — dynamic variables scenarios.
- Acceptance criteria
  - Entering variables renders correct dynamic content on players.
- Tests
  - Unit: formatter cases; Integration: broadcast updates on queue changes.

## 4) Singer Flow: QR Code Access Overlay

Provide QR overlay on players linking to singer or player URLs.

- Key edits
  - `client/src/components/Player/Player.tsx` — render QR overlay on WS `show_qr`/`hide_qr`.
  - `client` — lightweight QR component (e.g., `qrcode` lib or canvas).
  - `client/src/components/KjController/PlayerScreenManager.tsx` — “Show QR” action per device (sends WS command via server endpoint).
  - `server/src/index.ts` — endpoints/WS broadcast to toggle QR on specific device(s).
- Acceptance criteria
  - Admin can toggle QR on any connected player; QR points to `/singer` (and optionally `/player`).
- Tests
  - E2E: toggle QR and verify presence.
- BDD alignment
  - `docs/features/singer_flow/qr_code_access.feature` — overlay display and scanning.

## 5) Singer Flow: Personal Singer Queue UX

Allow singers to stage multiple requests and manage them until queued.

- Key edits
  - `client/src/pages/SingerPage.tsx` — add personal queue UI (add/remove), persist name + queue in `localStorage`.
  - `server/src/index.ts` — track singer-level staging optionally, enforce “disable requesting when next-up”.
- Acceptance criteria
  - Singers can maintain multiple pending requests; admin sees them; if singer is “next up”, request button disabled.
- Tests
  - Unit: store reducers; Integration: WS message flow; E2E: singer adds/removes/disabled state when next-up.
- BDD alignment
  - `docs/features/singer_flow/song_requests.feature` — personal queue + disable when next-up.

## 6) Session Management: 24h Expiry (Cloudflare)

- Key edits
  - `cloudflare/workers/src/index.ts` — set TTL and/or add Cron Trigger to prune sessions with `lastSeen > 24h`.
  - Update list/get endpoints to omit ended/expired sessions.
- Acceptance criteria
  - Sessions expire automatically after 24h of inactivity.
- Tests
  - Unit: helper for expiry decision; Integration: simulate heartbeat then expiry.
- BDD alignment
  - `docs/features/session_management/online_session.feature` — session lifecycle and expiry.

## 7) Tipping (Stripe Connect)

Implements `docs/features/tipping/*` including Tip-to-Skip and raffle.

- Key edits
  - Workers (API): onboarding (account links), tip creation (PaymentIntents), webhooks.
  - Server: react to tip events; apply Tip-to-Skip with configurable limits/cooldowns; emit events to admin/player.
  - Client: singer tipping UI; admin dashboard for tip stream and raffle drawing.
- Acceptance criteria
  - KJ can onboard; singer can tip; tip events update UI; Tip-to-Skip reorders queue per policy; raffle can be drawn.
- Tests
  - Mock Stripe in tests; integration for queue manipulation; E2E basic flows.
- BDD alignment
  - `docs/features/tipping/general_tipping.feature`, `docs/features/tipping/tip_to_skip.feature`, `docs/features/tipping/prize_raffle.feature`.

## 8) Website: Landing Page Downloads

- Key edits
  - `cloudflare/pages/landing/index.html` — implement `showDownloadOptions()` and platform selection; link to installers or docs.
- Acceptance criteria
  - “Download Offline App” works across platforms.
- Tests
  - Manual verification and a simple Playwright click-through.

## 9) Advanced Audio Controls (Key/Tempo)

- Key edits
  - Player: WebAudio graph for pitch shift/time stretch tied to `<video>`; admin controls to adjust per track.
  - Server: persist per-song last-used settings (optional).
- Acceptance criteria
  - Key/tempo adjustment applies in real time without desync.
- Tests
  - Unit for wrapper logic; manual QA for perceptual quality.
- BDD alignment
  - `docs/features/core/audio_controls.feature` — key/tempo scenarios (currently tagged @skip/@future).

## 10) Advanced Queue UI

- Key edits
  - `client` UI to view/reorder/promote entries from `/api/queue/advanced/*` with singer profile linking.
- Acceptance criteria
  - VIP/high priority paths visible and actionable.
- Tests
  - Integration with existing endpoints; E2E smoke.
- BDD alignment
  - `docs/features/kj_admin/queue_management.feature` — parity with scenarios.

## 11) Cross-Cutting: Testing & CI

- Expand Playwright E2E suites for web and Electron per `ARCHITECTURE.md`.
- Keep unit coverage ≥80% (gate). Add missing tests around new modules.
- Ensure `npm run check-all` passes locally and in CI.
- BDD traceability
  - Maintain mapping of `docs/features/**` to `e2e/steps/**` and unit/integration tests.

## Milestones (suggested)

1. Client sync completion + QR overlay + ticker variables.
2. Advanced queue UI + automation engine (basic).
3. Online session expiry + YouTube endpoints wired to UI.
4. Tipping (foundations) + Tip-to-Skip; raffle.
5. Advanced audio controls; landing downloads polish.


