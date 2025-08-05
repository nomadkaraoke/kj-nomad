import { ChildProcess } from 'child_process';
import { ElectronApplication } from 'playwright';

async function globalTeardown() {
  console.log('Tearing down E2E test environment...');
  
  const serverProcess = (global as any).serverProcess as ChildProcess;
  if (serverProcess) {
    console.log('Killing server process...');
    serverProcess.kill();
  }

  const electronApp = (global as any).electronApp as ElectronApplication;
  if (electronApp) {
    console.log('Closing Electron app...');
    await electronApp.close();
  }

  console.log('Teardown complete.');
}

export default globalTeardown;
