// --- START: Global Error Handlers ---
// These are placed at the very top of the file to catch any startup errors.
process.on('uncaughtException', (err, origin) => {
  console.error('<<<<< UNCAUGHT EXCEPTION >>>>>');
  console.error('An uncaught exception occurred!');
  console.error('Error:', err);
  console.error('Origin:', origin);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('<<<<< UNHANDLED REJECTION >>>>>');
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// --- END: Global Error Handlers ---


import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { scanMediaLibrary, searchSongs, getSongById } from './mediaLibrary';
import { addSongToQueue, getQueue, removeSongFromQueue, getNextSong, resetQueue } from './songQueue';
import { scanFillerMusic, getNextFillerSong } from './fillerMusic';

// import { Bonjour } from 'bonjour-service';

// ES Module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Publish the server on the network
// const bonjour = new Bonjour();
// bonjour.publish({ name: 'KJ-Nomad Server', type: 'http', port: 8080 });


// Scan the media library on startup
scanMediaLibrary();
scanFillerMusic();

const PORT = process.env.PORT || 8080;

// Serve static files from the React client
// Try production path first (when frontend is copied to server/public), then development path
const productionClientPath = path.join(__dirname, '../public');
const developmentClientPath = path.join(__dirname, '../../client/dist');
const clientPath = fs.existsSync(productionClientPath) ? productionClientPath : developmentClientPath;
console.log('Production client path:', productionClientPath, '(exists:', fs.existsSync(productionClientPath), ')');
console.log('Development client path:', developmentClientPath, '(exists:', fs.existsSync(developmentClientPath), ')');
console.log('Using client path:', clientPath);
// Enable static file serving
app.use(express.static(clientPath));
app.use(express.json());

// TEMP: Simple test endpoint
app.get('/api/test', (req, res) => {
    console.log('[API] GET /api/test - Debug endpoint hit');
    res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// API endpoint to search songs
app.get('/api/songs', (req, res) => {
    console.log('[API] GET /api/songs - Search songs endpoint hit, query:', req.query.q);
    const query = req.query.q as string || '';
    const results = searchSongs(query);
    res.json(results);
});

// API endpoint to get current queue
app.get('/api/queue', (req, res) => {
    console.log('[API] GET /api/queue - Get queue endpoint hit');
    res.json(getQueue());
});

// API endpoint to clear queue (for testing)
app.post('/api/queue/clear', (req, res) => {
    console.log('[API] POST /api/queue/clear - Clear queue endpoint hit');
    // Use the proper reset function instead of the infinite loop
    resetQueue();
    console.log('[API] POST /api/queue/clear - Queue cleared successfully');
    broadcast({ type: 'queue_updated', payload: getQueue() });
    res.json({ success: true, message: 'Queue cleared' });
});

// Helper function to determine content type
function getContentType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  switch (ext) {
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'avi':
      return 'video/x-msvideo';
    case 'mov':
      return 'video/quicktime';
    default:
      return 'video/mp4'; // Default fallback
  }
}

// API endpoint to stream video files
app.get('/api/media/:fileName', (req, res) => {
    console.log('[API] GET /api/media/:fileName - Media streaming endpoint hit, file:', req.params.fileName);
    const fileName = req.params.fileName;
    const mediaPath = path.join(__dirname, '../media', fileName);

    try {
        const stat = fs.statSync(mediaPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range && range.startsWith('bytes=')) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            // Validate parsed range values
            if (!isNaN(start) && !isNaN(end) && start >= 0 && end >= start && end < fileSize) {
                const chunksize = (end - start) + 1;
                const file = fs.createReadStream(mediaPath, { start, end });
                const head = {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': getContentType(fileName),
                };

                res.writeHead(206, head);
                file.pipe(res);
            } else {
                // Invalid range, fall back to full content
                const head = {
                    'Content-Length': fileSize,
                    'Content-Type': getContentType(fileName),
                };
                res.writeHead(200, head);
                fs.createReadStream(mediaPath).pipe(res);
            }
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': getContentType(fileName),
            };
            res.writeHead(200, head);
            fs.createReadStream(mediaPath).pipe(res);
        }
    } catch (error) {
        console.error('Error serving media file:', error);
        res.status(404).send('File not found');
    }
});

// Handle React Router client-side routing - serve index.html for specific routes
app.get('/', (req, res) => {
    console.log('[ROUTE] GET / - Root route hit, serving index.html');
    res.sendFile(path.join(clientPath, 'index.html'));
});

app.get('/singer', (req, res) => {
    console.log('[ROUTE] GET /singer - Singer route hit, serving index.html');
    res.sendFile(path.join(clientPath, 'index.html'));
});

app.get('/controller', (req, res) => {
    console.log('[ROUTE] GET /controller - Controller route hit, serving index.html');
    res.sendFile(path.join(clientPath, 'index.html'));
});

app.get('/player', (req, res) => {
    console.log('[ROUTE] GET /player - Player route hit, serving index.html');
    res.sendFile(path.join(clientPath, 'index.html'));
});

// Types for WebSocket messages  
interface WebSocketMessage {
    type: string;
    payload?: unknown;
}

const broadcast = (data: WebSocketMessage) => {
    wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    try {
        const data = JSON.parse(message.toString());
        const { type, payload } = data;

        switch (type) {
        case 'request_song': {
            const song = getSongById(payload.songId);
            if (song) {
            addSongToQueue(song, payload.singerName);
            broadcast({ type: 'queue_updated', payload: getQueue() });
            }
            break;
        }
        case 'get_queue':
            ws.send(JSON.stringify({ type: 'queue_updated', payload: getQueue() }));
            break;
        case 'remove_from_queue':
            removeSongFromQueue(payload.songId);
            broadcast({ type: 'queue_updated', payload: getQueue() });
            break;
        case 'song_ended': {
            const nextSong = getNextSong();
            if (nextSong) {
            broadcast({ type: 'play', payload: { songId: nextSong.song.id, fileName: nextSong.song.fileName } });
            } else {
                const nextFillerSong = getNextFillerSong();
                if(nextFillerSong) {
                    broadcast({ type: 'play_filler_music', payload: { fileName: nextFillerSong.fileName } });
                } else {
                    broadcast({ type: 'pause' });
                }
            }
            break;
        }
        case 'ticker_updated':
            broadcast({ type: 'ticker_updated', payload });
            break;
        default:
            // For playback controls, broadcast to all clients except the sender
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === ws.OPEN) {
                    client.send(message.toString());
                }
            });
            break;
        }
    } catch (error) {
        console.error('Failed to process message:', message.toString(), error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
