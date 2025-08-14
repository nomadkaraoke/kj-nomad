These are the behaviors and fixes that should be covered by tests and expanded BDD specs, including scheduling precision, domain handling, pause/resume exactness, reload catch‑up, auto‑correction policies (with and without anchor), UI toggles, and full telemetry coverage.

### Video sync and scheduling
- Accurate time domains and per-client baselines: Track `timeDomain` (client/server) and store per‑client baselines with `scheduledTime`, `videoStartSec`, `usedOffsetMs`, `usedLatencyMs`, `domain`, `establishedAt` to compute correct expected playback times. Why: eliminate ~2.7s systematic drift and make drift reflect real visual sync.
- Clock sync pings (latency/offset): Proactive `clock_sync_ping` before preload; clients report `averageLatency` and `clockOffset`; scheduled times are adjusted by offset−latency. Why: start events fire simultaneously across devices.
- Deterministic `sync_preload` → `sync_play`: Orchestrated preload with readiness wait, then scheduled play with sufficient buffer based on average latency. Why: avoid missed schedules and uneven starts.
- Catch‑up for newly joined players: When a player connects mid‑song, server sends preload + scheduled `sync_play` at current elapsed time with per‑client domain. Why: reloaded/joining screens catch up instead of starting at t=0.

### Pause, resume, stop, and end behavior
- True synchronized pause: `sync_pause` schedules pause without unloading media; client pauses at current frame. Why: prevent reset to 0 and preserve exact frame.
- Resume at exact paused timestamp: Server captures `pausedAtVideoSec`; `sync_resume` restarts from that timestamp. Why: frame‑accurate resume across screens.
- Session baseline adjusts for pause: Server `songQueue` shifts `currentSongStartTime` forward by paused duration on resume. Why: elapsed calculations for catch‑up/expected exclude paused time.
- Proper end/stop cleanup: On end/stop, engine clears baselines and clients unload media (`pause`, `removeAttribute('src')`, `load()`), returning to “Ready” screen with no stray audio. Why: avoid stuck final frame and ghost audio.

### Drift reporting and correction
- Correct drift math: Server `position_report` uses client‑domain time if baseline is client, otherwise server time, and computes `expectedSec` accordingly. Why: drift reflects real difference, not time‑domain mismatch.
- Automatic drift correction (>200 ms): Per‑client realignment to the expected timestamp with a short cooldown and telemetry. Why: converge screens when meaningful drift occurs.
- Anchor/muted strategy: Select an “anchor” (typically unmuted audio screen). Anchor is never hard‑corrected; instead a small baseline bias is applied, while other (muted) screens are corrected. Why: avoid audible skips on the live audio screen.
- Feature toggle for auto‑correction: KJ UI checkbox + WS command + env override to enable/disable auto drift correction at runtime. Why: quick mitigation on site if corrections misbehave.

### Player client behaviors
- Scheduled play handling: Client computes local target time from `timeDomain`, seeks, and plays exactly at schedule; avoids resetting `src` unless path differs (normalized path compare). Why: precise starts and no unnecessary reloads.
- Autoplay handling: Start muted to satisfy autoplay; surface `NotAllowedError` with a “Click to Play” recovery. Why: reliable starts in browsers with autoplay policies.
- Debug overlay improvements: Shows `clientId`, `expected` (domain-aware), `self drift`, `clock sync` stats, and status lines (`isPlaying`, `isVideoLoaded`, `hasNowPlaying`, `video.readyState`, `muted`, `paused`). Why: fast diagnosis on site.
- Expected freezes while paused: Overlay’s expected time stops advancing during pause. Why: correct on‑screen telemetry.

### Device management and identification
- Persistent `stableId` per player: Stored in `localStorage`, mapped server‑side (`upsertDevice` + `connectionToDeviceId`). Why: devices persist through reloads and are not shown as falsely disconnected.
- Heartbeat and status routing: Heartbeats and position reports are attributed to persistent device IDs; no unregister on transient WS close. Why: stable presence in admin UI.

### Admin/KJ UI features
- Player Screens section UI:
  - Moved below Queue and Ticker sections. Why: emphasize operational controls first.
  - Top‑right bug icon toggles all players’ debug overlays; subtle “log” icon toggles sync log panel; “Copy Log” appears only when log is open. Why: cleaner UI; debugging when needed.
  - Per‑screen status: shows drift and a quick status line (Loading | Playing | Muted). Why: at‑a‑glance health.
- Sync options (controller):
  - Toggle: Enable automatic drift correction.
  - Anchor controls: set/clear anchor device ID. Why: control correction strategy live.

---

### Server unit tests (Vitest, server/src/__tests__) (Implemented ✓ / Pending —)
- VideoSyncEngine: pause/resume/baseline — ✓ (videoSync_pause_resume.test.ts)
- VideoSyncEngine: realign and cooldown — ✓ (videoSync_realign.test.ts)
- VideoSyncEngine: catchUpClient — ✓ (videoSync_catchupClient.test.ts)
- SongQueue: pause/resume baseline shift — ✓ (songQueue_pause_resume.test.ts)
- Index route (drift/correction/anchor logging) — ✓ (index_drift_realign_ws.test.ts)
- Device identity and status mapping — ✓ (deviceManager_identity.test.ts)
- Catch-up on reconnect (lite) — ✓ (reconnect_catchup_lite.test.ts)

### Server integration tests (server/src/__tests__/integration)
- Happy path orchestration — ✓ (websocket.sync_orchestration.test.ts)
- Pause, resume, stop, end — ✓ (orchestration.pause_resume_end.test.ts)
- Auto-correction behavior (anchor and non-anchor) — ✓ (drift_correction_anchor.test.ts)

### Client unit/component tests (Vitest + RTL) (Implemented ✓ / Pending —)
- PlayerPage: preload/play/pause/resume/end/overlay — (basic overlay presence ✓, remaining pending) (PlayerPage.test.tsx)
  - Additional scheduled play/pause behavior ✓ (PlayerPage.behavior.test.tsx)
  - End-of-song unload + Ready UI ✓ (PlayerPage.end_ready.test.tsx)
  - Expected freeze on pause ✓ (PlayerPage.resume_expected.test.tsx)
- websocketService behaviors —
  - stableId generation + persistence ✓ (websocketService.behavior.test.ts)
  - message handling (sync_play, drift toggle) ✓ (websocketService.messages.test.ts)
- PlayerScreenManager: global debug toggle + Copy Log visibility — ✓ (PlayerScreenManager.test.tsx)
- HomePage layout (section order) — ✓ (HomePage.order.test.tsx)

### Client integration tests (optional)
- Two PlayerPage instances sync within tolerance — ✓ (PlayerPage.dual.integration.test.tsx)

### End-to-end BDD (Playwright)
- Implement scenarios from the updated features — —

### Utilities/notes
- Deterministic timing: use fake timers and controlled Date.now().
- Extend media mocks for readyState/buffered as needed.
- WS shims for unit/integration.