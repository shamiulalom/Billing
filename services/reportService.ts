import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { ReportHeader, LineItem, Totals } from '../types';
import { getFilenameDate, numberToWords } from '../utils';
import { registerPDFFonts, getActiveFontName } from '../fonts';

// Helper to format date for report (DD-Mon-YYYY)
const formatDateForReport = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) return dateStr.replace(/\//g, '-');
  return dateStr;
};

// Helper to calculate totals
export const calculateTotals = (items: LineItem[]): Totals => {
  return items.reduce(
    (acc, item) => ({
      totalInvoiceQty: acc.totalInvoiceQty + (Number(item.invoiceQty) || 0),
      totalRcvdQty: acc.totalRcvdQty + (Number(item.rcvdQty) || 0),
      totalValue: acc.totalValue + ((Number(item.invoiceQty) || 0) * (Number(item.unitPrice) || 0)),
    }),
    { totalInvoiceQty: 0, totalRcvdQty: 0, totalValue: 0 }
  );
};

export const generateReports = async (header: ReportHeader, items: LineItem[]) => {
  const totals = calculateTotals(items);
  const totalValueStr = totals.totalValue.toFixed(2); 
  
  const filenameDate = getFilenameDate(header.billingDate);
  const baseFilename = `Bill of Buyer ${header.buyerName} $${totalValueStr} DATE-${filenameDate}`;

  // Generate PDF
  try {
    console.log("Generating PDF...");
    await generatePDF(header, items, totals, baseFilename);
  } catch (e) {
    console.error("PDF Generation failed", e);
  }
  
  // Small delay to prevent browser from blocking the second download
  await new Promise(resolve => setTimeout(resolve, 800));

  // Generate Excel
  try {
    console.log("Generating Excel...");
    await generateExcel(header, items, totals, baseFilename);
  } catch (e) {
    console.error("Excel Generation failed", e);
    alert("Excel Generation Error: " + (e instanceof Error ? e.message : "Unknown error"));
  }
};

const generatePDF = async (header: ReportHeader, items: LineItem[], totals: Totals, filename: string) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth(); 
  const pageHeight = doc.internal.pageSize.getHeight(); 

  await registerPDFFonts(doc);
  const fontName = getActiveFontName();
  doc.setTextColor(0, 0, 0);

  // ===== 1. COMPACT FIXED DIMENSIONS =====
  const marginX = 10;
  const topMargin = 6; // Reduced from 10mm to 6mm
  const bottomMargin = 8;
  
  // Compact Header Section (Blue + Yellow Area)
  const headerSectionHeight = 40; // Reduced from 55mm to 40mm
  const tableStartY = topMargin + headerSectionHeight; 

  // Fixed Signature Area (Green Area)
  const signatureBlockHeight = 20;
  const signatureLineY = pageHeight - bottomMargin - 8; 

  // Red Area Space Calculation
  const inWordsHeight = 6;
  const gapBetweenTableAndInWords = 1.5;
  const tableMaxEndY = signatureLineY - signatureBlockHeight - inWordsHeight - gapBetweenTableAndInWords - 10;
  const availableTableHeight = tableMaxEndY - tableStartY;

  // ===== 2. HEADER TEXT (More Compact) =====
  doc.setFont(fontName, 'bold');
  doc.setFontSize(18); // Reduced from 20
  doc.text("Tusuka Trousers Ltd.", pageWidth / 2, topMargin + 4, { align: 'center' });
  
  doc.setFontSize(9); // Reduced from 10
  doc.setFont(fontName, 'normal');
  doc.text("Neelngar, Konabari, Gazipur", pageWidth / 2, topMargin + 9, { align: 'center' });

  doc.setFontSize(13); // Reduced from 15
  doc.setFont(fontName, 'bold');
  doc.text("Inventory Report", pageWidth / 2, topMargin + 16, { align: 'center' });

  // ===== 3. HEADER INFO SECTION (Yellow Area - Tightened) =====
  const infoY = topMargin + 22; // Moved up
  const infoLineStep = 4.2; // Reduced gap between lines from 5.5 to 4.2
  doc.setFontSize(8.5);
  
  const drawInfo = (label: string, value: string, x: number, y: number) => {
    doc.setFont(fontName, 'bold');
    doc.text(label, x, y);
    doc.setFont(fontName, 'normal');
    doc.text(value || '', x + 28, y); // Tightened horizontal gap
  };

  // 1. UPDATED HEADER INFO SECTION (Yellow Area)
  drawInfo("Buyer Name :", (header.buyerName || "").toUpperCase(), marginX, infoY);
  drawInfo("Supplier Name:", (header.supplierName || "").toUpperCase(), marginX, infoY + infoLineStep);
  drawInfo("File No :", header.fileNo, marginX, infoY + infoLineStep * 2);
  // Invoice No is now strictly Uppercase
  drawInfo("Invoice No :", (header.invoiceNo || "").toUpperCase(), marginX, infoY + infoLineStep * 3);
  drawInfo("L/C Number :", header.lcNumber, marginX, infoY + infoLineStep * 4);
  const rightColX = pageWidth - 75; // Adjusted position
  drawInfo("Invoice Date:", formatDateForReport(header.invoiceDate), rightColX, infoY);
  drawInfo("Billing Date:", formatDateForReport(header.billingDate), rightColX, infoY + infoLineStep);

  // ===== 4. DYNAMIC TABLE SCALING (Red Area) =====
  const totalRows = items.length + 1; 
  let calculatedRowHeight = availableTableHeight / (totalRows + 1); 
  const finalRowHeight = Math.max(3.8, Math.min(9, calculatedRowHeight)); // Smaller min height
  const fontSize = Math.max(5, Math.min(9.5, (finalRowHeight / 9) * 9.5));
  const cellPadding = Math.max(0.3, finalRowHeight * 0.1);

  const tableColumn = [
    "Fabric Code", "Item Description", "Received Date", "Challan No", 
    "Pi Number", "Unit", "Invoice Qty", "Received Qty", "Unit Price ($)", "Total Value ($)", "Appstreme No"
  ];

  const tableRows = items.map(item => {
      // Helper function to capitalize the first letter of every word
      const toTitleCase = (str: string) => {
        return (str || "").toLowerCase().split(' ').map(word => {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
      };

      // Format Description and Color
      const sentenceDesc = toTitleCase(item.itemDescription);
      const sentenceColor = toTitleCase(item.color);
      
      return [
        item.fabricCode,
        // Combines Title Case Description and Title Case Color in parentheses
        sentenceDesc + (sentenceColor ? ` (${sentenceColor})` : ""), 
        formatDateForReport(item.rcvdDate),
        item.challanNo,
        (item.piNumber || "").toUpperCase(), // PI stays uppercase
        item.unit,
        `${Math.round(item.invoiceQty).toLocaleString()}`,
        `${Math.round(item.rcvdQty).toLocaleString()}`,
        `$ ${Number(item.unitPrice).toFixed(2)}`,
        `$ ${(Number(item.invoiceQty) * Number(item.unitPrice)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        item.appstremeNo
      ];
    });

  tableRows.push(["", "", "", "", "", "TOTAL", `${Math.round(totals.totalInvoiceQty).toLocaleString()}`, `${Math.round(totals.totalRcvdQty).toLocaleString()}`, "", `$ ${totals.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, ""]);

  autoTable(doc, {
    startY: tableStartY,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    pageBreak: 'auto', 
    styles: {
      fontSize: fontSize,
      cellPadding: cellPadding,
      minCellHeight: finalRowHeight,
      valign: 'middle',
      halign: 'center',
      textColor: [0, 0, 0],   // <--- THIS LINE makes all table body text black
      lineColor: [0, 0, 0],
      lineWidth: 0.08,
      overflow: 'linebreak'
    },
    headStyles: { fillColor: [245, 245, 245],textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 34 }, // Fabric Code
      1: { cellWidth: 50, halign: 'left' }, // Item Description
      2: { cellWidth: 23 }, // Received Date
      3: { cellWidth: 22 }, // Challan No
      4: { cellWidth: 25 }, // PI Number
      5: { cellWidth: 15 }, // Unit
      6: { cellWidth: 18 }, // Invoice Qty
      7: { cellWidth: 18 }, // Received Qty
      8: { cellWidth: 20 }, // Unit Price
      9: { fontStyle: 'bold', cellWidth: 26 }, // Total Value
      10: { cellWidth: 22 } // Appstreme No
    },
    didParseCell: (data) => {
      if (data.row.index === tableRows.length - 1) data.cell.styles.fontStyle = 'bold';
    },
    margin: { left: marginX, right: marginX },
  });

  // --- In Words (Red Area Bottom) ---
  const finalTableInfo = (doc as any).lastAutoTable;
  const finalTableY = finalTableInfo ? finalTableInfo.finalY : tableStartY;
  doc.setFont(fontName, 'bold');
  doc.setTextColor(0, 0, 0); // Strictly black
  doc.setFontSize(Math.max(fontSize, 8.5)); // Matches table text size scaling
  doc.text(`IN WORDS: ${numberToWords(totals.totalValue).toUpperCase()} ONLY`, marginX + 60, finalTableY + 4);

  // --- Signature (Fixed Green Area) ---
  doc.setLineWidth(0.15);
  doc.setFontSize(8.5);
  doc.line(marginX + 5, signatureLineY, marginX + 60, signatureLineY);
  doc.text("Prepared By", marginX + 18, signatureLineY + 4);
  
  doc.line(pageWidth - marginX - 60, signatureLineY, pageWidth - marginX - 5, signatureLineY);
  doc.text("Store In-Charge", pageWidth - marginX - 48, signatureLineY + 4);

  doc.save(`${filename}.pdf`);
};

const generateExcel = async (header: ReportHeader, items: LineItem[], totals: Totals, filename: string) => {
  // Use the default export to instantiate Workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Bill Of Exchange Report');

  // Prepare Data for Excel rows
  const data: any[] = [
    ["Tusuka Trousers Ltd."], // Row 1: Company Name
    ["Neelngar, Konabari, Gazipur"], // Row 2: Company Address
    ["Bill Of Exchange Report"], // Row 3: Report Title
    [], // Row 4: Spacer
    ["Buyer Name :", header.buyerName, "", "", "", "", "", "", "", "Invoice Date :", formatDateForReport(header.invoiceDate)], // Row 5: Buyer Name & Invoice Date
    ["Supplier Name:", header.supplierName, "", "", "", "", "", "", "", "Billing Date :", formatDateForReport(header.billingDate)], // Row 6: Supplier Name & Billing Date
    ["File No :", header.fileNo], // Row 7: File No
    ["Invoice No :", header.invoiceNo], // Row 8: Invoice No
    ["L/C Number :", header.lcNumber], // Row 9: L/C Number
    [], // Row 10: Spacer
    [
      "Fabric Code", "Item Description", "Received Date", "Challan No", 
      "Pi Number", "Unit", "Invoice Qty", "Received Qty", "Unit Price $", "Total Value", "Appstreme No.\n(Receipt no)" // Row 11: Table Headers
    ]
  ];

  // Add line items to data array
  items.forEach(item => {
    const invoiceQty = Number(item.invoiceQty) || 0;
    const rcvdQty = Number(item.rcvdQty) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const totalVal = invoiceQty * unitPrice;

    let description = item.itemDescription || '';
    if (item.color) description += ` (${item.color})`;

    data.push([
      item.fabricCode,
      description,
      formatDateForReport(item.rcvdDate),
      item.challanNo,
      item.piNumber,
      item.unit,
      Math.round(invoiceQty),
      Math.round(rcvdQty),
      unitPrice,
      totalVal,
      item.appstremeNo
    ]);
  });

  // Calculate the row index for the total row
  const totalRowIndex = data.length + 1;
  // Add total row to data array
  data.push([
    "", "", "", "", "Total:", "YDS",
    Math.round(totals.totalInvoiceQty),
    Math.round(totals.totalRcvdQty),
    "",
    totals.totalValue,
    ""
  ]);

  // Calculate the row index for the "In Words" row
  const inWordsRowIndex = data.length + 1;
  // Add "In Words" row to data array
  data.push(["", "", "", "", `In Words: ${numberToWords(totals.totalValue)}`, "", "", "", "", "", ""]);

  data.push([], [], [], [], []); // Add spacer rows before signatures

  // Calculate the row index for the signature row
  const signatureRowIndex = data.length + 1;
  // Add signature row to data array
  data.push(["Prepared By", "", "", "", "", "", "", "", "", "Store In-Charge", ""]);

  // Add all prepared data rows to the worksheet
  data.forEach((rowData) => {
    worksheet.addRow(rowData);
  });

  // Define column widths for better readability
  worksheet.columns = [
    { width: 14 }, { width: 35 }, { width: 13 }, { width: 15 }, { width: 15 }, 
    { width: 8 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 14 }, { width: 16 }
  ];

  // Define common border styles
  const thinBorder = {
    top: { style: 'thin' as const },
    bottom: { style: 'thin' as const },
    left: { style: 'thin' as const },
    right: { style: 'thin' as const }
  };
  const topBorderOnly = { top: { style: 'thin' as const } };

  // Iterate over each row and cell to apply specific styles
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      if (rowNumber === 1) { // Company Name row
        cell.font = { bold: true, size: 20 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (rowNumber === 2) { // Company Address row
        cell.font = { size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (rowNumber === 3) { // Report Title row
        cell.font = { bold: true, size: 14 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (rowNumber >= 5 && rowNumber <= 9) { // Header Info section (Buyer Name, Supplier Name, etc.)
        if (colNumber === 1 || colNumber === 10) { // Labels (e.g., "Buyer Name :", "Invoice Date :")
          cell.font = { bold: true, size: 10 };
        } else { // Values
          cell.font = { size: 10 };
        }
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (rowNumber === 11) { // Table Header row
        cell.font = { bold: true, size: 10 };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = thinBorder;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }; // Light grey background
      } else if (rowNumber > 11 && rowNumber < totalRowIndex) { // Data rows (line items)
        cell.font = { size: 10 };
        cell.border = thinBorder;
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        if (colNumber === 2 || colNumber === 11) cell.alignment.horizontal = 'left'; // Item Description and Appstreme No left aligned
        if (colNumber >= 7 && colNumber <= 10) { // Quantity and Value columns right aligned
          cell.alignment.horizontal = 'right';
          if (colNumber >= 9) cell.numFmt = '#,##0.00'; // Total Value formatted to 2 decimal places
          else cell.numFmt = '#,##0'; // Quantities formatted as integers
        }
      } else if (rowNumber === totalRowIndex) { // Total row
        cell.font = { bold: true, size: 10 };
        cell.border = thinBorder;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (colNumber === 5) cell.alignment.horizontal = 'right'; // "Total:" label right aligned
        if (colNumber >= 7 && colNumber <= 10) { // Total quantities and value right aligned
          cell.alignment.horizontal = 'right';
          if (colNumber >= 9) cell.numFmt = '#,##0.00'; // Total Value formatted to 2 decimal places
          else cell.numFmt = '#,##0'; // Total Quantities formatted as integers
        }
      } else if (rowNumber === inWordsRowIndex) { // "In Words" row
        if (colNumber === 5) { // "In Words:" text
          cell.font = { bold: true, size: 10 };
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      } else if (rowNumber === signatureRowIndex) { // Signature row
        cell.font = { bold: true, size: 10 };
        cell.alignment = { horizontal: 'center', vertical: 'top' };
        if (colNumber === 1 || colNumber === 10) cell.border = topBorderOnly; // Top border for signature lines
      }
    });
  });

  // Set specific row heights
  worksheet.getRow(1).height = 26; // Company Name row height
  worksheet.getRow(2).height = 18; // Company Address row height
  worksheet.getRow(3).height = 22; // Report Title row height
  worksheet.getRow(11).height = 25; // Table Header row height
  
  // Merge cells for header and "In Words" sections
  worksheet.mergeCells('A1:K1'); // Merge for Company Name
  worksheet.mergeCells('A2:K2'); // Merge for Company Address
  worksheet.mergeCells('A3:K3'); // Merge for Report Title
  worksheet.mergeCells(`E${inWordsRowIndex}:K${inWordsRowIndex}`); // Merge for "In Words" text

  // Generate Excel buffer and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};