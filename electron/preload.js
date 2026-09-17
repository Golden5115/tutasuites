const { contextBridge, ipcRenderer, webFrame } = require('electron');

// Expose safe desktop API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  getPrinters: () => ipcRenderer.invoke('printers:get'),
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  printReceipt: (html, options = {}) => ipcRenderer.invoke('print:receipt', { html, ...options }),
});

// Neutralize QZ Tray WebSocket calls so the local QZ Tray app NEVER wakes up or pops up
try {
  webFrame.executeJavaScript(`
    (() => {
      if (typeof window !== 'undefined' && window.WebSocket) {
        const _RealWebSocket = window.WebSocket;
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
            console.warn('[Desktop POS] Diverted QZ Tray connection - printing will use native Windows spooler directly.');
            const dummySocket = new EventTarget();
            dummySocket.readyState = 3; // CLOSED
            dummySocket.close = () => {};
            dummySocket.send = () => {};
            setTimeout(() => {
              if (typeof dummySocket.onerror === 'function') dummySocket.onerror(new Event('error'));
              if (typeof dummySocket.onclose === 'function') dummySocket.onclose(new CloseEvent('close', { wasClean: false, code: 1006 }));
            }, 10);
            return dummySocket;
          }
          return new _RealWebSocket(url, protocols);
        };
      }
    })();
  `);
} catch (err) {
  console.error('Failed to inject QZ neutralizer:', err);
}
