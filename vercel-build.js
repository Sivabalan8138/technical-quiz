const fs = require('fs');
const { execSync } = require('child_process');

// Vercel compiles the frontend once, then tries to compile each backend function.
// This script ensures the frontend is only built ONCE to prevent infinite loops/timeouts.
if (!fs.existsSync('./frontend/dist')) {
  console.log('Building frontend...');
  execSync('cd frontend && npm install && npm run build', { stdio: 'inherit' });
} else {
  console.log('Frontend already built, skipping to prevent Vercel infinite loop...');
}
