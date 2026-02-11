"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { generateInvoicePDF } from "@/lib/generateInvoicePDF";

interface LineItem {
  id: string;
  description: string;
  price: number;
}

interface Invoice {
  id: string;
  customer_name: string;
  customer_phone: string;
  car_model: string;
  date: string;
  total: number;
  warranty: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  line_items: LineItem[];
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoice() {
      const { data, error: fetchError } = await supabase
        .from("invoices")
        .select("*, line_items(*)")
        .eq("id", params.id)
        .single();

      if (fetchError) {
        setError("Invoice not found.");
        console.error(fetchError);
      } else {
        setInvoice(data as Invoice);
      }
      setLoading(false);
    }
    fetchInvoice();
  }, [params.id]);

  const handleDownloadPDF = () => {
    if (!invoice) return;

    const doc = generateInvoicePDF({
      customerName: invoice.customer_name,
      customerPhone: invoice.customer_phone,
      carModel: invoice.car_model,
      date: invoice.date,
      lineItems: invoice.line_items.map((item) => ({
        description: item.description,
        price: Number(item.price),
      })),
      total: Number(invoice.total),
      warranty: invoice.warranty || "No Warranty",
      notes: invoice.notes || "",
    });

    const fileName = `Invoice_${invoice.customer_name.replace(/\s+/g, "_")}_${invoice.date}.pdf`;
    doc.save(fileName);
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error || !invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">{error || "Invoice not found."}</p>
        <Link href="/invoices" className="text-primary hover:underline">
          Back to Invoices
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/invoices"
            className="text-sm text-primary hover:underline"
          >
            &larr; Back to Invoices
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Invoice for {invoice.customer_name}
            </h2>
            {invoice.status === "draft" && (
              <span className="px-3 py-1 text-sm font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                Draft
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm">
            Created {formatDate(invoice.date)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {invoice.status === "draft" && (
            <Link
              href={`/invoices/${invoice.id}/edit`}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition shadow-sm"
            >
              Edit & Complete
            </Link>
          )}
          <button
            onClick={handleDownloadPDF}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition shadow-sm"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Customer & Vehicle */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
          Customer & Vehicle
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-400">Name</p>
            <p className="text-base font-medium text-gray-900">
              {invoice.customer_name}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Phone</p>
            <p className="text-base font-medium text-gray-900">
              {invoice.customer_phone}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Vehicle</p>
            <p className="text-base font-medium text-gray-900">
              {invoice.car_model}
            </p>
          </div>
        </div>
      </section>

      {/* Work Performed */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">
            Work Performed
          </h3>
        </div>
        <table className="w-full">
          <tbody className="divide-y divide-gray-100">
            {invoice.line_items.map((item, i) => (
              <tr key={item.id || i}>
                <td className="px-6 py-3 text-sm text-gray-900">
                  {item.description}
                </td>
                <td className="px-6 py-3 text-sm font-semibold text-gray-900 text-right">
                  ${Number(item.price).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t border-gray-200">
              <td className="px-6 py-3 text-sm font-bold text-gray-900">
                Total
              </td>
              <td className="px-6 py-3 text-lg font-bold text-gray-900 text-right">
                ${Number(invoice.total).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* Warranty & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Warranty
          </h3>
          <p className="text-base text-gray-900">
            {invoice.warranty || "No Warranty"}
          </p>
        </section>
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Notes & Recommendations
          </h3>
          <p className="text-base text-gray-700">
            {invoice.notes || "None"}
          </p>
        </section>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${month}/${day}/${year}`;
}
