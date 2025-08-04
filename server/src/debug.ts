import express from 'express';
import fs from 'fs';
import archiver from 'archiver';
import { getDataPath } from './dataPath.js';

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

export function applyDebugRoutes(app: express.Application): void {
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
}
