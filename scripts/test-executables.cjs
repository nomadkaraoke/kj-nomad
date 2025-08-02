#!/usr/bin/env node

/**
 * Test script for KJ-Nomad executables
 * Verifies that packaged executables start correctly and respond to basic commands
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TIMEOUT_MS = 10000; // 10 seconds timeout
const TEST_PORT = 8081; // Use different port to avoid conflicts

/**
 * Get the appropriate executable name for the current platform
 */
function getExecutableName() {
  const platform = os.platform();
  const arch = os.arch();
  
  if (platform === 'win32') {
    return 'kj-nomad-win-x64.exe';
  } else if (platform === 'darwin') {
    return arch === 'arm64' ? 'kj-nomad-macos-arm64' : 'kj-nomad-macos-x64';
  } else if (platform === 'linux') {
    return arch === 'arm64' ? 'kj-nomad-linux-arm64' : 'kj-nomad-linux-x64';
  }
  
  throw new Error(`Unsupported platform: ${platform}-${arch}`);
}

/**
 * Test if executable exists and is executable
 */
function testExecutableExists(executablePath) {
  console.log(`🔍 Checking if executable exists: ${executablePath}`);
  
  if (!fs.existsSync(executablePath)) {
    throw new Error(`Executable not found: ${executablePath}`);
  }
  
  const stats = fs.statSync(executablePath);
  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${executablePath}`);
  }
  
  // Check if file is executable (Unix-like systems)
  if (os.platform() !== 'win32') {
    const mode = stats.mode;
    const isExecutable = (mode & parseInt('111', 8)) !== 0;
    if (!isExecutable) {
      throw new Error(`File is not executable: ${executablePath}`);
    }
  }
  
  console.log(`✅ Executable exists and is valid`);
  return true;
}

/**
 * Test if executable starts and responds to --help
 */
function testExecutableHelp(executablePath) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Testing executable help: ${executablePath} --help`);
    
    const child = spawn(executablePath, ['--help'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: TIMEOUT_MS
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0 || stdout.includes('Usage:') || stdout.includes('help')) {
        console.log(`✅ Help command successful`);
        resolve({ code, stdout, stderr });
      } else {
        console.log(`❌ Help command failed with code ${code}`);
        console.log(`STDOUT: ${stdout}`);
        console.log(`STDERR: ${stderr}`);
        reject(new Error(`Help command failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.log(`❌ Failed to start executable: ${error.message}`);
      reject(error);
    });
    
    // Kill process after timeout
    setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGTERM');
        reject(new Error(`Help command timed out after ${TIMEOUT_MS}ms`));
      }
    }, TIMEOUT_MS);
  });
}

/**
 * Test if executable starts server and responds to HTTP requests
 */
function testExecutableServer(executablePath) {
  return new Promise((resolve, reject) => {
    console.log(`🌐 Testing executable server startup: ${executablePath}`);
    
    const child = spawn(executablePath, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { 
        ...process.env, 
        NODE_ENV: 'test', 
        AUTO_LAUNCH: 'false',
        PORT: TEST_PORT.toString()
      }
    });
    
    let stdout = '';
    let stderr = '';
    let serverStarted = false;
    
    child.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      
      // Look for server startup indicators
      if (output.includes(`Server running on port ${TEST_PORT}`) || 
          output.includes('KJ-Nomad Server') ||
          output.includes('Server started')) {
        serverStarted = true;
        
        // Give server a moment to fully start
        setTimeout(async () => {
          try {
            // Test HTTP endpoint
            const http = require('http');
            const req = http.request({
              hostname: 'localhost',
              port: TEST_PORT,
              path: '/api/test',
              method: 'GET',
              timeout: 5000
            }, (res) => {
              let responseData = '';
              res.on('data', (chunk) => {
                responseData += chunk;
              });
              
              res.on('end', () => {
                child.kill('SIGTERM');
                
                if (res.statusCode === 200) {
                  console.log(`✅ Server responded successfully`);
                  resolve({ code: 0, stdout, stderr, response: responseData });
                } else {
                  console.log(`❌ Server responded with status ${res.statusCode}`);
                  reject(new Error(`Server responded with status ${res.statusCode}`));
                }
              });
            });
            
            req.on('error', (error) => {
              child.kill('SIGTERM');
              console.log(`❌ HTTP request failed: ${error.message}`);
              reject(error);
            });
            
            req.end();
          } catch (error) {
            child.kill('SIGTERM');
            reject(error);
          }
        }, 2000);
      }
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (!serverStarted) {
        console.log(`❌ Server failed to start (exit code ${code})`);
        console.log(`STDOUT: ${stdout}`);
        console.log(`STDERR: ${stderr}`);
        reject(new Error(`Server failed to start with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.log(`❌ Failed to start server: ${error.message}`);
      reject(error);
    });
    
    // Kill process after timeout
    setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGTERM');
        if (!serverStarted) {
          reject(new Error(`Server startup timed out after ${TIMEOUT_MS}ms`));
        }
      }
    }, TIMEOUT_MS);
  });
}

/**
 * Main test function
 */
async function testExecutable() {
  try {
    console.log('🎤 KJ-Nomad Executable Testing');
    console.log('================================\n');
    
    const executableName = getExecutableName();
    const executablePath = path.join(__dirname, '..', 'dist', executableName);
    
    console.log(`Platform: ${os.platform()}-${os.arch()}`);
    console.log(`Testing: ${executableName}\n`);
    
    // Test 1: Check if executable exists
    testExecutableExists(executablePath);
    
    // Test 2: Test help command (skip for now as it might not be implemented)
    // await testExecutableHelp(executablePath);
    
    // Test 3: Test server startup
    await testExecutableServer(executablePath);
    
    console.log('\n🎉 All tests passed! Executable is working correctly.');
    process.exit(0);
    
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testExecutable();
}

module.exports = { testExecutable, getExecutableName };
