#!/bin/bash
# KJ-Nomad Quick Installer - One-line installation script

set -e

echo "🎤 KJ-Nomad Quick Installer"
echo "Downloading and running setup script..."
echo ""

# Download and run the setup script
if command -v curl &> /dev/null; then
    curl -fsSL https://raw.githubusercontent.com/nomadkaraoke/kj-nomad/main/scripts/setup.sh | bash
elif command -v wget &> /dev/null; then
    wget -qO- https://raw.githubusercontent.com/nomadkaraoke/kj-nomad/main/scripts/setup.sh | bash
else
    echo "❌ Neither curl nor wget found. Please install one of them and try again."
    echo ""
    echo "Alternative: Download the setup script manually from:"
    echo "https://raw.githubusercontent.com/nomadkaraoke/kj-nomad/main/scripts/setup.sh"
    echo ""
    echo "Then run: bash setup.sh"
    exit 1
fi