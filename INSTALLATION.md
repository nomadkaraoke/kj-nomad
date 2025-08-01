# 📦 KJ-Nomad Installation Guide

This guide provides multiple installation options for different user comfort levels with technology.

## 🚀 Quick Start (Recommended for Most Users)

### Option 1: One-Line Install (Mac/Linux)

Open Terminal and run:

```bash
curl -fsSL https://raw.githubusercontent.com/nomadkaraoke/kj-nomad/main/scripts/quick-install.sh | bash
```

**What this does:**
- Downloads and runs the setup script automatically
- Installs KJ-Nomad to your home directory
- Creates shortcuts and desktop icons
- Sets up everything you need to get started

### Option 2: Download Pre-Built Release

1. **Go to [GitHub Releases](https://github.com/nomadkaraoke/kj-nomad/releases)**
2. **Download** the appropriate file for your system:
   - **Windows**: `kj-nomad-windows.zip`
   - **Mac**: `kj-nomad-macos.tar.gz`
   - **Linux**: `kj-nomad-linux.tar.gz`
3. **Extract** the downloaded file to your preferred location
4. **Double-click** the executable to start KJ-Nomad

### Option 3: PowerShell Install (Windows)

1. **Right-click** on Start button → **Windows PowerShell (Admin)**
2. **Run this command:**
   ```powershell
   Invoke-WebRequest -Uri "https://raw.githubusercontent.com/nomadkaraoke/kj-nomad/main/scripts/setup.ps1" -OutFile "$env:TEMP\kj-nomad-setup.ps1"; & "$env:TEMP\kj-nomad-setup.ps1"
   ```

## 🛠️ Manual Installation (For Tech-Savvy Users)

### Prerequisites

- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **Git** (optional but recommended)

### Step-by-Step Manual Install

1. **Clone or Download the Repository**
   ```bash
   git clone https://github.com/nomadkaraoke/kj-nomad.git
   cd kj-nomad
   ```

2. **Install Server Dependencies**
   ```bash
   cd server
   npm install --production
   ```

3. **Install Client Dependencies and Build**
   ```bash
   cd ../client
   npm install
   npm run build
   ```

4. **Set Up Server Files**
   ```bash
   cd ../server
   mkdir -p public media
   cp -r ../client/dist/* public/
   ```

5. **Start KJ-Nomad**
   ```bash
   npm start
   ```

## 🔧 Development Installation

For contributors and developers who want to modify KJ-Nomad:

### Prerequisites

- **Node.js 18+**
- **Git**
- **Code editor** (VS Code recommended)

### Development Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/nomadkaraoke/kj-nomad.git
   cd kj-nomad
   ```

2. **Install All Dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install  # Note: NOT --production

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Start Development Servers**

   **Terminal 1 (Backend):**
   ```bash
   cd server
   npm run dev
   ```

   **Terminal 2 (Frontend):**
   ```bash
   cd client
   npm run dev
   ```

4. **Access Development Interface**
   - Frontend dev server: `http://localhost:5173`
   - Backend API: `http://localhost:8080`

### Development Commands

```bash
# Run tests
npm test                    # Run all tests
npm run test:watch         # Watch mode for tests

# Code quality
npm run lint               # Check code style
npm run lint:fix           # Fix auto-fixable issues
npm run type-check         # TypeScript type checking

# Build for production
npm run build              # Build frontend
npm run package            # Create executable (server)
```

## 📁 Directory Structure After Installation

```
KJ-Nomad/
├── server/                 # Backend server
│   ├── src/               # Server source code
│   ├── media/             # Your karaoke video files
│   ├── public/            # Built frontend files
│   ├── start-kj-nomad.js  # Startup script
│   └── package.json
├── client/                # Frontend source (dev only)
├── scripts/               # Installation scripts
├── README.md              # Main documentation
├── TROUBLESHOOTING.md     # Help guide
└── INSTALLATION.md        # This file
```

## 🎵 Adding Your Music

After installation, add your karaoke videos to the `media/` directory:

### File Naming Convention

```
✅ Correct format:
   "Artist - Song Title.mp4"
   "Taylor Swift - Shake It Off.mp4"
   "Beatles - Hey Jude.mp4"

✅ Filler music:
   "filler-jazz-background.mp4"
   "filler-party-music.mp4"

❌ Incorrect format:
   "track01.mp4"
   "Shake It Off by Taylor Swift.mp4"
   "taylor_swift_shake_it_off.mp4"
```

### Supported Formats

- **Video**: MP4 (H.264), WebM (VP9)
- **Audio**: AAC, Opus
- **Recommended**: MP4 with H.264 video and AAC audio

## 🌐 Network Setup

### Basic Setup (Single Computer)

1. Start KJ-Nomad
2. Open `http://localhost:8080` in your browser
3. You're ready to go!

### Multi-Device Setup

1. **Connect all devices to the same WiFi network**
2. **Start KJ-Nomad** - note the IP address shown (e.g., `192.168.1.100`)
3. **Set up device URLs:**
   - **KJ Control (your phone)**: `http://192.168.1.100:8080/controller`
   - **Player displays**: `http://192.168.1.100:8080/player`
   - **Singer requests**: `http://192.168.1.100:8080/singer`

### Professional Setup Tips

- **Dedicated router**: Use a separate WiFi router for the karaoke system
- **Wired connections**: Connect player displays via Ethernet for best performance
- **5GHz WiFi**: Use 5GHz band for better performance with multiple devices
- **Device recommendations**: Intel N-series mini PCs work better than Raspberry Pi

## 🔒 Firewall Configuration

### Windows

1. **Windows Defender Firewall** → **Allow an app through firewall**
2. **Add KJ-Nomad** (or Node.js) to the exceptions
3. **Allow both private and public networks**

### Mac

1. **System Preferences** → **Security & Privacy** → **Firewall**
2. **Add Node.js** to the allowed applications
3. **Allow incoming connections**

### Linux

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 8080

# Firewalld (RHEL/CentOS)
sudo firewall-cmd --add-port=8080/tcp --permanent
sudo firewall-cmd --reload
```

## 🆘 Troubleshooting

### Installation Issues

**"Node.js not found"**
- Install Node.js from [nodejs.org](https://nodejs.org/)
- Restart your terminal/command prompt after installation

**"Permission denied" (Mac/Linux)**
- Add `sudo` before the command (not recommended)
- Better: Fix permissions with `chmod +x setup.sh`

**"Cannot download files"**
- Check internet connection
- Corporate firewall may block downloads
- Download manually from GitHub releases page

### Common Problems

- **Can't connect to KJ-Nomad**: Check firewall settings
- **Songs won't play**: Verify file format and naming
- **Slow performance**: Check network connection and hardware specs

For detailed troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## 📞 Getting Help

- **Documentation**: [README.md](README.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **GitHub Issues**: [Report a bug](https://github.com/nomadkaraoke/kj-nomad/issues)
- **Email**: support@nomadkaraoke.com

## 🔄 Updating KJ-Nomad

### Automatic Updates (Installed via Script)

Run the setup script again:
```bash
curl -fsSL https://raw.githubusercontent.com/nomadkaraoke/kj-nomad/main/scripts/quick-install.sh | bash
```

### Manual Updates

1. **Download latest release** from GitHub
2. **Stop KJ-Nomad** if running
3. **Replace files** with new version
4. **Keep your media directory** - don't delete your songs!
5. **Restart KJ-Nomad**

---

**Ready to rock?** 🎸 Once installed, see the [README.md](README.md) for usage instructions!