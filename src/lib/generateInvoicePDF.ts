import jsPDF from "jspdf";

export interface InvoiceData {
  customerName: string;
  customerPhone: string;
  carModel: string;
  date: string;
  lineItems: { description: string; price: number }[];
  total: number;
  warranty: string;
  notes: string;
}

const SHOP = {
  name: "Alamillas Carburetors",
  address: "920 W 1st St, Santa Ana, CA 92703",
  phone: "(714) 667-5228",
};

const COLORS = {
  primary: [30, 64, 175] as [number, number, number],     // #1e40af
  darkText: [15, 23, 42] as [number, number, number],     // #0f172a
  grayText: [100, 116, 139] as [number, number, number],  // #64748b
  lightGray: [241, 245, 249] as [number, number, number], // #f1f5f9
  white: [255, 255, 255] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],    // #e2e8f0
};

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // ── Header: Blue banner ──
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 38, "F");

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(SHOP.name, margin, 16);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${SHOP.address}  |  ${SHOP.phone}`, margin, 24);

  // Invoice label on right
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - margin, 16, { align: "right" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${formatDate(data.date)}`, pageWidth - margin, 24, {
    align: "right",
  });

  y = 48;

  // ── Customer & Vehicle Info ──
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, "F");

  doc.setTextColor(...COLORS.grayText);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("CUSTOMER", margin + 6, y + 6);
  doc.text("PHONE", margin + 6, y + 18);
  doc.text("VEHICLE", pageWidth / 2 + 4, y + 6);

  doc.setTextColor(...COLORS.darkText);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(data.customerName, margin + 6, y + 12);
  doc.text(data.customerPhone, margin + 6, y + 24);
  doc.text(data.carModel, pageWidth / 2 + 4, y + 12);

  y += 38;

  // ── Work Performed Table ──
  // Table header
  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, y, contentWidth, 8, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("WORK PERFORMED", margin + 4, y + 5.5);
  doc.text("PRICE", pageWidth - margin - 4, y + 5.5, { align: "right" });
  y += 8;

  // Table rows
  data.lineItems.forEach((item, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(...COLORS.lightGray);
      doc.rect(margin, y, contentWidth, 8, "F");
    }

    doc.setTextColor(...COLORS.darkText);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(item.description, margin + 4, y + 5.5);
    doc.text(`$${item.price.toFixed(2)}`, pageWidth - margin - 4, y + 5.5, {
      align: "right",
    });
    y += 8;
  });

  // Border under table
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  // Total row
  y += 2;
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(pageWidth - margin - 60, y, 60, 12, 2, 2, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", pageWidth - margin - 56, y + 8);
  doc.text(`$${data.total.toFixed(2)}`, pageWidth - margin - 4, y + 8, {
    align: "right",
  });

  y += 22;

  // ── Warranty ──
  if (data.warranty && data.warranty !== "No Warranty") {
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "F");

    doc.setTextColor(...COLORS.grayText);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("WARRANTY", margin + 6, y + 5);

    doc.setTextColor(...COLORS.darkText);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(data.warranty, margin + 6, y + 11);
    y += 20;
  }

  // ── Notes / Recommendations ──
  if (data.notes) {
    doc.setTextColor(...COLORS.grayText);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("NOTES & MECHANIC RECOMMENDATIONS", margin, y + 4);
    y += 8;

    doc.setTextColor(...COLORS.darkText);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const noteLines = doc.splitTextToSize(data.notes, contentWidth - 8);
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(
      margin,
      y - 2,
      contentWidth,
      noteLines.length * 5 + 8,
      2,
      2,
      "F"
    );
    doc.text(noteLines, margin + 4, y + 4);
    y += noteLines.length * 5 + 12;
  }

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setTextColor(...COLORS.grayText);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for your business!", pageWidth / 2, footerY, {
    align: "center",
  });
  doc.text(
    `${SHOP.name}  |  ${SHOP.phone}`,
    pageWidth / 2,
    footerY + 4,
    { align: "center" }
  );

  return doc;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${month}/${day}/${year}`;
}
