# KJ-Nomad: Product Roadmap

This document outlines the high-level product roadmap for KJ-Nomad. The detailed behavior of completed features is specified in the Gherkin `.feature` files located in `/docs/features/`.

## 🚀 Vision

To provide Karaoke Jockeys with a modern, reliable, and beautiful tool that simplifies the technical challenges of hosting, allowing them to focus on creating amazing experiences for their audiences. KJ-Nomad supports both fully offline and cloud-coordinated online events, with a revenue model designed to increase KJ earnings through optional tipping features.

---

## ✅ Completed Epics

The following major development phases are complete. Their functionality is fully specified in the BDD feature files.

### ✔️ **Phase 1: Infrastructure & Core Foundation**
- Cloudflare-based infrastructure for online mode (Workers, Pages, Durable Objects).
- Dual-mode architecture supporting both Offline and Online sessions.
- Core backend server (Express.js) and frontend client (React) established.
- Real-time communication layer with WebSockets.

### ✔️ **Phase 2: Offline Mode MVP**
- Fully functional, self-contained desktop application for offline use.
- Guided setup wizard for media library configuration.
- Robust multi-screen management and configuration.
- Optimized workflow for handling paper-based song requests.

### ✔️ **Phase 3: Online Mode Foundation**
- Cloud-coordinated session management using 4-digit Session IDs.
- Web-based singer self-service portal (`sing.nomadkaraoke.com`).
- Hybrid architecture allowing the local server to connect to the cloud relay.

### ✔️ **Phase 4: YouTube Integration**
- On-demand downloading of YouTube videos via `yt-dlp`.
- Hybrid search results combining local and YouTube libraries.
- Local caching and download management for YouTube tracks.

---

## 🎯 Current & Upcoming Epics

The development focus is currently on completing the advanced features required for a full professional-grade experience.

### 🟡 **In Progress: Phase 5 - Advanced Features & Monetization**
This is the current focus of development.

- **Tipping Engine:**
  - [ ] Payment gateway integration (Stripe Connect).
  - [ ] Implementation of all tipping features specified in the BDD files ("Love Heart", Gated Features, Raffle, Tip-to-Skip).
- **Payout System:**
  - [ ] KJ onboarding flow for Stripe Connect.
  - [ ] Automated nightly payouts to KJs.
- **Advanced Queue Management:**
  - [ ] Priority/VIP queue slots.
- **Singer Profiles:**
  - [ ] Persistent singer history and profile management.

### ⏳ **Next Up: Phase 6 - Professional Polish & Usability**

- **QR Code Generation:** Auto-generate QR codes for easy access to singer and player pages.
- **Progressive Web App (PWA):** Implement Service Workers for enhanced offline capabilities and "install-to-homescreen" functionality.
- **Advanced Audio Controls:** Add Key and Tempo controls for karaoke tracks.
- **Monitoring & Analytics:** Integrate basic usage analytics to identify popular features and potential issues.

---

## 💡 Future Ideas (Backlog)

- Theming and branding options for KJs.
- Integration with lighting systems (DMX/Art-Net).
- Social media integration for sharing performances.
- Public API for third-party integrations.
