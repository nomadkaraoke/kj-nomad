// Minimal server for Electron testing
// This bypasses potentially problematic operations during startup

import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Parse command line arguments
const args = process.argv.slice(2);
const portArg = args.find(arg => arg.startsWith('--port='))?.split('=')[1];
const PORT = portArg ? parseInt(portArg, 10) : (process.env.PORT ? parseInt(process.env.PORT, 10) : 8080);

// Serve static files from the React client
const productionClientPath = path.join(__dirname, '../public');
const developmentClientPath = path.join(__dirname, '../../client/dist');
const clientPath = fs.existsSync(productionClientPath) ? productionClientPath : developmentClientPath;

console.log('Production client path:', productionClientPath, '(exists:', fs.existsSync(productionClientPath), ')');
console.log('Development client path:', developmentClientPath, '(exists:', fs.existsSync(developmentClientPath), ')');
console.log('Using client path:', clientPath);

// Enable static file serving
app.use(express.static(clientPath));
app.use(express.json());

// Simple test endpoint
app.get('/api/test', (req, res) => {
    console.log('[API] GET /api/test - Test endpoint hit');
    res.json({ message: 'Minimal server is working!', timestamp: new Date().toISOString() });
});

// Handle React Router client-side routing
app.get('*', (req, res) => {
    console.log(`[ROUTE] GET ${req.path} - Serving index.html`);
    res.sendFile(path.join(clientPath, 'index.html'));
});

server.listen(PORT, () => {
    console.log(`🎤 ===== KJ-NOMAD SERVER READY ===== 🎤`);
    console.log(`🌐 Server listening on port ${PORT}`);
    console.log(`🏠 LOCAL MODE - Offline Operation`);
    console.log(`📱 Admin Interface: http://localhost:${PORT}`);
    console.log(`🖥️  Player Screens: http://localhost:${PORT}/player`);
    console.log(`ℹ️  Minimal test server - Limited functionality`);
});
