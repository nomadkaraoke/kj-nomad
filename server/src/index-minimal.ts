// Minimal KJ-Nomad Server for E2E Testing
// This version strips out problematic features to get E2E tests working

import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { scanMediaLibrary, searchSongs, getSongById } from './mediaLibrary';
import { addSongToQueue, getQueue, removeSongFromQueue, getNextSong } from './songQueue';
import { scanFillerMusic, getNextFillerSong } from './fillerMusic';

// ES Module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Scan the media library on startup
console.log('Scanning media library...');
scanMediaLibrary();
console.log('Scanning for filler music...');
scanFillerMusic();

const PORT = process.env.PORT || 8080;

// Enable CORS for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Parse JSON bodies
app.use(express.json());

// API endpoint to search songs
app.get('/api/songs', (req, res) => {
    const query = req.query.q as string || '';
    const results = searchSongs(query);
    res.json(results);
});

// API endpoint to stream video files
app.get('/api/media/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const mediaPath = path.join(__dirname, '../media', fileName);

    try {
        const stat = fs.statSync(mediaPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(mediaPath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            };

            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(200, head);
            fs.createReadStream(mediaPath).pipe(res);
        }
    } catch (error) {
        console.error('Error serving media file:', error);
        res.status(404).send('File not found');
    }
});

// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'KJ-Nomad server is running' });
});

// Types for WebSocket messages
interface WebSocketMessage {
    type: string;
    payload?: unknown;
}

// WebSocket broadcast function
const broadcast = (data: WebSocketMessage) => {
    wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send initial data
  ws.send(JSON.stringify({ type: 'queue_updated', payload: getQueue() }));

  ws.on('message', (message) => {
    try {
        const data = JSON.parse(message.toString());
        const { type, payload } = data;
        console.log('Received message:', type, payload);

        switch (type) {
        case 'request_song': {
            const song = getSongById(payload.songId);
            if (song) {
                addSongToQueue(song, payload.singerName);
                console.log(`Song requested: ${song.title} by ${payload.singerName}`);
                broadcast({ type: 'queue_updated', payload: getQueue() });
            }
            break;
        }
        case 'get_queue':
            ws.send(JSON.stringify({ type: 'queue_updated', payload: getQueue() }));
            break;
        case 'play_next': {
            const nextSong = getNextSong();
            if (nextSong) {
                console.log(`Playing: ${nextSong.song.title} by ${nextSong.singerName}`);
                broadcast({ 
                    type: 'now_playing', 
                    payload: { 
                        song: nextSong.song, 
                        singer: nextSong.singerName,
                        fileName: nextSong.song.fileName,
                        isFiller: false
                    } 
                });
                broadcast({ type: 'queue_updated', payload: getQueue() });
            } else {
                // Try filler music
                const fillerSong = getNextFillerSong();
                if (fillerSong) {
                    console.log(`Playing filler: ${fillerSong.fileName}`);
                    broadcast({ 
                        type: 'now_playing', 
                        payload: { 
                            fileName: fillerSong.fileName,
                            isFiller: true
                        } 
                    });
                }
            }
            break;
        }
        case 'remove_from_queue':
            removeSongFromQueue(payload.songId);
            broadcast({ type: 'queue_updated', payload: getQueue() });
            break;
        case 'song_ended': {
            // Auto-play next song
            const autoNextSong = getNextSong();
            if (autoNextSong) {
                broadcast({ 
                    type: 'now_playing', 
                    payload: { 
                        song: autoNextSong.song, 
                        singer: autoNextSong.singerName,
                        fileName: autoNextSong.song.fileName,
                        isFiller: false
                    } 
                });
                broadcast({ type: 'queue_updated', payload: getQueue() });
            } else {
                const autoFillerSong = getNextFillerSong();
                if (autoFillerSong) {
                    broadcast({ 
                        type: 'now_playing', 
                        payload: { 
                            fileName: autoFillerSong.fileName,
                            isFiller: true
                        } 
                    });
                } else {
                    broadcast({ type: 'pause', payload: {} });
                }
            }
            break;
        }
        case 'update_ticker':
            broadcast({ type: 'ticker_updated', payload: { text: payload.text } });
            break;
        case 'clear_queue':
            // Clear queue (for testing)
            while (getQueue().length > 0) {
                removeSongFromQueue(getQueue()[0].song.id);
            }
            broadcast({ type: 'queue_updated', payload: getQueue() });
            break;
        default:
            console.log('Unknown message type:', type);
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
  console.log(`🎤 KJ-Nomad server is running on port ${PORT}`);
  console.log(`📊 Found ${getQueue().length} songs in queue`);
});