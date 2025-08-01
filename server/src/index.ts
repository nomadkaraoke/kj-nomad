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
import { addSongToQueue, getQueue, removeSongFromQueue, getNextSong } from './songQueue';
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
const clientPath = path.join(__dirname, '../../client/dist');
console.log('Client path:', clientPath);
console.log('Client path exists:', fs.existsSync(clientPath));
// Temporarily comment out static file serving to isolate path-to-regexp issue
// app.use(express.static(clientPath));

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


const broadcast = (data: any) => {
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
        case 'request_song':
            const song = getSongById(payload.songId);
            if (song) {
            addSongToQueue(song, payload.singerName);
            broadcast({ type: 'queue_updated', payload: getQueue() });
            }
            break;
        case 'get_queue':
            ws.send(JSON.stringify({ type: 'queue_updated', payload: getQueue() }));
            break;
        case 'remove_from_queue':
            removeSongFromQueue(payload.songId);
            broadcast({ type: 'queue_updated', payload: getQueue() });
            break;
        case 'song_ended':
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
        case 'ticker_updated':
            broadcast({ type: 'ticker_updated', payload: payload });
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

// All remaining requests return the React app, so it can handle routing.
// Temporarily comment out catch-all route to isolate path-to-regexp issue
// app.get('*', (req, res) => {
//     res.sendFile(path.join(clientPath, 'index.html'));
// });

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
