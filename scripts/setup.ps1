# KJ-Nomad Easy Setup Script for Windows PowerShell
# This script helps non-technical users set up KJ-Nomad quickly on Windows

Write-Host "🎤 KJ-Nomad Setup Script for Windows" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = & node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
        
        # Check Node.js version (need v18+)
        $majorVersion = [int]($nodeVersion -replace 'v', '' -split '\.')[0]
        if ($majorVersion -lt 18) {
            Write-Host "❌ Node.js version 18 or newer is required." -ForegroundColor Red
            Write-Host "Current version: $nodeVersion" -ForegroundColor Yellow
            Write-Host "Please update Node.js from https://nodejs.org/" -ForegroundColor Yellow
            exit 1
        }
    }
}
catch {
    Write-Host "❌ Node.js is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Download the LTS version (18.x or newer)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installing Node.js, run this script again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "🚀 Starting KJ-Nomad setup..." -ForegroundColor Green
Write-Host ""

# Create setup directory
$setupDir = "$env:USERPROFILE\KJ-Nomad"
if (Test-Path $setupDir) {
    Write-Host "📁 KJ-Nomad directory already exists at: $setupDir" -ForegroundColor Yellow
    $response = Read-Host "Do you want to update the existing installation? (y/n)"
    if ($response -notmatch '^[Yy]$') {
        Write-Host "Setup cancelled." -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 0
    }
} else {
    Write-Host "📁 Creating KJ-Nomad directory at: $setupDir" -ForegroundColor Green
    New-Item -ItemType Directory -Path $setupDir -Force | Out-Null
}

Set-Location $setupDir

# Download or update KJ-Nomad
if (Test-Path ".git") {
    Write-Host "🔄 Updating KJ-Nomad..." -ForegroundColor Blue
    & git pull origin main
} else {
    Write-Host "📥 Downloading KJ-Nomad..." -ForegroundColor Blue
    if (Get-Command git -ErrorAction SilentlyContinue) {
        & git clone https://github.com/nomadkaraoke/kj-nomad.git .
    } else {
        Write-Host "Git not found. Downloading as ZIP..." -ForegroundColor Yellow
        
        # Download ZIP file
        $zipUrl = "https://github.com/nomadkaraoke/kj-nomad/archive/main.zip"
        $zipFile = "$setupDir\kj-nomad.zip"
        
        try {
            Invoke-WebRequest -Uri $zipUrl -OutFile $zipFile -UseBasicParsing
            
            # Extract ZIP file
            Add-Type -AssemblyName System.IO.Compression.FileSystem
            [System.IO.Compression.ZipFile]::ExtractToDirectory($zipFile, $setupDir)
            
            # Move files from extracted folder
            $extractedFolder = "$setupDir\kj-nomad-main"
            if (Test-Path $extractedFolder) {
                Get-ChildItem $extractedFolder | Move-Item -Destination $setupDir
                Remove-Item $extractedFolder -Recurse -Force
            }
            
            Remove-Item $zipFile -Force
        }
        catch {
            Write-Host "❌ Failed to download KJ-Nomad. Please check your internet connection." -ForegroundColor Red
            Read-Host "Press Enter to exit"
            exit 1
        }
    }
}

# Install dependencies
Write-Host "📦 Installing server dependencies..." -ForegroundColor Blue
Set-Location "$setupDir\server"
& npm install --production

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install server dependencies." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "📦 Installing client dependencies..." -ForegroundColor Blue
Set-Location "$setupDir\client"
& npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install client dependencies." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Build the frontend
Write-Host "🏗️ Building frontend..." -ForegroundColor Blue
& npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build frontend." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Copy built frontend to server
Write-Host "📋 Setting up server files..." -ForegroundColor Blue
Set-Location "$setupDir\server"
if (!(Test-Path "public")) {
    New-Item -ItemType Directory -Path "public" -Force | Out-Null
}
Copy-Item "$setupDir\client\dist\*" "public" -Recurse -Force

# Create media directory if it doesn't exist
if (!(Test-Path "media")) {
    New-Item -ItemType Directory -Path "media" -Force | Out-Null
}

# Create sample media file info
$readmeFile = "media\README.txt"
if (!(Test-Path $readmeFile)) {
    @"
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
"@ | Out-File -FilePath $readmeFile -Encoding UTF8
}

# Create startup scripts
Write-Host "📝 Creating startup scripts..." -ForegroundColor Blue

# Create Node.js startup script
$startupScript = @"
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
console.log(\`   Local:    http://localhost:8080\`);
console.log(\`   Network:  http://\${localIP}:8080\`);
console.log('');
console.log('📱 Mobile interfaces:');
console.log(\`   KJ Control:      http://\${localIP}:8080/controller\`);
console.log(\`   Player Display:  http://\${localIP}:8080/player\`);
console.log(\`   Singer Requests: http://\${localIP}:8080/singer\`);
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
        console.log(\`❌ KJ-Nomad stopped unexpectedly (code \${code})\`);
    }
    process.exit(code);
});
"@

$startupScript | Out-File -FilePath "start-kj-nomad.js" -Encoding UTF8

# Create Windows batch file
$batchScript = @"
@echo off
cd /d "%~dp0"
echo Starting KJ-Nomad...
node start-kj-nomad.js
echo.
echo KJ-Nomad has stopped.
pause
"@

$batchScript | Out-File -FilePath "start-kj-nomad.bat" -Encoding ASCII

# Create PowerShell launcher
$psScript = @"
# KJ-Nomad PowerShell Launcher
Set-Location `$PSScriptRoot
Write-Host "🎤 Starting KJ-Nomad..." -ForegroundColor Cyan
& node start-kj-nomad.js
"@

$psScript | Out-File -FilePath "start-kj-nomad.ps1" -Encoding UTF8

# Create desktop shortcut
Write-Host "🖥️ Creating desktop shortcut..." -ForegroundColor Blue
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = "$desktopPath\KJ-Nomad.lnk"

try {
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath = "$setupDir\server\start-kj-nomad.bat"
    $Shortcut.WorkingDirectory = "$setupDir\server"
    $Shortcut.Description = "Professional Karaoke Hosting Software"
    $Shortcut.Save()
    Write-Host "✅ Desktop shortcut created: KJ-Nomad.lnk" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ Could not create desktop shortcut, but KJ-Nomad is ready to use." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 KJ-Nomad is installed at: $setupDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 To start KJ-Nomad:" -ForegroundColor Cyan
Write-Host "   Double-click: KJ-Nomad desktop shortcut" -ForegroundColor White
Write-Host "   OR double-click: $setupDir\server\start-kj-nomad.bat" -ForegroundColor White
Write-Host "   OR run PowerShell: $setupDir\server\start-kj-nomad.ps1" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   Setup guide: $setupDir\README.md" -ForegroundColor White
Write-Host "   Troubleshooting: $setupDir\TROUBLESHOOTING.md" -ForegroundColor White
Write-Host ""
Write-Host "🎵 Media files:" -ForegroundColor Cyan
Write-Host "   Add your karaoke videos to: $setupDir\server\media\" -ForegroundColor White
Write-Host "   See: $setupDir\server\media\README.txt for naming guidelines" -ForegroundColor White
Write-Host ""
Write-Host "🎉 You're ready to host karaoke!" -ForegroundColor Green
Write-Host ""

# Offer to start immediately
$response = Read-Host "Do you want to start KJ-Nomad now? (y/n)"
if ($response -match '^[Yy]$') {
    Write-Host "🚀 Starting KJ-Nomad..." -ForegroundColor Green
    Write-Host ""
    & node start-kj-nomad.js
} else {
    Write-Host "👋 Setup complete. You can start KJ-Nomad anytime using the desktop shortcut!" -ForegroundColor Green
    Read-Host "Press Enter to exit"
}