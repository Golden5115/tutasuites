const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// ESC/POS byte sequence
const reset = Buffer.from([0x1B, 0x40]);
const alignCenter = Buffer.from([0x1B, 0x61, 0x01]);
const boldOn = Buffer.from([0x1B, 0x45, 0x01]);
const doubleSize = Buffer.from([0x1D, 0x21, 0x11]);
const normalSize = Buffer.from([0x1D, 0x21, 0x00]);
const boldOff = Buffer.from([0x1B, 0x45, 0x00]);
const lineFeed = Buffer.from([0x0A]);
const cut = Buffer.from([0x1D, 0x56, 0x41, 0x03]);

const text = Buffer.from("TUTA SUITES\nDirect ESC/POS Native Print\nStatus: Connected OK\n--------------------------------\n\n\n", 'ascii');

const payload = Buffer.concat([
  reset,
  alignCenter,
  doubleSize,
  boldOn,
  Buffer.from("TUTA SUITES\n", 'ascii'),
  normalSize,
  boldOff,
  Buffer.from("Direct Native Print Test\nNo QZ Tray - No Driver Headers\n", 'ascii'),
  Buffer.from(new Date().toLocaleString() + "\n", 'ascii'),
  Buffer.from("------------------------------------------\n\n\n", 'ascii'),
  cut
]);

const tempFile = path.join(__dirname, 'test-receipt.bin');
fs.writeFileSync(tempFile, payload);

console.log(`Wrote ${payload.length} bytes to ${tempFile}`);

const psScript = path.join(__dirname, 'raw-print.ps1');
const ps = spawn('powershell.exe', [
  '-ExecutionPolicy', 'Bypass',
  '-File', psScript,
  '-PrinterName', 'Xprinter XP-Q301F',
  '-FilePath', tempFile
]);

ps.stdout.on('data', (d) => console.log(`STDOUT: ${d.toString()}`));
ps.stderr.on('data', (d) => console.error(`STDERR: ${d.toString()}`));
ps.on('close', (code) => {
  console.log(`Child process exited with code ${code}`);
  try { fs.unlinkSync(tempFile); } catch(e){}
});
