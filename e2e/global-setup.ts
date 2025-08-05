import { execSync } from 'child_process';

async function globalSetup() {
  console.log('Building server for E2E tests...');
  execSync('npm run build:server', { stdio: 'inherit' });
  console.log('Server built successfully.');
}

export default globalSetup;
