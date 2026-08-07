/**
 * Opens a new browser popup window containing ONLY the receipt HTML,
 * then triggers window.print() on that isolated window.
 * 
 * This completely avoids the blank-page problem caused by trying to
 * hide complex dashboard DOM with @media print CSS.
 */
export function printReceipt(receiptHtml: string) {
  const printWindow = window.open('', '_blank', 'width=400,height=600,scrollbars=yes')
  
  if (!printWindow) {
    alert('Please allow pop-ups to print receipts.')
    return
  }

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
          margin: 0mm;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          width: 80mm;
          max-width: 80mm;
          margin: 0 auto;
          padding: 4mm;
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          color: #000;
          background: #fff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .receipt-header {
          text-align: center;
          padding-bottom: 8px;
          border-bottom: 1px dashed #999;
          margin-bottom: 8px;
        }
        .receipt-header h2 {
          font-size: 16px;
          font-weight: bold;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .receipt-header .address {
          font-size: 9px;
          color: #555;
          line-height: 1.4;
        }
        .receipt-header .title-badge {
          display: inline-block;
          margin-top: 6px;
          padding: 2px 8px;
          background: #f0f0f0;
          font-weight: bold;
          font-size: 10px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          border-radius: 3px;
        }
        .meta-section {
          padding: 8px 0;
          border-bottom: 1px dashed #999;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          font-size: 11px;
        }
        .meta-row .label {
          color: #666;
        }
        .meta-row .value {
          font-weight: bold;
        }
        .items-section {
          padding: 8px 0;
          border-bottom: 1px dashed #999;
        }
        .items-header {
          display: flex;
          font-weight: bold;
          font-size: 9px;
          text-transform: uppercase;
          color: #666;
          padding-bottom: 4px;
          margin-bottom: 4px;
          border-bottom: 1px solid #ddd;
        }
        .items-header .col-item { flex: 6; }
        .items-header .col-qty { flex: 2; text-align: center; }
        .items-header .col-amt { flex: 4; text-align: right; }
        .item-row {
          display: flex;
          font-size: 11px;
          margin-bottom: 3px;
          line-height: 1.3;
        }
        .item-row .col-item {
          flex: 6;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding-right: 4px;
        }
        .item-row .col-qty { flex: 2; text-align: center; }
        .item-row .col-amt { flex: 4; text-align: right; font-weight: bold; }
        .total-section {
          padding: 8px 0;
          border-top: 2px solid #000;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          font-weight: bold;
        }
        .status-row {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #555;
          text-transform: uppercase;
          margin-top: 4px;
        }
        .receipt-footer {
          text-align: center;
          padding-top: 10px;
          border-top: 1px dashed #999;
          margin-top: 8px;
          font-size: 10px;
          color: #666;
        }
        .receipt-footer .thanks {
          font-weight: bold;
          color: #000;
          margin-bottom: 2px;
        }
        .receipt-footer .powered {
          font-size: 8px;
          color: #aaa;
          margin-top: 6px;
        }
        @media print {
          body {
            width: 80mm;
            padding: 4mm;
          }
          .screen-actions {
            display: none !important;
          }
        }
        .screen-actions {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        .btn-print {
          background: #D4AF37;
          color: #000;
          border: none;
          padding: 6px 14px;
          font-weight: bold;
          font-size: 11px;
          border-radius: 4px;
          cursor: pointer;
          text-transform: uppercase;
        }
        .btn-close {
          background: #333;
          color: #fff;
          border: none;
          padding: 6px 12px;
          font-size: 11px;
          border-radius: 4px;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div class="screen-actions">
        <button class="btn-print" onclick="window.print()">🖨️ Print Receipt (80mm)</button>
        <button class="btn-close" onclick="window.close()">Close</button>
      </div>
      ${receiptHtml}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          }, 300);
        };
      </script>
    </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(fullHtml)
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
        <span class="col-amt">₦${item.totalPrice.toLocaleString()}</span>
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
        Assurance CDA Estate, Orimerunmu<br/>
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
        <span>₦${data.totalAmount.toLocaleString()}</span>
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
