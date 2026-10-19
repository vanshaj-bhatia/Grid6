import {
  clip,
  endPath,
  PDFDocument,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
  rgb,
  StandardFonts,
} from 'pdf-lib';
import { GridConfig, PageSize } from '../types';

export const MM_TO_PT = 2.834645669291339; // 1 mm = 2.83465 pt (72 pt/inch)
export const PT_TO_MM = 1 / MM_TO_PT;

export const PAGE_DIMENSIONS_PT: Record<PageSize, { width: number; height: number }> = {
  A4: { width: 595.28, height: 841.89 },
  LETTER: { width: 612.0, height: 792.0 },
  A3: { width: 841.89, height: 1190.55 },
  LEGAL: { width: 612.0, height: 1008.0 },
};

export function getSheetDimensions(config: GridConfig): { width: number; height: number } {
  const base = PAGE_DIMENSIONS_PT[config.pageSize] || PAGE_DIMENSIONS_PT.A4;
  if (config.orientation === 'landscape') {
    return {
      width: Math.max(base.width, base.height),
      height: Math.min(base.width, base.height),
    };
  }
  return {
    width: Math.min(base.width, base.height),
    height: Math.max(base.width, base.height),
  };
}

export function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return rgb(r, g, b);
}

/**
 * Inspect page count of a PDF file without full rendering
 */
export async function getPdfPageCount(file: File): Promise<number> {
  const buffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  return pdf.getPageCount();
}

/**
 * Merge multiple pages of a source PDF into a 3x2 grid layout per sheet
 * with full support for:
 * - Picture Scaling: 'fitWidth' (stretch page width to match cell width, cropping empty bottom), 'inside', 'stretch', 'cropBottomQuarter'
 * - Picture Align: 'top-middle' (anchors top middle so no top content/barcode is cropped), 'center', 'bottom-middle'
 * - Zero/custom margins & cell clipping
 */
export async function processPdfToGrid(
  file: File,
  config: GridConfig,
  onProgress?: (percent: number) => void
): Promise<{ blob: Blob; sheetCount: number; originalPageCount: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = srcPdf.getPageCount();

  if (totalPages === 0) {
    throw new Error('The provided PDF file has 0 pages.');
  }

  const destPdf = await PDFDocument.create();
  const font = await destPdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await destPdf.embedFont(StandardFonts.HelveticaBold);

  onProgress?.(15);
  const embeddedPages = await destPdf.embedPages(srcPdf.getPages());
  onProgress?.(30);

  const { width: sheetWidth, height: sheetHeight } = getSheetDimensions(config);

  const marginLeftPt = config.marginLeftMm * MM_TO_PT;
  const marginRightPt = config.marginRightMm * MM_TO_PT;
  const marginTopPt = config.marginTopMm * MM_TO_PT;
  const marginBottomPt = config.marginBottomMm * MM_TO_PT;
  const gapXPt = config.gapXMm * MM_TO_PT;
  const gapYPt = config.gapYMm * MM_TO_PT;

  // Grid dimensions:
  // In portrait: 2 cols x 3 rows (standard 6-up portrait label layout)
  // In landscape: 3 cols x 2 rows
  const cols = config.cols || (config.orientation === 'portrait' ? 2 : 3);
  const rows = config.rows || (config.orientation === 'portrait' ? 3 : 2);
  const pagesPerSheet = cols * rows; // 6

  const availableWidth = Math.max(10, sheetWidth - marginLeftPt - marginRightPt - (cols - 1) * gapXPt);
  const availableHeight = Math.max(10, sheetHeight - marginTopPt - marginBottomPt - (rows - 1) * gapYPt);

  const cellWidth = availableWidth / cols;
  const cellHeight = availableHeight / rows;

  const totalSheets = Math.ceil(totalPages / pagesPerSheet);
  const borderColor = hexToRgb(config.borderColorHex);

  for (let sheetIndex = 0; sheetIndex < totalSheets; sheetIndex++) {
    const destPage = destPdf.addPage([sheetWidth, sheetHeight]);

    // Draw cut / trim marks if enabled
    if (config.drawCutGuides) {
      const guideColor = rgb(0.75, 0.75, 0.8);
      const markLen = 8;

      // Vertical dividing marks between columns
      for (let c = 1; c < cols; c++) {
        const x = marginLeftPt + c * cellWidth + (c - 0.5) * gapXPt;
        destPage.drawLine({
          start: { x, y: sheetHeight - 2 },
          end: { x, y: sheetHeight - 2 - markLen },
          thickness: 0.5,
          color: guideColor,
        });
        destPage.drawLine({
          start: { x, y: 2 },
          end: { x, y: 2 + markLen },
          thickness: 0.5,
          color: guideColor,
        });
      }

      // Horizontal dividing marks between rows
      for (let r = 1; r < rows; r++) {
        const y = sheetHeight - marginTopPt - r * cellHeight - (r - 0.5) * gapYPt;
        destPage.drawLine({
          start: { x: 2, y },
          end: { x: 2 + markLen, y },
          thickness: 0.5,
          color: guideColor,
        });
        destPage.drawLine({
          start: { x: sheetWidth - 2, y },
          end: { x: sheetWidth - 2 - markLen, y },
          thickness: 0.5,
          color: guideColor,
        });
      }
    }

    for (let slot = 0; slot < pagesPerSheet; slot++) {
      const pageIndex = sheetIndex * pagesPerSheet + slot;
      if (pageIndex >= totalPages) break;

      // Determine column & row based on order
      let col = 0;
      let row = 0;

      if (config.pageOrder === 'horizontal') {
        col = slot % cols;
        row = Math.floor(slot / cols);
      } else {
        row = slot % rows;
        col = Math.floor(slot / rows);
      }

      const cellX = marginLeftPt + col * (cellWidth + gapXPt);
      // In PDF, Y starts at 0 at bottom. Row 0 is at the top.
      const cellY = sheetHeight - marginTopPt - (row + 1) * cellHeight - row * gapYPt;

      const embedded = embeddedPages[pageIndex];
      const srcW = embedded.width;
      const srcH = embedded.height;

      // Calculate width and height based on user's Picture Scaling option
      let drawW = cellWidth;
      let drawH = cellHeight;

      if (config.pictureScaling === 'fitWidth') {
        // MATCH INPUT PAGE WIDTH TO CELL WIDTH (Stretches image to whole cell width, empty 1/4 at bottom overflow clipped)
        const scale = cellWidth / srcW;
        drawW = cellWidth;
        drawH = srcH * scale;
      } else if (config.pictureScaling === 'inside') {
        // Fit completely inside cell (standard aspect ratio preserve)
        const scale = Math.min(cellWidth / srcW, cellHeight / srcH);
        drawW = srcW * scale;
        drawH = srcH * scale;
      } else if (config.pictureScaling === 'stretch') {
        // Stretches both width and height to cell
        drawW = cellWidth;
        drawH = cellHeight;
      } else if (config.pictureScaling === 'cropBottomQuarter') {
        // Crop bottom 25% empty area, scale remaining 75% to cell
        const effH = srcH * 0.75;
        const scale = Math.min(cellWidth / srcW, cellHeight / effH);
        drawW = srcW * scale;
        drawH = srcH * scale;
      }

      // Calculate position based on Picture Align
      let drawX = cellX;
      let drawY = cellY;

      // Horizontal alignment: Center in cell width
      drawX = cellX + (cellWidth - drawW) / 2;

      // Vertical alignment:
      // 'top-middle': Top of page matches top of cell (cellY + cellHeight).
      // Crucial: Ensures barcode, address, and header at top are NEVER cropped!
      if (config.pictureAlign === 'top-middle') {
        drawY = cellY + cellHeight - drawH;
      } else if (config.pictureAlign === 'center') {
        drawY = cellY + (cellHeight - drawH) / 2;
      } else if (config.pictureAlign === 'bottom-middle') {
        drawY = cellY;
      }

      // CLIP TO CELL BOUNDS so any bottom excess (the empty 1/4) is cleanly trimmed without spilling
      if (config.clipToCell !== false) {
        destPage.pushOperators(
          pushGraphicsState(),
          rectangle(cellX, cellY, cellWidth, cellHeight),
          clip(),
          endPath()
        );
      }

      // Draw the embedded page
      destPage.drawPage(embedded, {
        x: drawX,
        y: drawY,
        width: drawW,
        height: drawH,
      });

      if (config.clipToCell !== false) {
        destPage.pushOperators(popGraphicsState());
      }

      // Draw border around cell boundary if enabled
      if (config.drawBorders) {
        destPage.drawRectangle({
          x: cellX,
          y: cellY,
          width: cellWidth,
          height: cellHeight,
          borderWidth: config.borderWidthPt,
          borderColor,
        });
      }

      // Draw page number badge if enabled
      if (config.drawPageNumbers) {
        const badgeText = `${pageIndex + 1}`;
        const textSize = 7.5;
        const textWidth = boldFont.widthOfTextAtSize(badgeText, textSize);
        const padding = 2.5;
        const badgeW = textWidth + padding * 2;
        const badgeH = textSize + padding * 2;

        const badgeX = cellX + cellWidth - badgeW - 2.5;
        const badgeY = cellY + 2.5;

        destPage.drawRectangle({
          x: badgeX,
          y: badgeY,
          width: badgeW,
          height: badgeH,
          color: rgb(0.96, 0.96, 0.98),
          borderColor: rgb(0.7, 0.7, 0.8),
          borderWidth: 0.5,
        });

        destPage.drawText(badgeText, {
          x: badgeX + padding,
          y: badgeY + padding + 1,
          size: textSize,
          font: boldFont,
          color: rgb(0.1, 0.1, 0.2),
        });
      }
    }

    const currentPercent = 30 + Math.round(((sheetIndex + 1) / totalSheets) * 60);
    onProgress?.(currentPercent);
  }

  onProgress?.(95);
  const pdfBytes = await destPdf.save();
  onProgress?.(100);

  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  return {
    blob,
    sheetCount: totalSheets,
    originalPageCount: totalPages,
  };
}

/**
 * Generate a realistic 6-label e-commerce document
 * matching the user's exact screenshot context:
 * - Top 3/4 has Shipping label, Barcode, Customer Address, SKU, and Tax Invoice
 * - Bottom 1/4 is completely blank whitespace
 */
export async function generateSampleMultiPagePdf(): Promise<File> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const sampleLabels = [
    {
      name: 'Sandeep',
      courier: 'Xpress Bees',
      awb: '134096165173586',
      city: 'Agra, Uttar Pradesh, 282007',
      address: '40/2 A1, Prevnath, Kedar Nagar Road, Shahganj, Agra',
      sku: 'Carpet Brush - Pack of 1',
      orderId: 'OD1294827591',
    },
    {
      name: 'BHASKAR KUMAR',
      courier: 'Shadowfax',
      awb: 'SF4302039520FPL',
      city: 'Patna, Bihar, 801124',
      address: 'House no-8, Near Shiv Mandir, Post - Bikram',
      sku: 'Artificial Grass Mat - Pack of 1',
      orderId: 'OD4829104812',
    },
    {
      name: 'Rajendra Trivedi',
      courier: 'Delhivery',
      awb: '34327027667A5000L',
      city: 'Indore, Madhya Pradesh, 452010',
      address: 'Flat 302, Green Avenue, Vijay Nagar, Indore',
      sku: 'Kitchen Storage Rack - 3 Layer',
      orderId: 'OD7291840284',
    },
    {
      name: 'Priya Sharma',
      courier: 'Blue Dart',
      awb: '78291047192801',
      city: 'Jaipur, Rajasthan, 302017',
      address: 'Plot 45, Malviya Nagar, Sector 4, Jaipur',
      sku: 'Cotton Bedsheet Set Double',
      orderId: 'OD9182740192',
    },
    {
      name: 'Amit Patel',
      courier: 'Ecom Express',
      awb: 'EC4820194820IN',
      city: 'Ahmedabad, Gujarat, 380015',
      address: 'B-12, Shivalik Residency, Satellite Road, Ahmedabad',
      sku: 'Wireless Bluetooth Earbuds',
      orderId: 'OD5829103948',
    },
    {
      name: 'Sneha Roy',
      courier: 'Shadowfax',
      awb: 'SF9281740284DEL',
      city: 'Kolkata, West Bengal, 700029',
      address: '18/4 Gariahat Road, South Kolkata',
      sku: 'Desk Lamp LED Rechargeable',
      orderId: 'OD3819401928',
    },
  ];

  for (let i = 0; i < sampleLabels.length; i++) {
    // Standard A4 portrait sheet (595.28 x 841.89 pt)
    const page = doc.addPage([595.28, 841.89]);
    const label = sampleLabels[i];

    // Background is white
    page.drawRectangle({
      x: 0,
      y: 0,
      width: 595.28,
      height: 841.89,
      color: rgb(1, 1, 1),
    });

    // Content container occupying TOP 3/4 (from y = 210 to y = 820)
    // BOTTOM 1/4 (from y = 0 to y = 210) IS COMPLETELY BLANK/EMPTY!
    const topY = 820;

    // Outer border of shipping label
    page.drawRectangle({
      x: 20,
      y: 220,
      width: 555.28,
      height: 600,
      borderWidth: 1.5,
      borderColor: rgb(0.1, 0.1, 0.1),
    });

    // Top Header: Customer Address & Courier Block
    page.drawLine({
      start: { x: 20, y: topY - 110 },
      end: { x: 575.28, y: topY - 110 },
      thickness: 1,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawLine({
      start: { x: 300, y: topY },
      end: { x: 300, y: topY - 110 },
      thickness: 1,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Customer info (Left side)
    page.drawText('Customer Address', { x: 30, y: topY - 18, size: 9, font: boldFont });
    page.drawText(label.name, { x: 30, y: topY - 34, size: 12, font: boldFont });
    page.drawText(label.address, { x: 30, y: topY - 50, size: 9, font });
    page.drawText(label.city, { x: 30, y: topY - 64, size: 9, font: boldFont });

    // Return to info
    page.drawText('If undelivered, return to: Logistics Hub, Sector 12', {
      x: 30,
      y: topY - 86,
      size: 7.5,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Courier & Barcode (Right side)
    page.drawText(`Prepaid  •  ${label.courier}`, { x: 315, y: topY - 18, size: 10, font: boldFont });

    // Simulated 2D DataMatrix / QR box
    page.drawRectangle({
      x: 480,
      y: topY - 100,
      width: 75,
      height: 75,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });
    // Draw matrix dots
    for (let dx = 0; dx < 5; dx++) {
      for (let dy = 0; dy < 5; dy++) {
        if ((dx + dy) % 2 === 0) {
          page.drawRectangle({
            x: 488 + dx * 12,
            y: topY - 92 + dy * 12,
            width: 7,
            height: 7,
            color: rgb(0, 0, 0),
          });
        }
      }
    }

    // Barcode Simulation
    const barcodeY = topY - 170;
    page.drawRectangle({
      x: 40,
      y: barcodeY,
      width: 515.28,
      height: 50,
      color: rgb(0.98, 0.98, 0.98),
    });
    // Vertical barcode lines
    for (let b = 0; b < 90; b++) {
      const lineX = 60 + b * 5.3;
      const thickness = (b % 3 === 0 ? 2.5 : 1.2);
      page.drawLine({
        start: { x: lineX, y: barcodeY + 45 },
        end: { x: lineX, y: barcodeY + 5 },
        thickness,
        color: rgb(0, 0, 0),
      });
    }

    page.drawText(`AWB: ${label.awb}`, {
      x: 210,
      y: barcodeY - 14,
      size: 11,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Divider
    page.drawLine({
      start: { x: 20, y: barcodeY - 25 },
      end: { x: 575.28, y: barcodeY - 25 },
      thickness: 1,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Product & SKU Details Table
    const tableY = barcodeY - 45;
    page.drawText('Product Details & SKU', { x: 30, y: tableY, size: 10, font: boldFont });
    page.drawText(`SKU: ${label.sku}   |   Qty: 1   |   Order: ${label.orderId}`, {
      x: 30,
      y: tableY - 18,
      size: 9,
      font,
    });

    // Tax Invoice section
    const invoiceY = tableY - 45;
    page.drawRectangle({
      x: 30,
      y: invoiceY - 100,
      width: 535.28,
      height: 100,
      borderWidth: 1,
      borderColor: rgb(0.2, 0.2, 0.2),
    });
    page.drawText('TAX INVOICE (ORIGINAL FOR RECIPIENT)', {
      x: 40,
      y: invoiceY - 18,
      size: 9,
      font: boldFont,
    });
    page.drawText(`Billed to: ${label.name}, ${label.city}`, { x: 40, y: invoiceY - 34, size: 8, font });
    page.drawText('Total Amount: Rs. 499.00  (IGST 18% included)', {
      x: 40,
      y: invoiceY - 50,
      size: 8,
      font: boldFont,
    });
    page.drawText('Authorized Signatory: Online Retail Seller • Agra, UP', {
      x: 40,
      y: invoiceY - 68,
      size: 7.5,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Notice text in label
    page.drawText('This shipment is subject to terms & conditions of carriage.', {
      x: 30,
      y: 230,
      size: 7,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Visual indicator that bottom 1/4 is blank (for demo clarity)
    page.drawText('--- [BOTTOM 1/4 OF PAGE IS EMPTY WHITESPACE] ---', {
      x: 160,
      y: 110,
      size: 8,
      font,
      color: rgb(0.75, 0.75, 0.8),
    });
    page.drawText('(Fit Cell Width stretches top label to full cell width and trims this blank area)', {
      x: 120,
      y: 90,
      size: 8,
      font,
      color: rgb(0.7, 0.7, 0.8),
    });
  }

  const pdfBytes = await doc.save();
  return new File([pdfBytes.buffer as ArrayBuffer], 'sample-shipping-labels-6pages.pdf', {
    type: 'application/pdf',
  });
}
