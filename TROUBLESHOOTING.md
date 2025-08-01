# 🔧 KJ-Nomad Troubleshooting Guide

This guide helps resolve common issues KJs encounter when using KJ-Nomad.

## 🚨 Emergency Quick Fixes

### Can't Access KJ-Nomad at All
1. **Check if KJ-Nomad is running**: Look for the KJ-Nomad window on your computer
2. **Restart KJ-Nomad**: Close the application completely and reopen it
3. **Check the startup message**: Note the IP address and port displayed
4. **Try localhost first**: Go to `http://localhost:8080` on the host computer

### Show Must Go On - Critical Issues
1. **Switch to backup**: Have a backup karaoke system ready
2. **Use host computer directly**: Access KJ-Nomad on the main laptop screen
3. **Restart everything**: Reboot host computer and restart KJ-Nomad
4. **Check power and cables**: Ensure all equipment is powered and connected

## 🌐 Network Connection Issues

### Devices Can't Connect to KJ-Nomad

**Symptoms:**
- Browser shows "This site can't be reached"
- Player screens show loading forever
- Mobile devices can't access KJ control

**Solutions:**

1. **Verify Network Connection**
   ```
   ✅ All devices connected to same WiFi network
   ✅ WiFi network is working (test with internet browsing)
   ✅ No "guest" or isolated networks being used
   ```

2. **Check IP Address**
   - Look at KJ-Nomad startup window for correct IP
   - Try both IP address AND `localhost:8080` on host computer
   - IP typically looks like: `192.168.1.100:8080` or `10.0.0.50:8080`

3. **Firewall Issues**
   - **Windows**: Add KJ-Nomad to Windows Defender firewall exceptions
   - **Mac**: Check System Preferences > Security & Privacy > Firewall
   - **Router**: Check if router has client isolation enabled (disable it)

4. **Port Conflicts**
   - Another application might be using port 8080
   - Restart your computer to free up ports
   - Try accessing with different port if configured

### WiFi Network Problems

**Create a Dedicated Network:**
1. Use a mobile hotspot or dedicated router
2. Avoid conference center or hotel WiFi (often has client isolation)
3. Use 5GHz WiFi for better performance
4. Position router centrally with good signal to all devices

## 🎵 Playback Issues

### Songs Won't Play

**Symptoms:**
- Player shows black screen
- Audio but no video
- "File not found" errors

**Solutions:**

1. **Check File Format**
   ```
   ✅ Files are .mp4 or .webm format
   ✅ Video codec: H.264 or VP9
   ✅ Audio codec: AAC or Opus
   ❌ Avoid: .avi, .wmv, .mov files
   ```

2. **Check File Naming**
   ```
   ✅ Good: "Taylor Swift - Shake It Off.mp4"
   ✅ Good: "Beatles - Hey Jude.mp4"
   ❌ Bad: "track01.mp4"
   ❌ Bad: "Shake It Off by Taylor Swift.mp4"
   ```

3. **Check File Location**
   - Files must be in the `media/` folder
   - Avoid spaces or special characters in folder names
   - Ensure KJ-Nomad has permission to read the files

4. **Check File Integrity**
   - Try playing the file in VLC or another media player
   - Re-download or re-rip corrupted files
   - Check available disk space

### Audio/Video Out of Sync

**Solutions:**
1. **Check Network Performance**
   - Use wired connection for player displays if possible
   - Reduce other network traffic during show
   - Position devices closer to WiFi router

2. **Browser Issues**
   - Refresh the player screen browsers (F5 or Ctrl+R)
   - Use Chrome or Firefox (avoid Internet Explorer)
   - Clear browser cache and cookies

3. **Hardware Performance**
   - Ensure player devices meet minimum requirements
   - Close other applications on player devices
   - Use Intel N-series mini PCs instead of Raspberry Pi

## 🔍 Search and Library Issues

### Songs Don't Appear in Search

**Symptoms:**
- Search returns no results
- Some songs missing from library
- Search is slow or unresponsive

**Solutions:**

1. **Check File Naming Convention**
   ```
   Format: "Artist - Song Title.mp4"
   
   ✅ Correct: "Adele - Rolling in the Deep.mp4"
   ❌ Wrong: "Rolling in the Deep - Adele.mp4"
   ❌ Wrong: "Adele_Rolling_in_the_Deep.mp4"
   ```

2. **Refresh Media Library**
   - Restart KJ-Nomad to rescan media library
   - Check startup console for scan results
   - Verify file count matches expectations

3. **File Permissions**
   - Ensure KJ-Nomad can read the media directory
   - Check folder permissions (not read-only)
   - Run KJ-Nomad as administrator if needed (Windows)

### Search Results Are Weird

**Common Issues:**
- **Typos in filenames**: Fix artist/song name spelling
- **Multiple versions**: Rename duplicates like "Song (Karaoke).mp4"
- **Wrong metadata**: Ensure filenames match actual content

## 📱 Mobile Device Issues

### KJ Control Not Working on Phone

**Solutions:**
1. **Browser Compatibility**
   - Use Chrome, Firefox, or Safari
   - Avoid in-app browsers (Facebook, Instagram)
   - Enable JavaScript in browser settings

2. **Screen Size Issues**
   - Rotate phone to landscape mode
   - Zoom out if interface appears cut off
   - Use tablet for easier control

3. **Touch Response Problems**
   - Clean phone screen
   - Remove screen protector if causing issues
   - Try different finger or stylus

### Singer Request Page Not Working

**Solutions:**
1. **QR Code Issues**
   - Ensure QR code is clearly visible and well-lit
   - Try typing the URL manually instead
   - Generate new QR code if corrupted

2. **Patron Device Problems**
   - Help patrons connect to correct WiFi
   - Check if device has internet restrictions
   - Provide backup song request method

## 🖥️ Player Display Issues

### Black Screen on Player Displays

**Solutions:**
1. **Check Browser**
   - Refresh the page (F5)
   - Check if URL is correct: `http://[IP]:8080/player`
   - Try opening in new browser tab

2. **Display Settings**
   - Check display cable connections
   - Verify display is set to correct input
   - Check display power and settings

3. **Hardware Issues**
   - Try different HDMI cable
   - Test with different display
   - Reboot player device

### Multiple Player Displays Out of Sync

**Solutions:**
1. **Network Optimization**
   - Use wired ethernet for player devices
   - Reduce WiFi interference
   - Upgrade to better router if needed

2. **Browser Sync**
   - Refresh all player screens simultaneously
   - Start playback after all screens are ready
   - Use identical hardware for all players

## 🎛️ Performance Issues

### KJ-Nomad Runs Slowly

**Solutions:**
1. **System Resources**
   - Close unnecessary applications
   - Check available RAM and disk space
   - Restart computer if running for long time

2. **Media Optimization**
   - Convert large video files to smaller sizes
   - Use consistent video encoding settings
   - Store media on SSD instead of USB drive

3. **Network Performance**
   - Limit number of connected devices
   - Use 5GHz WiFi instead of 2.4GHz
   - Position router optimally

### High CPU/Memory Usage

**Solutions:**
1. **File Format Optimization**
   - Use H.264 video codec (most efficient)
   - Avoid extremely high resolution videos (1080p max recommended)
   - Compress audio to reasonable bitrate

2. **System Optimization**
   - Update graphics drivers
   - Close background applications
   - Consider hardware upgrade if consistently slow

## ⚠️ Emergency Procedures

### Complete System Failure During Show

1. **Immediate Action**
   - Apologize to audience
   - Switch to backup karaoke system
   - Continue show with host computer only if needed

2. **Quick Recovery**
   - Restart KJ-Nomad application
   - Note current song and singer for queue restoration
   - Test one player screen before resuming

3. **Prevention**
   - Always have backup equipment
   - Test complete setup before event
   - Keep emergency contact for tech support

### Power Outage Recovery

1. **During Outage**
   - Use laptop battery power to continue on main screen
   - Note current position in queue
   - Inform audience of temporary issue

2. **After Power Returns**
   - Restart all equipment in order: router, player devices, host computer
   - Reload KJ-Nomad and restore queue position
   - Test all connections before resuming

## 📞 Getting Additional Help

### Self-Service Resources
- **Documentation**: Full user guide in `README.md`
- **Video Tutorials**: [Link to video guides]
- **Community Forum**: [Link to community discussions]

### Direct Support
- **Email**: support@nomadkaraoke.com
- **GitHub Issues**: Report bugs and feature requests
- **Emergency Hotline**: [Emergency support number for urgent issues]

### Information to Include When Asking for Help
1. **Operating System**: Windows 10, macOS Big Sur, etc.
2. **KJ-Nomad Version**: Check startup screen or about dialog
3. **Network Setup**: Number of devices, router type, connection method
4. **Error Messages**: Exact text of any error messages
5. **Steps to Reproduce**: What you were doing when the problem occurred

---

**Remember**: Most issues can be resolved with a restart of KJ-Nomad or the affected devices. When in doubt, restart and retry!