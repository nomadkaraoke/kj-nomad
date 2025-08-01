# 🎤 KJ-Nomad

**Modern, offline-first, beautiful karaoke hosting software for the modern KJ**

KJ-Nomad is a professional karaoke hosting system that runs entirely on your laptop, serving synchronized video to multiple screens on your local network. Perfect for mobile KJs, bars, and events - no internet required once set up!

![KJ-Nomad Demo](https://via.placeholder.com/800x400/4f46e5/ffffff?text=KJ-Nomad+Screenshots)

## ✨ Features

- 🖥️ **Multi-Screen Synchronization** - Player screens, KJ control, and singer request views
- 📱 **Mobile-First KJ Control** - Manage everything from your phone
- 🎵 **Offline Operation** - Works completely offline with your local media library
- 🎯 **Smart Queue Management** - Automatic singer rotation and filler music
- 🎨 **Dark/Light Mode** - Beautiful, clean interface with professional theming
- 📊 **Scrolling Ticker** - Display announcements and singer information
- 🔍 **Fuzzy Search** - Fast, intelligent song search
- 🎪 **Singer Self-Service** - QR code access for song requests
- 🎛️ **Professional Controls** - Key/tempo control, precise timing
- 🚀 **PWA Ready** - Install as an app on any device

## 🚀 Quick Start for KJs

### Option 1: Download Pre-built Release (Recommended)

1. **Download** the latest release from [GitHub Releases](../../releases)
2. **Extract** the zip file to your preferred location
3. **Add your music** files to the `media/` folder
4. **Double-click** `KJ-Nomad.exe` (Windows) or `KJ-Nomad` (Mac/Linux)
5. **Open your browser** to `http://localhost:8080`

### Option 2: One-Command Setup

If you have Node.js installed:

```bash
npx kj-nomad@latest
```

This will download, install, and start KJ-Nomad automatically.

## 📋 System Requirements

### Minimum Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: 4GB (8GB recommended)
- **Storage**: 50GB+ for music library
- **Network**: WiFi router for multi-device setup
- **Browsers**: Chrome 90+, Firefox 88+, Safari 14+ on client devices

### Recommended Hardware Setup
- **Host Computer**: Modern laptop with SSD drive
- **Player Displays**: Intel N-series Mini PCs (better than Raspberry Pi for video)
- **Network**: Dedicated WiFi router or hotspot
- **Audio**: External audio interface for professional sound

## 🏗️ Network Setup Guide

KJ-Nomad creates a local network-based karaoke system. Here's how to set it up:

### Basic Setup (Single Screen)
1. Start KJ-Nomad on your laptop
2. Open `http://localhost:8080` in your browser
3. Use the interface directly on your laptop

### Multi-Screen Setup
1. **Connect all devices** to the same WiFi network
2. **Start KJ-Nomad** on your host laptop
3. **Find your laptop's IP address** (displayed on startup)
4. **On player devices**, open: `http://[YOUR-IP]:8080/player`
5. **On KJ phone**, open: `http://[YOUR-IP]:8080/controller`
6. **For singer requests**, share: `http://[YOUR-IP]:8080/singer`

### Professional Setup with QR Codes
KJ-Nomad automatically generates QR codes for easy access:
- **Player Screen QR**: Direct access to player view
- **Singer Request QR**: For patron song requests
- **KJ Control QR**: For your mobile control interface

## 📁 File Organization

```
KJ-Nomad/
├── media/                    # Your karaoke video files
│   ├── Artist - Song.mp4     # Standard format: "Artist - Title.mp4"
│   ├── filler-music.mp4      # Background music (prefix with "filler-")
│   └── ...
├── KJ-Nomad.exe              # Main application (Windows)
├── KJ-Nomad                  # Main application (Mac/Linux)
└── README.md                 # This file
```

### Media File Naming
- **Karaoke Videos**: `Artist - Song Title.mp4` or `Artist - Song Title.webm`
- **Filler Music**: `filler-description.mp4` (any file starting with "filler-")
- **Supported Formats**: MP4, WebM (H.264/VP9 + AAC/Opus audio)

## 🎮 Usage Guide

### For KJs (Hosts)

#### Getting Started
1. **Launch KJ-Nomad** on your host computer
2. **Open the KJ Control interface** at `http://localhost:8080/controller`
3. **Set up your displays** by navigating player devices to `/player`
4. **Share the singer request link** (`/singer`) or QR code with patrons

#### Managing the Show
- **Queue Management**: View and reorder the song queue
- **Playback Control**: Play, pause, skip songs
- **Singer Rotation**: Automatic progression through queue
- **Ticker Messages**: Update scrolling announcements
- **Filler Music**: Automatic background music when queue is empty

#### Mobile Control
- **Phone-Optimized**: KJ control interface works perfectly on mobile
- **Quick Actions**: One-tap controls for common operations
- **Real-Time Updates**: See queue changes instantly
- **Dark Mode**: Easy on the eyes during shows

### For Singers (Patrons)

#### Requesting Songs
1. **Scan the QR code** or visit the singer request URL
2. **Enter your name** in the singer field
3. **Search for songs** using artist or title
4. **Select your song** and submit the request
5. **See your position** in the queue

#### Song Search Tips
- Search by **artist name**: "Taylor Swift"
- Search by **song title**: "Shake It Off"
- Use **partial matches**: "Shake" will find "Shake It Off"
- **Fuzzy search** handles typos and variations

## 🔧 Configuration

### Basic Settings
KJ-Nomad works great out-of-the-box, but you can customize:

- **Port**: Default is 8080, change in config if needed
- **Media Directory**: Point to your music library location
- **Ticker Settings**: Customize scrolling messages
- **Theme**: Choose between light and dark modes

### Advanced Configuration
For power users, see the [Advanced Configuration Guide](ADVANCED.md).

## 🆘 Troubleshooting

### Common Issues

#### "Can't connect to KJ-Nomad"
- **Check WiFi**: Ensure all devices are on the same network
- **Check IP address**: Verify you're using the correct IP from startup message
- **Check firewall**: Allow KJ-Nomad through your firewall
- **Restart KJ-Nomad**: Close and reopen the application

#### "Songs won't play"
- **Check file format**: Ensure videos are MP4 or WebM
- **Check file naming**: Use "Artist - Title.mp4" format
- **Check file permissions**: Ensure KJ-Nomad can read your media files
- **Check browser**: Use Chrome or Firefox for best compatibility

#### "Search doesn't find songs"
- **Check file names**: Ensure proper "Artist - Title" format
- **Restart application**: Refresh the media library scan
- **Check file location**: Ensure files are in the `media/` directory

#### "Player screens out of sync"
- **Check network**: Ensure stable WiFi connection
- **Refresh browsers**: Reload the player screens
- **Check hardware**: Verify player devices meet minimum requirements

### Getting Help
- **Documentation**: Check the full documentation at [docs/](docs/)
- **GitHub Issues**: Report bugs at [GitHub Issues](../../issues)
- **Community**: Join the KJ-Nomad community discussions
- **Email Support**: contact@nomadkaraoke.com

## 🛡️ Security & Privacy

- **Local Network Only**: KJ-Nomad runs entirely on your local network
- **No Cloud Connection**: Your music and data stay private
- **No Tracking**: No analytics or data collection
- **Open Source**: Full transparency - inspect the code yourself

## 🔄 Updates

KJ-Nomad automatically checks for updates and will notify you when new versions are available. Updates include:
- **Bug fixes** and performance improvements
- **New features** and interface enhancements
- **Security updates** and compatibility fixes

## 📝 License

KJ-Nomad is open source software licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

Built with ❤️ by [Nomad Karaoke](https://nomadkaraoke.com) for the karaoke community.

Special thanks to:
- The open source community for the amazing tools
- Beta testers and KJs who provided feedback
- The karaoke community for inspiration and support

---

**Need help?** Check our [troubleshooting guide](TROUBLESHOOTING.md) or [contact support](mailto:support@nomadkaraoke.com).

**Want to contribute?** See our [development guide](DEVELOPMENT.md) for technical contributors.