#!/usr/bin/env node

/**
 * KJ-Nomad Executable Packaging Script
 * Creates self-contained executables for Windows, Mac, and Linux
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PLATFORMS = {
  'win-x64': { os: 'Windows', arch: 'x64', ext: '.exe' },
  'macos-x64': { os: 'macOS', arch: 'x64', ext: '' },
  'macos-arm64': { os: 'macOS', arch: 'ARM64', ext: '' },
  'linux-x64': { os: 'Linux', arch: 'x64', ext: '' },
  'linux-arm64': { os: 'Linux', arch: 'ARM64', ext: '' }
};

const PKG_VERSION = '5.8.1'; // pkg version
const APP_VERSION = require('./package.json').version;

console.log('🎤 KJ-Nomad Executable Packaging Tool');
console.log('=====================================\n');

/**
 * Check if required tools are installed
 */
function checkDependencies() {
  console.log('📋 Checking dependencies...');
  
  try {
    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`✅ Node.js: ${nodeVersion}`);
    
    // Check npm
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`✅ npm: ${npmVersion}`);
    
    // Check if pkg is installed globally, if not install it
    try {
      const pkgVersion = execSync('pkg --version', { encoding: 'utf8' }).trim();
      console.log(`✅ pkg: ${pkgVersion}`);
    } catch (error) {
      console.log('⚠️  pkg not found globally, installing...');
      execSync(`npm install -g pkg@${PKG_VERSION}`, { stdio: 'inherit' });
      console.log('✅ pkg installed successfully');
    }
    
    console.log('');
  } catch (error) {
    console.error('❌ Dependency check failed:', error.message);
    process.exit(1);
  }
}

/**
 * Build the client (React frontend)
 */
function buildClient() {
  console.log('🔨 Building React client...');
  
  try {
    process.chdir('client');
    
    // Install dependencies if needed
    if (!fs.existsSync('node_modules')) {
      console.log('📦 Installing client dependencies...');
      execSync('npm install', { stdio: 'inherit' });
    }
    
    // Build production version
    console.log('🏗️  Building production client...');
    execSync('npm run build', { stdio: 'inherit' });
    
    process.chdir('..');
    console.log('✅ Client build complete\n');
  } catch (error) {
    console.error('❌ Client build failed:', error.message);
    process.exit(1);
  }
}

/**
 * Build the server (Node.js backend)
 */
function buildServer() {
  console.log('🔨 Building Node.js server...');
  
  try {
    process.chdir('server');
    
    // Install dependencies if needed
    if (!fs.existsSync('node_modules')) {
      console.log('📦 Installing server dependencies...');
      execSync('npm install', { stdio: 'inherit' });
    }
    
    // Build TypeScript
    console.log('🏗️  Compiling TypeScript...');
    execSync('npm run build', { stdio: 'inherit' });
    
    process.chdir('..');
    console.log('✅ Server build complete\n');
  } catch (error) {
    console.error('❌ Server build failed:', error.message);
    process.exit(1);
  }
}

/**
 * Copy client build to server public directory
 */
function copyClientToServer() {
  console.log('📂 Copying client to server...');
  
  const clientBuildPath = path.join('client', 'dist');
  const serverPublicPath = path.join('server', 'public');
  
  try {
    // Remove existing public directory
    if (fs.existsSync(serverPublicPath)) {
      fs.rmSync(serverPublicPath, { recursive: true, force: true });
    }
    
    // Create public directory
    fs.mkdirSync(serverPublicPath, { recursive: true });
    
    // Copy client build to server public
    execSync(`cp -r "${clientBuildPath}"/* "${serverPublicPath}"/`, { stdio: 'inherit' });
    
    console.log('✅ Client copied to server\n');
  } catch (error) {
    console.error('❌ Failed to copy client to server:', error.message);
    process.exit(1);
  }
}

/**
 * Create pkg configuration
 */
function createPkgConfig() {
  console.log('⚙️  Creating pkg configuration...');
  
  const pkgConfig = {
    name: 'kj-nomad',
    version: APP_VERSION,
    description: 'Professional Karaoke Hosting System',
    main: 'server/dist/index.js',
    scripts: {},
    pkg: {
      targets: Object.keys(PLATFORMS).map(platform => `node18-${platform.replace('-', '-')}`),
      assets: [
        'server/public/**/*',
        'server/media/**/*',
        'server/config/**/*'
      ],
      outputPath: 'dist'
    }
  };
  
  fs.writeFileSync('pkg.json', JSON.stringify(pkgConfig, null, 2));
  console.log('✅ pkg configuration created\n');
}

/**
 * Package executables for all platforms
 */
function packageExecutables() {
  console.log('📦 Packaging executables...');
  
  // Create dist directory
  const distDir = 'dist';
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
  }
  
  const serverDir = 'server';
  const mainScript = path.join(serverDir, 'dist', 'index.js');
  
  if (!fs.existsSync(mainScript)) {
    console.error('❌ Server build not found. Please run build first.');
    process.exit(1);
  }
  
  for (const [platform, info] of Object.entries(PLATFORMS)) {
    console.log(`🏗️  Building for ${info.os} (${info.arch})...`);
    
    const outputName = `kj-nomad-${platform}${info.ext}`;
    const outputPath = path.join(distDir, outputName);
    
    try {
      const pkgCommand = [
        'pkg',
        mainScript,
        '--target', `node18-${platform}`,
        '--output', outputPath,
        '--compress', 'Brotli'
      ];
      
      execSync(pkgCommand.join(' '), { stdio: 'inherit' });
      
      const stats = fs.statSync(outputPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
      
      console.log(`✅ ${outputName} (${sizeMB} MB)`);
    } catch (error) {
      console.error(`❌ Failed to build ${platform}:`, error.message);
    }
  }
  
  console.log('');
}

/**
 * Create installation packages and instructions
 */
function createInstallationPackages() {
  console.log('📋 Creating installation packages...');
  
  const distDir = 'dist';
  
  // Create README for each platform
  const readmeContent = `# KJ-Nomad Professional Karaoke System

## Quick Start

1. **Download** the executable for your platform
2. **Create a folder** for your karaoke library (e.g., \`C:\\Karaoke\` or \`~/Karaoke\`)
3. **Add video files** to your library folder (MP4, WebM, AVI, MOV supported)
4. **Run the executable** - it will auto-launch your browser
5. **Follow the setup wizard** to configure your library

## Features

✅ **Offline Mode MVP** - Complete offline karaoke system
✅ **Auto Browser Launch** - One-click startup
✅ **Setup Wizard** - Easy media library configuration  
✅ **Perfect Video Sync** - <100ms synchronization across screens
✅ **Multi-Screen Management** - Control unlimited player displays
✅ **Paper Workflow** - Efficient traditional slip management
✅ **Cloud Mode** - Connect to nomadkaraoke.com for remote singers

## System Requirements

- **Operating System**: Windows 10+, macOS 10.14+, or Linux (Ubuntu 18.04+)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB for app + space for your video library
- **Network**: Optional (for cloud mode and remote players)

## File Naming Convention

For best results, name your karaoke files like:
- \`Artist - Song Title.mp4\`
- \`Journey - Don't Stop Believin.mp4\`
- \`Queen - Bohemian Rhapsody.webm\`

Filler music should start with "filler-":
- \`filler-background-music.mp4\`

## Usage

### Offline Mode
1. Run the executable
2. Open \`http://localhost:8080\` for admin interface
3. Connect player screens to \`http://[your-ip]:8080/player\`
4. All screens will automatically sync video playback

### Cloud Mode (Online)
1. Get a session ID from nomadkaraoke.com
2. Run: \`ENABLE_CLOUD=true ./kj-nomad --session=YOUR_SESSION_ID\`
3. Singers can request remotely at \`sing.nomadkaraoke.com\`

## Support

- **Website**: https://nomadkaraoke.com
- **Documentation**: https://github.com/nomadkaraoke/kj-nomad
- **Issues**: https://github.com/nomadkaraoke/kj-nomad/issues

---

🎤 **Professional Karaoke Hosting Made Simple** 🎤
`;

  // Create README files
  fs.writeFileSync(path.join(distDir, 'README.md'), readmeContent);
  fs.writeFileSync(path.join(distDir, 'README.txt'), readmeContent);
  
  // Create simple batch/shell scripts for Windows/Unix
  const windowsScript = `@echo off
title KJ-Nomad Professional Karaoke System
echo.
echo 🎤 Starting KJ-Nomad Karaoke System...
echo.
kj-nomad-win-x64.exe
pause`;

  const unixScript = `#!/bin/bash
echo "🎤 Starting KJ-Nomad Karaoke System..."
echo ""
./kj-nomad-$(uname -s | tr '[:upper:]' '[:lower:]')-x64
echo ""
echo "Press any key to continue..."
read -n 1`;

  fs.writeFileSync(path.join(distDir, 'start-windows.bat'), windowsScript);
  fs.writeFileSync(path.join(distDir, 'start-unix.sh'), unixScript);
  
  // Make Unix script executable
  try {
    execSync(`chmod +x "${path.join(distDir, 'start-unix.sh')}"`);
  } catch (error) {
    // Ignore chmod errors on non-Unix systems
  }
  
  console.log('✅ Installation packages created\n');
}

/**
 * Generate release summary
 */
function generateReleaseSummary() {
  console.log('📊 Release Summary');
  console.log('==================');
  
  const distDir = 'dist';
  const files = fs.readdirSync(distDir);
  
  console.log(`📅 Version: ${APP_VERSION}`);
  console.log(`📂 Output Directory: ${path.resolve(distDir)}`);
  console.log('📦 Generated Files:');
  
  files.forEach(file => {
    const filePath = path.join(distDir, file);
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    
    if (file.includes('kj-nomad-')) {
      const platform = file.replace('kj-nomad-', '').replace(/\.(exe)?$/, '');
      const platformInfo = PLATFORMS[platform];
      if (platformInfo) {
        console.log(`  🖥️  ${file} - ${platformInfo.os} ${platformInfo.arch} (${sizeMB} MB)`);
      } else {
        console.log(`  📄 ${file} (${sizeMB} MB)`);
      }
    } else {
      console.log(`  📄 ${file}`);
    }
  });
  
  console.log('\n🎉 Build Complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Test executables on target platforms');
  console.log('2. Create release on GitHub with these files');
  console.log('3. Update documentation with download links');
  console.log('\n🎤 Professional Karaoke Hosting Made Simple! 🎤');
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node package-executable.js [options]

Options:
  --skip-deps     Skip dependency check
  --skip-build    Skip building (use existing builds)
  --platforms     Comma-separated list of platforms to build
  --help, -h      Show this help message

Examples:
  node package-executable.js
  node package-executable.js --platforms win-x64,macos-x64
  node package-executable.js --skip-build
`);
    return;
  }
  
  try {
    if (!args.includes('--skip-deps')) {
      checkDependencies();
    }
    
    if (!args.includes('--skip-build')) {
      buildClient();
      buildServer();
      copyClientToServer();
    }
    
    createPkgConfig();
    packageExecutables();
    createInstallationPackages();
    generateReleaseSummary();
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  main,
  checkDependencies,
  buildClient,
  buildServer,
  packageExecutables
};