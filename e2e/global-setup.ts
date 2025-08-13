import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

export default async () => {
  console.log('🚀 E2E Global Setup: Starting...');

  // 1. Create a temporary directory for media files
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kj-nomad-e2e-'));
  console.log(`📁 Created temporary media directory: ${tmpDir}`);

  // 2. Create a dummy song file
  fs.writeFileSync(path.join(tmpDir, 'Test Artist - Test Song.mp4'), 'dummy content');
  console.log('🎵 Created dummy song file.');

  // 3. Write the temp directory to a .env file for the webServer to use
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  fs.writeFileSync(path.join(__dirname, '..', '.env.test'), `MEDIA_DIR=${tmpDir}`);
  console.log(`✅ Wrote MEDIA_DIR to .env.test file: ${tmpDir}`);

  // 4. Ensure the server is built
  try {
    console.log('📦 Building server for E2E tests...');
    execSync('npm run build:server', { stdio: 'inherit' });
    console.log('✅ Server built successfully.');
  } catch (error) {
    console.error('🔥 Failed to build server:', error);
    process.exit(1);
  }

  console.log('🎉 E2E Global Setup: Complete.');
};
