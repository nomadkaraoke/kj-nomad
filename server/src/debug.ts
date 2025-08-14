import express from 'express';
import fs from 'fs';
import archiver from 'archiver';
import { getDataPath } from './dataPath.js';
import { addSongToQueue, resetQueue, getQueue, getSessionState, removeSongFromQueue } from './songQueue.js';
import { searchSongs, type Song } from './mediaLibrary.js';

const LOG_FILE = getDataPath('app.log');
const CONFIG_FILE = getDataPath('setup.json');

// Simple in-memory logger for now
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args: unknown[]) => {
  const message = args.map(arg => typeof arg === 'object' && arg !== null ? JSON.stringify(arg) : String(arg)).join(' ');
  logStream.write(`[LOG] ${new Date().toISOString()}: ${message}\n`);
  originalConsoleLog.apply(console, args);
};

console.error = (...args: unknown[]) => {
  const message = args.map(arg => typeof arg === 'object' && arg !== null ? JSON.stringify(arg) : String(arg)).join(' ');
  logStream.write(`[ERROR] ${new Date().toISOString()}: ${message}\n`);
  originalConsoleError.apply(console, args);
};

export function applyDebugRoutes(app: express.Application, broadcaster?: (data: { type: string; payload?: unknown }) => void): void {
  app.get('/api/debug/download', (req, res) => {
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    res.attachment('kj-nomad-debug-logs.zip');
    archive.pipe(res);

    // Add log file
    if (fs.existsSync(LOG_FILE)) {
      archive.file(LOG_FILE, { name: 'app.log' });
    }

    // Add config file
    if (fs.existsSync(CONFIG_FILE)) {
      archive.file(CONFIG_FILE, { name: 'setup.json' });
    }
    
    // Add a system info file
    const systemInfo = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cwd: process.cwd(),
      env: process.env
    };
    archive.append(JSON.stringify(systemInfo, null, 2), { name: 'system-info.json' });

    archive.finalize();
  });

  // Seed the main queue with given singer names using the first available song
  app.post('/api/debug/queue/seed', (req, res) => {
    try {
      const singers = (req.body && Array.isArray(req.body.singers)) ? (req.body.singers as string[]) : [];
      resetQueue();
      const songs: Song[] = searchSongs('');
      const song = songs[0];
      if (!song) return res.status(400).json({ success: false, error: 'No songs available to seed' });
      singers.forEach((name) => addSongToQueue(song, name));
      try { broadcaster?.({ type: 'queue_updated', payload: getQueue() }); } catch { /* ignore */ }
      try { broadcaster?.({ type: 'session_state_updated', payload: getSessionState() }); } catch { /* ignore */ }
      res.json({ success: true, count: singers.length });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  // Insert a provisional YouTube queue entry (for E2E tests)
  app.post('/api/debug/youtube/enqueue', (req, res) => {
    try {
      const { videoId, title, singerName } = req.body as { videoId: string; title?: string; singerName: string };
      if (!videoId || !singerName) return res.status(400).json({ success: false, error: 'videoId and singerName required' });
      const fileName = `youtube_${videoId}_${(title||videoId).replace(/[^a-zA-Z0-9_-]/g,'_')}.mp4`;
      const song: Song = { id: `yt_${videoId}`, artist: 'YouTube', title: title || videoId, fileName };
      addSongToQueue(song, singerName);
      try { broadcaster?.({ type: 'queue_updated', payload: getQueue() }); } catch { /* ignore */ }
      // Immediately broadcast a starting progress state so UIs render status without a race
      try { broadcaster?.({ type: 'youtube_download_progress', payload: { videoId, status: 'downloading', progress: 1, songId: `yt_${videoId}`, fileName, singerName } }); } catch { /* ignore */ }
      res.json({ success: true, song });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  app.post('/api/debug/youtube/progress', (req, res) => {
    try {
      if (!broadcaster) return res.status(500).json({ success: false, error: 'No broadcaster available' });
      const { videoId, status, progress, fileName, singerName } = req.body as { videoId: string; status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled'; progress?: number; fileName?: string; singerName?: string };
      if (!videoId || !status) return res.status(400).json({ success: false, error: 'videoId and status required' });
      broadcaster({ type: 'youtube_download_progress', payload: { videoId, status, progress, songId: `yt_${videoId}`, fileName, singerName } });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  app.post('/api/debug/queue/remove', (req, res) => {
    try {
      const { singerName } = req.body as { singerName?: string };
      if (!singerName) return res.status(400).json({ success: false, error: 'singerName required' });
      const entry = getQueue().find(e => e.singerName === singerName);
      if (!entry) return res.status(404).json({ success: false, error: 'Singer not found' });
      const ok = removeSongFromQueue(entry.song.id);
      if (ok) {
        try { broadcaster?.({ type: 'queue_updated', payload: getQueue() }); } catch { /* ignore */ }
        try { broadcaster?.({ type: 'session_state_updated', payload: getSessionState() }); } catch { /* ignore */ }
      }
      res.json({ success: ok });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err) });
    }
  });
}
