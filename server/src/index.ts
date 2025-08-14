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
import { randomUUID } from 'crypto';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { scanMediaLibrary, searchSongs, getSongById } from './mediaLibrary.js';
import { 
  addSongToQueue, 
  getQueue, 
  removeSongFromQueue, 
  reorderQueue,
  getNextSong, 
  resetQueue,
  getSessionState,
  playSong,
  getSessionHistory,
  pausePlayback,
  resumePlayback,
  stopPlayback
} from './songQueue.js';
import { scanFillerMusic, getNextFillerSong } from './fillerMusic.js';
import { cloudConnector } from './cloudConnector.js';
import {
  applySetupRoutes,
  loadSetupConfig,
} from './setupWizard.js';
import { videoSyncEngine } from './videoSyncEngine.js';
import { deviceManager } from './deviceManager.js';
import { paperWorkflow } from './paperWorkflow.js';
import { singerProfileManager } from './singerProfiles.js';
import { advancedQueueManager } from './advancedQueue.js';
import { applyDebugRoutes } from './debug.js';

import { Bonjour } from 'bonjour-service';

// __dirname is automatically available in CommonJS modules

const app = express();
const server = http.createServer(app);

server.on('error', (e: Error & { code?: string }) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`Error: Port ${PORT} is already in use.`);
    console.error('Please close the other application using this port or specify a different one.');
    process.exit(1);
  }
});

server.on('listening', () => {
  console.log(`[Server] HTTP server is listening; active ws clients: ${wss.clients.size}`);
});

const wss = new WebSocketServer({ server, clientTracking: true });

// Publish the server on the network
const bonjour = new Bonjour();
// Map per-connection IDs to persistent device IDs
const connectionToDeviceId = new Map<string, string>();


// Initialize paper workflow with song library
const updatePaperWorkflow = () => {
  const allSongs = searchSongs(''); // Get all songs
  paperWorkflow.updateSongLibrary(allSongs);
};
updatePaperWorkflow();

// Parse command line arguments
const args = process.argv.slice(2);
const portArg = args.find(arg => arg.startsWith('--port='))?.split('=')[1];
const PORT = portArg ? parseInt(portArg, 10) : (process.env.PORT ? parseInt(process.env.PORT, 10) : 8080);

bonjour.publish({ name: 'KJ-Nomad Server', type: 'http', port: PORT });

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

// Apply debug routes
applyDebugRoutes(app);

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

// API endpoint to reorder queue
app.post('/api/queue/reorder', (req, res) => {
    console.log('[API] POST /api/queue/reorder - Reorder queue endpoint hit');
    const { fromIndex, toIndex } = req.body;
    
    if (typeof fromIndex !== 'number' || typeof toIndex !== 'number') {
        return res.status(400).json({ 
            success: false, 
            error: 'fromIndex and toIndex must be numbers' 
        });
    }
    
    const success = reorderQueue(fromIndex, toIndex);
    
    if (success) {
        console.log(`[API] Queue reordered: moved item from ${fromIndex} to ${toIndex}`);
        broadcast({ type: 'queue_updated', payload: getQueue() });
        broadcast({ type: 'session_state_updated', payload: getSessionState() });
        res.json({ 
            success: true, 
            message: 'Queue reordered successfully',
            data: { fromIndex, toIndex, queue: getQueue() }
        });
    } else {
        res.status(400).json({ 
            success: false, 
            error: 'Invalid indices for queue reordering' 
        });
    }
});

// Cloud connectivity endpoints
app.post('/api/cloud/connect', async (req, res) => {
    console.log('[API] POST /api/cloud/connect - Connect to cloud session');
    const { sessionId, kjName, venue, allowYouTube } = req.body;
    
    if (!sessionId) {
        return res.status(400).json({ success: false, error: 'Session ID required' });
    }
    
    try {
        const success = await cloudConnector.registerWithSession(sessionId, PORT as number, {
            kjName,
            venue,
            allowYouTube
        });
        
        if (success) {
            res.json({ 
                success: true, 
                message: 'Connected to cloud session',
                status: cloudConnector.getStatus()
            });
        } else {
            res.status(500).json({ success: false, error: 'Failed to connect to cloud session' });
        }
    } catch (error) {
        console.error('[API] Cloud connection error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.get('/api/cloud/status', (req, res) => {
    console.log('[API] GET /api/cloud/status - Get cloud connection status');
    res.json({
        success: true,
        data: cloudConnector.getStatus()
    });
});

app.post('/api/cloud/disconnect', (req, res) => {
    console.log('[API] POST /api/cloud/disconnect - Disconnect from cloud');
    cloudConnector.disconnect();
    res.json({ 
        success: true, 
        message: 'Disconnected from cloud',
        status: cloudConnector.getStatus()
    });
});

// Apply setup routes
applySetupRoutes(app);

// A helper function to get and map the devices for broadcasting
const getMappedDevices = () => {
  return deviceManager.getDevices().map(d => ({
    id: d.id,
    name: d.name,
    ipAddress: d.ipAddress,
    viewport: d.viewport,
    os: d.os,
    browser: d.browser,
    isApp: d.isApp,
    isOnline: d.isOnline,
    lastActivity: d.lastActivity,
    isAudioEnabled: d.isAudioEnabled,
    isTickerVisible: d.isTickerVisible,
    isSidebarVisible: d.isSidebarVisible,
    isVideoPlayerVisible: d.isVideoPlayerVisible,
    syncStats: d.syncStats ? {
      averageLatency: d.syncStats.averageLatency,
      lastSyncError: d.syncStats.lastSyncError
    } : undefined,
  }));
};

// Listen for device manager events and broadcast updates
deviceManager.on('deviceConnected', (device) => {
  console.log(`[Event] Device connected: ${device.id}. Broadcasting updated device list.`);
  broadcast({ type: 'devices_updated', payload: getMappedDevices() });
});

deviceManager.on('deviceDisconnected', (device) => {
  console.log(`[Event] Device disconnected: ${device.id}. Broadcasting updated device list.`);
  broadcast({ type: 'devices_updated', payload: getMappedDevices() });
});

deviceManager.on('deviceStatusChanged', (device) => {
    console.log(`[Event] Device status changed: ${device.id}. Broadcasting updated device list.`);
    broadcast({ type: 'devices_updated', payload: getMappedDevices() });
});

// Video Sync endpoints
// Track intended playback baseline and last positions for drift calculation
let syncRefScheduledTimeMs: number | null = null; // when videoTime == syncRefVideoStartSec
let syncRefVideoStartSec: number | null = null;   // base video time at schedule
const latestPlaybackPositionsSec: Map<string, number> = new Map();

function syncLog(message: string, extra?: Record<string, unknown>) {
  try {
    broadcast({ type: 'sync_log', payload: { ts: Date.now(), message, ...(extra || {}) } });
  } catch {
    // ignore logging errors
  }
}

// Wire the sync engine logger to emit lifecycle events to admin UI
videoSyncEngine.setLogger((event, extra) => {
  syncLog(event, extra);
});

app.get('/api/sync/status', (req, res) => {
    console.log('[API] GET /api/sync/status - Get sync engine status');
    const stats = videoSyncEngine.getSyncStats();
    res.json({ success: true, data: stats });
});

app.post('/api/sync/play', async (req, res) => {
    console.log('[API] POST /api/sync/play - Sync play command');
    const { videoUrl, startTime = 0 } = req.body;
    
    if (!videoUrl) {
        return res.status(400).json({ success: false, error: 'Video URL required' });
    }
    
    try {
        // Schedule via engine first, then read back its baseline to ensure consistency
        const success = await videoSyncEngine.syncPlayVideo(videoUrl, startTime);
        if (success) {
            const baseline = videoSyncEngine.getBaseline();
            if (baseline) {
                syncRefScheduledTimeMs = baseline.scheduledTime;
                syncRefVideoStartSec = baseline.videoStartSec;
            } else {
                // Fallback: approximate baseline similar to engine's internal buffer
                const stats = videoSyncEngine.getSyncStats();
                const coordinationBuffer = Math.max(2000, stats.averageLatency * 3 + 500);
                syncRefScheduledTimeMs = Date.now() + coordinationBuffer;
                syncRefVideoStartSec = startTime;
            }
            syncLog('sync_play scheduled', { videoUrl, startTime, scheduledTime: syncRefScheduledTimeMs });
            res.json({ 
                success: true, 
                message: 'Sync play command sent',
                data: { videoUrl, startTime, scheduledTime: syncRefScheduledTimeMs }
            });
        } else {
            res.status(500).json({ success: false, error: 'No player clients available' });
        }
    } catch (error) {
        console.error('[API] Sync play error:', error);
        res.status(500).json({ success: false, error: 'Failed to sync video playback' });
    }
});

app.post('/api/sync/pause', async (req, res) => {
    console.log('[API] POST /api/sync/pause - Sync pause command');
    
    try {
        await videoSyncEngine.syncPause();
        res.json({ 
            success: true, 
            message: 'Sync pause command sent'
        });
    } catch (error) {
        console.error('[API] Sync pause error:', error);
        res.status(500).json({ success: false, error: 'Failed to sync pause' });
    }
});

// Device Management endpoints
app.get('/api/devices', (req, res) => {
    console.log('[API] GET /api/devices - Get all devices');
    res.json({ 
        success: true, 
        data: getMappedDevices(),
    });
});

app.post('/api/devices/:deviceId/toggle-audio', (req, res) => {
    const device = deviceManager.getDevice(req.params.deviceId);
    if (device) {
        device.isAudioEnabled = !device.isAudioEnabled;
        broadcast({ type: 'devices_updated', payload: getMappedDevices() });
        res.json({ success: true, isAudioEnabled: device.isAudioEnabled });
    } else {
        res.status(404).json({ success: false, error: 'Device not found' });
    }
});

app.post('/api/devices/:deviceId/toggle-ticker', (req, res) => {
    const device = deviceManager.getDevice(req.params.deviceId);
    if (device) {
        device.isTickerVisible = !device.isTickerVisible;
        broadcast({ type: 'devices_updated', payload: getMappedDevices() });
        res.json({ success: true, isTickerVisible: device.isTickerVisible });
    } else {
        res.status(404).json({ success: false, error: 'Device not found' });
    }
});

app.post('/api/devices/:deviceId/toggle-sidebar', (req, res) => {
    const device = deviceManager.getDevice(req.params.deviceId);
    if (device) {
        device.isSidebarVisible = !device.isSidebarVisible;
        broadcast({ type: 'devices_updated', payload: getMappedDevices() });
        res.json({ success: true, isSidebarVisible: device.isSidebarVisible });
    } else {
        res.status(404).json({ success: false, error: 'Device not found' });
    }
});

app.post('/api/devices/:deviceId/toggle-video', (req, res) => {
    const device = deviceManager.getDevice(req.params.deviceId);
    if (device) {
        device.isVideoPlayerVisible = !device.isVideoPlayerVisible;
        broadcast({ type: 'devices_updated', payload: getMappedDevices() });
        res.json({ success: true, isVideoPlayerVisible: device.isVideoPlayerVisible });
    } else {
        res.status(404).json({ success: false, error: 'Device not found' });
    }
});

app.post('/api/devices/:deviceId/identify', (req, res) => {
    const deviceId = req.params.deviceId;
    const success = deviceManager.sendToDevice(deviceId, {
        type: 'identify_screen',
        payload: { deviceId },
    });
    if (success) {
        res.json({ success: true, message: 'Identify command sent' });
    } else {
        res.status(404).json({ success: false, error: 'Device not found or offline' });
    }
});

app.delete('/api/devices/:deviceId', (req, res) => {
    const deviceId = req.params.deviceId;
    const device = deviceManager.getDevice(deviceId);
    if (device) {
        deviceManager.sendToDevice(deviceId, {
            type: 'disconnect_screen',
            payload: { deviceId },
        });
        deviceManager.unregisterDevice(deviceId, true); // Immediate removal
        res.json({ success: true, message: 'Device disconnected' });
    } else {
        res.status(404).json({ success: false, error: 'Device not found' });
    }
});

app.get('/api/devices/online', (req, res) => {
    console.log('[API] GET /api/devices/online - Get online devices');
    const devices = deviceManager.getOnlineDevices();
    res.json({ success: true, data: devices });
});

app.get('/api/devices/:deviceId', (req, res) => {
    console.log(`[API] GET /api/devices/${req.params.deviceId} - Get device details`);
    const device = deviceManager.getDevice(req.params.deviceId);
    
    if (!device) {
        return res.status(404).json({ success: false, error: 'Device not found' });
    }
    
    res.json({ success: true, data: device });
});

app.post('/api/devices/:deviceId/command', (req, res) => {
    console.log(`[API] POST /api/devices/${req.params.deviceId}/command - Send device command`);
    const { command, data } = req.body;
    
    if (!command) {
        return res.status(400).json({ success: false, error: 'Command required' });
    }
    
    const success = deviceManager.sendToDevice(req.params.deviceId, {
        type: command,
        payload: data || {}
    });
    
    if (success) {
        res.json({ success: true, message: 'Command sent successfully' });
    } else {
        res.status(500).json({ success: false, error: 'Failed to send command to device' });
    }
});

// Device Groups endpoints
app.get('/api/groups', (req, res) => {
    console.log('[API] GET /api/groups - Get all device groups');
    const groups = deviceManager.getGroups();
    res.json({ success: true, data: groups });
});

app.post('/api/groups', (req, res) => {
    console.log('[API] POST /api/groups - Create device group');
    const { name, deviceIds, layout } = req.body;
    
    if (!name || !deviceIds || !Array.isArray(deviceIds)) {
        return res.status(400).json({ 
            success: false, 
            error: 'Name and deviceIds array required' 
        });
    }
    
    const groupId = deviceManager.createGroup(name, deviceIds, layout);
    const group = deviceManager.getGroup(groupId);
    
    res.json({ 
        success: true, 
        message: 'Group created successfully',
        data: group 
    });
});

app.get('/api/groups/:groupId', (req, res) => {
    console.log(`[API] GET /api/groups/${req.params.groupId} - Get group details`);
    const group = deviceManager.getGroup(req.params.groupId);
    
    if (!group) {
        return res.status(404).json({ success: false, error: 'Group not found' });
    }
    
    res.json({ success: true, data: group });
});

app.post('/api/groups/:groupId/devices', (req, res) => {
    console.log(`[API] POST /api/groups/${req.params.groupId}/devices - Add device to group`);
    const { deviceId } = req.body;
    
    if (!deviceId) {
        return res.status(400).json({ success: false, error: 'Device ID required' });
    }
    
    const success = deviceManager.addDeviceToGroup(req.params.groupId, deviceId);
    
    if (success) {
        res.json({ success: true, message: 'Device added to group' });
    } else {
        res.status(400).json({ success: false, error: 'Failed to add device to group' });
    }
});

app.delete('/api/groups/:groupId/devices/:deviceId', (req, res) => {
    console.log(`[API] DELETE /api/groups/${req.params.groupId}/devices/${req.params.deviceId} - Remove device from group`);
    
    const success = deviceManager.removeDeviceFromGroup(req.params.groupId, req.params.deviceId);
    
    if (success) {
        res.json({ success: true, message: 'Device removed from group' });
    } else {
        res.status(400).json({ success: false, error: 'Failed to remove device from group' });
    }
});

app.post('/api/groups/:groupId/control', (req, res) => {
    console.log(`[API] POST /api/groups/${req.params.groupId}/control - Control group playback`);
    const { command, data } = req.body;
    
    if (!command) {
        return res.status(400).json({ success: false, error: 'Command required' });
    }
    
    const successCount = deviceManager.controlGroup(req.params.groupId, command, data);
    
    res.json({ 
        success: true, 
        message: `Command sent to ${successCount} devices`,
        data: { affectedDevices: successCount }
    });
});

app.put('/api/groups/:groupId/settings', (req, res) => {
    console.log(`[API] PUT /api/groups/${req.params.groupId}/settings - Update group settings`);
    const settings = req.body;
    
    const success = deviceManager.updateGroupSettings(req.params.groupId, settings);
    
    if (success) {
        const group = deviceManager.getGroup(req.params.groupId);
        res.json({ 
            success: true, 
            message: 'Group settings updated',
            data: group 
        });
    } else {
        res.status(404).json({ success: false, error: 'Group not found' });
    }
});

app.delete('/api/groups/:groupId', (req, res) => {
    console.log(`[API] DELETE /api/groups/${req.params.groupId} - Delete group`);
    
    const success = deviceManager.deleteGroup(req.params.groupId);
    
    if (success) {
        res.json({ success: true, message: 'Group deleted successfully' });
    } else {
        res.status(404).json({ success: false, error: 'Group not found' });
    }
});

// Paper Workflow endpoints
app.get('/api/paper/slips', (req, res) => {
    console.log('[API] GET /api/paper/slips - Get paper slips');
    const { status, priority, singer, limit } = req.query;
    
    const filter: {
        status?: ('pending' | 'matched' | 'queued' | 'duplicate' | 'unavailable' | 'rejected')[];
        priority?: ('normal' | 'high' | 'vip')[];
        singer?: string;
        limit?: number;
    } = {};
    if (status) filter.status = (status as string).split(',') as ('pending' | 'matched' | 'queued' | 'duplicate' | 'unavailable' | 'rejected')[];
    if (priority) filter.priority = (priority as string).split(',') as ('normal' | 'high' | 'vip')[];
    if (singer) filter.singer = singer as string;
    if (limit) filter.limit = parseInt(limit as string);
    
    const slips = paperWorkflow.getSlips(filter);
    res.json({ success: true, data: slips });
});

app.post('/api/paper/slips', (req, res) => {
    console.log('[API] POST /api/paper/slips - Add paper slip');
    const { singerName, requestedSong, priority, notes, kjNotes } = req.body;
    
    if (!singerName || !requestedSong) {
        return res.status(400).json({ 
            success: false, 
            error: 'Singer name and requested song required' 
        });
    }
    
    const slip = paperWorkflow.addSlip(singerName, requestedSong, {
        priority,
        notes,
        kjNotes
    });
    
    res.json({ 
        success: true, 
        message: 'Paper slip added successfully',
        data: slip 
    });
});

app.get('/api/paper/slips/:slipId', (req, res) => {
    console.log(`[API] GET /api/paper/slips/${req.params.slipId} - Get slip details`);
    const slip = paperWorkflow.getSlip(req.params.slipId);
    
    if (!slip) {
        return res.status(404).json({ success: false, error: 'Slip not found' });
    }
    
    res.json({ success: true, data: slip });
});

app.put('/api/paper/slips/:slipId', (req, res) => {
    console.log(`[API] PUT /api/paper/slips/${req.params.slipId} - Update slip`);
    const { status, notes } = req.body;
    
    if (!status) {
        return res.status(400).json({ success: false, error: 'Status required' });
    }
    
    const success = paperWorkflow.updateSlipStatus(req.params.slipId, status, notes);
    
    if (success) {
        const slip = paperWorkflow.getSlip(req.params.slipId);
        res.json({ 
            success: true, 
            message: 'Slip updated successfully',
            data: slip 
        });
    } else {
        res.status(404).json({ success: false, error: 'Slip not found' });
    }
});

app.post('/api/paper/slips/:slipId/match', (req, res) => {
    console.log(`[API] POST /api/paper/slips/${req.params.slipId}/match - Match slip to song`);
    const { songId } = req.body;
    
    if (!songId) {
        return res.status(400).json({ success: false, error: 'Song ID required' });
    }
    
    const success = paperWorkflow.matchSlip(req.params.slipId, songId);
    
    if (success) {
        const slip = paperWorkflow.getSlip(req.params.slipId);
        res.json({ 
            success: true, 
            message: 'Slip matched successfully',
            data: slip 
        });
    } else {
        res.status(400).json({ success: false, error: 'Failed to match slip' });
    }
});

app.delete('/api/paper/slips/:slipId', (req, res) => {
    console.log(`[API] DELETE /api/paper/slips/${req.params.slipId} - Delete slip`);
    
    const success = paperWorkflow.deleteSlip(req.params.slipId);
    
    if (success) {
        res.json({ success: true, message: 'Slip deleted successfully' });
    } else {
        res.status(404).json({ success: false, error: 'Slip not found' });
    }
});

app.get('/api/paper/stats', (req, res) => {
    console.log('[API] GET /api/paper/stats - Get workflow statistics');
    const stats = paperWorkflow.getStats();
    res.json({ success: true, data: stats });
});

app.get('/api/paper/suggestions', (req, res) => {
    console.log('[API] GET /api/paper/suggestions - Get input suggestions');
    const { query, limit } = req.query;
    
    if (!query) {
        return res.status(400).json({ success: false, error: 'Query required' });
    }
    
    const suggestions = paperWorkflow.getSuggestions(
        query as string, 
        limit ? parseInt(limit as string) : 10
    );
    
    res.json({ success: true, data: suggestions });
});

app.post('/api/paper/search', (req, res) => {
    console.log('[API] POST /api/paper/search - Search slips');
    const { query } = req.body;
    
    if (!query) {
        return res.status(400).json({ success: false, error: 'Query required' });
    }
    
    const results = paperWorkflow.searchSlips(query);
    res.json({ success: true, data: results });
});

app.get('/api/paper/settings', (req, res) => {
    console.log('[API] GET /api/paper/settings - Get workflow settings');
    const settings = paperWorkflow.getSettings();
    res.json({ success: true, data: settings });
});

app.put('/api/paper/settings', (req, res) => {
    console.log('[API] PUT /api/paper/settings - Update workflow settings');
    const settings = req.body;
    
    paperWorkflow.updateSettings(settings);
    const newSettings = paperWorkflow.getSettings();
    
    res.json({ 
        success: true, 
        message: 'Settings updated successfully',
        data: newSettings 
    });
});

app.post('/api/paper/clear', (req, res) => {
    console.log('[API] POST /api/paper/clear - Clear all slips');
    paperWorkflow.clearSlips();
    res.json({ success: true, message: 'All slips cleared' });
});

app.get('/api/paper/export', (req, res) => {
    console.log('[API] GET /api/paper/export - Export slips data');
    const slips = paperWorkflow.exportSlips();
    res.json({ success: true, data: slips });
});

app.post('/api/paper/import', (req, res) => {
    console.log('[API] POST /api/paper/import - Import slips data');
    const { slips } = req.body;
    
    if (!Array.isArray(slips)) {
        return res.status(400).json({ success: false, error: 'Slips array required' });
    }
    
    const imported = paperWorkflow.importSlips(slips);
    res.json({ 
        success: true, 
        message: `Imported ${imported} slips`,
        data: { imported }
    });
});

// Singer Profiles endpoints
app.get('/api/singers', (req, res) => {
    console.log('[API] GET /api/singers - Get all singer profiles');
    const profiles = singerProfileManager.getAllProfiles();
    res.json({ success: true, data: profiles });
});

app.post('/api/singers', (req, res) => {
    console.log('[API] POST /api/singers - Create singer profile');
    const { name, email, phone, favoriteGenres, notes, vipStatus, preferredKey } = req.body;
    
    if (!name) {
        return res.status(400).json({ success: false, error: 'Singer name required' });
    }
    
    const profile = singerProfileManager.createProfile({
        name,
        email,
        phone,
        favoriteGenres: favoriteGenres || [],
        favoriteSongs: [],
        totalSongsPerformed: 0,
        notes: notes || '',
        vipStatus: vipStatus || false,
        preferredKey
    });
    
    res.json({ 
        success: true, 
        message: 'Singer profile created successfully',
        data: profile 
    });
});

app.get('/api/singers/:singerId', (req, res) => {
    console.log(`[API] GET /api/singers/${req.params.singerId} - Get singer profile`);
    const profile = singerProfileManager.getProfile(req.params.singerId);
    
    if (!profile) {
        return res.status(404).json({ success: false, error: 'Singer profile not found' });
    }
    
    res.json({ success: true, data: profile });
});

app.put('/api/singers/:singerId', (req, res) => {
    console.log(`[API] PUT /api/singers/${req.params.singerId} - Update singer profile`);
    const updates = req.body;
    
    const updatedProfile = singerProfileManager.updateProfile(req.params.singerId, updates);
    
    if (!updatedProfile) {
        return res.status(404).json({ success: false, error: 'Singer profile not found' });
    }
    
    res.json({ 
        success: true, 
        message: 'Singer profile updated successfully',
        data: updatedProfile 
    });
});

app.delete('/api/singers/:singerId', (req, res) => {
    console.log(`[API] DELETE /api/singers/${req.params.singerId} - Delete singer profile`);
    
    const deleted = singerProfileManager.deleteProfile(req.params.singerId);
    
    if (!deleted) {
        return res.status(404).json({ success: false, error: 'Singer profile not found' });
    }
    
    res.json({ success: true, message: 'Singer profile deleted successfully' });
});

app.get('/api/singers/search/:query', (req, res) => {
    console.log(`[API] GET /api/singers/search/${req.params.query} - Search singer profiles`);
    const results = singerProfileManager.findProfilesByName(req.params.query);
    res.json({ success: true, data: results });
});

app.post('/api/singers/search', (req, res) => {
    console.log('[API] POST /api/singers/search - Advanced singer search');
    const criteria = req.body;
    const results = singerProfileManager.searchSingers(criteria);
    res.json({ success: true, data: results });
});

app.get('/api/singers/:singerId/stats', (req, res) => {
    console.log(`[API] GET /api/singers/${req.params.singerId}/stats - Get singer statistics`);
    const stats = singerProfileManager.getSingerStats(req.params.singerId);
    
    if (!stats) {
        return res.status(404).json({ success: false, error: 'Singer profile not found' });
    }
    
    res.json({ success: true, data: stats });
});

app.post('/api/singers/:singerId/performances', (req, res) => {
    console.log(`[API] POST /api/singers/${req.params.singerId}/performances - Record performance`);
    const { songId, songTitle, artist, rating, notes, sessionId, venue } = req.body;
    
    if (!songId || !songTitle || !artist) {
        return res.status(400).json({ 
            success: false, 
            error: 'Song ID, title, and artist required' 
        });
    }
    
    const performance = singerProfileManager.recordPerformance({
        singerId: req.params.singerId,
        songId,
        songTitle,
        artist,
        rating,
        notes,
        sessionId,
        venue
    });
    
    res.json({ 
        success: true, 
        message: 'Performance recorded successfully',
        data: performance 
    });
});

app.get('/api/singers/:singerId/performances', (req, res) => {
    console.log(`[API] GET /api/singers/${req.params.singerId}/performances - Get performance history`);
    const performances = singerProfileManager.getPerformanceHistory(req.params.singerId);
    res.json({ success: true, data: performances });
});

app.get('/api/singers/vip/list', (req, res) => {
    console.log('[API] GET /api/singers/vip/list - Get VIP singers');
    const vipSingers = singerProfileManager.getVipSingers();
    res.json({ success: true, data: vipSingers });
});

app.get('/api/singers/top/performers', (req, res) => {
    console.log('[API] GET /api/singers/top/performers - Get top performers');
    const { limit } = req.query;
    const topPerformers = singerProfileManager.getTopPerformers(
        limit ? parseInt(limit as string) : 10
    );
    res.json({ success: true, data: topPerformers });
});

app.get('/api/singers/export/data', (req, res) => {
    console.log('[API] GET /api/singers/export/data - Export singer data');
    const exportData = singerProfileManager.exportData();
    res.json({ success: true, data: exportData });
});

app.post('/api/singers/import/data', (req, res) => {
    console.log('[API] POST /api/singers/import/data - Import singer data');
    const { profiles, performances } = req.body;
    
    if (!profiles || !performances) {
        return res.status(400).json({ 
            success: false, 
            error: 'Profiles and performances data required' 
        });
    }
    
    singerProfileManager.importData({ profiles, performances });
    res.json({ 
        success: true, 
        message: 'Singer data imported successfully',
        data: { 
            profilesImported: profiles.length, 
            performancesImported: performances.length 
        }
    });
});

// Advanced Queue Management endpoints
app.get('/api/queue/advanced', (req, res) => {
    console.log('[API] GET /api/queue/advanced - Get advanced queue');
    const queue = advancedQueueManager.getQueue();
    res.json({ success: true, data: queue });
});

app.post('/api/queue/advanced/add', (req, res) => {
    console.log('[API] POST /api/queue/advanced/add - Add song to advanced queue');
    const { singerName, songId, priority, singerId } = req.body;
    
    if (!singerName || !songId) {
        return res.status(400).json({ 
            success: false, 
            error: 'Singer name and song ID required' 
        });
    }
    
    const song = getSongById(songId);
    if (!song) {
        return res.status(404).json({ success: false, error: 'Song not found' });
    }
    
    const entry = advancedQueueManager.addToQueue(song, singerName, { priority, singerId });
    broadcast({ type: 'advanced_queue_updated', payload: advancedQueueManager.getQueue() });
    
    res.json({ 
        success: true, 
        message: 'Song added to advanced queue',
        data: entry 
    });
});

app.delete('/api/queue/advanced/:entryId', (req, res) => {
    console.log(`[API] DELETE /api/queue/advanced/${req.params.entryId} - Remove from advanced queue`);
    
    const success = advancedQueueManager.removeFromQueue(req.params.entryId);
    
    if (success) {
        broadcast({ type: 'advanced_queue_updated', payload: advancedQueueManager.getQueue() });
        res.json({ success: true, message: 'Song removed from advanced queue' });
    } else {
        res.status(404).json({ success: false, error: 'Queue entry not found' });
    }
});

app.post('/api/queue/advanced/reorder', (req, res) => {
    console.log('[API] POST /api/queue/advanced/reorder - Reorder advanced queue');
    const { fromIndex, toIndex } = req.body;
    
    if (typeof fromIndex !== 'number' || typeof toIndex !== 'number') {
        return res.status(400).json({ 
            success: false, 
            error: 'fromIndex and toIndex must be numbers' 
        });
    }
    
    const success = advancedQueueManager.reorderQueue(fromIndex, toIndex);
    
    if (success) {
        broadcast({ type: 'advanced_queue_updated', payload: advancedQueueManager.getQueue() });
        res.json({ 
            success: true, 
            message: 'Advanced queue reordered successfully',
            data: { fromIndex, toIndex }
        });
    } else {
        res.status(400).json({ 
            success: false, 
            error: 'Invalid indices for queue reordering' 
        });
    }
});

app.post('/api/queue/advanced/promote/:entryId', (req, res) => {
    console.log(`[API] POST /api/queue/advanced/promote/${req.params.entryId} - Promote queue entry`);
    const { priority } = req.body;
    
    if (!priority || !['normal', 'high', 'vip'].includes(priority)) {
        return res.status(400).json({ 
            success: false, 
            error: 'Valid priority required (normal, high, vip)' 
        });
    }
    
    const success = advancedQueueManager.promoteEntry(req.params.entryId, priority);
    
    if (success) {
        broadcast({ type: 'advanced_queue_updated', payload: advancedQueueManager.getQueue() });
        res.json({ success: true, message: 'Queue entry promoted successfully' });
    } else {
        res.status(404).json({ success: false, error: 'Queue entry not found' });
    }
});

app.get('/api/queue/advanced/next', (req, res) => {
    console.log('[API] GET /api/queue/advanced/next - Get next song from advanced queue');
    const nextSong = advancedQueueManager.getNextSong();
    
    if (nextSong) {
        res.json({ success: true, data: nextSong });
    } else {
        res.json({ success: true, data: null, message: 'No songs in queue' });
    }
});

app.post('/api/queue/advanced/play-next', (req, res) => {
    console.log('[API] POST /api/queue/advanced/play-next - Play next song from advanced queue');
    const nextSong = advancedQueueManager.getNextSong();
    
    if (nextSong) {
        // Add to regular queue for playback (getNextSong already removes it)
        addSongToQueue(nextSong.song, nextSong.singerName);
        
        broadcast({ type: 'advanced_queue_updated', payload: advancedQueueManager.getQueue() });
        broadcast({ type: 'queue_updated', payload: getQueue() });
        
        res.json({ 
            success: true, 
            message: 'Next song moved to playback queue',
            data: nextSong 
        });
    } else {
        res.json({ success: false, message: 'No songs in advanced queue' });
    }
});

app.get('/api/queue/advanced/settings', (req, res) => {
    console.log('[API] GET /api/queue/advanced/settings - Get advanced queue settings');
    const settings = advancedQueueManager.getSettings();
    res.json({ success: true, data: settings });
});

app.put('/api/queue/advanced/settings', (req, res) => {
    console.log('[API] PUT /api/queue/advanced/settings - Update advanced queue settings');
    const settings = req.body;
    
    advancedQueueManager.updateSettings(settings);
    broadcast({ type: 'advanced_queue_settings_updated', payload: advancedQueueManager.getSettings() });
    
    res.json({ 
        success: true, 
        message: 'Advanced queue settings updated',
        data: advancedQueueManager.getSettings() 
    });
});

app.get('/api/queue/advanced/stats', (req, res) => {
    console.log('[API] GET /api/queue/advanced/stats - Get advanced queue statistics');
    const stats = advancedQueueManager.getQueueStats();
    res.json({ success: true, data: stats });
});

app.post('/api/queue/advanced/clear', (req, res) => {
    console.log('[API] POST /api/queue/advanced/clear - Clear advanced queue');
    advancedQueueManager.clearQueue();
    broadcast({ type: 'advanced_queue_updated', payload: advancedQueueManager.getQueue() });
    
    res.json({ success: true, message: 'Advanced queue cleared' });
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
    const config = loadSetupConfig();
    const mediaPath = path.join(config.mediaDirectory, fileName);

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
    console.log('[WebSocket] Broadcasting message:', data);
    
    // Broadcast to local clients
    wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
    
    // Also send to cloud relay if connected
    if (cloudConnector.isCloudMode()) {
        cloudConnector.sendToCloud({
            type: data.type,
            payload: data.payload as Record<string, unknown>,
            timestamp: Date.now()
        });
    }
};

// Set up cloud connector now that broadcast is defined
cloudConnector.setLocalBroadcast(broadcast);

wss.on('connection', (ws, req) => {
  const clientId = randomUUID();
  const ipAddress = req.socket.remoteAddress || 'unknown';
  let clientType: 'player' | 'admin' | 'singer' = 'admin'; // Default to admin
  let clientName = 'Unknown Client';
  
  console.log(`Client connected: ${clientId} from ${ipAddress}`);
  
  // Send current session state to newly connected client
  ws.send(JSON.stringify({ type: 'session_state_updated', payload: getSessionState() }));
  ws.send(JSON.stringify({ type: 'queue_updated', payload: getQueue() }));
  ws.send(JSON.stringify({ type: 'history_updated', payload: getSessionHistory() }));

  ws.on('message', async (message) => {
    try {
        const data = JSON.parse(message.toString());
        const { type, payload } = data;
        console.log('[WebSocket] Received message:', { type, payload });

        switch (type) {
        case 'client_identify': {
            // Handle client identification for sync engine
            clientType = payload.type || 'admin';
            clientName = payload.name || `${clientType} Client`;
            const stableId: string | undefined = typeof payload.stableId === 'string' ? payload.stableId : undefined;
            
            // Register with sync engine using the connection-specific id
            videoSyncEngine.registerClient(clientId, ws, clientName, clientType);
            
            // Register player devices with device manager (use stableId if provided to persist across reloads)
            if (clientType === 'player') {
                const deviceInfo = {
                    name: clientName,
                    ipAddress, // Use the IP from the connection
                    userAgent: payload.userAgent || 'unknown',
                    viewport: payload.viewport || { width: 0, height: 0 },
                    os: payload.os || 'unknown',
                    browser: payload.browser || 'unknown',
                    isApp: payload.isApp || false,
                    capabilities: payload.capabilities || {}
                };
                const deviceId = stableId || clientId;
                connectionToDeviceId.set(clientId, deviceId);
                deviceManager.upsertDevice(deviceId, ws, deviceInfo);
                
                // Send device management status
                ws.send(JSON.stringify({ 
                    type: 'device_status', 
                    payload: deviceManager.getStats() 
                }));

                // If a song is currently playing, catch the new player up
                const s = getSessionState();
                if (s.playbackState === 'playing' && s.nowPlaying?.song?.fileName && s.currentSongStartTime) {
                    try {
                        const elapsedSec = Math.max(0, (Date.now() - s.currentSongStartTime) / 1000);
                        const videoUrl = `/api/media/${s.nowPlaying.song.fileName}`;
                        // Allow time for initial clock sync and buffering
                        const avgLatency = videoSyncEngine.getSyncStats().averageLatency;
                        const coordinationBuffer = Math.max(2500, avgLatency * 3 + 800);
                        const scheduledTime = Date.now() + coordinationBuffer;

                        // Preload first
                        ws.send(JSON.stringify({
                            type: 'sync_preload',
                            videoUrl,
                            commandId: `catchup_${Date.now()}`
                        }));
                        // Schedule synchronized start at current timestamp
                        ws.send(JSON.stringify({
                            type: 'sync_play',
                            videoUrl,
                            scheduledTime,
                            videoTime: elapsedSec,
                            commandId: `catchup_${Date.now()}`,
                            tolerance: 100
                        }));
                    } catch (err) {
                        console.error('[Sync] Failed to schedule catch-up playback for new player:', err);
                    }
                }
            }
            
            console.log(`[WebSocket] Client identified: ${clientName} (${clientType})`);
            
            // Send sync status to player clients
            if (clientType === 'player') {
                ws.send(JSON.stringify({ 
                    type: 'sync_status', 
                    payload: videoSyncEngine.getSyncStats() 
                }));

                // If something is already playing, schedule a catch-up for this client
                const s = getSessionState();
                if (s.playbackState === 'playing' && s.nowPlaying?.song?.fileName && s.currentSongStartTime) {
                    try {
                        const elapsedSec = Math.max(0, (Date.now() - s.currentSongStartTime) / 1000);
                        const videoUrl = `/api/media/${s.nowPlaying.song.fileName}`;
                        // Use connection/clientId for sync engine id
                        const ok = await videoSyncEngine.catchUpClient(clientId, videoUrl, elapsedSec);
                        if (ok) {
                            // Update the persistent baseline for this connection so drift uses client clock domain
                            const baseline = videoSyncEngine.getClientBaseline(clientId);
                            if (baseline) {
                              // nothing; baseline is set in catchUpClient
                            }
                            syncLog('catchup_enqueued', { clientId, elapsedSec, videoUrl, at: Date.now() });
                        }
                    } catch {
                        // ignore
                    }
                }
            }
            break;
        }
        case 'clock_sync_response': {
            // Handle clock synchronization response
            videoSyncEngine.handleClockSyncResponse(clientId, payload);
            try {
              const info = typeof payload === 'object' && payload ? payload as Record<string, unknown> : {};
              syncLog('client_clock_sync_response', { clientId, ...info });
            } catch { void 0; }
            break;
        }
        case 'sync_ready': {
            // Handle client ready status for video sync
            videoSyncEngine.handleClientReady(clientId, payload);
            try {
                const info = typeof payload === 'object' && payload ? payload as Record<string, unknown> : {};
                syncLog('client_ready', { clientId, ...info });
            } catch {
                // ignore logging errors
            }
            break;
        }
        case 'client_video_loaded': {
            // Client reports its media element has loaded enough to play
            try {
                const info = typeof payload === 'object' && payload ? payload as Record<string, unknown> : {};
                syncLog('client_video_loaded', { clientId, ...info });
            } catch (err) {
                console.error('[Sync] client_video_loaded log error:', err);
            }
            break;
        }
        case 'client_preload_received': {
            try { const info = typeof payload === 'object' && payload ? payload as Record<string, unknown> : {}; syncLog('client_preload_received', { clientId, ...info }); } catch { void 0; }
            break;
        }
        case 'client_canplay': {
            try { const info = typeof payload === 'object' && payload ? payload as Record<string, unknown> : {}; syncLog('client_canplay', { clientId, ...info }); } catch { void 0; }
            break;
        }
        case 'client_schedule_received': {
            try { const info = typeof payload === 'object' && payload ? payload as Record<string, unknown> : {}; syncLog('client_schedule_received', { clientId, ...info }); } catch { void 0; }
            break;
        }
        case 'client_schedule_fired': {
            try { const info = typeof payload === 'object' && payload ? payload as Record<string, unknown> : {}; syncLog('client_schedule_fired', { clientId, ...info }); } catch { void 0; }
            break;
        }
        case 'client_started_playback': {
            // Client reports it actually started playback
            try {
                const info = typeof payload === 'object' && payload ? payload as Record<string, unknown> : {};
                syncLog('client_started_playback', { clientId, ...info });
            } catch (err) {
                console.error('[Sync] client_started_playback log error:', err);
            }
            break;
        }
        case 'client_position_tick': {
            try { const info = typeof payload === 'object' && payload ? payload as Record<string, unknown> : {}; syncLog('client_position_tick', { clientId, ...info }); } catch { void 0; }
            break;
        }
        case 'client_paused': {
            try { const info = typeof payload === 'object' && payload ? payload as Record<string, unknown> : {}; syncLog('client_paused', { clientId, ...info }); } catch { void 0; }
            break;
        }
        case 'sync_report_position': {
            // Player reports current playback position (seconds)
            try {
                const reportedTimeSec = (payload && typeof payload === 'object' && 'currentTime' in payload)
                    ? Number((payload as { currentTime: number }).currentTime)
                    : NaN;
                const clientReportedAt = (payload && typeof payload === 'object' && 'reportedAt' in payload)
                    ? Number((payload as { reportedAt?: number }).reportedAt)
                    : undefined;
                if (!isNaN(reportedTimeSec)) {
                    latestPlaybackPositionsSec.set(clientId, reportedTimeSec);

                    // Compute drift using per-client adjusted baseline if available; otherwise global
                    const clientBaseline = videoSyncEngine.getClientBaseline(clientId);
                    const hasGlobal = (syncRefScheduledTimeMs !== null && syncRefVideoStartSec !== null);
                    if (clientBaseline || hasGlobal) {
                        const scheduled = clientBaseline?.scheduledTime ?? (syncRefScheduledTimeMs as number);
                        const startSec = clientBaseline?.videoStartSec ?? (syncRefVideoStartSec as number);
                        const baselineDomain = clientBaseline ? clientBaseline.domain : 'server';
                        // Decide reference time for expectedSec based on baseline domain
                        const nowRef = (baselineDomain === 'client' && clientReportedAt) ? clientReportedAt : Date.now();
                        const expectedSec = startSec + Math.max(0, (nowRef - scheduled) / 1000);
                        const driftMs = Math.round((reportedTimeSec - expectedSec) * 1000);
                        const clientStats = videoSyncEngine.getClientStats(clientId);
                        const mappedId = connectionToDeviceId.get(clientId) || clientId;
                        deviceManager.updateDeviceStatus(mappedId, 'playing', {
                            syncStats: {
                                clockOffset: clientStats?.clockOffset ?? 0,
                                averageLatency: clientStats?.averageLatency ?? videoSyncEngine.getSyncStats().averageLatency,
                                lastSyncError: driftMs
                            }
                        });
                        broadcast({ type: 'devices_updated', payload: getMappedDevices() });
                        syncLog('position_report', { clientId, reportedTimeSec, expectedSec, driftMs, baseline: { scheduled, startSec, domain: baselineDomain, usedOffsetMs: clientBaseline?.usedOffsetMs, usedLatencyMs: clientBaseline?.usedLatencyMs, establishedAt: clientBaseline?.establishedAt }, referenceNow: { type: (baselineDomain === 'client' ? 'clientReportedAt' : 'serverNow'), value: nowRef }, clientStats });
                    }
                }
            } catch (err) {
                console.error('[Sync] Failed to process sync_report_position:', err);
            }
            break;
        }
        case 'device_status_update': {
            // Handle device status updates
            if (clientType === 'player') {
                deviceManager.updateDeviceStatus(clientId, payload.status, payload.data);
            }
            break;
        }
        case 'heartbeat_response': {
            // Handle heartbeat responses from devices
            if (clientType === 'player') {
                const mappedId = connectionToDeviceId.get(clientId) || clientId;
                deviceManager.handleHeartbeatResponse(mappedId, payload);
            }
            break;
        }
        case 'request_song': {
            const song = getSongById(payload.songId);
            if (song) {
            addSongToQueue(song, payload.singerName);
            broadcast({ type: 'queue_updated', payload: getQueue() });
            broadcast({ type: 'session_state_updated', payload: getSessionState() });
            }
            break;
        }
        case 'get_queue':
            ws.send(JSON.stringify({ type: 'queue_updated', payload: getQueue() }));
            break;
        case 'get_session_state':
            // Send complete session state for reconnecting clients
            ws.send(JSON.stringify({ type: 'session_state_updated', payload: getSessionState() }));
            break;
        case 'get_history':
            ws.send(JSON.stringify({ type: 'history_updated', payload: getSessionHistory() }));
            break;
        case 'remove_from_queue': {
            const removed = removeSongFromQueue(payload.songId);
            if (removed) {
              broadcast({ type: 'queue_updated', payload: getQueue() });
              broadcast({ type: 'session_state_updated', payload: getSessionState() });
            }
            break;
        }
        case 'play': {
            console.log('[WebSocket] Play message received:', payload);
            // When KJ manually plays a song
            const playedSong = playSong(payload.songId, payload.singer);
            if (playedSong) {
              broadcast({ type: 'play', payload: { 
                  songId: playedSong.song.id, 
                  fileName: playedSong.song.fileName,
                  singer: playedSong.singerName
              }});
              broadcast({ type: 'queue_updated', payload: getQueue() });
              broadcast({ type: 'session_state_updated', payload: getSessionState() });
            } else {
              // Fallback for direct file play (legacy support)
              broadcast({ type: 'play', payload: { 
                  songId: payload.songId, 
                  fileName: payload.fileName,
                  singer: payload.singer
              }});
            }
            break;
        }
        case 'restart_song': {
            console.log('[WebSocket] Restart song requested');
            const s = getSessionState();
            if (s.nowPlaying?.song?.fileName) {
              // Use sync engine to schedule a fresh start at t=0
              videoSyncEngine.syncPlayVideo(`/api/media/${s.nowPlaying.song.fileName}`, 0)
                .catch((err) => console.error('[Sync] restart error:', err));
            }
            broadcast({ type: 'session_state_updated', payload: getSessionState() });
            break;
        }
        case 'replay_song': {
            console.log('[WebSocket] Replay song requested:', payload);
            const replayedSong = playSong(payload.songId, payload.singerName);
            if (replayedSong) {
              broadcast({ type: 'play', payload: { 
                  songId: replayedSong.song.id, 
                  fileName: replayedSong.song.fileName,
                  singer: replayedSong.singerName,
                  replay: true
              }});
              broadcast({ type: 'queue_updated', payload: getQueue() });
              broadcast({ type: 'session_state_updated', payload: getSessionState() });
            }
            break;
        }
        case 'pause_playback': {
            // Use sync engine pause so clients pause in lockstep at a scheduled time
            videoSyncEngine.syncPause().catch((err) => console.error('[Sync] pause error:', err));
            pausePlayback();
            // Do not broadcast legacy 'pause' that resets client state; rely on sync_pause
            broadcast({ type: 'session_state_updated', payload: getSessionState() });
            try { syncLog('sync_pause_initiated', { at: Date.now() }); } catch { void 0; }
            break;
        }
        case 'resume_playback': {
            // Resume with synchronized schedule at current timestamp
            videoSyncEngine.syncResume().catch((err) => console.error('[Sync] resume error:', err));
            resumePlayback();
            broadcast({ type: 'session_state_updated', payload: getSessionState() });
            try { syncLog('sync_resume_initiated', { at: Date.now() }); } catch { void 0; }
            break;
        }
        case 'stop_playback':
            stopPlayback();
            // End engine playback and clear baselines; clients should unload
            videoSyncEngine.endPlayback();
            syncRefScheduledTimeMs = null;
            syncRefVideoStartSec = null;
            // Instruct clients to hard-stop/unload and CLEAR sync state by sending a minimal session state update afterwards
            broadcast({ type: 'sync_pause', payload: { commandId: `stop_${Date.now()}`, scheduledTime: Date.now() + 50 } });
            broadcast({ type: 'queue_updated', payload: getQueue() });
            broadcast({ type: 'session_state_updated', payload: getSessionState() });
            broadcast({ type: 'history_updated', payload: getSessionHistory() });
            break;
        case 'song_ended': {
            // Client reports a song finished; end sync engine playback and advance
            try { syncLog('client_song_ended', { clientId, at: Date.now() }); } catch { void 0; }
            videoSyncEngine.endPlayback();
            // Close out current song in session (history, clear nowPlaying)
            stopPlayback();
            // Mark current song as completed and move to next
            const nextSong = getNextSong();
            if (nextSong) {
              broadcast({ type: 'play', payload: { 
                  songId: nextSong.song.id, 
                  fileName: nextSong.song.fileName,
                  singer: nextSong.singerName
              }});
              broadcast({ type: 'queue_updated', payload: getQueue() });
              broadcast({ type: 'session_state_updated', payload: getSessionState() });
              broadcast({ type: 'history_updated', payload: getSessionHistory() });
            } else {
              const nextFillerSong = getNextFillerSong();
              if(nextFillerSong) {
                  broadcast({ type: 'play_filler_music', payload: { fileName: nextFillerSong.fileName } });
              } else {
                  // Explicitly notify clients state changed to stopped
                  broadcast({ type: 'session_state_updated', payload: getSessionState() });
              }
              broadcast({ type: 'history_updated', payload: getSessionHistory() });
            }
            break;
        }
        case 'ticker_updated':
            console.log('[WebSocket] Ticker update:', payload);
            broadcast({ type: 'ticker_updated', payload });
            break;
        case 'connect_online_session': {
            const { sessionId, adminKey } = payload as { sessionId: string; adminKey: string };
            console.log(`[WebSocket] Attempting to connect to online session ${sessionId} with key ${adminKey}`);
            // This is a simplified connection logic. In a real app, you'd validate the adminKey.
            cloudConnector.registerWithSession(sessionId, PORT as number, {})
              .then(success => {
                if (success) {
                  const config = loadSetupConfig();
                  ws.send(JSON.stringify({
                    type: 'online_session_connected',
                    payload: {
                      requiresLocalLibrary: !!config.mediaDirectory,
                    }
                  }));
                } else {
                  ws.send(JSON.stringify({
                    type: 'connection_error',
                    payload: 'Failed to connect to online session.'
                  }));
                }
              });
            break;
        }
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
    console.log(`Client disconnected: ${clientName} (${clientId})`);
    
    // Unregister from sync engine
    videoSyncEngine.unregisterClient(clientId);
    
    // Do not remove persistent device entries here; heartbeat logic will mark offline if necessary
  });
});

server.listen(PORT, async () => {
  // Load config first
  const config = loadSetupConfig();

  // Now scan libraries using configured paths
  console.log('[Server] Initializing media libraries from config...');
  try {
    const scannedSongs = scanMediaLibrary(config.mediaDirectory);
    console.log(`[Server Startup] Media library scanned. Found ${scannedSongs.length} songs.`);
    if (config.fillerMusicDirectory) {
        scanFillerMusic(config.fillerMusicDirectory);
    } else {
        // Fallback or default behavior if filler music dir isn't set
        scanFillerMusic(config.mediaDirectory);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Server Startup] Failed to scan media libraries: ${errorMessage}`);
    // Continue starting the server, but with an empty library.
    // The user will be prompted to fix this in the setup wizard.
  }
  
  // Update paper workflow after scanning
  updatePaperWorkflow();

  const startMode = process.env.START_MODE || 'offline'; // Default to offline
  console.log(`[Server] Starting in ${startMode} mode.`);

  // Output server ready message for Electron detection
  console.log(`🎤 ===== KJ-NOMAD SERVER READY ===== 🎤`);
  console.log(`🌐 Server listening on port ${PORT}`);

  if (startMode === 'offline') {
    // For offline mode, behave as a standard local server
    console.log(`ℹ️  Manual access: http://localhost:${PORT}\n`);
  } else {
    // For online mode, the server is ready and waiting for connection details
    // from the Electron app UI (which isn't built yet).
    // The UI will call the /api/cloud/connect endpoint.
    console.log('[Server] Online mode initiated. Waiting for connection from the app...');
    // No auto-launch, as the user flow is different.
  }
});
