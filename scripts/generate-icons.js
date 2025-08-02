#!/usr/bin/env node

/**
 * KJ-Nomad Icon Generation Script
 * Generates all required icon formats from the SVG source
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ICON_SIZES = {
  'icon.png': 512,
  'icon-256.png': 256,
  'icon-128.png': 128,
  'icon-64.png': 64,
  'icon-32.png': 32,
  'icon-16.png': 16,
  'tray-icon.png': 32,
  'tray-icon@2x.png': 64
};

console.log('🎨 KJ-Nomad Icon Generation');
console.log('============================\n');

/**
 * Check if ImageMagick is available
 */
function checkImageMagick() {
  try {
    execSync('convert -version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if Inkscape is available
 */
function checkInkscape() {
  try {
    execSync('inkscape --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate PNG icons from SVG using available tools
 */
function generatePNGIcons() {
  const svgPath = path.join('electron', 'assets', 'icon.svg');
  const assetsDir = path.join('electron', 'assets');
  
  if (!fs.existsSync(svgPath)) {
    console.error('❌ SVG icon not found:', svgPath);
    process.exit(1);
  }
  
  const hasImageMagick = checkImageMagick();
  const hasInkscape = checkInkscape();
  
  if (!hasImageMagick && !hasInkscape) {
    console.log('⚠️  Neither ImageMagick nor Inkscape found.');
    console.log('📋 Manual icon generation required:');
    console.log('   1. Open electron/assets/icon.svg in a graphics editor');
    console.log('   2. Export the following PNG files to electron/assets/:');
    
    Object.entries(ICON_SIZES).forEach(([filename, size]) => {
      console.log(`      - ${filename} (${size}x${size})`);
    });
    
    console.log('\n🔧 To install tools:');
    console.log('   macOS: brew install imagemagick inkscape');
    console.log('   Ubuntu: sudo apt install imagemagick inkscape');
    console.log('   Windows: Download from official websites');
    return false;
  }
  
  console.log(`🔧 Using ${hasInkscape ? 'Inkscape' : 'ImageMagick'} for PNG generation...`);
  
  Object.entries(ICON_SIZES).forEach(([filename, size]) => {
    const outputPath = path.join(assetsDir, filename);
    
    try {
      if (hasInkscape) {
        // Inkscape generally produces better quality from SVG
        execSync(`inkscape "${svgPath}" --export-filename="${outputPath}" --export-width=${size} --export-height=${size}`, { stdio: 'pipe' });
      } else {
        // Fallback to ImageMagick
        execSync(`convert "${svgPath}" -resize ${size}x${size} "${outputPath}"`, { stdio: 'pipe' });
      }
      
      console.log(`✅ Generated ${filename} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Failed to generate ${filename}:`, error.message);
    }
  });
  
  return true;
}

/**
 * Generate ICO file for Windows
 */
function generateICO() {
  const assetsDir = path.join('electron', 'assets');
  const icoPath = path.join(assetsDir, 'icon.ico');
  
  if (!checkImageMagick()) {
    console.log('⚠️  ImageMagick not found, skipping ICO generation');
    console.log('📋 Manual ICO generation: Use online converter or Windows tools');
    return false;
  }
  
  try {
    // Create ICO with multiple sizes
    const iconFiles = [
      'icon-16.png',
      'icon-32.png', 
      'icon-64.png',
      'icon-128.png',
      'icon-256.png'
    ].map(f => path.join(assetsDir, f)).filter(f => fs.existsSync(f));
    
    if (iconFiles.length === 0) {
      console.log('⚠️  No PNG icons found for ICO generation');
      return false;
    }
    
    const command = `convert ${iconFiles.join(' ')} "${icoPath}"`;
    execSync(command, { stdio: 'pipe' });
    
    console.log('✅ Generated icon.ico (multi-size)');
    return true;
  } catch (error) {
    console.error('❌ Failed to generate ICO:', error.message);
    return false;
  }
}

/**
 * Generate ICNS file for macOS
 */
function generateICNS() {
  const assetsDir = path.join('electron', 'assets');
  const icnsPath = path.join(assetsDir, 'icon.icns');
  
  // Check for iconutil (macOS only)
  try {
    execSync('iconutil --version', { stdio: 'pipe' });
  } catch (error) {
    console.log('⚠️  iconutil not found (macOS only), skipping ICNS generation');
    console.log('📋 Manual ICNS generation: Use online converter or macOS tools');
    return false;
  }
  
  try {
    // Create iconset directory structure
    const iconsetDir = path.join(assetsDir, 'icon.iconset');
    if (fs.existsSync(iconsetDir)) {
      fs.rmSync(iconsetDir, { recursive: true });
    }
    fs.mkdirSync(iconsetDir);
    
    // Copy PNG files with proper naming for iconset
    const iconsetFiles = {
      'icon-16.png': 'icon_16x16.png',
      'icon-32.png': 'icon_16x16@2x.png',
      'icon-32.png': 'icon_32x32.png', 
      'icon-64.png': 'icon_32x32@2x.png',
      'icon-128.png': 'icon_128x128.png',
      'icon-256.png': 'icon_128x128@2x.png',
      'icon-256.png': 'icon_256x256.png',
      'icon.png': 'icon_256x256@2x.png',
      'icon.png': 'icon_512x512.png'
    };
    
    Object.entries(iconsetFiles).forEach(([source, dest]) => {
      const sourcePath = path.join(assetsDir, source);
      const destPath = path.join(iconsetDir, dest);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
      }
    });
    
    // Generate ICNS
    execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`, { stdio: 'pipe' });
    
    // Clean up iconset directory
    fs.rmSync(iconsetDir, { recursive: true });
    
    console.log('✅ Generated icon.icns (macOS)');
    return true;
  } catch (error) {
    console.error('❌ Failed to generate ICNS:', error.message);
    return false;
  }
}

/**
 * Validate generated icons
 */
function validateIcons() {
  console.log('\n📋 Icon Validation:');
  
  const assetsDir = path.join('electron', 'assets');
  const requiredIcons = ['icon.png', 'tray-icon.png'];
  const optionalIcons = ['icon.ico', 'icon.icns'];
  
  let allRequired = true;
  
  requiredIcons.forEach(icon => {
    const iconPath = path.join(assetsDir, icon);
    if (fs.existsSync(iconPath)) {
      const stats = fs.statSync(iconPath);
      console.log(`✅ ${icon} (${(stats.size / 1024).toFixed(1)} KB)`);
    } else {
      console.log(`❌ ${icon} - MISSING (required)`);
      allRequired = false;
    }
  });
  
  optionalIcons.forEach(icon => {
    const iconPath = path.join(assetsDir, icon);
    if (fs.existsSync(iconPath)) {
      const stats = fs.statSync(iconPath);
      console.log(`✅ ${icon} (${(stats.size / 1024).toFixed(1)} KB)`);
    } else {
      console.log(`⚠️  ${icon} - Missing (optional, platform-specific)`);
    }
  });
  
  return allRequired;
}

/**
 * Main execution
 */
function main() {
  try {
    console.log('🎯 Generating icons from SVG...\n');
    
    const pngSuccess = generatePNGIcons();
    if (pngSuccess) {
      generateICO();
      generateICNS();
    }
    
    const isValid = validateIcons();
    
    if (isValid) {
      console.log('\n🎉 Icon generation complete!');
      console.log('📦 Ready for Electron packaging');
    } else {
      console.log('\n⚠️  Some required icons are missing');
      console.log('📋 Please generate them manually or install required tools');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Icon generation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  main,
  generatePNGIcons,
  generateICO,
  generateICNS,
  validateIcons
};
