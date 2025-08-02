#!/usr/bin/env node

console.log('🎤 KJ-Nomad Test Server Starting...');
console.log('Arguments:', process.argv);
console.log('Environment PORT:', process.env.PORT);

// Parse command line arguments
const args = process.argv.slice(2);
const portArg = args.find(arg => arg.startsWith('--port='))?.split('=')[1];
const PORT = portArg ? parseInt(portArg, 10) : (process.env.PORT ? parseInt(process.env.PORT, 10) : 8080);

console.log('Using PORT:', PORT);

import express from 'express';
import http from 'http';

const app = express();
const server = http.createServer(app);

app.use(express.json());

// Simple test endpoint
app.get('/api/test', (req, res) => {
    console.log('[API] GET /api/test - Test endpoint hit');
    res.json({ message: 'Test server is working!', timestamp: new Date().toISOString(), port: PORT });
});

app.get('/', (req, res) => {
    res.send(`<h1>KJ-Nomad Test Server</h1><p>Running on port ${PORT}</p><p><a href="/api/test">Test API</a></p>`);
});

server.listen(PORT, () => {
    console.log(`🚀 Test server running on port ${PORT}`);
    console.log(`📍 Access at: http://localhost:${PORT}`);
    console.log(`🧪 Test API: http://localhost:${PORT}/api/test`);
});

// Keep the process alive
process.on('SIGTERM', () => {
    console.log('📴 Received SIGTERM, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('📴 Received SIGINT, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
