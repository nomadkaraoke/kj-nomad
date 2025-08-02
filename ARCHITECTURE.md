# KJ-Nomad: System Architecture and Implementation Plan

This document outlines the technical architecture and implementation roadmap for KJ-Nomad, a dual-mode karaoke hosting system supporting both offline-first local operation and cloud-coordinated online experiences.

## Application Vision

KJ-Nomad provides professional KJs with two deployment modes:

**Local Mode**: "Modern, offline-first, beautiful but reliable KJ software. Multiple screens in perfect sync, scrolling ticker, automated rotation tracking. All KJ controls accessible from your phone, freeing you up to be a great host!"

**Online Mode**: "Cloud-coordinated karaoke with singer self-service. Uses local media library AND YouTube together. Singers request songs from their phones, videos sync perfectly across screens, zero-config setup."

## 1. Dual-Mode Architecture Overview

KJ-Nomad operates in two distinct modes, each optimized for different venue scenarios:

### 1.1 Local Mode (Offline-First)
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

## 2. Local Mode Architecture

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

### 2.2 Local Mode Server (Enhanced Node.js)

**Technology Stack:**
- **Runtime:** Node.js 18+
- **Framework:** Express.js for HTTP/WebSocket serving
- **Real-time:** `ws` library for WebSocket server
- **Media:** `fuse.js` for search, HTTP Range Requests for streaming
- **Packaging:** `pkg` for single executable (Windows/Mac/Linux)
- **Auto-launch:** Platform-specific browser launching

**Core Responsibilities:**
- **Media Library Management:** Scan local directories, parse metadata, build search index
- **Perfect Video Synchronization:** <100ms tolerance across multiple screens
- **Setup Wizard:** Guide KJ through library selection and player screen configuration
- **Device Management:** Track connected player screens, individual control toggles
- **Paper Request Workflow:** Optimized UI for manual singer/song entry

### 2.3 Local Mode Setup Flow

1. **Launch:** KJ double-clicks executable → auto-opens admin UI in browser
2. **Setup Wizard:**
   - Select local media directory
   - Scan and index video library
   - Display server IP address (e.g., 192.168.1.34:8080)
3. **Player Setup:** Navigate player devices to `http://[IP]:8080/player`
4. **Device Controls:** Toggle audio output, ticker, sidebar per screen
5. **Paper Requests:** Search library, add singers to queue manually

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

### 3.4 Online Mode Setup Flow

1. **Session Creation:** KJ visits kj.nomadkaraoke.com → creates session → gets 4-digit ID
2. **Local Server:** Enhanced server connects to Cloudflare relay, registers IP
3. **Player Setup:** Navigate to kj.nomadkaraoke.com/player → enter session ID
4. **Singer Access:** Singers visit sing.nomadkaraoke.com → enter session ID
5. **Media Sources:** Choose local library + YouTube, or YouTube only
6. **Auto-Discovery:** All devices auto-connect via session ID

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

**Automated Singer Rotation:**
- Fair-play algorithms for queue management
- Automatic progression to next song
- Configurable rotation rules

**Automated Filler Music:**  
- Background music between performances
- Auto-fade when next song begins
- Separate filler music library management

## 5. Implementation Roadmap

### Phase 1: Infrastructure & Landing Page
**Goal:** Set up deployment infrastructure and create user-facing entry points

**Deliverables:**
- [ ] Cloudflare Workers + Pages deployment configuration
- [ ] Landing page at kj.nomadkaraoke.com with mode selection
- [ ] GitHub Actions CI/CD pipeline  
- [ ] Domain setup: kj.nomadkaraoke.com, sing.nomadkaraoke.com
- [ ] Basic session management API (Workers + KV)

**Technical Tasks:**
- Set up `wrangler.toml` configurations for Workers and Pages
- Create landing page with Local vs Online mode explanations
- Build session creation API endpoint
- Configure automated deployment from GitHub

### Phase 2: Local Mode MVP  
**Goal:** Create fully functional offline karaoke system

**Deliverables:**
- [ ] Self-contained executable (Windows/Mac/Linux)
- [ ] Auto-browser launch on server startup
- [ ] Setup wizard for media library selection
- [ ] Perfect video synchronization engine (<100ms)
- [ ] Multi-screen device management interface
- [ ] Paper request workflow optimization

**Technical Tasks:**  
- Enhance server with auto-launch capabilities
- Implement video sync engine with clock synchronization
- Build setup wizard UI components
- Add device management and per-screen controls
- Package executable with `pkg`

### Phase 3: Online Mode Foundation
**Goal:** Establish cloud-coordinated session management

**Deliverables:**
- [ ] Durable Objects WebSocket relay system
- [ ] 4-digit session ID generation and discovery
- [ ] Cloud-local hybrid architecture
- [ ] Enhanced local server with cloud connectivity
- [ ] Player auto-discovery via session ID

**Technical Tasks:**
- Implement Durable Objects for session relay
- Build session registration and discovery APIs
- Create cloud-frontend connection logic
- Enhance local server with Cloudflare integration
- Build session-based player connection system

### Phase 4: YouTube Integration
**Goal:** Add on-demand video downloading and hybrid search

**Deliverables:**
- [ ] `yt-dlp` integration for video downloading
- [ ] Hybrid search (local library + YouTube)
- [ ] Video caching and storage management
- [ ] Download progress tracking UI
- [ ] Quality management and bandwidth optimization

**Technical Tasks:**
- Integrate yt-dlp with Node.js wrapper
- Build hybrid search interface
- Implement local video caching system
- Create download progress components
- Add bandwidth-based quality selection

### Phase 5: Advanced Features & Polish
**Goal:** Complete professional-grade feature set

**Deliverables:**
- [ ] Drag-and-drop queue reordering
- [ ] Per-device control toggles (audio/ticker/sidebar)
- [ ] Singer profile management
- [ ] Advanced queue management (VIP, priority)
- [ ] Comprehensive monitoring and analytics

**Technical Tasks:**
- Build drag-and-drop UI components
- Implement granular device control systems
- Create singer profile persistence
- Add queue management algorithms
- Integrate usage analytics

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
    ├── FEATURES.md         # Feature implementation status
    └── API.md              # API documentation
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

## 7. Development Principles

### 7.1 Code Quality Standards
- **TypeScript:** Strict typing throughout (frontend and backend)
- **Testing:** Minimum 80% coverage for core business logic
- **Modularity:** Single-responsibility principle for all components
- **Documentation:** Inline docs and comprehensive API documentation

### 7.2 Testing Strategy
- **Unit Tests:** Core modules (songQueue, mediaLibrary, sync engine)
- **Integration Tests:** API endpoints and WebSocket communication  
- **E2E Tests:** Critical user flows (Cypress for browser automation)
- **Performance Tests:** Video synchronization accuracy validation
- **Load Tests:** Cloud infrastructure stress testing

### 7.3 Security Considerations
- **Local Mode:** No external network access required
- **Online Mode:** Session ID-based access control
- **YouTube Integration:** Rate limiting and ToS compliance
- **Data Privacy:** No persistent user data storage
- **Network Security:** HTTPS/WSS everywhere, input validation
