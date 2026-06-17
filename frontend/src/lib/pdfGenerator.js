/**
 * PDF Generator Utility
 * Generates highly stylized, professional print templates for invoices, quotes, payments, and general ledger statement.
 */

import { formatCurrency, formatDate } from './utils';

export function printDocument(type, data) {
  const settingsStr = localStorage.getItem('crm-workspace-settings');
  let workspaceSettings = null;
  if (settingsStr) {
    try {
      workspaceSettings = JSON.parse(settingsStr);
    } catch(e) {}
  }
  
  const activeOrg = localStorage.getItem('auth-tenant-id') || 'rapidmodel_corp';
  const isHk = activeOrg !== 'rapidmodel_corp' && activeOrg !== 'rapidmodel';

  const companyName = workspaceSettings?.company_name || (isHk ? 'HARIKRUSHN DIGIVERSE LLP' : 'RapidModel Corp Private Limited');
  const companyAddress = workspaceSettings?.company_address || (isHk ? 'SURAT, GUJARAT, INDIA' : 'DLF CyberCity, Phase III, Gurugram, Haryana, 122002');
  const companyGstin = workspaceSettings?.company_gstin || (isHk ? '24APQPN3916P1Z4' : '06AAACR9821Q1ZH');
  const companyPan = workspaceSettings?.company_pan || (isHk ? 'ABCDE1234F' : 'XYZ123456');
  const logoUrl = workspaceSettings?.logo_url || '';

  const headerHtml = `
    <div class="header">
      <div class="logo-container">
        \${logoUrl ? \`
          <img src="\${logoUrl.startsWith('/') ? \`\${window.location.origin}\${logoUrl}\` : logoUrl}" style="height: 35px; max-width: 150px; object-fit: contain; margin-bottom: 5px;" />
        \` : \`
          <div class="logo">\${companyName.split(' ')[0]}<span>\${companyName.split(' ').slice(1).join('') || ''}</span></div>
        \`}
        <div style="font-size: 8px; font-weight: 700; color: #64748b; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase;">INTELLIGENT BUSINESS SYSTEMS</div>
      </div>
      <div class="company-info">
        <p style="font-weight: 700; margin: 0; color: #1e1b4b; font-size: 12px;">\${companyName}</p>
        \${companyAddress.split(',').map(part => \`<p style="margin: 2px 0;">\${part.trim()}</p>\`).join('')}
        <p style="margin: 2px 0; font-weight: 600;">GSTIN: \${companyGstin}</p>
        \${companyPan ? \`<p style="margin: 2px 0; font-weight: 600;">PAN: \${companyPan}</p>\` : ''}
      </div>
    </div>
  `;

  const printIframe = document.createElement('iframe');
  printIframe.style.position = 'absolute';
  printIframe.style.top = '-10000px';
  printIframe.style.left = '-10000px';
  document.body.appendChild(printIframe);

  const doc = printIframe.contentDocument || printIframe.contentWindow.document;
  
  let content = '';

  const commonStyles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
      
      * {
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Plus Jakarta Sans', sans-serif;
        color: #334155;
        margin: 0;
        padding: 40px;
        font-size: 13px;
        line-height: 1.6;
        background: #fff;
      }
      
      .brand-bar {
        height: 6px;
        background: linear-gradient(90deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%);
        margin: -40px -40px 40px -40px;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 24px;
        margin-bottom: 30px;
      }
      
      .logo-container {
        display: flex;
        flex-direction: column;
      }
      
      .logo {
        font-family: 'Outfit', sans-serif;
        font-size: 24px;
        font-weight: 800;
        color: #1e1b4b;
        letter-spacing: -0.5px;
        line-height: 1;
      }
      
      .logo span {
        color: #4f46e5;
      }
      
      .company-info {
        text-align: right;
        font-size: 11px;
        color: #64748b;
        line-height: 1.5;
      }
      
      .title-section {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 35px;
      }
      
      .doc-title {
        font-family: 'Outfit', sans-serif;
        font-size: 28px;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .doc-id {
        font-size: 13px;
        font-weight: 600;
        color: #64748b;
        margin: 5px 0 0 0;
      }
      
      .doc-id span {
        color: #4f46e5;
        font-weight: 750;
      }
      
      .details-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 24px;
        margin-bottom: 35px;
      }
      
      .details-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 18px;
      }
      
      .details-box h3 {
        margin: 0 0 10px 0;
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        color: #4f46e5;
        letter-spacing: 1px;
      }
      
      .details-box p {
        margin: 4px 0;
        font-size: 12px;
        color: #475569;
      }
      
      .details-box .primary-text {
        font-size: 14px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 6px;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 30px;
      }
      
      th {
        background: #f8fafc;
        color: #475569;
        font-weight: 700;
        text-transform: uppercase;
        font-size: 10px;
        letter-spacing: 0.5px;
        padding: 12px 14px;
        text-align: left;
        border-top: 1px solid #e2e8f0;
        border-bottom: 2px solid #e2e8f0;
      }
      
      td {
        padding: 12px 14px;
        border-bottom: 1px solid #f1f5f9;
        color: #334155;
        font-size: 12px;
      }
      
      tr:last-child td {
        border-bottom: 1px solid #e2e8f0;
      }
      
      .text-right {
        text-align: right;
      }
      
      .summary-section {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
        page-break-inside: avoid;
      }
      
      .summary-table {
        width: 320px;
        margin-bottom: 0;
      }
      
      .summary-table td {
        padding: 6px 14px;
        border: none;
        font-size: 12px;
      }
      
      .summary-table tr.total td {
        font-family: 'Outfit', sans-serif;
        font-weight: 800;
        font-size: 18px;
        color: #1e1b4b;
        border-top: 2px double #e2e8f0;
        padding-top: 10px;
      }
      
      .summary-table tr.total .total-amount {
        color: #4f46e5;
      }
      
      .bottom-notes-grid {
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 30px;
        margin-top: 40px;
        page-break-inside: avoid;
      }
      
      .notes-section {
        border-top: 1px solid #e2e8f0;
        padding-top: 15px;
      }
      
      .notes-section h4 {
        margin: 0 0 8px 0;
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        color: #4f46e5;
        letter-spacing: 0.5px;
      }
      
      .notes-section p {
        margin: 0;
        color: #64748b;
        font-size: 11px;
        line-height: 1.5;
      }
      
      .signature-section {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        justify-content: flex-end;
        padding-top: 15px;
      }
      
      .signature-line {
        width: 180px;
        border-bottom: 1px solid #cbd5e1;
        margin-bottom: 8px;
      }
      
      .signature-label {
        font-size: 10px;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        text-align: center;
        width: 180px;
      }
      
      .status-badge {
        display: inline-block;
        padding: 5px 12px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .status-paid {
        background: #f0fdf4;
        color: #16a34a;
        border: 1px solid #bbf7d0;
      }
      
      .status-pending {
        background: #fffbeb;
        color: #d97706;
        border: 1px solid #fef3c7;
      }
      
      .status-overdue {
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
      }
      
      .footer {
        margin-top: 60px;
        text-align: center;
        font-size: 10px;
        color: #94a3b8;
        border-top: 1px solid #f1f5f9;
        padding-top: 15px;
        page-break-inside: avoid;
      }
      
      @media print {
        body {
          padding: 20px;
        }
        .brand-bar {
          margin: -20px -20px 20px -20px;
        }
      }
    </style>
  `;

  if (type === 'invoice') {
    content = `
      <html>
        <head>
          <title>Invoice ${data.id}</title>
          ${commonStyles}
        </head>
        <body>
          <div class="brand-bar"></div>
          \${headerHtml}

          <div class="title-section">
            <div>
              <h1 class="doc-title">Tax Invoice</h1>
              <p class="doc-id">Invoice Number: <span>${data.id}</span></p>
            </div>
            <div>
              <div class="status-badge ${
                data.status === 'Paid' ? 'status-paid' :
                data.status === 'Overdue' ? 'status-overdue' : 'status-pending'
              }">${data.status}</div>
            </div>
          </div>

          <div class="details-grid">
            <div class="details-box">
              <h3>Billed To</h3>
              <p class="primary-text">${data.client}</p>
              <p style="margin-bottom: 2px;">${data.email || 'billing@client.com'}</p>
              <p>Corporate Tax Client</p>
            </div>
            <div class="details-box">
              <h3>Invoice Details</h3>
              <p><strong>Filing Date:</strong> ${formatDate(data.date)}</p>
              <p><strong>Due Date:</strong> ${formatDate(data.dueDate)}</p>
              <p><strong>Settlement:</strong> ${data.paymentMethod || 'UPI'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50%;">Description / Scope of Service</th>
                <th style="width: 15%;">HSN/SAC</th>
                <th style="width: 10%;" class="text-right">Qty</th>
                <th style="width: 12.5%;" class="text-right">Rate</th>
                <th style="width: 12.5%;" class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${(data.items || []).map(item => `
                <tr>
                  <td><strong style="color: #1e1b4b;">${item.desc}</strong></td>
                  <td>${item.hsn || '998314'}</td>
                  <td class="text-right">${item.qty}</td>
                  <td class="text-right">${formatCurrency(item.rate)}</td>
                  <td class="text-right">${formatCurrency(item.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary-section">
            <table class="summary-table">
              <tr>
                <td style="color: #64748b;">Subtotal</td>
                <td class="text-right" style="font-weight: 600;">${formatCurrency(data.subtotal)}</td>
              </tr>
              ${data.discount > 0 ? `
                <tr style="color: #16a34a;">
                  <td>Special Rebate/Discount</td>
                  <td class="text-right">-${formatCurrency(data.discount)}</td>
                </tr>
              ` : ''}
              <tr>
                <td style="color: #64748b;">CGST (9%)</td>
                <td class="text-right">${formatCurrency(data.cgst)}</td>
              </tr>
              <tr>
                <td style="color: #64748b;">SGST (9%)</td>
                <td class="text-right">${formatCurrency(data.sgst)}</td>
              </tr>
              <tr class="total">
                <td>Grand Total (INR)</td>
                <td class="text-right total-amount">${formatCurrency(data.total)}</td>
              </tr>
            </table>
          </div>

          <div class="bottom-notes-grid">
            <div class="notes-section">
              <h4>Terms & Payment Information</h4>
              <p style="margin-bottom: 6px;">1. Please reference the Invoice Number in bank transfer descriptions.</p>
              <p>2. Payments are due within the periods specified. Standard terms and conditions apply.</p>
              ${data.notes ? `<p style="margin-top: 10px; font-style: italic;">Remarks: ${data.notes}</p>` : ''}
            </div>
            <div class="signature-section">
              <div class="signature-line"></div>
              <div class="signature-label">Authorized Signatory</div>
            </div>
          </div>

          <div class="footer">
            <p>For support or billing queries, email account-receivables@rapidmodel.com</p>
            <p style="margin-top: 4px; font-weight: 500;">RapidModel Corp Private Limited - Automated Billing Receipt</p>
          </div>
        </body>
      </html>
    `;
  } else if (type === 'quote') {
    content = `
      <html>
        <head>
          <title>Quotation ${data.id}</title>
          ${commonStyles}
        </head>
        <body>
          <div class="brand-bar"></div>
          \${headerHtml}

          <div class="title-section">
            <div>
              <h1 class="doc-title">Commercial Quotation</h1>
              <p class="doc-id">Reference ID: <span>${data.id}</span></p>
            </div>
            <div>
              <div class="status-badge ${
                data.status === 'Accepted' ? 'status-paid' :
                data.status === 'Declined' ? 'status-overdue' : 'status-pending'
              }">${data.status}</div>
            </div>
          </div>

          <div class="details-grid">
            <div class="details-box">
              <h3>Prepared For</h3>
              <p class="primary-text">${data.client}</p>
              <p>Corporate Enterprise Account</p>
            </div>
            <div class="details-box">
              <h3>Validity & Details</h3>
              <p><strong>Proposal Date:</strong> ${formatDate(data.date)}</p>
              <p><strong>Valid Until:</strong> ${formatDate(data.validUntil)}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 55%;">Product / Service Scope</th>
                <th style="width: 15%;" class="text-right">Qty</th>
                <th style="width: 15%;" class="text-right">Unit Rate</th>
                <th style="width: 15%;" class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong style="color: #1e1b4b;">${data.productName}</strong></td>
                <td class="text-right">${data.quantity}</td>
                <td class="text-right">${formatCurrency(data.price)}</td>
                <td class="text-right">${formatCurrency(data.quantity * data.price)}</td>
              </tr>
            </tbody>
          </table>

          <div class="summary-section">
            <table class="summary-table">
              <tr>
                <td style="color: #64748b;">Subtotal</td>
                <td class="text-right" style="font-weight: 600;">${formatCurrency(data.quantity * data.price)}</td>
              </tr>
              ${data.discount > 0 ? `
                <tr style="color: #16a34a;">
                  <td>Special Discount Offer</td>
                  <td class="text-right">-${formatCurrency(data.discount)}</td>
                </tr>
              ` : ''}
              <tr>
                <td style="color: #64748b;">Estimated GST/Tax</td>
                <td class="text-right">${formatCurrency(data.tax)}</td>
              </tr>
              <tr class="total">
                <td>Total Estimate (INR)</td>
                <td class="text-right total-amount">${formatCurrency(data.total)}</td>
              </tr>
            </table>
          </div>

          <div class="bottom-notes-grid">
            <div class="notes-section">
              <h4>Terms & Conditions</h4>
              <p style="margin-bottom: 6px;">1. Pricing is valid only until the date listed above.</p>
              <p>2. Acceptance of proposal triggers drafting of Master Service Agreement (MSA).</p>
              ${data.notes ? `<p style="margin-top: 10px; font-style: italic;">Remarks: ${data.notes}</p>` : ''}
            </div>
            <div class="signature-section">
              <div class="signature-line"></div>
              <div class="signature-label">Business Development</div>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for choosing RapidModel. For scope revisions, contact sales@rapidmodel.com</p>
          </div>
        </body>
      </html>
    `;
  } else if (type === 'payment') {
    content = `
      <html>
        <head>
          <title>Payment Receipt ${data.id}</title>
          ${commonStyles}
        </head>
        <body>
          <div class="brand-bar"></div>
          ${headerHtml}

          <div class="title-section">
            <div>
              <h1 class="doc-title">Payment Receipt</h1>
              <p class="doc-id">Transaction ID: <span>${data.id}</span></p>
            </div>
            <div>
              <div class="status-badge ${
                data.status === 'Completed' ? 'status-paid' :
                data.status === 'Failed' ? 'status-overdue' : 'status-pending'
              }">${data.status}</div>
            </div>
          </div>

          <div class="details-grid" style="margin-bottom: 25px;">
            <div class="details-box">
              <h3>Received From</h3>
              <p class="primary-text">${data.client}</p>
              <p><strong>Settled Invoice:</strong> ${data.invoiceId}</p>
            </div>
            <div class="details-box">
              <h3>Gateway Details</h3>
              <p><strong>Payment Date:</strong> ${formatDate(data.date)}</p>
              <p><strong>Method:</strong> ${data.method}</p>
              <p><strong>Reference:</strong> ${data.reference || 'N/A'}</p>
            </div>
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 25px; text-align: center; margin-bottom: 35px;">
            <p style="margin: 0; font-size: 10px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 1.5px;">Acknowledged Amount Received</p>
            <h2 style="margin: 8px 0 0 0; font-size: 34px; font-family: 'Outfit', sans-serif; font-weight: 800; color: #1e1b4b;">${formatCurrency(data.amount)}</h2>
            <p style="margin: 6px 0 0 0; font-size: 11px; color: #64748b;">Transaction successfully captured & reconciled</p>
          </div>

          <div class="bottom-notes-grid">
            <div class="notes-section">
              <h4>System Verification</h4>
              <p>This payment voucher acknowledges receipt of funds to RapidModel Corp accounts. Reconciled successfully with double-entry general ledger books.</p>
              ${data.remarks ? `<p style="margin-top: 10px; font-style: italic;">Remarks: ${data.remarks}</p>` : ''}
            </div>
            <div class="signature-section">
              <div class="signature-line"></div>
              <div class="signature-label">Finance Officer</div>
            </div>
          </div>

          <div class="footer">
            <p>This is a system-generated transaction acknowledgment receipt - No manual signature required.</p>
          </div>
        </body>
      </html>
    `;
  } else if (type === 'ledger') {
    const entries = Array.isArray(data) ? data : [];
    const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);
    const finalBalance = entries.length > 0 ? entries[0].balance : 0;

    content = `
      <html>
        <head>
          <title>General Ledger Statement</title>
          ${commonStyles}
        </head>
        <body>
          <div class="brand-bar"></div>
          ${headerHtml}

          <div class="title-section">
            <div>
              <h1 class="doc-title">General Ledger Statement</h1>
              <p class="doc-id">Financial Statement: <span>FY 2026-2027</span></p>
            </div>
          </div>

          <div class="details-grid" style="margin-bottom: 25px;">
            <div class="details-box" style="padding: 15px;">
              <h3>Total Debits (Outflows)</h3>
              <p class="primary-text" style="color: #dc2626; font-size: 20px; font-weight: 800; font-family: 'Outfit', sans-serif;">${formatCurrency(totalDebit)}</p>
            </div>
            <div class="details-box" style="padding: 15px;">
              <h3>Total Credits (Inflows)</h3>
              <p class="primary-text" style="color: #16a34a; font-size: 20px; font-weight: 800; font-family: 'Outfit', sans-serif;">${formatCurrency(totalCredit)}</p>
            </div>
          </div>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 20px; font-weight: 700; display: flex; justify-content: space-between; margin-bottom: 25px; font-size: 13px;">
            <span style="color: #64748b;">Current Closing Book Balance:</span>
            <span style="color: #4f46e5; font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 800;">${formatCurrency(finalBalance)}</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Date</th>
                <th style="width: 15%;">Voucher ID</th>
                <th style="width: 40%;">Description / Reference</th>
                <th style="width: 10%;" class="text-right">Debit</th>
                <th style="width: 10%;" class="text-right">Credit</th>
                <th style="width: 10%;" class="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              ${entries.map(e => `
                <tr>
                  <td>${formatDate(e.date)}</td>
                  <td><strong style="color: #4f46e5;">${e.id}</strong></td>
                  <td>${e.description}</td>
                  <td class="text-right" style="color: ${e.debit > 0 ? '#dc2626' : '#94a3b8'}; font-weight: ${e.debit > 0 ? '600' : '400'};">${e.debit > 0 ? formatCurrency(e.debit) : '-'}</td>
                  <td class="text-right" style="color: ${e.credit > 0 ? '#16a34a' : '#94a3b8'}; font-weight: ${e.credit > 0 ? '600' : '400'};">${e.credit > 0 ? formatCurrency(e.credit) : '-'}</td>
                  <td class="text-right" style="font-weight: 700; color: #1e1b4b;">${formatCurrency(e.balance)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="bottom-notes-grid" style="margin-top: 30px;">
            <div class="notes-section">
              <h4>Statement Audit Verification</h4>
              <p>This statement of accounts reflects all transactions tracked within the RapidModel billing sub-ledger. Generated dynamically from live general ledger double-entry tables.</p>
            </div>
            <div class="signature-section">
              <div class="signature-line"></div>
              <div class="signature-label">Auditing Controller</div>
            </div>
          </div>

          <div class="footer">
            <p>RapidModel Corp Bookkeeping Systems • Statement generated on ${new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </body>
      </html>
    `;
  }

  doc.open();
  doc.write(content);
  doc.close();

  // Print once the frame loads
  printIframe.onload = () => {
    printIframe.contentWindow.focus();
    printIframe.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(printIframe);
    }, 1000);
  };
}
