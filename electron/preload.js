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

// 2. Inject Silent Print Interceptors & QZ Tray Bridge into the Main World
try {
  webFrame.executeJavaScript(`
    (() => {
      if (typeof window === 'undefined') return;

      // Helper: ASCII sanitization for thermal printer ESC/POS stream
      function sanitizeAscii(str) {
        if (!str || typeof str !== 'string') return '';
        const map = { '₦': '#', '£': 'L', '€': 'E', '©': '(c)', '®': '(R)', '™': 'TM' };
        return str.replace(/[^\x00-\x7F]/g, (c) => map[c] || '?');
      }

      // ── A. OVERRIDE window.print TO BE 100% SILENT (NO CHROMIUM POPUP) ─────────
      const _originalPrint = window.print;
      window.print = function() {
        console.log('[Tuta POS] Intercepted window.print() — routing to native silent print');
        const receiptEl = document.querySelector('.receipt-container') ||
                          document.querySelector('.receipt-card') ||
                          document.body;
        const html = receiptEl ? receiptEl.outerHTML : document.body.innerHTML;
        if (window.electronAPI && window.electronAPI.printReceipt) {
          window.electronAPI.printReceipt(html);
        }
      };

      // ── B. INTERCEPT window.open FOR RECEIPT PRINT WINDOWS ──────────────────────
      const _originalOpen = window.open;
      window.open = function(url, target, features) {
        // If it's an empty popup for printing (like fallbackPrint)
        if (!url || url === '' || url === 'about:blank') {
          const fakeWindow = {
            document: {
              _html: '',
              open: function() { this._html = ''; },
              write: function(content) { this._html += content; },
              close: function() {
                console.log('[Tuta POS] Intercepted print popup document write — printing silently');
                if (window.electronAPI && window.electronAPI.printReceipt) {
                  window.electronAPI.printReceipt(this._html);
                }
              }
            },
            onload: null,
            onafterprint: null,
            print: function() {},
            close: function() {},
            focus: function() {}
          };
          return fakeWindow;
        }
        return _originalOpen.apply(window, arguments);
      };

      // ── C. INJECT QZ TRAY WEBSOCKET EMULATOR ───────────────────────────────────
      // Intercepts any call to localhost:8181/8182 made by qz-tray on the website.
      if (window.WebSocket) {
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
                console.log('[Tuta POS] QZ print call received, data chunks:', printData.length);
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
            console.log('[Tuta POS] Intercepted QZ Tray WebSocket for native silent print:', url);
            return new QZMockWebSocket(url, protocols);
          }
          return new _RealWebSocket(url, protocols);
        };
      }

      // ── D. DIRECT PRINT BUTTON INTERCEPTOR ─────────────────────────────────────
      // Catches clicks on any "PRINT RECEIPT" buttons on the web page and prints directly
      window.addEventListener('click', (e) => {
        const btn = e.target && e.target.closest ? e.target.closest('button, a') : null;
        if (!btn) return;
        const text = (btn.innerText || btn.textContent || '').trim().toLowerCase();
        if (text.includes('print receipt') || text.includes('print (80mm)')) {
          console.log('[Tuta POS] Direct Print button click captured');
          const receiptEl = document.querySelector('.receipt-container') ||
                            document.querySelector('.receipt-card') ||
                            document.querySelector('[class*="receipt"]') ||
                            document.querySelector('div[class*="max-w-[400px]"].bg-white');
          if (receiptEl && window.electronAPI && window.electronAPI.printReceipt) {
            e.preventDefault();
            e.stopPropagation();
            window.electronAPI.printReceipt(receiptEl.outerHTML);
          }
        }
      }, true);

      console.log('[Tuta POS] Native Desktop Silent Printing Engine Active');
    })();
  `);
} catch (err) {
  console.error('Failed to inject POS silent print interceptors:', err);
}
