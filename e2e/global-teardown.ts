import { ChildProcess } from 'child_process';
import { ElectronApplication } from 'playwright';
import kill from 'kill-port';

async function globalTeardown() {
  console.log('Tearing down E2E test environment...');
  
  const serverProcess = (global as any).serverProcess as ChildProcess;
  if (serverProcess) {
    console.log('Killing server process...');
    serverProcess.kill();
  }

  // Ensure port 8080 is freed
  try {
    await kill(8080, 'tcp');
    console.log('Port 8080 freed.');
  } catch (err) {
    console.error(`Error freeing port 8080: ${err}`);
  }

  const electronApp = (global as any).electronApp as ElectronApplication;
  if (electronApp) {
    console.log('Closing Electron app...');
    await electronApp.close();
  }

  console.log('Teardown complete.');
}

export default globalTeardown;
