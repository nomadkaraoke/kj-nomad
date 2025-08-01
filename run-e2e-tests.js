#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const log = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class E2ETestRunner {
  constructor() {
    this.serverProcess = null;
    this.clientProcess = null;
  }

  async killExistingProcesses() {
    log('🔄 Killing any existing server processes...');
    try {
      // Kill any existing tsx processes (server)
      await execAsync('pkill -f "tsx src/index.ts" || true');
      // Kill any existing vite processes (client dev server)
      await execAsync('pkill -f "vite" || true');
      await sleep(2000); // Give processes time to die
      log('✅ Existing processes killed');
    } catch (error) {
      // pkill returns non-zero if no processes found, which is fine
      log('No existing processes to kill');
    }
  }

  async buildClient() {
    log('🔨 Building client...');
    try {
      const { stdout, stderr } = await execAsync('cd client && npm run build');
      if (stderr && !stderr.includes('vite v')) {
        log(`Client build warnings: ${stderr}`, 'warn');
      }
      log('✅ Client built successfully');
    } catch (error) {
      log(`❌ Client build failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async copyClientToServer() {
    log('📁 Copying client build to server...');
    try {
      // Ensure server/public exists
      if (!fs.existsSync('server/public')) {
        fs.mkdirSync('server/public', { recursive: true });
      }
      
      // Copy client dist to server public
      await execAsync('rm -rf server/public/* && cp -r client/dist/* server/public/');
      log('✅ Client copied to server');
    } catch (error) {
      log(`❌ Failed to copy client: ${error.message}`, 'error');
      throw error;
    }
  }

  async startServer() {
    log('🚀 Starting server...');
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('npm', ['run', 'dev'], {
        cwd: 'server',
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let serverReady = false;

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Server is listening on port 8080')) {
          serverReady = true;
          log('✅ Server started successfully');
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (!serverReady && error.includes('Error')) {
          log(`❌ Server error: ${error}`, 'error');
          reject(new Error(error));
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!serverReady) {
          reject(new Error('Server failed to start within 30 seconds'));
        }
      }, 30000);
    });
  }

  async waitForServerReady() {
    log('⏳ Waiting for server to be ready...');
    for (let i = 0; i < 20; i++) {
      try {
        const { stdout } = await execAsync('curl -s -o /dev/null -w "%{http_code}" http://localhost:8080');
        if (stdout.trim() === '200') {
          log('✅ Server is responding');
          return;
        }
      } catch (error) {
        // Curl failed, server not ready yet
      }
      await sleep(1000);
    }
    throw new Error('Server never became ready');
  }

  async runCypressTests() {
    log('🧪 Running E2E tests...');
    return new Promise((resolve, reject) => {
      const cypress = spawn('npx', ['cypress', 'run', '--spec', 'cypress/e2e/main_flow.cy.ts'], {
        cwd: 'client',
        stdio: 'inherit'
      });

      cypress.on('close', (code) => {
        if (code === 0) {
          log('✅ All E2E tests passed!', 'success');
          resolve();
        } else {
          log(`❌ E2E tests failed with exit code ${code}`, 'error');
          reject(new Error(`Tests failed with exit code ${code}`));
        }
      });

      cypress.on('error', (error) => {
        log(`❌ Failed to start Cypress: ${error.message}`, 'error');
        reject(error);
      });
    });
  }

  async cleanup() {
    log('🧹 Cleaning up...');
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
      await sleep(2000);
      if (!this.serverProcess.killed) {
        this.serverProcess.kill('SIGKILL');
      }
    }
    if (this.clientProcess) {
      this.clientProcess.kill('SIGTERM');
    }
    
    // Final cleanup of any remaining processes
    try {
      await execAsync('pkill -f "tsx src/index.ts" || true');
      await execAsync('pkill -f "vite" || true');
    } catch (error) {
      // Ignore errors during cleanup
    }
    
    log('✅ Cleanup completed');
  }

  async run() {
    let exitCode = 0;
    
    try {
      await this.killExistingProcesses();
      await this.buildClient();
      await this.copyClientToServer();
      await this.startServer();
      await this.waitForServerReady();
      await this.runCypressTests();
      log('🎉 All E2E tests completed successfully!', 'success');
    } catch (error) {
      log(`❌ E2E test run failed: ${error.message}`, 'error');
      exitCode = 1;
    } finally {
      await this.cleanup();
    }

    process.exit(exitCode);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  log('⚠️ Received SIGINT, cleaning up...');
  const runner = new E2ETestRunner();
  await runner.cleanup();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  log('⚠️ Received SIGTERM, cleaning up...');
  const runner = new E2ETestRunner();
  await runner.cleanup();
  process.exit(1);
});

// Run the tests
const runner = new E2ETestRunner();
runner.run();