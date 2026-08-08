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
          margin: 0;
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

  try {
    // Dynamically import qz-tray to avoid SSR issues
    const qz = await import('qz-tray')
    
    // Set up security certificate & signature verification
    qz.default.security.setCertificatePromise((resolve: (cert: string) => void, reject: (reason: any) => void) => {
      fetch('/api/qz/certificate')
        .then((res) => res.text())
        .then(resolve)
        .catch(reject)
    })

    qz.default.security.setSignaturePromise((toSign: string) => {
      return (resolve: (sig: string) => void, reject: (reason: any) => void) => {
        fetch(`/api/qz/sign?toSign=${encodeURIComponent(toSign)}`)
          .then((res) => res.text())
          .then(resolve)
          .catch(reject)
      }
    })

    // Connect to QZ Tray if not already active
    if (!qz.default.websocket.isActive()) {
      await qz.default.websocket.connect()
    }
    
    // Find the default printer
    const printerName = await qz.default.printers.getDefault()
    const config = qz.default.configs.create(printerName)
    
    // Clean currency symbols for printer compatibility (# instead of ₦)
    const sanitizedHtml = fullHtml.replaceAll('₦', '#')
    
    // Convert HTML structure to native ESC/POS commands for thermal printer
    const escposCommands = convertHtmlToEscPos(sanitizedHtml)
    
    // Resize logo to compact size (110px) on client canvas
    const logoBase64 = await getResizedLogoBase64(110)
    
    const printData: any[] = [
      '\x1B@',     // Reset printer
      '\x1Ba\x01', // Center alignment
    ]

    if (logoBase64) {
      printData.push({
        type: 'image',
        format: 'base64',
        data: logoBase64,
        options: {
          language: 'ESCPOS'
        }
      })
      printData.push('\x1Ba\x01') // Keep centered after image
    }

    // Append the text commands (skipping initial reset & align)
    printData.push(...escposCommands.slice(2))
    
    await qz.default.print(config, printData)
  } catch (err: unknown) {
    console.error("QZ Tray Error:", err)
    
    // Fallback to window.print if QZ Tray fails or isn't running
    fallbackPrint(fullHtml)
  }
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
  
  // Reset printer
  commands.push('\x1B@')
  
  // Header: Centered
  commands.push('\x1Ba\x01')
  
  // Title: Double height & double width
  const title = doc.querySelector('.receipt-header h2')?.textContent?.trim() || 'TUTA SUITES'
  commands.push('\x1B!\x30')
  commands.push(`${title}\n`)
  commands.push('\x1B!\x00')
  
  // Address
  const addressText = doc.querySelector('.receipt-header .address')?.textContent?.trim() || ''
  if (addressText) {
    const lines = addressText.split('\n').map(l => l.trim()).filter(Boolean)
    lines.forEach(l => commands.push(`${l}\n`))
  }
  
  // Badge
  const badge = doc.querySelector('.title-badge')?.textContent?.trim()
  if (badge) {
    commands.push(`\n${badge}\n`)
  }
  
  commands.push('\n------------------------------------------\n')
  
  // Meta Section: Left aligned
  commands.push('\x1Ba\x00')
  const metaRows = doc.querySelectorAll('.meta-row')
  metaRows.forEach(row => {
    const label = row.querySelector('.label')?.textContent?.trim() || ''
    const value = row.querySelector('.value')?.textContent?.trim() || ''
    if (label || value) {
      commands.push(formatTwoColumns(label, value) + '\n')
    }
  })
  
  commands.push('------------------------------------------\n')
  
  // Items Header: Bold
  commands.push('\x1BE\x01')
  commands.push(formatThreeColumns('Item', 'Qty', 'Amount') + '\n')
  commands.push('\x1BE\x00')
  commands.push('------------------------------------------\n')
  
  // Item Rows
  const itemRows = doc.querySelectorAll('.item-row')
  itemRows.forEach(row => {
    const name = row.querySelector('.col-item')?.textContent?.trim() || ''
    const qty = row.querySelector('.col-qty')?.textContent?.trim() || ''
    const amt = row.querySelector('.col-amt')?.textContent?.trim() || ''
    commands.push(formatThreeColumns(name, qty, amt) + '\n')
  })
  
  commands.push('------------------------------------------\n')
  
  // Total Section
  const totalRow = doc.querySelector('.total-row')
  if (totalRow) {
    const spans = totalRow.querySelectorAll('span')
    const label = spans[0]?.textContent?.trim() || 'TOTAL:'
    const amt = spans[1]?.textContent?.trim() || ''
    commands.push('\x1BE\x01')
    commands.push(formatTwoColumns(label, amt) + '\n')
    commands.push('\x1BE\x00')
  }
  
  const statusRow = doc.querySelector('.status-row')
  if (statusRow) {
    const spans = statusRow.querySelectorAll('span')
    const label = spans[0]?.textContent?.trim() || 'Payment:'
    const status = spans[1]?.textContent?.trim() || ''
    commands.push(formatTwoColumns(label, status) + '\n')
  }
  
  commands.push('------------------------------------------\n')
  
  // Footer: Centered
  commands.push('\x1Ba\x01')
  const thanks = doc.querySelector('.receipt-footer .thanks')?.textContent?.trim()
  if (thanks) commands.push(`\n${thanks}\n`)
  
  const footers = doc.querySelectorAll('.receipt-footer div')
  footers.forEach(div => {
    if (!div.classList.contains('thanks') && !div.classList.contains('powered')) {
      const text = div.textContent?.trim()
      if (text) commands.push(`${text}\n`)
    }
  })
  
  const powered = doc.querySelector('.receipt-footer .powered')?.textContent?.trim()
  if (powered) commands.push(`${powered}\n`)
  
  // Feed lines & cut
  commands.push('\n\n\n\n')
  commands.push('\x1DV\x41\x03')
  
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
}

export function buildReceiptHtml(data: PrintReceiptData): string {
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

  const metaRows = [
    `<div class="meta-row"><span class="label">Order #:</span><span class="value">#${data.orderNumber}</span></div>`,
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

    <div class="items-section">
      <div class="items-header">
        <span class="col-item">Item</span>
        <span class="col-qty">Qty</span>
        <span class="col-amt">Amount</span>
      </div>
      ${itemsHtml}
    </div>

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
