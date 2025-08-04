# KJ-Nomad: System Architecture and Implementation Plan

This document outlines the technical architecture and implementation roadmap for KJ-Nomad, a dual-mode karaoke hosting system supporting both offline-first local operation and cloud-coordinated online experiences.

## Application Vision

KJ-Nomad provides professional KJs with two deployment modes:

**Offline Mode**: "Modern, offline-first, beautiful but reliable KJ software. Multiple screens in perfect sync, scrolling ticker, automated rotation tracking. All KJ controls accessible from your phone, freeing you up to be a great host!"

**Online Mode**: "Cloud-coordinated karaoke with singer self-service. Uses local media library AND YouTube together. Singers request songs from their phones, videos sync perfectly across screens, zero-config setup."

## 1. Dual-Mode Architecture Overview

KJ-Nomad operates in two distinct modes, each optimized for different venue scenarios:

### 1.1 Offline Mode
- **Target**: Venues with unreliable internet or KJs preferring traditional paper-based requests
- **Architecture**: Self-contained executable + local network PWA
- **Discovery**: Manual IP address entry for player screens
- **Requests**: Paper slips entered via KJ admin interface
- **Media**: Local video library only

### 1.2 Online Mode (Cloud-Coordinated)  
- **Target**: Venues with reliable WiFi, modern singer self-service experience
- **Architecture**: Cloudflare-hosted frontends + local server + cloud relay
- **Discovery**: 4-digit session IDs for automatic device connection
- **Requests**: Singer self-service via mobile web app
- **Media**: Local library + YouTube on-demand downloads

## 2. Offline Mode Architecture

### 2.1 Components Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   KJ's Laptop   │    │  Player Screen  │    │  Player Screen  │
│                 │    │      #1         │    │      #2         │
│ ┌─────────────┐ │    │                 │    │                 │
│ │Local Server │◄┼────┤http://192.168.  │    │http://192.168.  │
│ │Executable   │ │    │1.34:8080/player│    │1.34:8080/player│
│ │- Express.js │ │    │                 │    │                 │
│ │- WebSocket  │ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │- Media Scan │ │    │ │Video Player │ │    │ │Video Player │ │
│ │- Auto Launch│ │    │ │+ Ticker     │ │    │ │+ Sidebar    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│        │        │    └─────────────────┘    └─────────────────┘
│ ┌─────────────┐ │             │                       │
│ │Admin UI     │ │             │    Perfect Sync      │
│ │localhost:   │ │             │    (<100ms)          │
│ │8080/admin   │ │             └───────────────────────┘
│ └─────────────┘ │
└─────────────────┘
```

### 2.2 Offline Mode Application (Electron Desktop App)

**Technology Stack:**
- **Runtime:** Electron (Node.js + Chromium)
- **Backend:** Express.js for HTTP/WebSocket serving
- **Real-time:** `ws` library for WebSocket server
- **Media:** `fuse.js` for search, HTTP Range Requests for streaming
- **Packaging:** Electron Builder for native installers (Windows/Mac/Linux)
- **UI:** Built-in Chromium browser (no external browser dependency)

**Core Technical Responsibilities:**
- **Media Library Management:** Scan local directories, parse metadata, and build a fuzzy-search index.
- **Video Synchronization:** Maintain a <100ms synchronization tolerance across all connected player screens.
- **Device Management:** Track and manage the state of all connected player devices.
- **File Streaming:** Serve video files efficiently using HTTP Range Requests.

## 3. Online Mode Architecture  

### 3.1 Cloudflare Infrastructure Stack

```
┌─────────────────────────────────────────────────────────┐
│                 Cloudflare Edge Network                 │
├─────────────────────────────────────────────────────────┤
│ 📄 Pages (Static Hosting - FREE)                       │
│   • kj.nomadkaraoke.com (Landing + Admin)              │
│   • sing.nomadkaraoke.com (Singer Self-Service)        │
├─────────────────────────────────────────────────────────┤
│ ⚡ Workers (API Layer - 100k req/day FREE)             │
│   • Session Management API                              │
│   • Authentication & Routing                            │
│   • /api/sessions/* endpoints                          │
├─────────────────────────────────────────────────────────┤
│ 🔄 Durable Objects (WebSocket Relay - 400k/month FREE) │
│   • One DO per session (session:1234)                  │
│   • Real-time message routing                           │
│   • Connection state management                         │
├─────────────────────────────────────────────────────────┤
│ 💾 Workers KV (Session Storage - 100k reads/day FREE)  │
│   • Session metadata & local server registration        │
│   • Active session tracking                            │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Online Mode Data Flow

```
Singer (4G) ──┐   ┌── Admin (Venue WiFi) ──┐   ┌── Players (LAN)
              │   │                        │   │
              ▼   ▼                        ▼   ▼
    ┌─────────────────────────────────────────────────────┐
    │            Cloudflare Edge Network                  │
    │  ┌─────────────────┐    ┌─────────────────────────┐ │
    │  │ Durable Object  │◄──►│     Workers KV          │ │
    │  │ (Session 1234)  │    │ session:1234 →          │ │
    │  │ • 4 WebSockets  │    │ {localIP, port, status} │ │
    │  │ • Message Relay │    └─────────────────────────┘ │
    │  └─────────────────┘                                │
    └─────────────────────────────────────────────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │    Local Server         │
                     │   (KJ's Laptop)         │
                     │ 192.168.1.34:8080      │
                     │ • Connects to Cloudflare│
                     │ • Serves videos to LAN  │
                     │ • Downloads from YouTube│
                     │ • yt-dlp integration    │
                     └─────────────────────────┘
```

### 3.3 Session Management System

**Workers KV Schema:**
```typescript
interface SessionData {
  sessionId: string;        // "1234" (4-digit)
  localServerIP: string;    // "192.168.1.34" 
  localServerPort: number;  // 8080
  kjName?: string;
  venue?: string;
  status: 'active' | 'ended';
  hasLocalLibrary: boolean;
  allowYouTube: boolean;
  createdAt: number;
  lastSeen: number;
}

// KV Keys:
// session:1234 → SessionData
// active_sessions → string[] (session IDs)
```

**Durable Object (WebSocket Relay):**
```typescript
export class SessionRelay {
  // One instance per session
  // Relays messages between: Singer Apps ↔ Admin UI ↔ Player Screens
  // Handles connection management and message broadcasting
}
```


## 4. Shared Components & Synchronization

### 4.1 Perfect Video Synchronization Engine

**Requirements:** <100ms synchronization tolerance across multiple screens

**Implementation:**
- **Clock Synchronization:** NTP-like algorithm for client time sync
- **Pre-fetch Coordination:** Download and buffer videos before playback
- **Latency Compensation:** Calculate network delays and adjust timing
- **Drift Correction:** Continuous monitoring and micro-adjustments
- **Synchronized Start:** All players begin playback at identical timestamps

### 4.2 YouTube Integration (Online Mode Only)

**Technology:** `yt-dlp` for video downloading
- **On-demand Download:** Fetch videos when added to queue
- **Local Caching:** Store downloaded videos temporarily 
- **Hybrid Search:** Combine local library + YouTube search results
- **Progress Tracking:** Real-time download status for KJ/singers
- **Quality Management:** Automatic quality selection based on bandwidth

### 4.3 Automation Engine (Both Modes)

The server is responsible for managing automated singer rotation and the filler music system. The specific behavioral rules for this automation are defined in `docs/features/kj_admin/automation.feature`.

### 4.4 Tipping Engine (Online Mode Only)

**Goal:** Facilitate and encourage tipping to provide a revenue stream for both KJs and the platform.

**Components:**
- **Payment Processor Integration (Stripe Connect):** Utilize Stripe Connect to manage the entire lifecycle of funds. This includes:
    - **Onboarding KJs:** A flow for KJs to connect their bank accounts securely.
    - **Processing Charges:** Accepting payments from singers using various methods (Cards, PayPal, Venmo, Cash App Pay).
    - **Holding Funds:** Aggregating funds for a session.
    - **Automated Payouts:** Triggering nightly payouts to KJs via Direct Deposit (ACH) or to a debit card.
- **Tipping Configuration API:** Endpoints for KJs to manage tipping settings.
- **Real-time Event Bus:** Utilize WebSockets to broadcast tipping events instantly.
- **State Management:** Extend the session state to include tipping information.
- **Queue Management Logic:** Enhance the song queue with logic to handle "Tip to Skip" events.

The specific user-facing behaviors of the tipping engine are defined in the feature files under `docs/features/tipping/`.

## 6. Technical Specifications

### 6.1 Project Structure
```
kj-nomad/
├── server/                 # Local server (both modes)
│   ├── src/
│   │   ├── local-mode/     # Local-specific features
│   │   ├── online-mode/    # Cloud integration
│   │   ├── shared/         # Common components
│   │   └── sync/           # Video synchronization
│   └── package.json
├── client/                 # Shared React components
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
├── cloudflare/
│   ├── workers/            # API and session management
│   │   ├── src/
│   │   ├── wrangler.toml
│   │   └── package.json
│   └── pages/              # Static frontends
│       ├── landing/        # kj.nomadkaraoke.com
│       ├── admin/          # Admin interface
│       ├── singer/         # sing.nomadkaraoke.com
│       └── player/         # Player interface
└── docs/
    ├── ARCHITECTURE.md     # This file
    ├── ROADMAP.md          # High-level product roadmap
    ├── features/           # BDD specifications
    ├── rationale/          # Documents explaining key decisions
    └── archive/            # Historical/outdated documents
```

### 6.2 Cloudflare Cost Analysis (Free Tier)
- **Workers:** 100,000 requests/day → ~3,000 sessions/day
- **Durable Objects:** 400,000 invocations/month → ~13,000/day  
- **KV:** 100,000 reads/day, 1,000 writes/day
- **Pages:** Unlimited static hosting
- **Bandwidth:** 100GB/month
- **Estimated Cost:** $0/month for typical usage

### 6.3 Video Synchronization Requirements
- **Tolerance:** <100ms between all player screens
- **Network Handling:** Compensate for varying latency (WiFi vs Ethernet)
- **Clock Sync:** NTP-like algorithm for time coordination
- **Buffer Management:** Pre-fetch videos before playback commands
- **Drift Correction:** Continuous micro-adjustments during playback

### 6.4 Session Management Specifications
- **Session IDs:** 4-digit numeric codes (1000-9999)
- **Collision Handling:** Regenerate on conflicts
- **Timeout:** Sessions expire after 24 hours of inactivity
- **Capacity:** Support up to 100 concurrent sessions per region
- **Geographic:** Leverage Cloudflare's global edge network

## 7. Development Principles & Quality Standards

### 7.1 **MANDATORY** Code Quality Standards
- **TypeScript Strict Mode:** All code MUST use strict TypeScript with zero `any` types
- **Zero Tolerance Policy:** NO features merged without corresponding tests
- **SOLID Principles:** Single-responsibility, dependency injection, clear interfaces
- **Documentation:** Every public function/class MUST have JSDoc comments
- **Linting:** ESLint + Prettier MUST pass with zero warnings before commit

### 7.2 **REQUIRED** Testing Strategy
- **Unit Tests:** All business logic modules must have high line coverage (target: 80%+).
- **Integration Tests:** All API endpoints must be covered, including success and error scenarios.
- **End-to-End (E2E) Tests:** Critical user flows, as defined in the `.feature` files, must be automated using Playwright.

### 7.3 **ENFORCEMENT** Development Workflow

**🚫 BLOCKING RULES (Non-negotiable):**
1. **NO MERGE without tests**: Every PR must include tests for new functionality
2. **NO COMMIT without passing lint**: `npm run lint` must pass with zero warnings
3. **NO DEPLOY without CI green**: All tests must pass in automated environment
4. **NO FEATURE without integration test**: API endpoints require full test coverage
5. **NO COMPLEX LOGIC without unit tests**: Business logic requires 80%+ coverage

**✅ REQUIRED PRE-COMMIT CHECKLIST:**
- [ ] Unit tests written and passing (80%+ coverage)
- [ ] Integration tests cover new API endpoints
- [ ] TypeScript compiles with zero errors
- [ ] ESLint + Prettier pass with zero warnings
- [ ] E2E tests updated for user-facing changes
- [ ] Documentation updated (JSDoc + architecture docs)

**� QUALITY GATES:**
- **Coverage Gate**: Build fails if coverage drops below 80%
- **Performance Gate**: Video sync tests must maintain <100ms tolerance
- **Security Gate**: All inputs must be validated and sanitized
- **Accessibility Gate**: Frontend components must pass a11y standards


### 7.5 Continuous Integration & Deployment

**GitHub Actions Pipeline (REQUIRED):**
```yaml
- Lint Check (ESLint + Prettier)
- TypeScript Compilation 
- Unit Tests (80% coverage requirement)
- Integration Tests (All API endpoints)
- E2E Tests (Critical flows)
- Security Scan (Dependencies + Code)
- Performance Tests (Video sync validation)
- Build Verification (All platforms)
```

**Deployment Gates:**
- All tests pass ✅
- Coverage ≥ 80% ✅  
- Security scan clean ✅
- Performance benchmarks met ✅

### 7.6 Security & Privacy Standards

**Mandatory Security Practices:**
- **Input Validation**: Every API endpoint, file path, user input
- **SQL Injection Prevention**: Parameterized queries only
- **XSS Protection**: All user content sanitized
- **CORS Configuration**: Restrictive origin policies
- **Rate Limiting**: API endpoints protected against abuse
- **Dependency Scanning**: Automated vulnerability detection

**Privacy by Design:**
- **Offline Mode**: Zero external data transmission
- **Online Mode**: Session-only data, no persistent user storage
- **YouTube Integration**: No user data sent to third parties
- **Logging**: No PII in logs, sanitized error messages

---

**🎯 BOTTOM LINE**: KJ-Nomad aims to be a professional-grade application. Every line of code must meet production standards with comprehensive testing, documentation, and security practices. No exceptions.
