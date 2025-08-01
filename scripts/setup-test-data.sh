#!/bin/bash

# KJ-Nomad E2E Test Data Setup Script
# Creates test media files for Cypress E2E testing

set -e

echo "🎬 Setting up KJ-Nomad E2E test data..."

# Create test media directory
TEST_MEDIA_DIR="server/media"
mkdir -p "$TEST_MEDIA_DIR"

echo "📁 Created test media directory: $TEST_MEDIA_DIR"

# Create test video files (real video files for e2e testing)
echo "🎵 Creating test karaoke video files..."

# Check if ffmpeg is available for creating real test videos
if command -v ffmpeg >/dev/null 2>&1; then
  echo "📹 FFmpeg found, creating real test video files..."
  ffmpeg -f lavfi -i testsrc=duration=5:size=320x240:rate=1 -c:v libx264 -t 5 "$TEST_MEDIA_DIR/Test Artist - Test Song.mp4" -y >/dev/null 2>&1
  ffmpeg -f lavfi -i testsrc=duration=5:size=320x240:rate=1 -c:v libx264 -t 5 "$TEST_MEDIA_DIR/Taylor Swift - Shake It Off.mp4" -y >/dev/null 2>&1
  ffmpeg -f lavfi -i testsrc=duration=5:size=320x240:rate=1 -c:v libx264 -t 5 "$TEST_MEDIA_DIR/Ed Sheeran - Perfect.mp4" -y >/dev/null 2>&1
  ffmpeg -f lavfi -i testsrc=duration=5:size=320x240:rate=1 -c:v libx264 -t 5 "$TEST_MEDIA_DIR/Beatles - Hey Jude.mp4" -y >/dev/null 2>&1
  ffmpeg -f lavfi -i testsrc=duration=5:size=320x240:rate=1 -c:v libx264 -t 5 "$TEST_MEDIA_DIR/Adele - Rolling in the Deep.mp4" -y >/dev/null 2>&1
  ffmpeg -f lavfi -i testsrc=duration=3:size=320x240:rate=1 -c:v libx264 -t 3 "$TEST_MEDIA_DIR/filler-background.mp4" -y >/dev/null 2>&1
  ffmpeg -f lavfi -i testsrc=duration=3:size=320x240:rate=1 -c:v libx264 -t 3 "$TEST_MEDIA_DIR/filler-jazz.mp4" -y >/dev/null 2>&1
  ffmpeg -f lavfi -i testsrc=duration=3:size=320x240:rate=1 -c:v libx264 -t 3 "$TEST_MEDIA_DIR/filler-party.mp4" -y >/dev/null 2>&1
  echo "✅ Real test videos created with FFmpeg"
else
  echo "⚠️  FFmpeg not found, creating placeholder files (tests may have issues with video playback)"
  
  # Test karaoke songs
  cat > "$TEST_MEDIA_DIR/Test Artist - Test Song.mp4" << 'EOF'
PLACEHOLDER_VIDEO_FILE
This is a placeholder for Test Artist - Test Song.mp4
In production, this would be an actual MP4 video file.
EOF

  cat > "$TEST_MEDIA_DIR/Taylor Swift - Shake It Off.mp4" << 'EOF'
PLACEHOLDER_VIDEO_FILE
This is a placeholder for Taylor Swift - Shake It Off.mp4
In production, this would be an actual MP4 video file.
EOF

  cat > "$TEST_MEDIA_DIR/Ed Sheeran - Perfect.mp4" << 'EOF'
PLACEHOLDER_VIDEO_FILE
This is a placeholder for Ed Sheeran - Perfect.mp4
In production, this would be an actual MP4 video file.
EOF

  cat > "$TEST_MEDIA_DIR/Beatles - Hey Jude.mp4" << 'EOF'
PLACEHOLDER_VIDEO_FILE
This is a placeholder for Beatles - Hey Jude.mp4
In production, this would be an actual MP4 video file.
EOF

  cat > "$TEST_MEDIA_DIR/Adele - Rolling in the Deep.mp4" << 'EOF'
PLACEHOLDER_VIDEO_FILE
This is a placeholder for Adele - Rolling in the Deep.mp4
In production, this would be an actual MP4 video file.
EOF
fi

echo "🎶 Creating test filler music files..."

# Test filler music (if not already created by ffmpeg)
if [ ! -f "$TEST_MEDIA_DIR/filler-background.mp4" ]; then
  cat > "$TEST_MEDIA_DIR/filler-background.mp4" << 'EOF'
PLACEHOLDER_VIDEO_FILE
This is a placeholder for filler-background.mp4
In production, this would be an actual MP4 video file.
EOF
fi

if [ ! -f "$TEST_MEDIA_DIR/filler-jazz.mp4" ]; then
  cat > "$TEST_MEDIA_DIR/filler-jazz.mp4" << 'EOF'
PLACEHOLDER_VIDEO_FILE
This is a placeholder for filler-jazz.mp4
In production, this would be an actual MP4 video file.
EOF
fi

if [ ! -f "$TEST_MEDIA_DIR/filler-party.mp4" ]; then
  cat > "$TEST_MEDIA_DIR/filler-party.mp4" << 'EOF'
PLACEHOLDER_VIDEO_FILE
This is a placeholder for filler-party.mp4
In production, this would be an actual MP4 video file.
EOF
fi

echo "📝 Creating test media README..."

cat > "$TEST_MEDIA_DIR/README-TEST.txt" << 'EOF'
KJ-Nomad Test Media Files
=========================

These are placeholder test files for E2E testing.

In a real deployment, these would be actual MP4/WebM karaoke video files.

Test Files Created:
- Test Artist - Test Song.mp4
- Taylor Swift - Shake It Off.mp4
- Ed Sheeran - Perfect.mp4
- Beatles - Hey Jude.mp4
- Adele - Rolling in the Deep.mp4
- filler-background.mp4
- filler-jazz.mp4
- filler-party.mp4

File Naming Convention:
- Karaoke: "Artist - Title.mp4"
- Filler: "filler-description.mp4"
EOF

# Set appropriate permissions
chmod 644 "$TEST_MEDIA_DIR"/*.mp4
chmod 644 "$TEST_MEDIA_DIR"/*.txt

echo "✅ Test media setup complete!"
echo ""
echo "📊 Created test files:"
ls -la "$TEST_MEDIA_DIR"
echo ""
echo "🎯 Ready for E2E testing!"
echo "   - $(ls "$TEST_MEDIA_DIR"/*.mp4 | grep -v filler | wc -l) karaoke songs"
echo "   - $(ls "$TEST_MEDIA_DIR"/filler-*.mp4 | wc -l) filler music files"
echo ""