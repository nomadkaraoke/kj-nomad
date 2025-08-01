#!/bin/bash

# KJ-Nomad Easy Setup Script
# This script helps non-technical users set up KJ-Nomad quickly

set -e

echo "🎤 KJ-Nomad Setup Script"
echo "========================"
echo ""

# Check if we're on a supported OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    CYGWIN*)    MACHINE=Windows;;
    MINGW*)     MACHINE=Windows;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo "Detected OS: $MACHINE"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo ""
    echo "Please install Node.js from https://nodejs.org/"
    echo "Download the LTS version (18.x or newer)"
    echo ""
    echo "After installing Node.js, run this script again."
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js version: $NODE_VERSION"

# Check Node.js version (need v18+)
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | cut -d'v' -f2)
if [ $MAJOR_VERSION -lt 18 ]; then
    echo "❌ Node.js version 18 or newer is required."
    echo "Current version: $NODE_VERSION"
    echo "Please update Node.js from https://nodejs.org/"
    exit 1
fi

echo ""
echo "🚀 Starting KJ-Nomad setup..."
echo ""

# Create setup directory
SETUP_DIR="$HOME/KJ-Nomad"
if [ -d "$SETUP_DIR" ]; then
    echo "📁 KJ-Nomad directory already exists at: $SETUP_DIR"
    read -p "Do you want to update the existing installation? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
else
    echo "📁 Creating KJ-Nomad directory at: $SETUP_DIR"
    mkdir -p "$SETUP_DIR"
fi

cd "$SETUP_DIR"

# Download or update KJ-Nomad
if [ -d ".git" ]; then
    echo "🔄 Updating KJ-Nomad..."
    git pull origin main
else
    echo "📥 Downloading KJ-Nomad..."
    if command -v git &> /dev/null; then
        git clone https://github.com/nomadkaraoke/kj-nomad.git .
    else
        echo "Git not found. Downloading as ZIP..."
        if command -v curl &> /dev/null; then
            curl -L https://github.com/nomadkaraoke/kj-nomad/archive/main.zip -o kj-nomad.zip
            unzip -q kj-nomad.zip
            mv kj-nomad-main/* .
            rm -rf kj-nomad-main kj-nomad.zip
        else
            echo "❌ Neither git nor curl found. Please install git or curl and try again."
            exit 1
        fi
    fi
fi

# Install dependencies
echo "📦 Installing server dependencies..."
cd server
npm install --production

echo "📦 Installing client dependencies..."
cd ../client
npm install

# Build the frontend
echo "🏗️ Building frontend..."
npm run build

# Copy built frontend to server
echo "📋 Setting up server files..."
cd ../server
mkdir -p public
cp -r ../client/dist/* public/

# Create media directory if it doesn't exist
mkdir -p media

# Create sample media file info
if [ ! -f media/README.txt ]; then
    cat > media/README.txt << EOF
KJ-Nomad Media Directory
========================

Put your karaoke video files in this directory.

File Naming Convention:
- Karaoke videos: "Artist - Song Title.mp4"
- Background music: "filler-description.mp4"

Examples:
✅ Good: "Taylor Swift - Shake It Off.mp4"
✅ Good: "Beatles - Hey Jude.mp4"  
✅ Good: "filler-jazz-background.mp4"

❌ Bad: "track01.mp4"
❌ Bad: "Shake It Off by Taylor Swift.mp4"

Supported formats: MP4, WebM
For best compatibility, use MP4 with H.264 video and AAC audio.

Need help? See the README.md file in the main directory.
EOF
fi

# Create startup scripts
echo "📝 Creating startup scripts..."

# Create cross-platform startup script
cat > start-kj-nomad.js << 'EOF'
#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

console.log('🎤 Starting KJ-Nomad...');
console.log('');

// Get local IP address
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '127.0.0.1';
}

const localIP = getLocalIP();

console.log('🌐 KJ-Nomad will be available at:');
console.log(`   Local:    http://localhost:8080`);
console.log(`   Network:  http://${localIP}:8080`);
console.log('');
console.log('📱 Mobile interfaces:');
console.log(`   KJ Control:      http://${localIP}:8080/controller`);
console.log(`   Player Display:  http://${localIP}:8080/player`);
console.log(`   Singer Requests: http://${localIP}:8080/singer`);
console.log('');
console.log('Press Ctrl+C to stop the server');
console.log('');

// Start the server
const serverProcess = spawn('node', ['--loader', 'tsx/esm', 'src/index.ts'], {
    stdio: 'inherit',
    cwd: __dirname
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down KJ-Nomad...');
    serverProcess.kill('SIGINT');
    process.exit(0);
});

serverProcess.on('close', (code) => {
    if (code !== 0) {
        console.log(`❌ KJ-Nomad stopped unexpectedly (code ${code})`);
    }
    process.exit(code);
});
EOF

# Make startup script executable
chmod +x start-kj-nomad.js

# Create platform-specific shortcuts
if [ "$MACHINE" = "Mac" ]; then
    # Create macOS app bundle
    echo "🍎 Creating macOS app..."
    mkdir -p "../KJ-Nomad.app/Contents/MacOS"
    mkdir -p "../KJ-Nomad.app/Contents/Resources"
    
    cat > "../KJ-Nomad.app/Contents/MacOS/KJ-Nomad" << EOF
#!/bin/bash
cd "\$(dirname "\$0")/../../../server"
node start-kj-nomad.js
EOF
    
    chmod +x "../KJ-Nomad.app/Contents/MacOS/KJ-Nomad"
    
    cat > "../KJ-Nomad.app/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>KJ-Nomad</string>
    <key>CFBundleIdentifier</key>
    <string>com.nomadkaraoke.kj-nomad</string>
    <key>CFBundleName</key>
    <string>KJ-Nomad</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleDisplayName</key>
    <string>KJ-Nomad</string>
</dict>
</plist>
EOF

elif [ "$MACHINE" = "Linux" ]; then
    # Create Linux desktop entry
    echo "🐧 Creating Linux desktop entry..."
    cat > "../kj-nomad.desktop" << EOF
[Desktop Entry]
Name=KJ-Nomad
Comment=Professional Karaoke Hosting Software
Exec=$SETUP_DIR/server/start-kj-nomad.js
Icon=multimedia-player
Terminal=true
Type=Application
Categories=AudioVideo;Audio;Player;
EOF
fi

# Create batch file for Windows (will work in Git Bash)
cat > start-kj-nomad.bat << 'EOF'
@echo off
cd /d "%~dp0"
node start-kj-nomad.js
pause
EOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "📍 KJ-Nomad is installed at: $SETUP_DIR"
echo ""
echo "🚀 To start KJ-Nomad:"
if [ "$MACHINE" = "Mac" ]; then
    echo "   Double-click: KJ-Nomad.app"
    echo "   OR run: $SETUP_DIR/server/start-kj-nomad.js"
elif [ "$MACHINE" = "Linux" ]; then
    echo "   Double-click: kj-nomad.desktop"
    echo "   OR run: $SETUP_DIR/server/start-kj-nomad.js"
else
    echo "   Double-click: start-kj-nomad.bat"
    echo "   OR run: $SETUP_DIR/server/start-kj-nomad.js"
fi
echo ""
echo "📚 Documentation:"
echo "   Setup guide: $SETUP_DIR/README.md"
echo "   Troubleshooting: $SETUP_DIR/TROUBLESHOOTING.md"
echo ""
echo "🎵 Media files:"
echo "   Add your karaoke videos to: $SETUP_DIR/server/media/"
echo "   See: $SETUP_DIR/server/media/README.txt for naming guidelines"
echo ""
echo "🎉 You're ready to host karaoke!"
echo ""

# Offer to start immediately
read -p "Do you want to start KJ-Nomad now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting KJ-Nomad..."
    echo ""
    ./start-kj-nomad.js
fi