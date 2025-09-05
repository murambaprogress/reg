
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Utility to load logo as Base64 (caches after first load)
let logoBase64 = null;
async function getLogoBase64() {
  if (logoBase64) return logoBase64;
  const response = await fetch('/assets/images/Regimark_Logo_page-0001-1752221173479.jpg');
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      logoBase64 = reader.result;
      resolve(logoBase64);
    };
    reader.readAsDataURL(blob);
  });
}


/**
 * Generate and download a PDF financial statement (with logo).
 * @param {Array} data - Array of statement objects.
 * @param {string} title - Title for the PDF.
 * @param {Object} filters - Filters applied (date range, customer, etc).
 */
export async function generateFinancialStatementPDF(data, title = 'Financial Statement', filters = {}) {
  const doc = new jsPDF();

  // System color palette
  const COLORS = {
    primary: '#DC2626', // Regimark Red
    accent: '#DC2626',
    secondary: '#1F2937',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    border: '#E5E7EB',
  };

  // Add logo (centered at top)
  try {
    const logo = await getLogoBase64();
    doc.addImage(logo, 'JPEG', 80, 8, 40, 16);
  } catch (e) {}

  // Title (move down to fit logo)
  doc.setFontSize(18);
  doc.setTextColor(COLORS.primary);
  doc.text(title, 14, 32);
  doc.setTextColor(COLORS.textPrimary);

  // Filters summary
  doc.setFontSize(11);
  let filterText = Object.entries(filters)
    .filter(([k, v]) => v && v !== 'all')
    .map(([k, v]) => `${k[0].toUpperCase() + k.slice(1)}: ${v}`)
    .join('   ');
  if (filterText) {
    doc.setFontSize(10);
    doc.setTextColor(COLORS.textSecondary);
    doc.text(filterText, 14, 40);
    doc.setTextColor(COLORS.textPrimary);
  }

  // Table columns
  // If incoming data is a list of generic statement entries {label, amount}, render a simple statement table.
  const isGenericStatement = data.every(d => d && Object.prototype.hasOwnProperty.call(d, 'label') && Object.prototype.hasOwnProperty.call(d, 'amount'));

  if (isGenericStatement) {
    const cols = ['Description', 'Amount'];
    const rows = data.map(d => [d.label, typeof d.amount === 'number' ? d.amount.toFixed(2) : d.amount]);
    doc.autoTable({
      startY: filterText ? 46 : 40,
      head: [cols],
      body: rows,
      styles: { fontSize: 10, textColor: COLORS.textPrimary, lineColor: COLORS.border, cellPadding: 2.5 },
      headStyles: { fillColor: COLORS.primary, textColor: '#FFFFFF', fontStyle: 'bold', lineColor: COLORS.primary },
    });

    // Totals
    const total = data.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : (filterText ? 46 : 40) + 20;
    doc.setFontSize(11);
    doc.setTextColor(COLORS.textPrimary);
    doc.text(`Total: ${total.toFixed(2)}`, 14, finalY);
    doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
    return;
  }

  // Table columns for invoice-like data
  const columns = [
    { header: 'Date', dataKey: 'date' },
    { header: 'Customer', dataKey: 'customer' },
    { header: 'Invoice #', dataKey: 'invoice' },
    { header: 'Vehicle', dataKey: 'vehicle' },
    { header: 'Service', dataKey: 'service' },
    { header: 'Amount', dataKey: 'amount' },
    { header: 'Status', dataKey: 'status' },
    { header: 'Due Date', dataKey: 'dueDate' },
  ];

  // Table rows
  const rows = data.map(item => ({
    date: item.date,
    customer: item.customer,
    invoice: item.invoice,
    vehicle: item.vehicle,
    service: item.service,
    amount: item.amount,
    status: item.status,
    dueDate: item.dueDate,
  }));

  // Colorful status cell rendering
  function statusCellColor(status) {
    if (!status) return COLORS.textSecondary;
    if (status.toLowerCase().includes('paid')) return COLORS.success;
    if (status.toLowerCase().includes('due')) return COLORS.warning;
    if (status.toLowerCase().includes('overdue') || status.toLowerCase().includes('error')) return COLORS.error;
    return COLORS.primary;
  }

  doc.autoTable({
    startY: filterText ? 46 : 40,
    head: [columns.map(col => col.header)],
    body: rows.map(row => columns.map(col => row[col.dataKey])),
    styles: {
      fontSize: 10,
      textColor: COLORS.textPrimary,
      lineColor: COLORS.border,
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.primaryForeground || '#FFFFFF',
      fontStyle: 'bold',
      lineColor: COLORS.primary,
    },
    alternateRowStyles: { fillColor: COLORS.background },
    bodyStyles: {
      fillColor: COLORS.surface,
    },
    didParseCell: function (data) {
      // Color status cell
      if (data.column.dataKey === 'status' && data.cell.section === 'body') {
        data.cell.styles.textColor = statusCellColor(data.cell.raw);
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
}
