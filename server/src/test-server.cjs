// Simple test server for E2E testing
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.WebSocketServer({ server });

const PORT = 8080;

// Simple in-memory data for testing
let songs = [
  { id: '1', artist: 'Test Artist', title: 'Test Song', fileName: 'Test Artist - Test Song.mp4' },
  { id: '2', artist: 'Taylor Swift', title: 'Shake It Off', fileName: 'Taylor Swift - Shake It Off.mp4' },
  { id: '3', artist: 'Ed Sheeran', title: 'Perfect', fileName: 'Ed Sheeran - Perfect.mp4' },
  { id: '4', artist: 'Beatles', title: 'Hey Jude', fileName: 'Beatles - Hey Jude.mp4' },
  { id: '5', artist: 'Adele', title: 'Rolling in the Deep', fileName: 'Adele - Rolling in the Deep.mp4' }
];

let queue = [];
let nowPlaying = null;
let tickerText = 'Welcome to KJ-Nomad!';

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'KJ-Nomad test server is running' });
});

// Search songs API
app.get('/api/songs', (req, res) => {
  const query = req.query.q || '';
  let results = songs;
  
  if (query) {
    results = songs.filter(song => 
      song.artist.toLowerCase().includes(query.toLowerCase()) ||
      song.title.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  console.log(`Search query: "${query}", results: ${results.length}`);
  res.json(results);
});

// Serve media files
app.get('/api/media/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const mediaPath = path.join(__dirname, '../media', fileName);
  
  console.log(`Media request: ${fileName}`);
  
  // Check if file exists
  if (!fs.existsSync(mediaPath)) {
    console.log(`File not found: ${mediaPath}`);
    return res.status(404).send('File not found');
  }
  
  // For test files (which are just text), serve them as video
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Accept-Ranges', 'bytes');
  
  const stat = fs.statSync(mediaPath);
  const range = req.headers.range;
  
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunksize = (end - start) + 1;
    
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
    });
    
    fs.createReadStream(mediaPath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': stat.size,
    });
    fs.createReadStream(mediaPath).pipe(res);
  }
});

// WebSocket broadcast
function broadcast(data) {
  const message = JSON.stringify(data);
  console.log('Broadcasting:', data.type);
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send initial state
  ws.send(JSON.stringify({ type: 'queue_updated', payload: queue }));
  ws.send(JSON.stringify({ type: 'ticker_updated', payload: { text: tickerText } }));
  
  if (nowPlaying) {
    ws.send(JSON.stringify({ type: 'now_playing', payload: nowPlaying }));
  }
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data.type, data.payload);
      
      switch (data.type) {
        case 'request_song':
          const song = songs.find(s => s.id === data.payload.songId);
          if (song) {
            const queueEntry = {
              song: song,
              singerName: data.payload.singerName,
              timestamp: Date.now()
            };
            queue.push(queueEntry);
            console.log(`Added to queue: ${song.title} by ${data.payload.singerName}`);
            broadcast({ type: 'queue_updated', payload: queue });
          }
          break;
          
        case 'play_next':
          if (queue.length > 0) {
            nowPlaying = queue.shift();
            console.log(`Now playing: ${nowPlaying.song.title} by ${nowPlaying.singerName}`);
            broadcast({ 
              type: 'now_playing', 
              payload: {
                song: nowPlaying.song,
                singer: nowPlaying.singerName,
                fileName: nowPlaying.song.fileName,
                isFiller: false
              }
            });
            broadcast({ type: 'queue_updated', payload: queue });
          }
          break;
          
        case 'update_ticker':
          tickerText = data.payload.text;
          console.log(`Ticker updated: ${tickerText}`);
          broadcast({ type: 'ticker_updated', payload: { text: tickerText } });
          break;
          
        case 'clear_queue':
          queue = [];
          nowPlaying = null;
          console.log('Queue cleared');
          broadcast({ type: 'queue_updated', payload: queue });
          break;
          
        case 'song_ended':
          console.log('Song ended, playing next...');
          if (queue.length > 0) {
            nowPlaying = queue.shift();
            broadcast({ 
              type: 'now_playing', 
              payload: {
                song: nowPlaying.song,
                singer: nowPlaying.singerName,
                fileName: nowPlaying.song.fileName,
                isFiller: false
              }
            });
            broadcast({ type: 'queue_updated', payload: queue });
          } else {
            // Play filler music
            nowPlaying = {
              fileName: 'filler-background.mp4',
              isFiller: true
            };
            broadcast({ 
              type: 'now_playing', 
              payload: {
                fileName: 'filler-background.mp4',
                isFiller: true
              }
            });
          }
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`🎤 KJ-Nomad test server running on port ${PORT}`);
  console.log(`📊 ${songs.length} test songs available`);
  console.log(`🎯 Ready for E2E testing!`);
});