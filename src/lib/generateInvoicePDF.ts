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

const BLACK: [number, number, number] = [0, 0, 0];
const GRAY: [number, number, number] = [120, 120, 120];

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // ── Header: Shop name + info (text only, no filled banner) ──
  doc.setTextColor(...BLACK);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(SHOP.name, margin, y);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(`${SHOP.address}  |  ${SHOP.phone}`, margin, y + 6);

  // Invoice label + date on right
  doc.setTextColor(...BLACK);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - margin, y, { align: "right" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(`Date: ${formatDate(data.date)}`, pageWidth - margin, y + 6, {
    align: "right",
  });

  // Thin line under header
  y += 12;
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;

  // ── Customer & Vehicle Info ──
  doc.setTextColor(...GRAY);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("CUSTOMER", margin, y);
  doc.text("PHONE", margin, y + 12);
  doc.text("VEHICLE", pageWidth / 2, y);

  doc.setTextColor(...BLACK);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(data.customerName, margin, y + 5);
  doc.text(data.customerPhone, margin, y + 17);
  doc.text(data.carModel || "—", pageWidth / 2, y + 5);

  y += 26;

  // Thin line
  doc.setDrawColor(...GRAY);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);

  y += 6;

  // ── Work Performed Table ──
  // Table header (text only, no fill)
  doc.setTextColor(...BLACK);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("WORK PERFORMED", margin, y);
  doc.text("PRICE", pageWidth - margin, y, { align: "right" });

  y += 2;
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Table rows (no alternating background)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  data.lineItems.forEach((item) => {
    doc.setTextColor(...BLACK);
    doc.text(item.description, margin + 2, y);
    doc.text(`$${item.price.toFixed(2)}`, pageWidth - margin - 2, y, {
      align: "right",
    });
    y += 7;
  });

  // Line above total
  doc.setDrawColor(...GRAY);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);

  // Total row (text only, no filled badge)
  y += 7;
  doc.setTextColor(...BLACK);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", pageWidth - margin - 55, y);
  doc.text(`$${data.total.toFixed(2)}`, pageWidth - margin - 2, y, {
    align: "right",
  });

  y += 12;

  // ── Warranty ──
  if (data.warranty && data.warranty !== "No Warranty") {
    doc.setTextColor(...GRAY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("WARRANTY", margin, y);

    doc.setTextColor(...BLACK);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(data.warranty, margin, y + 5);
    y += 14;
  }

  // ── Notes / Recommendations ──
  if (data.notes) {
    doc.setTextColor(...GRAY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("NOTES & MECHANIC RECOMMENDATIONS", margin, y);
    y += 5;

    doc.setTextColor(...BLACK);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const noteLines = doc.splitTextToSize(data.notes, contentWidth - 4);
    doc.text(noteLines, margin + 2, y);
    y += noteLines.length * 5 + 6;
  }

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(...GRAY);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setTextColor(...GRAY);
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
