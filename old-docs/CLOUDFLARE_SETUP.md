# Cloudflare Setup Guide for KJ-Nomad

This guide walks through setting up KJ-Nomad's Online Mode infrastructure on Cloudflare.

## Prerequisites

- Cloudflare account with `nomadkaraoke.com` domain
- GitHub repository: `https://github.com/nomadkaraoke/kj-nomad`
- Wrangler CLI installed (optional for manual deployment)

## Step 1: Cloudflare API Token

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Custom token" template
4. Configure permissions:
   - **Zone:Zone:Read** (for nomadkaraoke.com)
   - **Zone:Zone Settings:Edit** (for nomadkaraoke.com)
   - **Zone:DNS:Edit** (for nomadkaraoke.com)
   - **Account:Cloudflare Workers:Edit**
   - **Account:Page:Edit**
   - **Account:Account Settings:Read**
5. Set Zone Resources to "Include - nomadkaraoke.com"
6. Click "Continue to summary" then "Create Token"
7. Copy the token (you'll only see it once)

## Step 2: GitHub Secrets

1. Go to your GitHub repository: `https://github.com/nomadkaraoke/kj-nomad`
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add:
   - **Name**: `CLOUDFLARE_API_TOKEN`
   - **Secret**: [Paste the token from Step 1]

## Step 3: Initial Deployment

### Option A: Automatic (Recommended)
1. Push the cloudflare infrastructure code to the main branch
2. GitHub Actions will automatically deploy all services
3. Check the Actions tab to monitor deployment progress

### Option B: Manual Setup
If you prefer to set up through Cloudflare's web interface:

1. **Create Workers KV Namespace**:
   - Go to Workers & Pages → KV
   - Create namespace: `kj-nomad-sessions`
   - Copy the namespace ID
   - Update `wrangler.toml` with the ID

2. **Import GitHub Repository**:
   - Go to Workers & Pages → Overview
   - Click "Create application"
   - Select "Pages" tab
   - Click "Connect to Git"
   - Select your GitHub repository
   - Configure build settings:
     - Build command: `cd cloudflare/workers && npm run build`
     - Build output directory: `cloudflare/workers/dist`

## Step 4: Domain Configuration

### DNS Records
These should be configured automatically by Cloudflare Pages, but verify:

1. Go to DNS → Records in Cloudflare dashboard
2. Ensure these records exist:
   - `kj` (CNAME) → `kj-nomad-landing.pages.dev`
   - `sing` (CNAME) → `kj-nomad-singer.pages.dev`

### Custom Domains
1. Go to Workers & Pages → Overview
2. For each Pages project:
   - Click on the project name
   - Go to "Custom domains" tab
   - Add the appropriate domain:
     - `kj-nomad-landing` → `kj.nomadkaraoke.com`
     - `kj-nomad-singer` → `sing.nomadkaraoke.com`

## Step 5: Verification

### Test the Landing Page
1. Visit `https://kj.nomadkaraoke.com`
2. Should show the KJ-Nomad landing page with dual-mode selection
3. Click "Start Online Session" to test session creation

### Test the API
```bash
# Create a session
curl -X POST https://kj.nomadkaraoke.com/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"allowYouTube": true}'

# Should return: {"success": true, "data": {"sessionId": "1234", ...}}
```

### Test WebSocket Connection
1. Visit the admin interface with a session ID
2. Open browser developer tools → Network tab
3. Should see WebSocket connection to `/sessions/1234/ws`

## Step 6: Monitor and Debug

### Cloudflare Dashboard
- **Workers & Pages → Overview**: See all deployed services
- **Analytics & Logs → Real-time Logs**: Monitor API requests
- **Workers & Pages → KV**: Check session storage

### GitHub Actions
- Monitor deployment status in the Actions tab
- Check logs if deployment fails
- Re-run jobs if needed

## Troubleshooting

### Common Issues

**1. DNS Not Propagating**
- DNS changes can take up to 24 hours
- Use `dig kj.nomadkaraoke.com` to check status
- Ensure nameservers point to Cloudflare

**2. Workers Deployment Fails**
- Check KV namespace ID in `wrangler.toml`
- Verify API token permissions
- Check GitHub Actions logs for specific errors

**3. Pages Not Loading**
- Verify custom domain configuration
- Check if build completed successfully
- Ensure proper directory structure in repo

**4. WebSocket Connection Issues**
- Verify Workers routes are configured correctly
- Check browser console for connection errors
- Test API endpoints first before WebSocket

### Getting Help

- **GitHub Issues**: Report bugs or request help
- **Cloudflare Community**: For infrastructure-specific questions
- **Documentation**: Refer to `cloudflare/README.md` for technical details

## Cost Monitoring

Monitor usage in Cloudflare dashboard:
- **Workers & Pages → Plans**: Check request counts
- **Analytics**: Monitor traffic patterns

Expected free tier limits:
- Workers: 100,000 requests/day
- Pages: Unlimited
- KV: 100,000 reads/day, 1,000 writes/day
- Durable Objects: 400,000 invocations/month

Should remain free for typical usage.