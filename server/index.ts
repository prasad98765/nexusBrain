// Temporary Node.js wrapper to start Python Flask server
import { spawn } from 'child_process';
import { createServer } from 'http';
import fs from 'fs';
import path from 'path';

console.log('Starting Python Flask server...');

// Check if Python is available
const pythonProcess = spawn('python', ['run.py'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

pythonProcess.on('error', (error) => {
  console.error('Failed to start Python server:', error.message);
  console.log('Make sure Python is installed and run.py exists');
  process.exit(1);
});

pythonProcess.on('close', (code) => {
  console.log(`Python server exited with code ${code}`);
  process.exit(code || 0);
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  pythonProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  pythonProcess.kill('SIGTERM');
});