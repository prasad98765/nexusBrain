const fs = require('fs-extra');
const path = require('path');

// Copy shared directory to dist
fs.copySync(
  path.resolve(__dirname, '../shared'),
  path.resolve(__dirname, '../dist/shared'),
  { overwrite: true }
);

console.log('✓ Shared directory copied to dist');
