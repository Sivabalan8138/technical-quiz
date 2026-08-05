const fs = require('fs');
const path = require('path');

const root = __dirname;
const frontend = path.join(root, 'frontend');

// Move all items from frontend to root
const items = fs.readdirSync(frontend);
for (const item of items) {
  if (item === 'node_modules') continue;
  const oldPath = path.join(frontend, item);
  const newPath = path.join(root, item);
  
  if (fs.existsSync(newPath)) {
    console.log(`Deleting existing ${newPath}`);
    fs.rmSync(newPath, { recursive: true, force: true });
  }
  
  console.log(`Moving ${oldPath} to ${newPath}`);
  fs.renameSync(oldPath, newPath);
}

// Clean up frontend folder
fs.rmSync(frontend, { recursive: true, force: true });
console.log('Restructured successfully');
