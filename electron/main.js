const { app, BrowserWindow, ipcMain, Menu, shell, dialog } = require('electron');
const { execFile, execSync } = require('child_process');
const net = require('net');
const http = require('http');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

// Determine environment & target server URL
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
const DEFAULT_PROD_URL = 'https://tutasuites.com';
const DEV_URL = 'http://localhost:3000';

// Config path to store user preferences (like custom URL or selected printer)
const configPath = path.join(app.getPath('userData'), 'tuta-config.json');

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading config:', err);
  }
  return {
    serverUrl: isDev ? DEV_URL : DEFAULT_PROD_URL,
    selectedPrinter: '',
    paperWidth: 80, // 80mm default for standard POS
  };
}

function saveConfig(data) {
  try {
    const current = loadConfig();
    const updated = { ...current, ...data };
    fs.writeFileSync(configPath, JSON.stringify(updated, null, 2), 'utf8');
    return updated;
  } catch (err) {
    console.error('Error saving config:', err);
  }
}

function createWindow() {
  const config = loadConfig();
  const iconPath = fs.existsSync(path.join(__dirname, 'icon.ico'))
    ? path.join(__dirname, 'icon.ico')
    : fs.existsSync(path.join(__dirname, 'icon.png'))
    ? path.join(__dirname, 'icon.png')
    : path.join(__dirname, '..', 'public', 'favicon.ico');

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'Tuta Suites - POS & Hotel Management',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
    },
  });

  // Native application menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Reload App',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.reload(),
        },
        {
          label: 'Change Server URL...',
          click: async () => {
            const currentUrl = loadConfig().serverUrl || DEFAULT_PROD_URL;
            const { response } = await dialog.showMessageBox(mainWindow, {
              type: 'question',
              buttons: ['Keep Current', 'Switch to Local (http://localhost:3000)', 'Switch to Live (https://tutasuites.com)'],
              defaultId: 0,
              title: 'Server Connection',
              message: `Current Server: ${currentUrl}\n\nSelect server to connect to:`,
            });
            if (response === 1) {
              saveConfig({ serverUrl: DEV_URL });
              mainWindow.loadURL(DEV_URL);
            } else if (response === 2) {
              saveConfig({ serverUrl: DEFAULT_PROD_URL });
              mainWindow.loadURL(DEFAULT_PROD_URL);
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Printers',
      submenu: [
        {
          label: 'Scan Connected Printers',
          click: async () => {
            const printers = await mainWindow.webContents.getPrintersAsync();
            const list = printers.map((p) => `• ${p.name} ${p.isDefault ? '(Default)' : ''}`).join('\n');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Installed Printers',
              message: `Detected ${printers.length} printer(s):\n\n${list || 'No printers found'}`,
            });
          },
        },
        {
          label: 'Set Default Thermal Printer',
          click: async () => {
            const printers = await mainWindow.webContents.getPrintersAsync();
            const names = printers.map((p) => p.name);
            if (names.length === 0) {
              dialog.showMessageBox(mainWindow, {
                type: 'warning',
                title: 'No Printers',
                message: 'No installed printers found on this system.',
              });
              return;
            }
            const { response } = await dialog.showMessageBox(mainWindow, {
              type: 'question',
              buttons: [...names, 'Cancel'],
              cancelId: names.length,
              title: 'Select Thermal / Xprinter',
              message: 'Choose which printer Tuta Suites should use for instant silent printing:',
            });
            if (response < names.length) {
              const chosen = names[response];
              saveConfig({ selectedPrinter: chosen });
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Printer Saved',
                message: `Tuta Suites will now print receipts directly to: ${chosen}`,
              });
            }
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click: () => mainWindow.webContents.toggleDevTools(),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Tuta Suites Desktop',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Tuta Suites POS Client',
              message: `Tuta Suites Desktop Client\nConnected POS Terminal with native thermal printing.\nNo QZ Tray required.`,
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Load configured URL
  const targetUrl = isDev ? DEV_URL : (config.serverUrl || DEFAULT_PROD_URL);
  console.log(`Loading Tuta Suites from: ${targetUrl}`);
  
  const loadWithRetry = (attempt = 1) => {
    mainWindow.loadURL(targetUrl).catch((err) => {
      console.error(`[Attempt ${attempt}] Failed to load URL:`, err.message);
      const offlinePage = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Tuta Suites - Connecting...</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', sans-serif;
              background: #0f172a;
              color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              text-align: center;
            }
            .card {
              background: #1e293b;
              border: 1px solid #334155;
              border-radius: 16px;
              padding: 48px 64px;
              max-width: 520px;
              width: 90%;
            }
            .logo { font-size: 36px; font-weight: 800; color: #D4AF37; margin-bottom: 8px; }
            .subtitle { font-size: 13px; color: #94a3b8; margin-bottom: 32px; text-transform: uppercase; letter-spacing: 2px; }
            .icon { font-size: 56px; margin-bottom: 20px; }
            h2 { font-size: 22px; color: #f1f5f9; margin-bottom: 12px; }
            p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 8px; }
            .url { font-size: 12px; color: #475569; font-family: monospace; margin-bottom: 28px; word-break: break-all; }
            .spinner {
              width: 36px; height: 36px;
              border: 3px solid #334155;
              border-top-color: #D4AF37;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
              margin: 0 auto 20px;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
            .status { font-size: 13px; color: #64748b; margin-bottom: 24px; }
            .countdown { color: #D4AF37; font-weight: bold; }
            .btn {
              background: #D4AF37;
              color: #000;
              border: none;
              padding: 12px 28px;
              border-radius: 8px;
              font-size: 15px;
              font-weight: 700;
              cursor: pointer;
              margin: 4px;
            }
            .btn:hover { background: #c49b2a; }
            .btn-outline {
              background: transparent;
              color: #94a3b8;
              border: 1px solid #334155;
              padding: 12px 28px;
              border-radius: 8px;
              font-size: 15px;
              cursor: pointer;
              margin: 4px;
            }
            .attempt { font-size: 11px; color: #475569; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">TUTA SUITES</div>
            <div class="subtitle">POS &amp; Hotel Management</div>
            <div class="icon">📡</div>
            <h2>Connecting to Server...</h2>
            <p>Unable to reach the Tuta Suites server.</p>
            <p>Please check your internet connection.</p>
            <div class="url">${targetUrl}</div>
            <div class="spinner"></div>
            <div class="status">Auto-retrying in <span class="countdown" id="cd">5</span>s...</div>
            <div>
              <button class="btn" onclick="retryNow()">🔄 Retry Now</button>
              <button class="btn-outline" onclick="openBrowser()">🌐 Open in Browser</button>
            </div>
            <div class="attempt">Attempt #${attempt} &nbsp;|&nbsp; Error: Connection reset by server</div>
          </div>
          <script>
            let t = 5;
            const cd = document.getElementById('cd');
            const timer = setInterval(() => {
              t--;
              cd.textContent = t;
              if (t <= 0) {
                clearInterval(timer);
                retryNow();
              }
            }, 1000);

            function retryNow() {
              clearInterval(timer);
              location.reload();
            }

            function openBrowser() {
              // Signal Electron main to open in system browser
              if (window.__electron_openExternal) {
                window.__electron_openExternal('${targetUrl}');
              }
            }
          </script>
        </body>
        </html>
      `;
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(offlinePage)}`);
    });
  };

  loadWithRetry(1);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Completely deny blank/popup windows to prevent unwanted browser print dialogs
    if (!url || url === 'about:blank' || url.startsWith('data:')) {
      return { action: 'deny' };
    }
    if (!url.startsWith(targetUrl)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// -------------------------------------------------------------
// IPC HANDLERS FOR HARDWARE & PRINTING
// -------------------------------------------------------------

// 1. Get all installed printers
ipcMain.handle('printers:get', async () => {
  if (!mainWindow) return [];
  try {
    const printers = await mainWindow.webContents.getPrintersAsync();
    const config = loadConfig();
    return printers.map((p) => ({
      name: p.name,
      displayName: p.displayName || p.name,
      description: p.description || '',
      status: p.status,
      isDefault: p.isDefault,
      isSelected: config.selectedPrinter === p.name,
    }));
  } catch (err) {
    console.error('Failed to get printers:', err);
    return [];
  }
});

// 2. Get saved config
ipcMain.handle('config:get', () => {
  return loadConfig();
});

// 3. Save config (e.g. selected printer or paper size)
ipcMain.handle('config:save', (event, newConfig) => {
  return saveConfig(newConfig);
});

// -------------------------------------------------------------
// ESC/POS FORMATTER & NATIVE SPOOLER ENGINE
// Completely replaces Chromium webContents.print to eliminate
// Windows print dialog popups and unending thermal paper feeds!
// -------------------------------------------------------------

function getThermalLogoBuffer() {
  const possiblePaths = [
    path.join(__dirname, 'thermal-logo.bin'),
    path.join(__dirname, 'electron', 'thermal-logo.bin'),
    path.join(process.resourcesPath || '', 'thermal-logo.bin'),
    path.join(process.resourcesPath || '', 'app', 'electron', 'thermal-logo.bin'),
    path.join(process.resourcesPath || '', 'electron', 'thermal-logo.bin'),
    path.join(app.getAppPath ? app.getAppPath() : __dirname, 'electron', 'thermal-logo.bin'),
    path.join(app.getAppPath ? app.getAppPath() : __dirname, 'thermal-logo.bin'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const buf = fs.readFileSync(p);
        if (buf.length > 0) return buf;
      } catch (e) {}
    }
  }
  return null;
}

function convertHtmlToEscPosText(html) {
  if (!html || typeof html !== 'string') return Buffer.alloc(0);

  let text = html
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/₦/g, '#');

  const format2Cols = (left, right, width = 42) => {
    left = String(left || '').trim();
    right = String(right || '').trim();
    const space = width - left.length - right.length;
    if (space <= 0) {
      return `${left}\n  ${right}`;
    }
    return left + ' '.repeat(space) + right;
  };

  const format3Cols = (c1, c2, c3, width = 42) => {
    c1 = String(c1 || '').trim();
    c2 = String(c2 || '').trim();
    c3 = String(c3 || '').trim();
    const c1Width = 24;
    const c2Width = 5;
    const c3Width = 13;
    const p1 = c1.substring(0, c1Width).padEnd(c1Width, ' ');
    const p2 = c2.padStart(c2Width, ' ');
    const p3 = c3.padStart(c3Width, ' ');
    return `${p1}${p2}${p3}`;
  };

  const logoBuf = getThermalLogoBuffer();
  const initCommands = '\x1B@\x1C.\x1Bt\x00\x1BR\x00\x1BM\x00\x1B3\x18\x1Ba\x01';

  const lines = [];

  // Title: Centered + Double size
  lines.push('\x1Ba\x01');   // Center
  lines.push('\x1B!\x30');   // Double width & height
  lines.push('TUTA SUITES\n');
  lines.push('\x1B!\x00');   // Normal size

  // Address & contact
  lines.push('3, Assurance CDA Estate, Orimerunmu\n');
  lines.push('Mowe-Ibafo, Ogun State\n');
  lines.push('Tel: +234 811 182 1899\n');

  // Check for badge text
  const badgeMatch = text.match(/\*\*\*[^*]+\*\*\*/);
  if (badgeMatch) {
    lines.push(`\n${badgeMatch[0]}\n`);
  }

  lines.push('------------------------------------------\n');
  lines.push('\x1Ba\x00');   // Left align

  // --- 1. EXTRACT ALL METADATA ROWS ---
  const metaRowRegex = /<div[^>]*class="[^"]*(?:flex[^"]*justify-between|meta-row)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let rowMatch;
  const processedMeta = new Set();

  while ((rowMatch = metaRowRegex.exec(text)) !== null) {
    const inner = rowMatch[1];
    if (/subtotal|\btotal\b/i.test(inner)) continue;

    const spans = [];
    const spanRegex = /<span[^>]*>([\s\S]*?)<\/span>/gi;
    let s;
    while ((s = spanRegex.exec(inner)) !== null) {
      const cleanSpan = s[1].replace(/<[^>]+>/g, '').trim();
      if (cleanSpan) spans.push(cleanSpan);
    }

    if (spans.length >= 2) {
      const label = spans[0].trim();
      const val = spans[1].trim();
      if (label && val && !processedMeta.has(label)) {
        processedMeta.add(label);
        lines.push(format2Cols(label, val) + '\n');
      }
    }
  }

  lines.push('------------------------------------------\n');

  // --- 2. EXTRACT SECTIONS AND ITEMS ---
  const itemRowExtract = (blockText) => {
    const items = [];
    const itemRegex = /<div[^>]*class="[^"]*(?:grid\s+grid-cols-12|item-row)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    let im;
    while ((im = itemRegex.exec(blockText)) !== null) {
      const inner = im[1];
      if (/item/i.test(inner) && /qty/i.test(inner) && /amount/i.test(inner)) continue;
      const spans = [];
      const spanRegex = /<span[^>]*>([\s\S]*?)<\/span>/gi;
      let s;
      while ((s = spanRegex.exec(inner)) !== null) {
        spans.push(s[1].replace(/<[^>]+>/g, '').trim());
      }
      if (spans.length >= 3) {
        items.push({ name: spans[0], qty: spans[1], amount: spans[2].replace(/₦/g, '#') });
      }
    }
    return items;
  };

  const knownSectionNames = ['KITCHEN & RESTAURANT', 'MINI LOUNGE & BAR', 'LAUNDRY SERVICE', 'BAR ORDER', 'RESTAURANT ORDER'];
  const presentSections = knownSectionNames.filter(name => text.includes(name));

  if (presentSections.length > 0) {
    presentSections.forEach(secName => {
      const secStartIndex = text.indexOf(secName);
      const nextIndexCandidates = presentSections
        .map(n => text.indexOf(n))
        .filter(idx => idx > secStartIndex);
      const totalIndex = text.search(/COMBINED TOTAL|GRAND TOTAL|\bTOTAL\b/i);
      if (totalIndex > secStartIndex) nextIndexCandidates.push(totalIndex);
      
      const secEndIndex = nextIndexCandidates.length > 0 ? Math.min(...nextIndexCandidates) : text.length;
      const sectionSnippet = text.substring(secStartIndex, secEndIndex);

      lines.push('\x1Ba\x01');   // Center
      lines.push('\x1BE\x01');   // Bold on
      lines.push(`\n--- ${secName} ---\n`);
      lines.push('\x1BE\x00');   // Bold off
      lines.push('\x1Ba\x00');   // Left align

      lines.push(format3Cols('Item', 'Qty', 'Amount') + '\n');
      lines.push(' - - - - - - - - - - - - - - - - - - - - -\n');

      const secItems = itemRowExtract(sectionSnippet);
      secItems.forEach(it => {
        lines.push(format3Cols(it.name, it.qty, it.amount) + '\n');
      });

      const subMatch = sectionSnippet.match(/(?:Subtotal)[\s\S]*?(#[\d,]+)/i);
      if (subMatch) {
        lines.push(' - - - - - - - - - - - - - - - - - - - - -\n');
        lines.push(format2Cols(`${secName} Subtotal:`, subMatch[1]) + '\n');
      }
    });
  } else {
    // Standard single items list
    lines.push('\x1BE\x01');   // Bold on
    lines.push(format3Cols('Item', 'Qty', 'Amount') + '\n');
    lines.push('\x1BE\x00');   // Bold off
    lines.push('------------------------------------------\n');

    const allItems = itemRowExtract(text);
    allItems.forEach(it => {
      lines.push(format3Cols(it.name, it.qty, it.amount) + '\n');
    });
  }

  lines.push('------------------------------------------\n');

  // --- 3. GRAND TOTAL ---
  let grandTotal = '';
  const combinedMatch = text.match(/COMBINED TOTAL:?\s*<\/span>\s*<span[^>]*>(#[\d,]+)/i) ||
                        text.match(/COMBINED TOTAL:?[\s\S]*?(#[\d,]+)/i);
  if (combinedMatch) {
    grandTotal = combinedMatch[1];
  } else {
    const finalTotalMatch = text.match(/(?:GRAND TOTAL|\bTOTAL\b):?\s*<\/span>\s*<span[^>]*>(#[\d,]+)/i) ||
                            text.match(/(?:GRAND TOTAL|\bTOTAL\b):?[\s\S]*?(#[\d,]+)/i);
    if (finalTotalMatch) grandTotal = finalTotalMatch[1];
  }

  if (grandTotal) {
    lines.push('\x1BE\x01');   // Bold on
    lines.push('\x1B!\x20');   // Double height
    lines.push(format2Cols('COMBINED TOTAL:', grandTotal) + '\n');
    lines.push('\x1B!\x00');   // Normal
    lines.push('\x1BE\x00');   // Bold off
  }

  lines.push('------------------------------------------\n');

  // Footer: Centered
  lines.push('\x1Ba\x01');   // Center
  lines.push('\nThank you for your patronage!\n');
  lines.push('Powered by Tuta Suites POS\n');

  // Feed 4 lines + Full Cut
  lines.push('\n\n\n\n');
  lines.push('\x1Bd\x04');       // ESC d 4
  lines.push('\x1DV\x42\x00');   // GS V B 0 (Full Cut)
  lines.push('\x1Bi');           // ESC i (Xprinter Cut)

  const asciiClean = (s) => s.replace(/[^\x00-\x7F]/g, (c) => {
    const map = { '₦': '#', '£': 'L', '€': 'E' };
    return map[c] || '?';
  });

  const textBuf = Buffer.from(asciiClean(lines.join('')), 'latin1');
  const initBuf = Buffer.from(initCommands, 'latin1');

  if (logoBuf && logoBuf.length > 0) {
    return Buffer.concat([initBuf, logoBuf, Buffer.from('\n', 'latin1'), textBuf]);
  } else {
    return Buffer.concat([initBuf, textBuf]);
  }
}

async function sendRawToPrinter(escposInput, preferredPrinter) {
  try {
    const config = loadConfig();
    const printers = mainWindow ? await mainWindow.webContents.getPrintersAsync() : [];
    let targetPrinter = preferredPrinter || config.selectedPrinter;

    if (!targetPrinter || !printers.some((p) => p.name === targetPrinter)) {
      const match = printers.find((p) => /xprinter|xp-|pos|thermal|receipt/i.test(p.name));
      targetPrinter = match
        ? match.name
        : (printers.find((p) => p.isDefault)?.name || (printers[0] ? printers[0].name : ''));
    }

    if (!targetPrinter) {
      return { success: false, error: 'No thermal printer found on this system.' };
    }

    const escposHeader = '\x1B@\x1C.\x1Bt\x00\x1BR\x00\x1BM\x00\x1B3\x18';
    const escposFooter = '\n\n\n\n\x1Bd\x04\x1DV\x42\x00\x1Bi';

    let buffer;
    if (Buffer.isBuffer(escposInput)) {
      buffer = escposInput;
    } else {
      let rawText = '';
      if (Array.isArray(escposInput)) {
        rawText = escposInput.filter((x) => typeof x === 'string').join('');
      } else {
        rawText = String(escposInput || '');
      }

      const sanitize = (s) => s.replace(/[^\x00-\x7F]/g, (c) => {
        const map = { '₦': '#', '£': 'L', '€': 'E', '©': '(c)', '®': '(R)', '™': 'TM' };
        return map[c] || '?';
      });

      let finalStream = sanitize(rawText);
      const logoBuf = getThermalLogoBuffer();
      const hasLogo = finalStream.includes('\x1Dv0') || finalStream.includes('\x1D\x76\x30');

      if (!finalStream.includes('\x1C.')) {
        finalStream = escposHeader + finalStream;
      }
      if (!finalStream.includes('\x1DV\x42\x00') && !finalStream.includes('\x1Bi')) {
        finalStream += escposFooter;
      }

      if (logoBuf && !hasLogo) {
        const headerIdx = finalStream.indexOf(escposHeader);
        if (headerIdx !== -1) {
          const before = Buffer.from(finalStream.substring(0, headerIdx + escposHeader.length) + '\x1Ba\x01', 'latin1');
          const after = Buffer.from('\n' + finalStream.substring(headerIdx + escposHeader.length), 'latin1');
          buffer = Buffer.concat([before, logoBuf, after]);
        } else {
          buffer = Buffer.concat([
            Buffer.from(escposHeader + '\x1Ba\x01', 'latin1'),
            logoBuf,
            Buffer.from('\n' + finalStream, 'latin1')
          ]);
        }
      } else {
        buffer = Buffer.from(finalStream, 'latin1');
      }
    }

    console.log(`[Desktop POS] Sending ${buffer.length} bytes ESC/POS to: "${targetPrinter}"`);

    const tempFile = path.join(app.getPath('temp'), `tuta-receipt-${Date.now()}.bin`);
    fs.writeFileSync(tempFile, buffer);

    const possibleExePaths = [
      path.join(__dirname, 'raw-printer.exe'),
      path.join(process.resourcesPath || '', 'app', 'electron', 'raw-printer.exe'),
      path.join(process.resourcesPath || '', 'electron', 'raw-printer.exe'),
      path.join(app.getAppPath(), 'electron', 'raw-printer.exe'),
      path.join(app.getAppPath(), 'raw-printer.exe'),
    ];
    const rawPrinterExe = possibleExePaths.find((p) => fs.existsSync(p)) || path.join(__dirname, 'raw-printer.exe');

    return new Promise((resolve) => {
      execFile(rawPrinterExe, [targetPrinter, tempFile], (err, stdout, stderr) => {
        try { fs.unlinkSync(tempFile); } catch (e) {}
        if (err) {
          console.error('[Desktop POS] Spooler RAW error:', err.message, stderr);
          resolve({ success: false, error: stderr || err.message });
        } else {
          console.log('[Desktop POS] ✅ Spooler RAW success:', stdout.trim());
          resolve({ success: true, printer: targetPrinter, method: 'Spooler-RAW' });
        }
      });
    });
  } catch (err) {
    console.error('[Desktop POS] print exception:', err);
    return { success: false, error: err.message };
  }
}

// 4. Direct Raw ESC/POS Thermal Printing
ipcMain.handle('print:raw', async (event, { rawCommands, printerName }) => {
  return sendRawToPrinter(rawCommands, printerName);
});

// 5. HTML Receipt Printing — Automatically converts HTML to native ESC/POS
// NEVER calls webContents.print, eliminating Windows print dialogs and unending feeds!
ipcMain.handle('print:receipt', async (event, { html, printerName }) => {
  console.log('[Desktop POS] print:receipt converting HTML to native ESC/POS');
  const escposText = convertHtmlToEscPosText(html);
  return sendRawToPrinter(escposText, printerName);
});

// -------------------------------------------------------------
// LOCAL HTTP PRINT BRIDGE FOR WEB BROWSER CLIENTS
// Allows web pages on tutasuites.com (in Chrome/Edge) to print
// silently & directly to the thermal printer via Windows Spooler
// without requiring QZ Tray!
// -------------------------------------------------------------
let localPrintServer = null;

function startLocalPrintServer() {
  try {
    localPrintServer = http.createServer(async (req, res) => {
      // Allow requests from tutasuites.com and localhost
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.method === 'GET' && req.url === '/ping') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', app: 'Tuta Suites POS Desktop', version: '1.0' }));
        return;
      }

      if (req.method === 'POST' && req.url === '/print') {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body || '{}');
            console.log('[Local Print Bridge] Web client initiated thermal print job');
            const result = await sendRawToPrinter(
              data.html ? convertHtmlToEscPosText(data.html) : (data.raw || ''),
              data.printerName
            );
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } catch (err) {
            console.error('[Local Print Bridge] Print processing error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
        return;
      }

      res.writeHead(404);
      res.end();
    });

    localPrintServer.listen(19989, '127.0.0.1', () => {
      console.log('[Local Print Bridge] ✅ Listening on http://127.0.0.1:19989 for browser print requests');
    });

    localPrintServer.on('error', (e) => {
      console.warn('[Local Print Bridge] Port 19989 unavailable (another instance active?):', e.message);
    });
  } catch (err) {
    console.warn('[Local Print Bridge] Could not initialize print server:', err);
  }
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  startLocalPrintServer();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (localPrintServer) {
    try { localPrintServer.close(); } catch (e) {}
  }
  if (process.platform !== 'darwin') app.quit();
});

