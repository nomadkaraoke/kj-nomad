#!/bin/bash

# KJ-Nomad Professional Karaoke System Installer
# For macOS and Linux

set -e

echo "🎤 KJ-Nomad Professional Karaoke System Installer"
echo "================================================="
echo ""

# Configuration
APP_NAME="KJ-Nomad"
GITHUB_REPO="nomadkaraoke/kj-nomad"
INSTALL_DIR="$HOME/Applications"
BINARY_NAME="kj-nomad"

# Detect platform
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case $ARCH in
    x86_64)
        ARCH="x64"
        ;;
    arm64|aarch64)
        ARCH="arm64"
        ;;
    *)
        echo "❌ Unsupported architecture: $ARCH"
        exit 1
        ;;
esac

PLATFORM="${OS}-${ARCH}"
echo "🖥️  Detected platform: $PLATFORM"

# Get latest release
echo "📡 Fetching latest release..."
LATEST_RELEASE=$(curl -s "https://api.github.com/repos/$GITHUB_REPO/releases/latest")
VERSION=$(echo "$LATEST_RELEASE" | grep '"tag_name":' | sed -E 's/.*"tag_name":\s*"([^"]+)".*/\1/')

if [ -z "$VERSION" ]; then
    echo "❌ Failed to get latest version"
    exit 1
fi

echo "📦 Latest version: $VERSION"

# Construct download URL
EXECUTABLE_NAME="kj-nomad-${PLATFORM}"
DOWNLOAD_URL="https://github.com/$GITHUB_REPO/releases/download/$VERSION/$EXECUTABLE_NAME"

echo "⬇️  Downloading from: $DOWNLOAD_URL"

# Create install directory
mkdir -p "$INSTALL_DIR"

# Download executable
TEMP_FILE="/tmp/$EXECUTABLE_NAME"
echo "📥 Downloading executable..."

if command -v curl >/dev/null 2>&1; then
    curl -L -o "$TEMP_FILE" "$DOWNLOAD_URL"
elif command -v wget >/dev/null 2>&1; then
    wget -O "$TEMP_FILE" "$DOWNLOAD_URL"
else
    echo "❌ Neither curl nor wget found. Please install one of them."
    exit 1
fi

# Verify download
if [ ! -f "$TEMP_FILE" ]; then
    echo "❌ Download failed"
    exit 1
fi

echo "✅ Download complete"

# Move to install directory and make executable
INSTALL_PATH="$INSTALL_DIR/$BINARY_NAME"
mv "$TEMP_FILE" "$INSTALL_PATH"
chmod +x "$INSTALL_PATH"

echo "📁 Installed to: $INSTALL_PATH"

# Create desktop entry for Linux
if [ "$OS" = "linux" ]; then
    DESKTOP_DIR="$HOME/.local/share/applications"
    mkdir -p "$DESKTOP_DIR"
    
    cat > "$DESKTOP_DIR/kj-nomad.desktop" << EOF
[Desktop Entry]
Name=KJ-Nomad
Comment=Professional Karaoke Hosting System
Exec=$INSTALL_PATH
Icon=microphone
Terminal=false
Type=Application
Categories=AudioVideo;Audio;
StartupNotify=true
EOF
    
    echo "🖥️  Desktop entry created"
fi

# Add to PATH if not already there
SHELL_RC=""
case "$SHELL" in
    */bash)
        SHELL_RC="$HOME/.bashrc"
        ;;
    */zsh)
        SHELL_RC="$HOME/.zshrc"
        ;;
    */fish)
        SHELL_RC="$HOME/.config/fish/config.fish"
        ;;
esac

if [ -n "$SHELL_RC" ] && [ -f "$SHELL_RC" ]; then
    if ! grep -q "$INSTALL_DIR" "$SHELL_RC"; then
        echo "" >> "$SHELL_RC"
        echo "# KJ-Nomad" >> "$SHELL_RC"
        echo "export PATH=\"$INSTALL_DIR:\$PATH\"" >> "$SHELL_RC"
        echo "🔧 Added to PATH in $SHELL_RC"
        echo "📝 Please restart your terminal or run: source $SHELL_RC"
    fi
fi

# Create sample directory structure
KARAOKE_DIR="$HOME/Karaoke"
if [ ! -d "$KARAOKE_DIR" ]; then
    mkdir -p "$KARAOKE_DIR"
    echo "📂 Created karaoke directory: $KARAOKE_DIR"
    
    # Create sample structure
    cat > "$KARAOKE_DIR/README.txt" << EOF
🎤 KJ-Nomad Karaoke Library

Add your karaoke video files here!

Supported formats: MP4, WebM, AVI, MOV

Recommended naming convention:
- Artist - Song Title.mp4
- Journey - Don't Stop Believin.mp4
- Queen - Bohemian Rhapsody.webm

For filler music, prefix with "filler-":
- filler-background-music.mp4

To get started:
1. Add video files to this directory
2. Run 'kj-nomad' in terminal
3. Follow the setup wizard
4. Start hosting karaoke!

Visit https://nomadkaraoke.com for more information.
EOF
fi

echo ""
echo "🎉 Installation Complete!"
echo "========================"
echo ""
echo "📍 Executable location: $INSTALL_PATH"
echo "📂 Karaoke library: $KARAOKE_DIR"
echo ""
echo "🚀 Quick Start:"
echo "1. Add video files to $KARAOKE_DIR"
echo "2. Run: $BINARY_NAME"
echo "3. Follow the setup wizard"
echo "4. Start hosting karaoke!"
echo ""
echo "📚 Documentation: https://github.com/$GITHUB_REPO"
echo "🎤 Professional Karaoke Hosting Made Simple!"