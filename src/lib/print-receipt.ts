/**
 * Opens a new browser popup window containing ONLY the receipt HTML,
 * then triggers window.print() on that isolated window.
 * 
 * This completely avoids the blank-page problem caused by trying to
 * hide complex dashboard DOM with @media print CSS.
 */
export async function printReceipt(receiptHtml: string) {
  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Receipt — Tuta Suites</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        @media print {
          html, body {
            width: 78mm !important;
            max-width: 78mm !important;
            margin: 0 !important;
            padding: 1mm 2mm !important;
          }
          .screen-actions {
            display: none !important;
          }
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          width: 576px;
          margin: 0;
          padding: 16px;
          font-family: 'Courier New', Courier, monospace;
          font-size: 24px;
          color: #000;
          background: #fff;
        }
        .receipt-header {
          text-align: center;
          padding-bottom: 12px;
          border-bottom: 2px dashed #999;
          margin-bottom: 12px;
        }
        .receipt-header h2 {
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .receipt-header .address {
          font-size: 20px;
          color: #555;
          line-height: 1.4;
        }
        .receipt-header .title-badge {
          display: inline-block;
          margin-top: 8px;
          padding: 4px 16px;
          background: #f0f0f0;
          font-weight: bold;
          font-size: 22px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          border-radius: 4px;
        }
        .meta-section {
          padding: 12px 0;
          border-bottom: 2px dashed #999;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 24px;
        }
        .meta-row .label {
          color: #666;
        }
        .meta-row .value {
          font-weight: bold;
        }
        .items-section {
          padding: 12px 0;
          border-bottom: 2px dashed #999;
        }
        .receipt-section {
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px dashed #aaa;
        }
        .section-title {
          font-size: 22px;
          font-weight: bold;
          text-transform: uppercase;
          background: #f0f0f0;
          padding: 4px 10px;
          margin-bottom: 8px;
          border-radius: 4px;
          display: inline-block;
        }
        .section-subtotal {
          display: flex;
          justify-content: space-between;
          font-size: 24px;
          font-weight: bold;
          padding: 6px 0;
          margin-top: 6px;
          border-top: 1px dashed #ccc;
        }
        .items-header {
          display: flex;
          font-weight: bold;
          font-size: 20px;
          text-transform: uppercase;
          color: #666;
          padding-bottom: 8px;
          margin-bottom: 8px;
          border-bottom: 2px solid #ddd;
        }
        .items-header .col-item { flex: 6; }
        .items-header .col-qty { flex: 2; text-align: center; }
        .items-header .col-amt { flex: 4; text-align: right; }
        .item-row {
          display: flex;
          font-size: 24px;
          margin-bottom: 6px;
          line-height: 1.3;
        }
        .item-row .col-item {
          flex: 6;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding-right: 8px;
        }
        .item-row .col-qty { flex: 2; text-align: center; }
        .item-row .col-amt { flex: 4; text-align: right; font-weight: bold; }
        .total-section {
          padding: 12px 0;
          border-top: 3px solid #000;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 30px;
          font-weight: bold;
        }
        .status-row {
          display: flex;
          justify-content: space-between;
          font-size: 22px;
          color: #555;
          text-transform: uppercase;
          margin-top: 8px;
        }
        .receipt-footer {
          text-align: center;
          padding-top: 16px;
          border-top: 2px dashed #999;
          margin-top: 12px;
          font-size: 20px;
          color: #666;
        }
        .receipt-footer .thanks {
          font-weight: bold;
          color: #000;
          margin-bottom: 4px;
        }
        .receipt-footer .powered {
          font-size: 16px;
          color: #aaa;
          margin-top: 8px;
        }
        @media print {
          .screen-actions {
            display: none !important;
          }
        }
        .screen-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 2px solid #eee;
        }
        .btn-print {
          background: #D4AF37;
          color: #000;
          border: none;
          padding: 12px 24px;
          font-weight: bold;
          font-size: 20px;
          border-radius: 8px;
          cursor: pointer;
          text-transform: uppercase;
        }
        .btn-close {
          background: #333;
          color: #fff;
          border: none;
          padding: 12px 24px;
          font-size: 20px;
          border-radius: 8px;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      ${receiptHtml}
    </body>
    </html>
  `

  // 1. DESKTOP CLIENT MODE: Direct printing — NO QZ Tray, NO browser dialog
  if (typeof window !== 'undefined' && (window as any).electronAPI?.isDesktop) {
    try {
      const sanitizedHtml = fullHtml.replaceAll('₦', '#')
      const result = await (window as any).electronAPI.printReceipt(sanitizedHtml)
      if (result?.success) {
        console.log(`[Desktop] ✅ Thermal print succeeded via ${result.method || 'Spooler-RAW'} → ${result.printer}`)
        return { success: true, printer: result.printer }
      }
      console.warn('[Desktop] printReceipt reported failure, attempting printRaw fallback:', result?.error)
    } catch (err) {
      console.error('[Desktop] printReceipt threw:', err)
    }

    try {
      const sanitizedHtml = fullHtml.replaceAll('₦', '#')
      const escposCommands = convertHtmlToEscPos(sanitizedHtml)
      const rawText = escposCommands.join('')
      const rawResult = await (window as any).electronAPI.printRaw(rawText)
      if (rawResult?.success) {
        console.log(`[Desktop] ✅ printRaw succeeded → ${rawResult.printer}`)
        return { success: true, printer: rawResult.printer }
      }
    } catch (rawErr) {
      console.error('[Desktop] printRaw threw:', rawErr)
    }

    console.error('[Desktop] ❌ All desktop print methods failed. Check printer connection.')
    return { success: false, error: 'Printer not responding. Go to Printers menu → Set Default Thermal Printer and make sure the Xprinter is selected and connected.' }
  }

  // 2. WEB BROWSER MODE: Direct Silent Printing via Local Desktop Bridge (No QZ Tray)
  if (typeof window !== 'undefined') {
    // Attempt A: Connect to local Tuta Suites POS print bridge on the terminal PC
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 1500)
      const res = await fetch('http://127.0.0.1:19989/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: fullHtml.replaceAll('₦', '#') }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          console.log(`[Web Browser POS] ✅ Printed silently via local hardware bridge → ${data.printer}`)
          return { success: true, printer: data.printer, method: 'LocalBridge-RAW' }
        }
      }
    } catch (bridgeErr) {
      // Local bridge not running on this machine (or user is on remote device)
      console.log('[Web Browser POS] Local hardware bridge not reachable, using direct 80mm browser print')
    }

    // Attempt B: Clean 80mm Browser Thermal Print (Zero popup blockage, no QZ Tray)
    return cleanBrowserPrint(fullHtml)
  }
}

function cleanBrowserPrint(htmlString: string) {
  try {
    const existingIframe = document.getElementById('tuta-print-frame')
    if (existingIframe) existingIframe.remove()

    const iframe = document.createElement('iframe')
    iframe.id = 'tuta-print-frame'
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (doc) {
      doc.open()
      doc.write(htmlString)
      doc.close()
      iframe.contentWindow?.focus()
      setTimeout(() => {
        iframe.contentWindow?.print()
        setTimeout(() => iframe.remove(), 2500)
      }, 350)
      return { success: true, method: 'Browser-80mm' }
    }
  } catch (err) {
    console.error('Clean browser print error:', err)
  }
  fallbackPrint(htmlString)
  return { success: true, method: 'Browser-Popup' }
}

async function getResizedLogoBase64(targetWidth: number = 110): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null)
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      const aspectRatio = img.height / img.width
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = Math.round(targetWidth * aspectRatio)
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(null)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg|jpeg);base64,/, ''))
    }
    img.onerror = () => resolve(null)
    img.src = '/logo.png'
  })
}

function formatTwoColumns(left: string, right: string, width: number = 42): string {
  const rightLen = right.length
  const maxLeftLen = width - rightLen - 1
  let trimmedLeft = left
  if (trimmedLeft.length > maxLeftLen) {
    trimmedLeft = trimmedLeft.substring(0, maxLeftLen)
  }
  const spaces = width - trimmedLeft.length - rightLen
  return trimmedLeft + ' '.repeat(Math.max(1, spaces)) + right
}

function formatThreeColumns(col1: string, col2: string, col3: string, width: number = 42): string {
  const c1Width = 22
  const c2Width = 6
  const c3Width = width - c1Width - c2Width
  
  const c1 = col1.substring(0, c1Width).padEnd(c1Width, ' ')
  const c2 = col2.padStart(c2Width, ' ')
  const c3 = col3.padStart(c3Width, ' ')
  
  return `${c1}${c2}${c3}`
}

export function convertHtmlToEscPos(htmlString: string): string[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlString, 'text/html')
  
  const commands: string[] = []
  
  // ── Printer Initialization ──────────────────────────────────────────────────
  commands.push('\x1B@')       // ESC @  — Full hardware reset (clear all settings)
  commands.push('\x1C.')       // FS .   — Cancel Chinese character mode (Xprinter specific)
  commands.push('\x1Bt\x00')   // ESC t 0 — Codepage: PC437 USA (Western standard)
  commands.push('\x1BR\x00')   // ESC R 0 — International charset: USA
  commands.push('\x1BM\x00')   // ESC M 0 — Font A (standard)
  commands.push('\x1B3\x18')   // ESC 3 24 — Line spacing: 24 dots (standard)
  // ───────────────────────────────────────────────────────────────────────────

  // Helper: strip non-ASCII chars that could trigger Chinese multi-byte mode
  const ascii = (str: string) => str.replace(/[^\x00-\x7F]/g, (c) => {
    const map: Record<string, string> = { '₦': '#', '£': 'L', '€': 'E', '©': '(c)', '®': '(R)', '™': 'TM' }
    return map[c] || '?'
  })

  // Header: Centered
  commands.push('\x1Ba\x01')
  
  // Title: Double height & double width
  const title = doc.querySelector('.receipt-header h2')?.textContent?.trim() || 'TUTA SUITES'
  commands.push('\x1B!\x30')
  commands.push(`${ascii(title)}\n`)
  commands.push('\x1B!\x00')
  
  // Address
  const addressText = doc.querySelector('.receipt-header .address')?.textContent?.trim() || ''
  if (addressText) {
    const lines = addressText.split('\n').map(l => l.trim()).filter(Boolean)
    lines.forEach(l => commands.push(`${ascii(l)}\n`))
  }
  
  // Badge
  const badge = doc.querySelector('.title-badge')?.textContent?.trim()
  if (badge) {
    commands.push(`\n${ascii(badge)}\n`)
  }
  
  commands.push('\n------------------------------------------\n')
  
  // Meta Section: Left aligned
  commands.push('\x1Ba\x00')
  const metaRows = doc.querySelectorAll('.meta-row')
  metaRows.forEach(row => {
    const label = ascii(row.querySelector('.label')?.textContent?.trim() || '')
    const value = ascii(row.querySelector('.value')?.textContent?.trim() || '')
    if (label || value) {
      commands.push(formatTwoColumns(label, value) + '\n')
    }
  })
  
  commands.push('------------------------------------------\n')
  
  // Sectional or standard items
  const receiptSections = doc.querySelectorAll('.receipt-section')
  if (receiptSections.length > 0) {
    receiptSections.forEach(section => {
      const sectionTitle = ascii(section.querySelector('.section-title')?.textContent?.trim() || '')
      if (sectionTitle) {
        commands.push('\x1Ba\x01')
        commands.push('\x1BE\x01')
        commands.push(`\n--- ${sectionTitle} ---\n`)
        commands.push('\x1BE\x00')
        commands.push('\x1Ba\x00')
      }

      commands.push('\x1BE\x01')
      commands.push(formatThreeColumns('Item', 'Qty', 'Amount') + '\n')
      commands.push('\x1BE\x00')
      commands.push('------------------------------------------\n')

      const sectionItems = section.querySelectorAll('.item-row')
      sectionItems.forEach(row => {
        const name = ascii(row.querySelector('.col-item')?.textContent?.trim() || '')
        const qty  = ascii(row.querySelector('.col-qty')?.textContent?.trim() || '')
        const amt  = ascii(row.querySelector('.col-amt')?.textContent?.trim() || '')
        commands.push(formatThreeColumns(name, qty, amt) + '\n')
      })

      const subtotalRow = section.querySelector('.section-subtotal')
      if (subtotalRow) {
        const spans = subtotalRow.querySelectorAll('span')
        const label = ascii(spans[0]?.textContent?.trim() || 'Subtotal:')
        const amt   = ascii(spans[1]?.textContent?.trim() || '')
        commands.push(' - - - - - - - - - - - - - - - - - - - - -\n')
        commands.push(formatTwoColumns(label, amt) + '\n')
      }
      commands.push('------------------------------------------\n')
    })
  } else {
    // Standard items
    commands.push('\x1BE\x01')
    commands.push(formatThreeColumns('Item', 'Qty', 'Amount') + '\n')
    commands.push('\x1BE\x00')
    commands.push('------------------------------------------\n')
    
    // Item Rows
    const itemRows = doc.querySelectorAll('.item-row')
    itemRows.forEach(row => {
      const name = ascii(row.querySelector('.col-item')?.textContent?.trim() || '')
      const qty  = ascii(row.querySelector('.col-qty')?.textContent?.trim() || '')
      const amt  = ascii(row.querySelector('.col-amt')?.textContent?.trim() || '')
      commands.push(formatThreeColumns(name, qty, amt) + '\n')
    })
    
    commands.push('------------------------------------------\n')
  }
  
  // Total Section
  const totalRow = doc.querySelector('.total-row')
  if (totalRow) {
    const spans = totalRow.querySelectorAll('span')
    const label = ascii(spans[0]?.textContent?.trim() || 'TOTAL:')
    const amt = ascii(spans[1]?.textContent?.trim() || '')
    commands.push('\x1BE\x01')
    commands.push(formatTwoColumns(label, amt) + '\n')
    commands.push('\x1BE\x00')
  }
  
  const statusRow = doc.querySelector('.status-row')
  if (statusRow) {
    const spans = statusRow.querySelectorAll('span')
    const label = ascii(spans[0]?.textContent?.trim() || 'Payment:')
    const status = ascii(spans[1]?.textContent?.trim() || '')
    commands.push(formatTwoColumns(label, status) + '\n')
  }
  
  commands.push('------------------------------------------\n')
  
  // Footer: Centered
  commands.push('\x1Ba\x01')
  const thanks = doc.querySelector('.receipt-footer .thanks')?.textContent?.trim()
  if (thanks) commands.push(`\n${ascii(thanks)}\n`)
  
  const footers = doc.querySelectorAll('.receipt-footer div')
  footers.forEach(div => {
    if (!div.classList.contains('thanks') && !div.classList.contains('powered')) {
      const text = div.textContent?.trim()
      if (text) commands.push(`${ascii(text)}\n`)
    }
  })
  
  const powered = doc.querySelector('.receipt-footer .powered')?.textContent?.trim()
  if (powered) commands.push(`${ascii(powered)}\n`)
  
  // Feed and cut
  commands.push('\x0A\x0A\x0A\x0A')   // 4 × LF (paper feed)
  commands.push('\x1B\x64\x04')        // ESC d 4 — feed 4 lines
  commands.push('\x1D\x56\x42\x00')   // GS V B 0 — full cut
  commands.push('\x1B\x69')           // ESC i — instant cut (Xprinter specific)
  
  return commands
}

function fallbackPrint(htmlString: string) {
  const printWindow = window.open('', '_blank', 'width=400,height=600,scrollbars=yes')
  
  if (!printWindow) {
    alert('Please allow pop-ups to print receipts.')
    return
  }
  
  const fallbackHtml = htmlString.replace('<body>', `<body>
      <div class="screen-actions">
        <button class="btn-print" onclick="window.print()">🖨️ Print Receipt (80mm)</button>
        <button class="btn-close" onclick="window.close()">Close</button>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          }, 300);
        };
      </script>`)

  printWindow.document.open()
  printWindow.document.write(fallbackHtml)
  printWindow.document.close()
}

/**
 * Generates receipt HTML string from structured data.
 */
export interface PrintReceiptSection {
  title: string
  items: { name: string; quantity: number; totalPrice: number }[]
  subtotal: number
}

export interface PrintReceiptData {
  title: string
  orderNumber: string
  date: string
  customerName?: string
  roomNumber?: string
  orderType?: string
  items: { name: string; quantity: number; totalPrice: number }[]
  totalAmount: number
  paymentStatus?: string
  sections?: PrintReceiptSection[]
  linkedOrderNumbers?: {
    restaurant?: string
    bar?: string
  }
}

export function buildReceiptHtml(data: PrintReceiptData): string {
  let contentHtml = ''

  if (data.sections && data.sections.length > 0) {
    contentHtml = data.sections
      .map(
        (sec) => `
        <div class="receipt-section">
          <div class="section-title">${sec.title}</div>
          <div class="items-header">
            <span class="col-item">Item</span>
            <span class="col-qty">Qty</span>
            <span class="col-amt">Amount</span>
          </div>
          ${sec.items
            .map(
              (item) => `
              <div class="item-row">
                <span class="col-item">${item.name}</span>
                <span class="col-qty">${item.quantity}</span>
                <span class="col-amt">#${item.totalPrice.toLocaleString()}</span>
              </div>`
            )
            .join('')}
          <div class="section-subtotal">
            <span>${sec.title} Subtotal:</span>
            <span>#${sec.subtotal.toLocaleString()}</span>
          </div>
        </div>
      `
      )
      .join('')
  } else {
    const itemsHtml = data.items
      .map(
        (item) => `
        <div class="item-row">
          <span class="col-item">${item.name}</span>
          <span class="col-qty">${item.quantity}</span>
          <span class="col-amt">#${item.totalPrice.toLocaleString()}</span>
        </div>`
      )
      .join('')

    contentHtml = `
      <div class="items-section">
        <div class="items-header">
          <span class="col-item">Item</span>
          <span class="col-qty">Qty</span>
          <span class="col-amt">Amount</span>
        </div>
        ${itemsHtml}
      </div>
    `
  }

  const metaRows = [
    `<div class="meta-row"><span class="label">Order #:</span><span class="value">#${data.orderNumber}</span></div>`,
    data.linkedOrderNumbers?.restaurant && data.linkedOrderNumbers?.bar
      ? `<div class="meta-row"><span class="label">Ref:</span><span class="value">Kitchen: #${data.linkedOrderNumbers.restaurant} | Bar: #${data.linkedOrderNumbers.bar}</span></div>`
      : '',
    `<div class="meta-row"><span class="label">Date:</span><span class="value">${data.date}</span></div>`,
    data.orderType
      ? `<div class="meta-row"><span class="label">Type:</span><span class="value">${data.orderType}</span></div>`
      : '',
    data.customerName
      ? `<div class="meta-row"><span class="label">Customer:</span><span class="value">${data.customerName}</span></div>`
      : '',
    data.roomNumber
      ? `<div class="meta-row"><span class="label">Room:</span><span class="value">Room ${data.roomNumber}</span></div>`
      : '',
    data.paymentStatus
      ? `<div class="meta-row"><span class="label">Status:</span><span class="value">[${data.paymentStatus}]</span></div>`
      : '',
  ]
    .filter(Boolean)
    .join('')

  return `
    <div class="receipt-header">
      <h2>TUTA SUITES</h2>
      <div class="address">
        3, Assurance CDA Estate, Orimerunmu<br/>
        Mowe-Ibafo, Ogun State<br/>
        Tel: +234 811 182 1899
      </div>
      <div class="title-badge">*** ${data.title} ***</div>
    </div>

    <div class="meta-section">
      ${metaRows}
    </div>

    ${contentHtml}

    <div class="total-section">
      <div class="total-row">
        <span>TOTAL:</span>
        <span>#${data.totalAmount.toLocaleString()}</span>
      </div>
      ${
        data.paymentStatus
          ? `<div class="status-row"><span>Payment:</span><span>${data.paymentStatus}</span></div>`
          : ''
      }
    </div>

    <div class="receipt-footer">
      <div class="thanks">THANK YOU FOR YOUR PATRONAGE!</div>
      <div>Please keep this receipt for your records.</div>
      <div class="powered">Powered by TutaSuites System</div>
    </div>
  `
}
