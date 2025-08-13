# KJ‑Nomad: Manual Test Guide

This guide describes how to manually verify the current implementation across offline mode, player screens, queue/playback, ticker, history, singer profiles, paper slips, advanced queue, YouTube integration, and online session wiring.

## Prerequisites

- A folder containing a few `.mp4` karaoke videos. Optional: add filler tracks prefixed with `filler-`.
- Node.js environment; `yt-dlp` installed and on PATH if testing YouTube backend.

## Start the server (offline mode)

From the repo root:

```bash
npm run setup && npm run dev
```

Expected: logs show server ready on port 8080.

## Setup Wizard

1. Open `http://localhost:8080/`.
2. Configure media directory; verify validation (video count detected).
3. Complete setup; admin Home loads.
4. Sanity API checks:

```bash
curl -s http://localhost:8080/api/setup/status | jq
curl -s 'http://localhost:8080/api/songs?q=love' | jq
```

## Connect player screens

1. On the same machine, open `http://localhost:8080/player` in a second window.
2. Optionally on another device in LAN: `http://<LAN-IP>:8080/player`.
3. In admin Home, the `Player Screens` panel lists screens with resolution/OS.
4. Test controls per device:
   - Identify: short overlay appears on player.
   - Toggle Audio/Ticker/Sidebar/Video: reflected immediately on player UI.
   - Disconnect: player shows disconnected and stops receiving updates.

## Queue management and playback

1. In Home, use “Manual Request” to add a song with a singer name; entry appears in queue.
2. Drag to reorder; after refresh, order persists (server-side reorder API).
3. Click “Play Next”: video should start on connected player; “Now Singing” shows singer and file.
4. Controls:
   - Restart: restarts current song.
   - Pause/Resume: toggles playback state.
   - Skip: behaves as song end; next plays or filler starts.
   - Stop: stops playback and records history.
5. When a video ends, server handles `song_ended`; next item plays; otherwise emits `play_filler_music` (if available) or pauses.

## Ticker

1. Update ticker text in Home.
2. Player shows updated scrolling text immediately.

## Session history

1. After playing a few songs, open History (button in Home).
2. Verify entries and timestamps.

## Devices API spot checks (optional)

```bash
curl -s http://localhost:8080/api/devices | jq
# Pick a deviceId from response
curl -s -X POST http://localhost:8080/api/devices/<deviceId>/identify | jq
```

## Singer profiles (backend)

Create and manage via API:

```bash
# Create
curl -s -X POST http://localhost:8080/api/singers \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alice","favoriteGenres":["Pop"],"vipStatus":true}' | jq

# List
curl -s http://localhost:8080/api/singers | jq

# Record performance
curl -s -X POST http://localhost:8080/api/singers/<singerId>/performances \
  -H 'Content-Type: application/json' \
  -d '{"songId":"1","songTitle":"Song","artist":"Artist"}' | jq
```

## Paper workflow (optional)

```bash
curl -s -X POST http://localhost:8080/api/paper/slips \
  -H 'Content-Type: application/json' \
  -d '{"singerName":"Bob","requestedSong":"Wonderwall"}' | jq
curl -s http://localhost:8080/api/paper/slips | jq
```

## Advanced queue (backend APIs)

```bash
curl -s -X POST http://localhost:8080/api/queue/advanced/add \
  -H 'Content-Type: application/json' \
  -d '{"singerName":"VIP Jane","songId":"1","priority":"vip"}' | jq
curl -s http://localhost:8080/api/queue/advanced | jq
curl -s -X POST http://localhost:8080/api/queue/advanced/play-next | jq
```

## YouTube integration (backend only)

Ensure `yt-dlp` is installed. The backend module is ready but not exposed via routes yet. Validate via unit tests (see below) or wire endpoints before manual UI tests.

## Online session (Cloudflare Worker) basics

1. From `cloudflare/workers`:

```bash
npm i
npx wrangler dev
```

2. Create a session:

```bash
curl -s -X POST http://127.0.0.1:8787/api/sessions -H 'Content-Type: application/json' -d '{}' | jq
```

3. Connect local server:

```bash
curl -s -X POST http://localhost:8080/api/cloud/connect \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"<id-from-previous>","allowYouTube":true}' | jq
curl -s http://localhost:8080/api/cloud/status | jq
```

## E2E and unit tests (optional but recommended)

From repo root:

```bash
npm run lint
npm run test
npm run test:e2e:web
npm run test:e2e:electron
npm run check-all
```

All should pass cleanly once new features and tests are added per the implementation plan.


