# KJ-Nomad Professional Karaoke System Installer
# For Windows PowerShell

param(
    [string]$InstallDir = "$env:LOCALAPPDATA\KJ-Nomad",
    [switch]$AddToPath = $true,
    [switch]$CreateShortcuts = $true
)

Write-Host "🎤 KJ-Nomad Professional Karaoke System Installer" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$AppName = "KJ-Nomad"
$GitHubRepo = "nomadkaraoke/kj-nomad"
$BinaryName = "kj-nomad.exe"

# Detect architecture
$Arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
$Platform = "win-$Arch"

Write-Host "🖥️  Detected platform: Windows $Arch" -ForegroundColor Green

# Check if running as administrator for system-wide install
$IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if ($IsAdmin) {
    Write-Host "👑 Running as Administrator - system-wide install available" -ForegroundColor Yellow
    $SystemInstall = Read-Host "Install system-wide for all users? [y/N]"
    if ($SystemInstall -eq 'y' -or $SystemInstall -eq 'Y') {
        $InstallDir = "$env:ProgramFiles\KJ-Nomad"
    }
}

Write-Host "📁 Install directory: $InstallDir" -ForegroundColor Green

# Get latest release
Write-Host "📡 Fetching latest release..." -ForegroundColor Blue

try {
    $LatestRelease = Invoke-RestMethod -Uri "https://api.github.com/repos/$GitHubRepo/releases/latest"
    $Version = $LatestRelease.tag_name
    Write-Host "📦 Latest version: $Version" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get latest version: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Construct download URL
$ExecutableName = "kj-nomad-$Platform.exe"
$DownloadUrl = "https://github.com/$GitHubRepo/releases/download/$Version/$ExecutableName"
$TempFile = "$env:TEMP\$ExecutableName"

Write-Host "⬇️  Downloading from: $DownloadUrl" -ForegroundColor Blue

# Download executable
try {
    Write-Host "📥 Downloading executable..." -ForegroundColor Blue
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $TempFile -UseBasicParsing
    Write-Host "✅ Download complete" -ForegroundColor Green
} catch {
    Write-Host "❌ Download failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create install directory
if (!(Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    Write-Host "📁 Created install directory" -ForegroundColor Green
}

# Move executable to install directory
$InstallPath = Join-Path $InstallDir $BinaryName
try {
    Move-Item $TempFile $InstallPath -Force
    Write-Host "📁 Installed to: $InstallPath" -ForegroundColor Green
} catch {
    Write-Host "❌ Installation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Add to PATH
if ($AddToPath) {
    $CurrentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    if ($CurrentPath -notlike "*$InstallDir*") {
        $NewPath = "$CurrentPath;$InstallDir"
        [Environment]::SetEnvironmentVariable("PATH", $NewPath, "User")
        Write-Host "🔧 Added to user PATH" -ForegroundColor Green
        Write-Host "📝 Please restart your terminal to use 'kj-nomad' command" -ForegroundColor Yellow
    }
}

# Create desktop shortcut
if ($CreateShortcuts) {
    $DesktopPath = [Environment]::GetFolderPath("Desktop")
    $ShortcutPath = Join-Path $DesktopPath "KJ-Nomad.lnk"
    
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = $InstallPath
    $Shortcut.WorkingDirectory = Split-Path $InstallPath
    $Shortcut.Description = "Professional Karaoke Hosting System"
    $Shortcut.Save()
    
    Write-Host "🖥️  Desktop shortcut created" -ForegroundColor Green
    
    # Create Start Menu shortcut
    $StartMenuPath = [Environment]::GetFolderPath("StartMenu")
    $StartMenuFolder = Join-Path $StartMenuPath "Programs\KJ-Nomad"
    if (!(Test-Path $StartMenuFolder)) {
        New-Item -ItemType Directory -Path $StartMenuFolder -Force | Out-Null
    }
    
    $StartMenuShortcut = Join-Path $StartMenuFolder "KJ-Nomad.lnk"
    $Shortcut2 = $WshShell.CreateShortcut($StartMenuShortcut)
    $Shortcut2.TargetPath = $InstallPath
    $Shortcut2.WorkingDirectory = Split-Path $InstallPath
    $Shortcut2.Description = "Professional Karaoke Hosting System"
    $Shortcut2.Save()
    
    Write-Host "📋 Start Menu shortcut created" -ForegroundColor Green
}

# Create sample karaoke directory
$KaraokeDir = Join-Path $env:USERPROFILE "Karaoke"
if (!(Test-Path $KaraokeDir)) {
    New-Item -ItemType Directory -Path $KaraokeDir -Force | Out-Null
    Write-Host "📂 Created karaoke directory: $KaraokeDir" -ForegroundColor Green
    
    # Create sample README
    $ReadmeContent = @"
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
2. Double-click the KJ-Nomad desktop shortcut
3. Follow the setup wizard
4. Start hosting karaoke!

Visit https://nomadkaraoke.com for more information.
"@
    
    $ReadmePath = Join-Path $KaraokeDir "README.txt"
    $ReadmeContent | Out-File -FilePath $ReadmePath -Encoding UTF8
}

# Create uninstaller
$UninstallerContent = @"
# KJ-Nomad Uninstaller
Write-Host "🗑️  Uninstalling KJ-Nomad..." -ForegroundColor Yellow

# Remove installation directory
if (Test-Path "$InstallDir") {
    Remove-Item "$InstallDir" -Recurse -Force
    Write-Host "✅ Removed installation directory" -ForegroundColor Green
}

# Remove from PATH
`$CurrentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if (`$CurrentPath -like "*$InstallDir*") {
    `$NewPath = `$CurrentPath.Replace(";$InstallDir", "").Replace("$InstallDir;", "").Replace("$InstallDir", "")
    [Environment]::SetEnvironmentVariable("PATH", `$NewPath, "User")
    Write-Host "✅ Removed from PATH" -ForegroundColor Green
}

# Remove shortcuts
`$DesktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "KJ-Nomad.lnk"
if (Test-Path `$DesktopShortcut) {
    Remove-Item `$DesktopShortcut -Force
    Write-Host "✅ Removed desktop shortcut" -ForegroundColor Green
}

`$StartMenuFolder = Join-Path ([Environment]::GetFolderPath("StartMenu")) "Programs\KJ-Nomad"
if (Test-Path `$StartMenuFolder) {
    Remove-Item `$StartMenuFolder -Recurse -Force
    Write-Host "✅ Removed Start Menu shortcuts" -ForegroundColor Green
}

Write-Host "🎤 KJ-Nomad uninstalled successfully!" -ForegroundColor Green
Write-Host "📂 Your karaoke library at $KaraokeDir has been preserved." -ForegroundColor Blue
"@

$UninstallerPath = Join-Path $InstallDir "uninstall.ps1"
$UninstallerContent | Out-File -FilePath $UninstallerPath -Encoding UTF8

Write-Host ""
Write-Host "🎉 Installation Complete!" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Executable location: $InstallPath" -ForegroundColor White
Write-Host "📂 Karaoke library: $KaraokeDir" -ForegroundColor White
Write-Host "🗑️  Uninstaller: $UninstallerPath" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Quick Start:" -ForegroundColor Yellow
Write-Host "1. Add video files to $KaraokeDir" -ForegroundColor White
Write-Host "2. Double-click the KJ-Nomad desktop shortcut" -ForegroundColor White
Write-Host "3. Follow the setup wizard" -ForegroundColor White
Write-Host "4. Start hosting karaoke!" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation: https://github.com/$GitHubRepo" -ForegroundColor Blue
Write-Host "🎤 Professional Karaoke Hosting Made Simple!" -ForegroundColor Cyan