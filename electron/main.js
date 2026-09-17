const { app, BrowserWindow, ipcMain, Menu, shell, dialog } = require('electron');
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
  const iconPath = fs.existsSync(path.join(__dirname, 'icon.png'))
    ? path.join(__dirname, 'icon.png')
    : fs.existsSync(path.join(__dirname, 'icon.ico'))
    ? path.join(__dirname, 'icon.ico')
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
  
  mainWindow.loadURL(targetUrl).catch((err) => {
    console.error('Failed to load URL:', err);
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
      <div style="font-family:sans-serif; text-align:center; padding:60px;">
        <h2>Unable to connect to Tuta Suites</h2>
        <p>Could not connect to ${targetUrl}. Please check your internet connection.</p>
        <button onclick="location.reload()" style="padding:10px 20px; font-size:16px; cursor:pointer;">Retry</button>
      </div>
    `)}`);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow receipt print popups but keep them completely hidden
    if (!url || url === 'about:blank' || url.startsWith('data:')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          show: false,
          width: 576,
          height: 800,
        },
      };
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

// 4. Native Silent Thermal Receipt Printing
ipcMain.handle('print:receipt', async (event, { html, printerName, paperWidth }) => {
  const config = loadConfig();
  const width = paperWidth || config.paperWidth || 80;
  
  // Create an invisible off-screen BrowserWindow to render the receipt
  const printWin = new BrowserWindow({
    show: false,
    width: width === 58 ? 384 : 576,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  try {
    // Wrap HTML with styling tailored for thermal roll printing
    const thermalHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page {
            margin: 0;
            size: auto;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            width: ${width === 58 ? '48mm' : '72mm'};
            margin: 0 auto;
            padding: 4px;
            font-family: monospace, 'Courier New', Courier;
            color: #000;
            background: #fff;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          .screen-actions {
            display: none !important;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;

    await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(thermalHtml)}`);

    // Determine target printer: specified > saved config > auto-detected Xprinter > default printer
    const printers = await printWin.webContents.getPrintersAsync();
    let targetPrinter = printerName || config.selectedPrinter;

    if (!targetPrinter || !printers.some((p) => p.name === targetPrinter)) {
      // Auto-detect any thermal/receipt printer name (e.g., Xprinter, POS, Thermal, Receipt, XP-)
      const autoMatch = printers.find((p) =>
        /xprinter|xp-|pos|thermal|receipt|58mm|80mm/i.test(p.name)
      );
      if (autoMatch) {
        targetPrinter = autoMatch.name;
      } else {
        const defaultPrinter = printers.find((p) => p.isDefault);
        targetPrinter = defaultPrinter ? defaultPrinter.name : (printers[0] ? printers[0].name : '');
      }
    }

    if (!targetPrinter) {
      printWin.close();
      return { success: false, error: 'No printer found on this system.' };
    }

    console.log(`Printing silently to: ${targetPrinter}`);

    // Micron size: 1mm = 1,000 microns. 80mm = 80,000 microns. Continuous roll length = 300,000 microns.
    const micronWidth = width === 58 ? 58000 : 80000;

    return new Promise((resolve) => {
      printWin.webContents.print(
        {
          silent: true,
          printBackground: true,
          deviceName: targetPrinter,
          margins: {
            marginType: 'none',
          },
          pageSize: {
            width: micronWidth,
            height: 300000,
          },
        },
        (success, failureReason) => {
          printWin.close();
          if (!success) {
            console.error('Silent print failed:', failureReason);
            resolve({ success: false, error: failureReason });
          } else {
            console.log(`Successfully printed receipt to ${targetPrinter}`);
            resolve({ success: true, printer: targetPrinter });
          }
        }
      );
    });
  } catch (err) {
    if (!printWin.isDestroyed()) printWin.close();
    console.error('Print handler exception:', err);
    return { success: false, error: err.message };
  }
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Intercept any fallback print window, print silently directly to Xprinter, and close
app.on('browser-window-created', (event, childWin) => {
  if (childWin !== mainWindow) {
    childWin.hide(); // Keep completely invisible

    childWin.webContents.on('dom-ready', () => {
      setTimeout(async () => {
        if (childWin.isDestroyed()) return;
        try {
          const printers = await childWin.webContents.getPrintersAsync();
          const config = loadConfig();
          let targetPrinter = config.selectedPrinter;

          if (!targetPrinter || !printers.some((p) => p.name === targetPrinter)) {
            const autoMatch = printers.find((p) =>
              /xprinter|xp-|pos|thermal|receipt|58mm|80mm/i.test(p.name)
            );
            targetPrinter = autoMatch ? autoMatch.name : (printers.find((p) => p.isDefault)?.name || printers[0]?.name);
          }

          if (targetPrinter) {
            console.log(`[Desktop POS] Intercepted receipt popup, printing silently to: ${targetPrinter}`);
            childWin.webContents.print(
              {
                silent: true,
                printBackground: true,
                deviceName: targetPrinter,
                margins: { marginType: 'none' },
                pageSize: { width: 80000, height: 300000 },
              },
              () => {
                if (!childWin.isDestroyed()) childWin.close();
              }
            );
          } else {
            if (!childWin.isDestroyed()) childWin.close();
          }
        } catch (err) {
          console.error('Child print error:', err);
          if (!childWin.isDestroyed()) childWin.close();
        }
      }, 300);
    });
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
