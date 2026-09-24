/**
 * make-icon.js — Convert public/logo.png into:
 *  - electron/icon.png (256x256)
 *  - electron/icon.ico (multi-resolution: 256, 128, 64, 48, 32, 16)
 * Usage: node electron/make-icon.js
 */
const path = require('path');
const { execSync } = require('child_process');

try {
  const psPath = path.join(__dirname, 'make-icon.ps1');
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psPath}"`, { stdio: 'inherit' });
  console.log('🎉 Application icons successfully updated from public/logo.png!');
} catch (e) {
  console.error('Failed to create icon:', e.message);
  process.exit(1);
}
