const { contextBridge, ipcRenderer, webFrame } = require('electron');

// 1. Expose clean native desktop API to web application
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  getPrinters: () => ipcRenderer.invoke('printers:get'),
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  printReceipt: (html, options = {}) => ipcRenderer.invoke('print:receipt', { html, ...options }),
  printRaw: (rawCommands, printerName) => ipcRenderer.invoke('print:raw', { rawCommands, printerName }),
});

// 2. Injected QZ Tray WebSocket Emulator
// Intercepts any call to localhost:8181/8182 made by qz-tray.js on the live website.
// Completely eliminates the need for the QZ Tray program and routes all ESC/POS directly to the printer!
try {
  webFrame.executeJavaScript(`
    (() => {
      if (typeof window !== 'undefined' && window.WebSocket) {
        const _RealWebSocket = window.WebSocket;

        class QZMockWebSocket extends EventTarget {
          constructor(url, protocols) {
            super();
            this.url = url;
            this.protocols = protocols;
            this.readyState = 0; // CONNECTING
            this.binaryType = 'blob';

            setTimeout(() => {
              this.readyState = 1; // OPEN
              if (typeof this.onopen === 'function') {
                this.onopen(new Event('open'));
              }
            }, 10);
          }

          send(dataStr) {
            if (dataStr === 'ping') return;

            try {
              const msg = JSON.parse(dataStr);
              const uid = msg.uid;
              const call = msg.call;
              let result = null;

              if (call === 'getVersion') {
                result = '2.2.6';
              } else if (call === 'getCertificate') {
                result = null;
              } else if (call === 'printers.getDefault') {
                result = 'Xprinter XP-Q301F';
              } else if (call === 'printers.find') {
                result = ['Xprinter XP-Q301F'];
              } else if (call === 'print') {
                const printData = msg.params && msg.params[1] ? msg.params[1] : [];
                if (window.electronAPI && window.electronAPI.printRaw) {
                  window.electronAPI.printRaw(printData);
                }
                result = null;
              }

              setTimeout(() => {
                const response = JSON.stringify({ uid: uid, result: result });
                if (typeof this.onmessage === 'function') {
                  this.onmessage({ data: response });
                }
              }, 15);
            } catch (err) {
              console.error('[Tuta POS] QZ mock websocket send error:', err);
            }
          }

          close(code, reason) {
            this.readyState = 3; // CLOSED
            if (typeof this.onclose === 'function') {
              this.onclose(new CloseEvent('close', { code: code || 1000, reason: reason || '' }));
            }
          }
        }

        window.WebSocket = function(url, protocols) {
          if (typeof url === 'string' && (
            url.includes(':8181') ||
            url.includes(':8182') ||
            url.includes(':8282') ||
            url.includes(':8283') ||
            url.includes(':8383') ||
            url.includes(':8484') ||
            url.includes('localhost.qz.io') ||
            url.includes('qz.surf')
          )) {
            console.log('[Tuta POS] Using native desktop print bridge for:', url);
            return new QZMockWebSocket(url, protocols);
          }
          return new _RealWebSocket(url, protocols);
        };
      }
    })();
  `);
} catch (err) {
  console.error('Failed to inject QZ mock websocket:', err);
}
