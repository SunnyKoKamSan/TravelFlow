import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { ItineraryItem, Expense, TripSettings } from '../types';
import { formatDate } from './utils';

interface ExportData {
  settings: TripSettings;
  itinerary: ItineraryItem[];
  expenses: Expense[];
  balances: Record<string, number>;
}

// --- The NanoBanana Design System ---
const theme = {
    colors: {
        primary: [255, 253, 200] as [number, number, number], // Very Light Yellow
        secondary: [26, 26, 26] as [number, number, number], // Deep Charcoal / Black
        text: [40, 40, 40] as [number, number, number], // Dark Grey
        subText: [120, 120, 120] as [number, number, number], // Light Grey
        accent1: [0, 200, 150] as [number, number, number], // Vivid Teal
        accent2: [255, 80, 80] as [number, number, number], // Vivid Coral
        bg: [255, 255, 255] as [number, number, number], // White
        lightBg: [248, 248, 248] as [number, number, number], // Very light grey for banding
        line: [220, 220, 220] as [number, number, number], // Light grey for timeline lines
    },
    fonts: {
        heading: 'helvetica' as const,
        body: 'helvetica' as const
    }
};

export const exportTripToPDF = (data: ExportData) => {
  const { settings, itinerary, expenses, balances } = data;
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // ---------------------------------------------------------
  // 1. HERO HEADER SECTION
  // ---------------------------------------------------------
  
  // Big Yellow Header Block
  doc.setFillColor(theme.colors.primary[0], theme.colors.primary[1], theme.colors.primary[2]);
  doc.rect(0, 0, pageWidth, 70, 'F'); // Top hero banner

  // Destination Title (Big & Bold)
  doc.setFont(theme.fonts.heading, 'bold');
  doc.setTextColor(theme.colors.secondary[0], theme.colors.secondary[1], theme.colors.secondary[2]);
  doc.setFontSize(42);
  const destination = settings.destination.split(',')[0].toUpperCase();
  doc.text(destination, margin, 35);

  // Decorative "Trip Plan" Pill
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - margin - 50, 22, 50, 12, 6, 6, 'F');
  doc.setFontSize(10);
  doc.setTextColor(theme.colors.secondary[0], theme.colors.secondary[1], theme.colors.secondary[2]);
  doc.text("TRIP ITINERARY", pageWidth - margin - 25, 29, { align: 'center' });

  // Trip Metadata Grid (Floating White Box)
  const metaY = 55;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(theme.colors.line[0], theme.colors.line[1], theme.colors.line[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, metaY, pageWidth - (margin * 2), 25, 2, 2, 'FD');
  
  // Metadata Text
  doc.setFontSize(9);
  doc.setTextColor(theme.colors.subText[0], theme.colors.subText[1], theme.colors.subText[2]);
  doc.text("DATES", margin + 10, metaY + 8);
  doc.text("DURATION", margin + 70, metaY + 8);
  doc.text("TRAVELERS", margin + 110, metaY + 8);

  doc.setFontSize(11);
  doc.setTextColor(theme.colors.text[0], theme.colors.text[1], theme.colors.text[2]);
  doc.setFont(theme.fonts.body, 'bold');
  
  const dateStr = `${formatDate(settings.startDate)} - ${formatDate(settings.endDate)}`;
  doc.text(dateStr, margin + 10, metaY + 18);
  doc.text(`${settings.days} Days`, margin + 70, metaY + 18);
  doc.text(settings.users.join(', '), margin + 110, metaY + 18);

  let currentY = 95;

  // ---------------------------------------------------------
  // 2. ITINERARY (The Visual Timeline)
  // ---------------------------------------------------------

  // Group items by day
  const itineraryByDay: Record<number, ItineraryItem[]> = {};
  for (let i = 0; i < settings.days; i++) itineraryByDay[i] = [];
  itinerary.forEach(item => {
    if (itineraryByDay[item.dayIndex]) itineraryByDay[item.dayIndex].push(item);
  });

  Object.keys(itineraryByDay).map(Number).sort((a, b) => a - b).forEach((dayIndex) => {
    const dayItems = itineraryByDay[dayIndex].sort((a, b) => a.time.localeCompare(b.time));
    
    // Day Header
    const dayDate = getDayDate(settings.startDate, dayIndex);
    
    // Check page break for header
    if (currentY + 20 > pageHeight) {
      doc.addPage();
      currentY = 20;
    }

    // Day Label (Black pill with Yellow text for contrast)
    doc.setFillColor(theme.colors.secondary[0], theme.colors.secondary[1], theme.colors.secondary[2]);
    doc.roundedRect(margin, currentY, 25, 10, 2, 2, 'F');
    doc.setTextColor(theme.colors.primary[0], theme.colors.primary[1], theme.colors.primary[2]);
    doc.setFontSize(9);
    doc.setFont(theme.fonts.body, 'bold');
    doc.text(`DAY ${dayIndex + 1}`, margin + 12.5, currentY + 6.5, { align: 'center' });

    // Date Text next to pill
    doc.setTextColor(theme.colors.secondary[0], theme.colors.secondary[1], theme.colors.secondary[2]);
    doc.setFontSize(14);
    doc.text(dayDate, margin + 30, currentY + 7);
    
    currentY += 15;

    if (dayItems.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(theme.colors.subText[0], theme.colors.subText[1], theme.colors.subText[2]);
      doc.setFont(theme.fonts.body, 'italic');
      doc.text("No activities planned for this day.", margin + 5, currentY);
      currentY += 15;
      return;
    }

    // Prepare table body
    const tableBody = dayItems.map(item => [
      '', // Timeline Column (Empty, drawn via hook)
      item.time,
      item.location,
      item.note || ''
    ]);
    // We'll record the top/bottom Y of this day's table so we can draw a subtle border around it
    let tableStartY: number | null = null;
    let tableEndY: number | null = null;

    autoTable(doc, {
      startY: currentY,
      body: tableBody,
      theme: 'plain',
      styles: {
        cellPadding: 4,
        fontSize: 10,
        valign: 'top',
        overflow: 'linebreak',
        textColor: theme.colors.text as [number, number, number]
      },
      columnStyles: {
        0: { cellWidth: 15 }, // Timeline column
        1: { cellWidth: 25, fontStyle: 'bold' }, // Time
        2: { cellWidth: 60, fontStyle: 'bold' }, // Location
        3: { cellWidth: 'auto', textColor: theme.colors.subText as [number, number, number] } // Notes
      },
      didDrawCell: (data) => {
        // Capture table top/bottom positions and draw Timeline Visuals
        if (data.section === 'body') {
          if (tableStartY === null && data.row.index === 0) tableStartY = data.cell.y;
          if (data.row.index === dayItems.length - 1) tableEndY = data.cell.y + data.cell.height;
        }

        // Draw Timeline Visuals
        if (data.section === 'body' && data.column.index === 0) {
          const { x, y, height, width } = data.cell;
          
          // 1. Draw Vertical Line (connects items)
          // Don't draw line after last item in the day
          if (data.row.index < dayItems.length - 1) {
            doc.setDrawColor(theme.colors.line[0], theme.colors.line[1], theme.colors.line[2]);
            doc.setLineWidth(0.5);
            doc.line(x + width/2, y + 10, x + width/2, y + height + 10); // Extend slightly to next row
          }

          // 2. Draw Dot (Color coded by type)
          const item = dayItems[data.row.index];
          const isTransport = item.type === 'transport';
          const dotColor = isTransport ? theme.colors.accent2 : theme.colors.accent1;
          
          doc.setFillColor(dotColor[0], dotColor[1], dotColor[2]);
          doc.circle(x + width/2, y + 6, 2.5, 'F');
        }

        // Draw a subtle horizontal separator under every session row
        if (data.section === 'body' && data.column.index === 3) {
          const tableStartX = margin;
          const tableWidth = pageWidth - (margin * 2);
          const y = data.cell.y + data.cell.height;
          doc.setDrawColor(theme.colors.line[0], theme.colors.line[1], theme.colors.line[2]);
          doc.setLineWidth(0.3);
          doc.line(tableStartX, y, tableStartX + tableWidth, y);
        }
      },
      margin: { left: margin, right: margin }
    });

    // Draw a subtle border around the day's table if we captured bounds
    if (tableStartY !== null && tableEndY !== null) {
      const borderPad = 4;
      doc.setDrawColor(theme.colors.line[0], theme.colors.line[1], theme.colors.line[2]);
      doc.setLineWidth(0.6);
      // Slightly extend horizontally to give breathing room
      doc.rect(margin - 2, tableStartY - borderPad / 2, pageWidth - (margin * 2) + 4, tableEndY - tableStartY + borderPad, 'S');
    }

    currentY = (doc as any).lastAutoTable.finalY + 15;
  });

  // ---------------------------------------------------------
  // 3. EXPENSES SECTION
  // ---------------------------------------------------------
  
  if (currentY + 40 > pageHeight) {
    doc.addPage();
    currentY = 30;
  }

  // Section Header
  doc.setFontSize(18);
  doc.setFont(theme.fonts.heading, 'bold');
  doc.setTextColor(theme.colors.secondary[0], theme.colors.secondary[1], theme.colors.secondary[2]);
  doc.text("EXPENSES & SETTLEMENT", margin, currentY);
  
  // Yellow Underline
  doc.setFillColor(theme.colors.primary[0], theme.colors.primary[1], theme.colors.primary[2]);
  doc.rect(margin, currentY + 3, 60, 2, 'F');
  
  currentY += 15;

  if (expenses.length > 0) {
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Modern Table for Expenses
    autoTable(doc, {
      startY: currentY,
      head: [['ITEM', 'PAID BY', 'AMOUNT']],
      body: [
        ...expenses.map(e => [e.title, e.payer, `${settings.currencySymbol}${e.amount.toFixed(2)}`]),
        ['TOTAL', '', `${settings.currencySymbol}${totalExpense.toFixed(2)}`] // Footer row inside body for custom styling
      ],
      theme: 'grid',
      headStyles: {
        fillColor: theme.colors.secondary as [number, number, number],
        textColor: theme.colors.primary as [number, number, number], // Yellow text on Black header
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: {
        textColor: theme.colors.text as [number, number, number],
        lineColor: [240, 240, 240]
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 40 },
        2: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
      },
      willDrawCell: (data) => {
        // Highlight the Total row
        if (data.row.index === expenses.length) {
          doc.setFillColor(theme.colors.lightBg[0], theme.colors.lightBg[1], theme.colors.lightBg[2]);
          doc.setFont(theme.fonts.body, 'bold');
        }
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // ---------------------------------------------------------
  // 4. BALANCES (Visual Cards)
  // ---------------------------------------------------------
  
  if (Object.keys(balances).length > 0) {
    // Check space
    if (currentY + 30 > pageHeight) {
      doc.addPage();
      currentY = 30;
    }

    doc.setFontSize(11);
    doc.setTextColor(theme.colors.subText[0], theme.colors.subText[1], theme.colors.subText[2]);
    doc.text("WHO OWES WHO", margin, currentY);
    currentY += 8;

    Object.entries(balances).forEach(([user, balance], index) => {
      // Create a "Card" for each balance
      const cardWidth = 80;
      const cardHeight = 16;
      // Arrange in 2 columns
      const xPos = index % 2 === 0 ? margin : margin + cardWidth + 10;
      const yPos = currentY + (Math.floor(index / 2) * (cardHeight + 5));

      // Card Background
      const isOwed = balance < 0; // Negative means they receive money
      const statusColor = isOwed ? theme.colors.accent1 : theme.colors.secondary;
      
      doc.setDrawColor(230, 230, 230);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(xPos, yPos, cardWidth, cardHeight, 2, 2, 'FD');

      // Colored Indicator Strip
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.roundedRect(xPos, yPos, 4, cardHeight, 2, 2, 'F');
      // Fix left corners to be square for the strip look
      doc.rect(xPos + 2, yPos, 2, cardHeight, 'F'); 

      // User Name
      doc.setTextColor(theme.colors.text[0], theme.colors.text[1], theme.colors.text[2]);
      doc.setFontSize(10);
      doc.text(user, xPos + 10, yPos + 11);

      // Amount
      const amountStr = `${settings.currencySymbol}${Math.abs(balance).toFixed(2)}`;
      const statusStr = isOwed ? `Gets ${amountStr}` : `Owes ${amountStr}`;
      
      doc.setFont(theme.fonts.body, 'bold');
      doc.setTextColor(isOwed ? theme.colors.accent1[0] : theme.colors.secondary[0], isOwed ? theme.colors.accent1[1] : theme.colors.secondary[1], isOwed ? theme.colors.accent1[2] : theme.colors.secondary[2]);
      doc.text(statusStr, xPos + cardWidth - 5, yPos + 11, { align: 'right' });
    });
  }

  // ---------------------------------------------------------
  // 5. FOOTER
  // ---------------------------------------------------------
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    
    // Tiny Branding
    doc.setFillColor(theme.colors.primary[0], theme.colors.primary[1], theme.colors.primary[2]);
    doc.circle(margin, pageHeight - 11.5, 2, 'F');
    doc.text("TravelFlow Plan", margin + 5, pageHeight - 10);
  }

  // Save
  const fileName = `${destination.replace(/[^a-zA-Z0-9]/g, '_')}_Itinerary.pdf`;
  doc.save(fileName);
};

// Helper for date formatting
const getDayDate = (startDate: string, dayIndex: number): string => {
  if (!startDate) return '';
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayIndex);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'long' });
};