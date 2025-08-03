# Use Node.js v24 to match the local development environment
FROM node:24-bookworm

# Set up the working directory
WORKDIR /app

# Install dependencies required for Electron and electron-builder on Debian/Ubuntu
# Based on https://www.electron.build/multi-platform-build#linux
RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    libgtk-3-dev \
    libgconf-2-4 \
    libnss3 \
    libasound2 \
    libxtst-dev \
    libxss1 \
    libsecret-1-dev \
    # For SUID sandbox
    build-essential \
    # For AppImage
    fuse \
    # For debugging
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json for all workspaces
COPY package.json package-lock.json ./
COPY client/package.json client/package-lock.json ./client/
COPY server/package.json server/package-lock.json ./server/
COPY cloudflare/workers/package.json cloudflare/workers/package-lock.json ./cloudflare/workers/

# Install all dependencies
# This is not a workspace project, so we install for each package individually.
RUN npm install && \
    npm install --prefix client && \
    npm install --prefix server && \
    npm install --prefix cloudflare/workers

# Copy the rest of the application source code
COPY . .

# Set an environment variable to disable the sandbox in CI
ENV ELECTRON_DISABLE_SANDBOX=true

# Run the packaging test script within a virtual display (Xvfb)
# This is required for Electron to run in a headless CI environment.
CMD ["xvfb-run", "--auto-servernum", "npm", "run", "test:packaging"]
