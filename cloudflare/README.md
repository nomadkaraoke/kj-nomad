# KJ-Nomad Cloudflare Infrastructure

This directory contains the Cloudflare Workers and Pages configuration for KJ-Nomad's Online Mode.

## Structure

```
cloudflare/
├── workers/               # Session Management API
│   ├── src/
│   │   ├── index.ts      # Main Workers entry point
│   │   ├── session-relay.ts  # Durable Objects for WebSocket relay
│   │   └── types.ts      # TypeScript interfaces
│   ├── package.json
│   └── tsconfig.json
└── pages/                # Static frontend applications
    ├── landing/          # kj.nomadkaraoke.com
    ├── admin/            # Admin interface for Online Mode
    ├── singer/           # sing.nomadkaraoke.com (Singer self-service)
    └── player/           # Player screen interface
```

## Services

### Workers API (kj-nomad-api)
- **Purpose**: Session management, WebSocket relay, and API endpoints
- **Routes**: 
  - `kj.nomadkaraoke.com/api/*`
  - `kj.nomadkaraoke.com/sessions/*`
  - `sing.nomadkaraoke.com/api/*`
  - `sing.nomadkaraoke.com/sessions/*`
- **Features**:
  - 4-digit session ID generation
  - Durable Objects for WebSocket relay
  - Workers KV for session storage
  - Real-time client connection management

### Pages Applications

#### Landing Page (`kj-nomad-landing`)
- **Domain**: `kj.nomadkaraoke.com`
- **Purpose**: Main entry point, mode selection, session creation
- **Features**: Nomad Karaoke branding, dual-mode explanation

#### Admin Interface (`kj-nomad-admin`)
- **Purpose**: Online Mode session management and setup wizard
- **Features**: Session setup, device management, real-time status

#### Singer App (`kj-nomad-singer`)
- **Domain**: `sing.nomadkaraoke.com`
- **Purpose**: Singer self-service song requests
- **Status**: Placeholder (to be implemented in Phase 3)

#### Player Interface (`kj-nomad-player`)
- **Purpose**: Video display screens with perfect synchronization
- **Status**: Placeholder (to be implemented in Phase 2/3)

## Deployment

### Automatic Deployment
The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically deploys all services when changes are pushed to the main branch.

### Manual Deployment
For development or manual deployment:

```bash
# Deploy Workers API
cd cloudflare/workers
npm install
wrangler deploy

# Deploy Pages (from repo root)
wrangler pages deploy cloudflare/pages/landing --project-name=kj-nomad-landing
wrangler pages deploy cloudflare/pages/admin --project-name=kj-nomad-admin
wrangler pages deploy cloudflare/pages/singer --project-name=kj-nomad-singer
wrangler pages deploy cloudflare/pages/player --project-name=kj-nomad-player
```

## Configuration

### Required Secrets
Set these in your GitHub repository secrets:
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with Workers and Pages permissions

### Domain Setup
The following DNS records should be configured in Cloudflare:
- `kj.nomadkaraoke.com` → Points to Pages (kj-nomad-landing)
- `sing.nomadkaraoke.com` → Points to Pages (kj-nomad-singer)

API routes are handled by Workers routes configuration in `wrangler.toml`.

## Development

### Workers Development
```bash
cd cloudflare/workers
npm install
npm run dev  # Starts local development server
```

### Testing
```bash
# Type checking
npm run type-check

# Build
npm run build
```

## Architecture Notes

### Session Management Flow
1. User visits `kj.nomadkaraoke.com` and selects Online Mode
2. Frontend calls `POST /api/sessions` to create 4-digit session ID
3. Local server connects to session via WebSocket
4. Player screens connect using session ID
5. Singers access via `sing.nomadkaraoke.com` with session ID

### WebSocket Relay
- Each session gets a Durable Object instance
- All real-time communication routes through the Durable Object
- Supports admin, local-server, player, and singer client types
- Automatic reconnection and error handling

### Cost Optimization
- Leverages Cloudflare's free tiers
- Durable Objects: 400,000 invocations/month free
- Workers: 100,000 requests/day free
- Pages: Unlimited static hosting
- KV: 100,000 reads/day, 1,000 writes/day free

Expected cost: $0/month for typical usage patterns.