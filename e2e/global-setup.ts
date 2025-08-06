import { execSync, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import waitOn from 'wait-on';

async function globalSetup() {
  console.log('Building server for E2E tests...');
  execSync('npm run build:server', { stdio: 'inherit' });
  console.log('Server built successfully.');

  // Start the web server in the background and wait for it to be ready
  const serverProcess = exec('npm run dev:server', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  (global as any).serverProcess = serverProcess;
  console.log('Web server started in background.');

  // Ensure `wait-on` is installed in the root project (it's already in the devDependencies)
  // execSync('npm install wait-on', { stdio: 'inherit' }); // No need to install again

  await waitOn({ resources: ['http://localhost:8080'], timeout: 5000 });
  console.log('Web server is ready.');

  // Setup dummy media and config for server
  const serverDataPath = path.join(__dirname, '..', 'server', 'data');
  const setupFilePath = path.join(serverDataPath, 'setup.json');
  const mediaDirectoryPath = path.join(__dirname, '..', 'server', 'media');

  // Ensure server/data directory exists
  if (!fs.existsSync(serverDataPath)) {
    fs.mkdirSync(serverDataPath, { recursive: true });
  }

  // Create dummy setup.json
  const setupConfig = {
    mediaDirectory: mediaDirectoryPath,
    fillerMusicDirectory: mediaDirectoryPath,
    kjName: 'Test KJ',
    venue: 'Test Venue',
    autoLaunchBrowser: false,
    defaultPort: 8080,
    enableNetworkAccess: true,
    setupComplete: true,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  };
  fs.writeFileSync(setupFilePath, JSON.stringify(setupConfig, null, 2));
  console.log(`Dummy setup.json created at: ${setupFilePath}`);

  // Ensure server/media directory exists
  if (!fs.existsSync(mediaDirectoryPath)) {
    fs.mkdirSync(mediaDirectoryPath, { recursive: true });
  }

  // Create dummy video files for testing
  fs.writeFileSync(path.join(mediaDirectoryPath, 'Test Artist - Test Song.mp4'), '');
  fs.writeFileSync(path.join(mediaDirectoryPath, 'Another Artist - Another Song.mp4'), '');
  fs.writeFileSync(path.join(mediaDirectoryPath, 'filler-song.mp4'), '');
  console.log(`Dummy media files created in: ${mediaDirectoryPath}`);
}

export default globalSetup;
