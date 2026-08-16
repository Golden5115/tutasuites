import { printReceipt } from "./print-receipt"

export interface DailySummaryData {
  department: string
  dateLabel: string
  totalRevenue: number
  totalOrders: number
  walkInRevenue: number
  walkInOrdersCount: number
  roomChargeRevenue: number
  roomChargeOrdersCount: number
  itemsSold: { name: string; quantity: number; revenue: number }[]
  topCombos?: { combo: string; count: number }[]
  generatedAt?: string
}

export function buildDailySummaryHtml(data: DailySummaryData): string {
  const generatedTime = data.generatedAt || new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  const itemsHtml = data.itemsSold.length > 0 
    ? data.itemsSold
        .map(
          (item) => `
          <div class="item-row">
            <span class="col-item">${item.name}</span>
            <span class="col-qty">x${item.quantity}</span>
            <span class="col-amt">#${item.revenue.toLocaleString()}</span>
          </div>`
        )
        .join('')
    : '<div style="text-align: center; color: #888; padding: 8px 0;">No items sold in this period</div>'

  const combosHtml = data.topCombos && data.topCombos.length > 0
    ? `
      <div style="padding: 12px 0; border-bottom: 2px dashed #999;">
        <div style="font-weight: bold; font-size: 20px; text-transform: uppercase; color: #333; margin-bottom: 6px;">
          TOP FOOD COMBOS:
        </div>
        ${data.topCombos.slice(0, 5).map(c => `
          <div style="display: flex; justify-content: space-between; font-size: 22px; margin-bottom: 4px;">
            <span style="flex: 8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.combo}</span>
            <span style="flex: 2; text-align: right; font-weight: bold;">(${c.count}x)</span>
          </div>
        `).join('')}
      </div>
    `
    : ''

  return `
    <div class="receipt-header">
      <h2>TUTA SUITES</h2>
      <div class="address">
        3, Assurance CDA Estate, Orimerunmu<br/>
        Mowe-Ibafo, Ogun State<br/>
        Tel: +234 811 182 1899
      </div>
      <div class="title-badge">*** DAILY SALES / SHIFT REPORT ***</div>
    </div>

    <div class="meta-section">
      <div class="meta-row"><span class="label">Department:</span><span class="value">${data.department}</span></div>
      <div class="meta-row"><span class="label">Period:</span><span class="value">${data.dateLabel}</span></div>
      <div class="meta-row"><span class="label">Generated:</span><span class="value">${generatedTime}</span></div>
    </div>

    <div style="padding: 12px 0; border-bottom: 2px dashed #999;">
      <div style="display: flex; justify-content: space-between; font-size: 26px; font-weight: bold; margin-bottom: 8px;">
        <span>TOTAL SALES:</span>
        <span>#${data.totalRevenue.toLocaleString()}</span>
      </div>
      <div class="meta-row"><span class="label">Total Orders:</span><span class="value">${data.totalOrders}</span></div>
      <div class="meta-row"><span class="label">Walk-in Sales:</span><span class="value">#${data.walkInRevenue.toLocaleString()} (${data.walkInOrdersCount})</span></div>
      <div class="meta-row"><span class="label">Room Charges:</span><span class="value">#${data.roomChargeRevenue.toLocaleString()} (${data.roomChargeOrdersCount})</span></div>
    </div>

    <div class="items-section">
      <div class="items-header">
        <span class="col-item">Item Description</span>
        <span class="col-qty">Qty</span>
        <span class="col-amt">Revenue</span>
      </div>
      ${itemsHtml}
    </div>

    ${combosHtml}

    <div class="receipt-footer">
      <div class="thanks">END OF REPORT</div>
      <div>Verified by Staff on Duty</div>
      <div class="powered">Powered by TutaSuites System</div>
    </div>
  `
}

export async function printDailySummary(data: DailySummaryData) {
  const html = buildDailySummaryHtml(data)
  return await printReceipt(html)
}
