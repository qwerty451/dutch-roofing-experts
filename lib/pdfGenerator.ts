// Client-side only — no fs, no path, no Node.js APIs.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { UserOptions, CellDef } from 'jspdf-autotable';
import type { QuoteData, LineItem } from '../types/tool';
import { translations, type Language } from './quoteTranslations';

// ---------------------------------------------------------------------------
// jsPDF does not expose its internal type — use the public constructor type.
// ---------------------------------------------------------------------------
type JsPDFDoc = InstanceType<typeof jsPDF>;

// ---------------------------------------------------------------------------
// Color constants
// ---------------------------------------------------------------------------
const COLOR_DARK = '#111111';
const COLOR_RED = '#cc0000';
const COLOR_GOLD = '#d4af37';
const COLOR_LIGHT_GRAY = '#f5f5f5';
const COLOR_WHITE = '#ffffff';
const COLOR_TEXT_DARK = '#1a1a1a';
const COLOR_GRAY_MID = '#666666';

// A4 dimensions in mm
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_L = 14;
const MARGIN_R = 14;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

function setFillHex(doc: JsPDFDoc, hex: string): void {
  const [r, g, b] = hexToRgb(hex);
  doc.setFillColor(r, g, b);
}

function setTextHex(doc: JsPDFDoc, hex: string): void {
  const [r, g, b] = hexToRgb(hex);
  doc.setTextColor(r, g, b);
}

function setDrawHex(doc: JsPDFDoc, hex: string): void {
  const [r, g, b] = hexToRgb(hex);
  doc.setDrawColor(r, g, b);
}

/**
 * Format a number as Dutch currency: €1.234,56
 */
function formatCurrency(amount: number): string {
  return '€ ' + amount.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Format date as DD-MM-YYYY (default) or localised per language.
 */
function formatDate(date: Date, language: Language): string {
  if (language === 'en') {
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
  }
  if (language === 'es') {
    return date.toLocaleDateString('es-ES'); // DD/MM/YYYY
  }
  // nl: DD-MM-YYYY
  return date.toLocaleDateString('nl-NL');
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Load company logo as base64 data URL.
 * Returns null if loading fails (graceful degradation).
 */
async function loadLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch('/uploads/logo.png');
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Resolve the localised description for a LineItem.
 * Falls back to NL if the requested language is not available.
 */
function resolveDescription(item: LineItem, language: Language): string {
  return item.description[language] || item.description.nl || '';
}

// ---------------------------------------------------------------------------
// Section drawing helpers
// ---------------------------------------------------------------------------

/**
 * Draw the dark header bar with logo (optional) and company info.
 * Returns the Y position immediately below the header.
 */
function drawHeader(doc: JsPDFDoc, logoBase64: string | null, lang: Language): number {
  const t = translations[lang];
  const headerH = 35;

  // Dark background
  setFillHex(doc, COLOR_DARK);
  doc.rect(0, 0, PAGE_W, headerH, 'F');

  // Logo (if loaded)
  const logoX = MARGIN_L;
  const logoY = 4;
  const logoH = 27;
  const logoW = 27;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoW, logoH);
    } catch {
      // Silently ignore logo rendering errors
    }
  }

  // Company info — right-aligned block
  const infoX = PAGE_W - MARGIN_R;
  let infoY = 9;

  // Company name — bold white
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  setTextHex(doc, COLOR_WHITE);
  doc.text(t.companyName, infoX, infoY, { align: 'right' });

  // Contact lines — smaller gray
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setTextHex(doc, '#cccccc');
  infoY += 6;
  doc.text(t.companyPhone, infoX, infoY, { align: 'right' });
  infoY += 5;
  doc.text(t.companyEmail, infoX, infoY, { align: 'right' });
  infoY += 5;
  doc.text(t.companyLocation, infoX, infoY, { align: 'right' });

  return headerH + 4; // small gap below header
}

/**
 * Draw the quote info block (title, number, dates).
 * Returns the Y position immediately below this block.
 */
function drawQuoteInfo(
  doc: JsPDFDoc,
  quoteId: string,
  today: Date,
  language: Language,
  y: number,
): number {
  const t = translations[language];
  const blockH = 22;
  const rightX = PAGE_W - MARGIN_R;

  // Light separator line at top
  setDrawHex(doc, '#333333');
  doc.setLineWidth(0.3);
  doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);

  y += 12;

  // Title: OFFERTE / QUOTATION / PRESUPUESTO — big red text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  setTextHex(doc, COLOR_RED);
  doc.text(t.offerteTitle, MARGIN_L, y);

  // Quote number — right side (aligned with top of OFFERTE letters)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setTextHex(doc, COLOR_TEXT_DARK);
  doc.text(`${t.quoteNumber}: ${quoteId}`, rightX, y - 6, { align: 'right' });

  const validUntil = addDays(today, 14);
  doc.text(`${t.date}: ${formatDate(today, language)}`, rightX, y - 1, { align: 'right' });
  doc.text(
    `${t.validUntil}: ${formatDate(validUntil, language)} ${t.validDays}`,
    rightX,
    y + 4,
    { align: 'right' },
  );

  return y + blockH - 10;
}

/**
 * Draw the customer block.
 * Returns the Y position immediately below.
 */
function drawCustomerBlock(doc: JsPDFDoc, quoteData: QuoteData, language: Language, y: number): number {
  const t = translations[language];
  const { customer } = quoteData;

  // Light horizontal rule
  setDrawHex(doc, '#dddddd');
  doc.setLineWidth(0.3);
  doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);

  y += 6;

  // Section label in gold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setTextHex(doc, COLOR_GOLD);
  doc.text(`${t.customer}:`, MARGIN_L, y);

  y += 5;

  // Customer details in dark text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setTextHex(doc, COLOR_TEXT_DARK);

  if (customer.naam) {
    doc.text(customer.naam, MARGIN_L, y);
    y += 4.5;
  }
  if (customer.adres) {
    doc.text(customer.adres, MARGIN_L, y);
    y += 4.5;
  }
  if (customer.postcode || customer.stad) {
    doc.text(`${customer.postcode} ${customer.stad}`.trim(), MARGIN_L, y);
    y += 4.5;
  }

  // Phone and email on the same line if both present
  const contactParts: string[] = [];
  if (customer.telefoon) contactParts.push(customer.telefoon);
  if (customer.email) contactParts.push(customer.email);
  if (contactParts.length > 0) {
    doc.text(contactParts.join('   '), MARGIN_L, y);
    y += 4.5;
  }

  return y + 3;
}

/**
 * Draw the line items table using autoTable.
 * Returns the Y position immediately below the table.
 */
function drawItemsTable(
  doc: JsPDFDoc,
  items: LineItem[],
  language: Language,
  y: number,
): number {
  const t = translations[language];

  const [headR, headG, headB] = hexToRgb(COLOR_GOLD);
  const [altR, altG, altB] = hexToRgb(COLOR_LIGHT_GRAY);

  const tableBody: CellDef[][] = items.map((item) => [
    { content: resolveDescription(item, language) },
    { content: item.unit, styles: { halign: 'center' } },
    { content: item.quantity.toString(), styles: { halign: 'right' } },
    { content: formatCurrency(item.unitPrice), styles: { halign: 'right' } },
    { content: formatCurrency(item.total), styles: { halign: 'right' } },
  ]);

  const options: UserOptions = {
    startY: y,
    margin: { left: MARGIN_L, right: MARGIN_R },
    theme: 'plain',
    head: [
      [
        { content: t.description },
        { content: t.unit, styles: { halign: 'center' } },
        { content: t.quantity, styles: { halign: 'right' } },
        { content: t.unitPrice, styles: { halign: 'right' } },
        { content: t.total, styles: { halign: 'right' } },
      ],
    ],
    body: tableBody,
    headStyles: {
      fillColor: [headR, headG, headB],
      textColor: [20, 20, 20],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8.5,
      cellPadding: 3,
      textColor: hexToRgb(COLOR_TEXT_DARK),
    },
    alternateRowStyles: {
      fillColor: [altR, altG, altB],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },   // Description — takes remaining width
      1: { cellWidth: 20 },       // Unit
      2: { cellWidth: 16 },       // Qty
      3: { cellWidth: 28 },       // Unit price
      4: { cellWidth: 30 },       // Total
    },
    tableLineColor: [220, 220, 220],
    tableLineWidth: 0.2,
  };

  autoTable(doc, options);

  // autoTable exposes lastAutoTable on the doc instance via plugin augmentation
  const docWithTable = doc as JsPDFDoc & { lastAutoTable: { finalY: number } };
  return (docWithTable.lastAutoTable?.finalY ?? y + 20) + 4;
}

/**
 * Draw the totals block (subtotal, VAT, discount, grand total).
 * Returns the Y position immediately below.
 */
function drawTotals(doc: JsPDFDoc, quoteData: QuoteData, language: Language, y: number): number {
  const t = translations[language];
  const { items, discount } = quoteData;

  // Calculate totals from items
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const vatAmount = items.reduce((sum, item) => sum + item.total * item.vatRate, 0);
  const discountAmount = subtotal * discount;
  const grandTotal = subtotal + vatAmount - discountAmount;

  const rightX = PAGE_W - MARGIN_R;
  const labelX = PAGE_W - MARGIN_R - 75;
  const lineH = 6;

  // Thin separator
  setDrawHex(doc, '#dddddd');
  doc.setLineWidth(0.3);
  doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);
  y += 5;

  // Helper: draw a single totals row
  const drawRow = (label: string, amount: string, bold: boolean, labelColor: string, amountColor: string) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 10 : 9);
    setTextHex(doc, labelColor);
    doc.text(label, labelX, y);
    setTextHex(doc, amountColor);
    doc.text(amount, rightX, y, { align: 'right' });
    y += lineH;
  };

  drawRow(t.subtotal, formatCurrency(subtotal), false, COLOR_GRAY_MID, COLOR_TEXT_DARK);
  drawRow(t.vat, formatCurrency(vatAmount), false, COLOR_GRAY_MID, COLOR_TEXT_DARK);

  if (discount > 0) {
    const discountLabel = `${t.discount} (${Math.round(discount * 100)}%)`;
    drawRow(discountLabel, `- ${formatCurrency(discountAmount)}`, false, COLOR_RED, COLOR_RED);
  }

  // Separator before grand total
  setDrawHex(doc, COLOR_GOLD);
  doc.setLineWidth(0.5);
  doc.line(labelX, y - 1, PAGE_W - MARGIN_R, y - 1);
  y += 2;

  // Grand total row — gold accent left bar
  setFillHex(doc, COLOR_GOLD);
  doc.rect(MARGIN_L, y - 5, 3, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setTextHex(doc, COLOR_GOLD);
  doc.text(t.totalIncVat, labelX, y);
  doc.text(formatCurrency(grandTotal), rightX, y, { align: 'right' });
  y += lineH + 3;

  return y;
}

/**
 * Draw the payment terms block.
 * Returns the Y position immediately below.
 */
function drawPaymentTerms(doc: JsPDFDoc, paymentTerms: string, language: Language, y: number): number {
  const t = translations[language];

  // Separator
  setDrawHex(doc, '#dddddd');
  doc.setLineWidth(0.3);
  doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);
  y += 6;

  // Label in gold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setTextHex(doc, COLOR_GOLD);
  doc.text(`${t.paymentTerms}:`, MARGIN_L, y);
  y += 5;

  // Terms text — wrap to content width
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setTextHex(doc, COLOR_TEXT_DARK);

  const lines = doc.splitTextToSize(paymentTerms, CONTENT_W);
  doc.text(lines as string[], MARGIN_L, y);
  y += (lines as string[]).length * 4.5 + 3;

  return y;
}

/**
 * Draw the two-column signature block at the bottom.
 * Returns the Y position immediately below.
 */
function drawSignatureBlock(doc: JsPDFDoc, language: Language, y: number): number {
  const t = translations[language];

  // Separator
  setDrawHex(doc, '#dddddd');
  doc.setLineWidth(0.3);
  doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);
  y += 8;

  const colW = CONTENT_W / 2 - 5;
  const col1X = MARGIN_L;
  const col2X = MARGIN_L + colW + 10;
  const signLineLen = colW - 5;

  // Column labels in gold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setTextHex(doc, COLOR_GOLD);
  doc.text(`${t.signatureCustomer}:`, col1X, y);
  doc.text(`${t.signatureCompany}:`, col2X, y);
  y += 14;

  // Signature lines
  setDrawHex(doc, '#555555');
  doc.setLineWidth(0.4);
  doc.line(col1X, y, col1X + signLineLen, y);
  doc.line(col2X, y, col2X + signLineLen, y);
  y += 6;

  // "Datum: ___" under customer, company name under company
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setTextHex(doc, COLOR_GRAY_MID);
  doc.text(`${t.dateLabel}: ___________________`, col1X, y);
  doc.text(t.companyName, col2X, y);

  y += 6;
  return y;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Generate a PDF quote document client-side using jsPDF + jspdf-autotable.
 *
 * @param quoteData  Full quote data (customer, items, discount, payment terms, etc.)
 * @param quoteId    Human-readable quote identifier, e.g. "DRE-2026-001"
 * @param language   Output language: 'nl' | 'en' | 'es'
 * @returns          A Blob with MIME type application/pdf
 */
export async function generatePDF(
  quoteData: QuoteData,
  quoteId: string,
  language: Language,
): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const today = new Date();

  // Load logo (non-blocking, graceful on failure)
  const logoBase64 = await loadLogoBase64();

  // --- Header ---
  let y = drawHeader(doc, logoBase64, language);

  // --- Quote info ---
  y = drawQuoteInfo(doc, quoteId, today, language, y);

  // --- Customer block ---
  y = drawCustomerBlock(doc, quoteData, language, y);

  // --- Line items table ---
  y = drawItemsTable(doc, quoteData.items, language, y);

  // --- Totals ---
  y = drawTotals(doc, quoteData, language, y);

  // Check if we need a new page for the remaining blocks
  const remainingBlocks = 55; // approximate mm needed for payment terms + signature
  if (y + remainingBlocks > PAGE_H - 10) {
    doc.addPage();
    y = 15;
  }

  // --- Payment terms ---
  y = drawPaymentTerms(doc, quoteData.paymentTerms, language, y);

  // --- Signature block ---
  drawSignatureBlock(doc, language, y);

  // Return as Blob
  const pdfArrayBuffer = doc.output('arraybuffer');
  return new Blob([pdfArrayBuffer], { type: 'application/pdf' });
}
