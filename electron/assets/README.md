# KJ-Nomad Electron Assets

This directory contains assets for the Electron desktop application.

## Required Icons

For proper desktop integration, the following icon files are needed:

- `icon.png` - Main app icon (512x512 PNG)
- `icon.ico` - Windows icon (multi-size ICO)
- `icon.icns` - macOS icon (multi-size ICNS)
- `tray-icon.png` - System tray icon (16x16 or 32x32 PNG)

## Icon Requirements

### Main App Icon (icon.png)
- Size: 512x512 pixels
- Format: PNG with transparency
- Content: KJ-Nomad logo or microphone/music themed icon

### Windows Icon (icon.ico)
- Multi-size ICO file containing: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
- Generated from the main PNG icon

### macOS Icon (icon.icns)
- Multi-size ICNS file for macOS app bundles
- Generated from the main PNG icon

### System Tray Icon (tray-icon.png)
- Size: 16x16 or 32x32 pixels (system will scale)
- Format: PNG with transparency
- Content: Simple monochrome version of main icon

## Generating Icons

You can use tools like:
- **ImageMagick**: `convert icon.png -resize 16x16 tray-icon.png`
- **electron-icon-builder**: `npm install -g electron-icon-builder && electron-icon-builder --input=icon.png --output=./`
- **Online converters**: For ICO and ICNS generation

## Current Status

🔄 **Placeholder icons needed** - Add proper KJ-Nomad branded icons for professional appearance.
