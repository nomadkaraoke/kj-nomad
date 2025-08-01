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

import { scanMediaLibrary, searchSongs, getSongById } from './mediaLibrary';
import { 
  addSongToQueue, 
  getQueue, 
  removeSongFromQueue, 
  getNextSong, 
  resetQueue,
  getSessionState,
  playSong,
  restartCurrentSong,
  getSessionHistory,
  pausePlayback,
  resumePlayback,
  stopPlayback
} from './songQueue';
import { scanFillerMusic, getNextFillerSong } from './fillerMusic';
import { cloudConnector } from './cloudConnector';
import { 
  launchAdminInterface, 
  shouldAutoLaunch, 
  displayStartupInstructions 
} from './browserLauncher';
import {
  loadSetupConfig,
  saveSetupConfig,
  getSetupSteps,
  isSetupRequired,
  markSetupComplete,
  resetSetup,
  validateMediaDirectory,
  getNetworkInfo,
  getMediaDirectorySuggestions
} from './setupWizard';
import { videoSyncEngine } from './videoSyncEngine';
import { deviceManager } from './deviceManager';
import { paperWorkflow } from './paperWorkflow';

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

// Initialize paper workflow with song library
const updatePaperWorkflow = () => {
  const allSongs = searchSongs(''); // Get all songs
  paperWorkflow.updateSongLibrary(allSongs);
};
updatePaperWorkflow();

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

// Setup Wizard endpoints
app.get('/api/setup/status', (req, res) => {
    console.log('[API] GET /api/setup/status - Get setup status');
    const config = loadSetupConfig();
    const steps = getSetupSteps(config);
    const required = isSetupRequired();
    const networkInfo = getNetworkInfo();
    
    res.json({
        success: true,
        data: {
            config,
            steps,
            setupRequired: required,
            networkInfo
        }
    });
});

app.get('/api/setup/config', (req, res) => {
    console.log('[API] GET /api/setup/config - Get setup configuration');
    const config = loadSetupConfig();
    res.json({ success: true, data: config });
});

app.post('/api/setup/config', (req, res) => {
    console.log('[API] POST /api/setup/config - Update setup configuration');
    try {
        const newConfig = req.body;
        const success = saveSetupConfig(newConfig);
        
        if (success) {
            // If media directory changed, trigger rescan
            if (newConfig.mediaDirectory) {
                console.log('[Setup] Media directory updated, rescanning...');
                scanMediaLibrary(newConfig.mediaDirectory);
                if (newConfig.fillerMusicDirectory) {
                    scanFillerMusic(newConfig.fillerMusicDirectory);
                }
            }
            
            res.json({ 
                success: true, 
                message: 'Configuration updated successfully',
                data: loadSetupConfig()
            });
        } else {
            res.status(500).json({ success: false, error: 'Failed to save configuration' });
        }
    } catch (error) {
        console.error('[API] Setup config error:', error);
        res.status(500).json({ success: false, error: 'Invalid configuration data' });
    }
});

app.post('/api/setup/validate-directory', (req, res) => {
    console.log('[API] POST /api/setup/validate-directory - Validate media directory');
    const { directory } = req.body;
    
    if (!directory) {
        return res.status(400).json({ success: false, error: 'Directory path required' });
    }
    
    const validation = validateMediaDirectory(directory);
    res.json({ success: true, data: validation });
});

app.get('/api/setup/directory-suggestions', (req, res) => {
    console.log('[API] GET /api/setup/directory-suggestions - Get directory suggestions');
    const suggestions = getMediaDirectorySuggestions();
    res.json({ success: true, data: suggestions });
});

app.post('/api/setup/complete', (req, res) => {
    console.log('[API] POST /api/setup/complete - Mark setup as complete');
    const success = markSetupComplete();
    
    if (success) {
        res.json({ 
            success: true, 
            message: 'Setup completed successfully',
            data: { setupComplete: true }
        });
    } else {
        res.status(500).json({ success: false, error: 'Failed to mark setup as complete' });
    }
});

app.post('/api/setup/reset', (req, res) => {
    console.log('[API] POST /api/setup/reset - Reset setup wizard');
    const success = resetSetup();
    
    if (success) {
        res.json({ 
            success: true, 
            message: 'Setup reset successfully',
            data: { setupComplete: false }
        });
    } else {
        res.status(500).json({ success: false, error: 'Failed to reset setup' });
    }
});

app.get('/api/setup/network-info', (req, res) => {
    console.log('[API] GET /api/setup/network-info - Get network information');
    const networkInfo = getNetworkInfo();
    res.json({ success: true, data: networkInfo });
});

// Video Sync endpoints
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
        const success = await videoSyncEngine.syncPlayVideo(videoUrl, startTime);
        if (success) {
            res.json({ 
                success: true, 
                message: 'Sync play command sent',
                data: { videoUrl, startTime }
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
    const devices = deviceManager.getDevices();
    const stats = deviceManager.getStats();
    
    res.json({ 
        success: true, 
        data: { 
            devices, 
            stats 
        } 
    });
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

wss.on('connection', (ws) => {
  const clientId = randomUUID();
  let clientType: 'player' | 'admin' | 'singer' = 'admin'; // Default to admin
  let clientName = 'Unknown Client';
  
  console.log(`Client connected: ${clientId}`);
  
  // Send current session state to newly connected client
  ws.send(JSON.stringify({ type: 'session_state_updated', payload: getSessionState() }));
  ws.send(JSON.stringify({ type: 'queue_updated', payload: getQueue() }));
  ws.send(JSON.stringify({ type: 'history_updated', payload: getSessionHistory() }));

  ws.on('message', (message) => {
    try {
        const data = JSON.parse(message.toString());
        const { type, payload } = data;
        console.log('[WebSocket] Received message:', { type, payload });

        switch (type) {
        case 'client_identify': {
            // Handle client identification for sync engine
            clientType = payload.type || 'admin';
            clientName = payload.name || `${clientType} Client`;
            
            // Register with sync engine
            videoSyncEngine.registerClient(clientId, ws, clientName, clientType);
            
            // Register player devices with device manager
            if (clientType === 'player') {
                const deviceInfo = {
                    name: clientName,
                    ipAddress: payload.ipAddress || 'unknown',
                    userAgent: payload.userAgent || 'unknown',
                    screenResolution: payload.screenResolution,
                    capabilities: payload.capabilities || {}
                };
                
                deviceManager.registerDevice(clientId, ws, deviceInfo);
                
                // Send device management status
                ws.send(JSON.stringify({ 
                    type: 'device_status', 
                    payload: deviceManager.getStats() 
                }));
            }
            
            console.log(`[WebSocket] Client identified: ${clientName} (${clientType})`);
            
            // Send sync status to player clients
            if (clientType === 'player') {
                ws.send(JSON.stringify({ 
                    type: 'sync_status', 
                    payload: videoSyncEngine.getSyncStats() 
                }));
            }
            break;
        }
        case 'clock_sync_response': {
            // Handle clock synchronization response
            videoSyncEngine.handleClockSyncResponse(clientId, payload);
            break;
        }
        case 'sync_ready': {
            // Handle client ready status for video sync
            videoSyncEngine.handleClientReady(clientId, payload);
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
                deviceManager.handleHeartbeatResponse(clientId, payload);
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
            const currentSong = restartCurrentSong();
            if (currentSong) {
              broadcast({ type: 'play', payload: { 
                  songId: currentSong.song.id, 
                  fileName: currentSong.song.fileName,
                  singer: currentSong.singerName,
                  restart: true
              }});
              broadcast({ type: 'session_state_updated', payload: getSessionState() });
            }
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
        case 'pause_playback':
            pausePlayback();
            broadcast({ type: 'pause' });
            broadcast({ type: 'session_state_updated', payload: getSessionState() });
            break;
        case 'resume_playback':
            resumePlayback();
            broadcast({ type: 'resume' });
            broadcast({ type: 'session_state_updated', payload: getSessionState() });
            break;
        case 'stop_playback':
            stopPlayback();
            broadcast({ type: 'pause' });
            broadcast({ type: 'queue_updated', payload: getQueue() });
            broadcast({ type: 'session_state_updated', payload: getSessionState() });
            broadcast({ type: 'history_updated', payload: getSessionHistory() });
            break;
        case 'song_ended': {
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
                  broadcast({ type: 'pause' });
              }
              broadcast({ type: 'session_state_updated', payload: getSessionState() });
            }
            break;
        }
        case 'ticker_updated':
            console.log('[WebSocket] Ticker update:', payload);
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
    console.log(`Client disconnected: ${clientName} (${clientId})`);
    
    // Unregister from sync engine
    videoSyncEngine.unregisterClient(clientId);
    
    // Unregister from device manager if it's a player
    if (clientType === 'player') {
        deviceManager.unregisterDevice(clientId);
    }
  });
});

server.listen(PORT, async () => {
  // Check for session ID in command line arguments or environment variables
  const sessionId = process.argv.find(arg => arg.startsWith('--session='))?.split('=')[1] || 
                   process.env.SESSION_ID;
  
  let cloudMode = false;
  const localIP = cloudConnector.getStatus().localIP;
  
  if (sessionId) {
    // Auto-connect to cloud session
    try {
      const success = await cloudConnector.registerWithSession(sessionId, PORT as number, {
        kjName: process.env.KJ_NAME || 'Local KJ',
        venue: process.env.VENUE_NAME,
        allowYouTube: process.env.ALLOW_YOUTUBE === 'true'
      });
      
      cloudMode = success;
      if (!success) {
        console.error(`[Server] ❌ Failed to connect to cloud session ${sessionId}`);
        console.log(`[Server] Falling back to local mode`);
      }
    } catch (error) {
      console.error('[Server] Cloud connection error:', error);
      console.log(`[Server] Falling back to local mode`);
    }
  }
  
  // Display enhanced startup instructions
  displayStartupInstructions(PORT as number, {
    sessionId: cloudMode ? sessionId : undefined,
    localIP,
    cloudMode
  });
  
  // Auto-launch browser for local mode
  if (shouldAutoLaunch()) {
    console.log('🚀 Auto-launching admin interface...\n');
    launchAdminInterface(PORT as number).then((success) => {
      if (!success) {
        console.log(`💡 Please manually open: http://localhost:${  PORT}`);
      }
    });
  } else {
    console.log(`ℹ️  Auto-launch disabled. Manual access: http://localhost:${  PORT  }\n`);
  }
});
