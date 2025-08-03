// Ultra-minimal server for Electron testing (CommonJS version)
// This avoids all potentially problematic operations

const http = require('http');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const portArg = args.find(arg => arg.startsWith('--port='))?.split('=')[1];
const PORT = portArg ? parseInt(portArg, 10) : (process.env.PORT ? parseInt(process.env.PORT, 10) : 8080);

// Simple HTTP server without Express
const server = http.createServer((req, res) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.url === '/api/test') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: 'Ultra-minimal server is working!', 
            timestamp: new Date().toISOString() 
        }));
        return;
    }
    
    // Serve a simple HTML page for all other requests
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KJ-Nomad Test Server</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 50px auto; 
            padding: 20px;
            background: #1a1a1a;
            color: #fff;
        }
        .header { text-align: center; margin-bottom: 30px; }
        .status { background: #2a2a2a; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .success { color: #4ade80; }
        .info { color: #60a5fa; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎤 KJ-Nomad Test Server</h1>
        <p class="success">✅ Server is running successfully!</p>
    </div>
    
    <div class="status">
        <h3 class="info">Server Information</h3>
        <p><strong>Port:</strong> ${PORT}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>Mode:</strong> Electron Test Mode</p>
    </div>
    
    <div class="status">
        <h3 class="info">Test Endpoints</h3>
        <p><strong>API Test:</strong> <a href="/api/test" style="color: #60a5fa;">/api/test</a></p>
        <p><strong>Admin Interface:</strong> <a href="/" style="color: #60a5fa;">/ (this page)</a></p>
    </div>
    
    <div class="status">
        <h3 class="info">Next Steps</h3>
        <p>This minimal server confirms that the Electron app can successfully start a Node.js server process.</p>
        <p>The full KJ-Nomad application will replace this test server with complete functionality.</p>
    </div>
</body>
</html>`;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
});

server.listen(PORT, () => {
    console.log(`🎤 ===== KJ-NOMAD SERVER READY ===== 🎤`);
    console.log(`🌐 Server listening on port ${PORT}`);
    console.log(`🏠 LOCAL MODE - Offline Operation`);
    console.log(`📱 Admin Interface: http://localhost:${PORT}`);
    console.log(`🖥️  Player Screens: http://localhost:${PORT}/player`);
    console.log(`ℹ️  Ultra-minimal test server - Basic functionality only`);
});

// Handle server errors
server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
