"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { generateInvoicePDF } from "@/lib/generateInvoicePDF";

type WarrantyOption = "none" | "6months" | "1year" | "2years" | "custom";

const warrantyLabels: Record<WarrantyOption, string> = {
  none: "No Warranty",
  "6months": "6 Months",
  "1year": "1 Year",
  "2years": "2 Years",
  custom: "Custom",
};

const warrantyReverse: Record<string, WarrantyOption> = {
  "No Warranty": "none",
  "6 Months": "6months",
  "1 Year": "1year",
  "2 Years": "2years",
};

interface LineItem {
  id: string;
  description: string;
  price: string;
}

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [carModel, setCarModel] = useState("");
  const [date, setDate] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [warranty, setWarranty] = useState<WarrantyOption>("6months");
  const [customWarranty, setCustomWarranty] = useState("");
  const [notes, setNotes] = useState("");
  const [nextId, setNextId] = useState(1);
  const [status, setStatus] = useState<string>("draft");

  useEffect(() => {
    async function fetchInvoice() {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, line_items(*)")
        .eq("id", params.id)
        .single();

      if (error || !data) {
        setLoading(false);
        return;
      }

      setCustomerName(data.customer_name);
      setCustomerPhone(data.customer_phone);
      setCarModel(data.car_model || "");
      setDate(data.date);
      setNotes(data.notes || "");
      setStatus(data.status || "draft");

      // Resolve warranty
      const w = data.warranty || "No Warranty";
      if (warrantyReverse[w]) {
        setWarranty(warrantyReverse[w]);
      } else {
        setWarranty("custom");
        setCustomWarranty(w);
      }

      // Load line items
      const items = (data.line_items || []).map((li: { id: string; description: string; price: number }, i: number) => ({
        id: li.id || `existing-${i}`,
        description: li.description,
        price: String(Number(li.price)),
      }));

      if (items.length === 0) {
        items.push({ id: "new-1", description: "", price: "" });
        setNextId(2);
      } else {
        setNextId(items.length + 1);
      }

      setLineItems(items);
      setLoading(false);
    }
    fetchInvoice();
  }, [params.id]);

  const total = lineItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

  const addLineItem = () => {
    setLineItems([...lineItems, { id: `new-${nextId}`, description: "", price: "" }]);
    setNextId(nextId + 1);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, field: "description" | "price", value: string) => {
    setLineItems(lineItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const warrantyValue = warranty === "custom" ? customWarranty : warrantyLabels[warranty];

    try {
      // Update invoice
      const { error: updateError } = await supabase
        .from("invoices")
        .update({
          customer_name: customerName,
          customer_phone: customerPhone,
          car_model: carModel,
          date,
          total,
          warranty: warrantyValue,
          notes: notes || null,
          status: "completed",
        })
        .eq("id", params.id);

      if (updateError) throw updateError;

      // Delete old line items and insert new ones
      await supabase.from("line_items").delete().eq("invoice_id", params.id);

      const filledItems = lineItems.filter((item) => item.description.trim());
      if (filledItems.length > 0) {
        const { error: itemsError } = await supabase.from("line_items").insert(
          filledItems.map((item) => ({
            invoice_id: params.id,
            description: item.description,
            price: parseFloat(item.price) || 0,
          }))
        );
        if (itemsError) throw itemsError;
      }

      // Generate PDF
      const doc = generateInvoicePDF({
        customerName,
        customerPhone,
        carModel,
        date,
        lineItems: filledItems.map((item) => ({
          description: item.description,
          price: parseFloat(item.price) || 0,
        })),
        total,
        warranty: warrantyValue,
        notes,
      });
      doc.save(`Invoice_${customerName.replace(/\s+/g, "_")}_${date}.pdf`);

      setMessage({ type: "success", text: status === "draft" ? "Invoice completed and PDF downloaded!" : "Invoice updated and PDF downloaded!" });
      setTimeout(() => router.push(`/invoices/${params.id}`), 1500);
    } catch (err) {
      console.error("Failed to update invoice:", err);
      setMessage({ type: "error", text: "Failed to update invoice." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <div className="mb-6">
        <Link href={`/invoices/${params.id}`} className="text-sm text-primary hover:underline">
          &larr; Back to Invoice
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 mt-2">Edit Invoice</h2>
        <p className="text-gray-500 text-sm">
          {status === "draft" ? "Complete the draft and generate the PDF" : "Update the invoice details"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Customer & Vehicle */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer & Vehicle Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input type="tel" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Car Model *</label>
              <input type="text" required value={carModel} onChange={(e) => setCarModel(e.target.value)} placeholder="2020 Honda Civic"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition" />
            </div>
          </div>
        </section>

        {/* Line Items */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Performed</h3>
          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <span className="text-sm text-gray-400 w-6 text-right hidden sm:block">{index + 1}.</span>
                <span className="text-sm text-gray-400 sm:hidden">Item {index + 1}</span>
                <input type="text" required value={item.description} onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                  placeholder="Oil change, brake pads, etc."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition" />
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:flex-none">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input type="number" required min="0" step="0.01" value={item.price}
                      onChange={(e) => updateLineItem(item.id, "price", e.target.value)} placeholder="0.00"
                      className="w-full sm:w-32 pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition" />
                  </div>
                  <button type="button" onClick={() => removeLineItem(item.id)} disabled={lineItems.length === 1}
                    className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition" title="Remove">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addLineItem}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-light transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Line Item
          </button>
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-3xl font-bold text-gray-900">${total.toFixed(2)}</p>
            </div>
          </div>
        </section>

        {/* Warranty */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Warranty</h3>
          <div className="flex flex-wrap gap-3">
            {(Object.keys(warrantyLabels) as WarrantyOption[]).map((option) => (
              <label key={option} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition ${
                warranty === option ? "border-primary bg-blue-50 text-primary font-medium" : "border-gray-300 hover:border-gray-400"
              }`}>
                <input type="radio" name="warranty" value={option} checked={warranty === option}
                  onChange={() => setWarranty(option)} className="sr-only" />
                {warrantyLabels[option]}
              </label>
            ))}
          </div>
          {warranty === "custom" && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom Warranty Description</label>
              <input type="text" value={customWarranty} onChange={(e) => setCustomWarranty(e.target.value)}
                placeholder="e.g., 3 months on labor, 1 year on parts"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition" />
            </div>
          )}
        </section>

        {/* Notes */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes & Mechanic Recommendations</h3>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
            placeholder="Recommend transmission flush at 100k miles..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition resize-y" />
        </section>

        {message && (
          <div className={`p-4 rounded-lg text-sm font-medium ${
            message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Link href={`/invoices/${params.id}`}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
            Cancel
          </Link>
          <button type="submit" disabled={saving}
            className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? "Saving..." : status === "draft" ? "Complete Invoice & Download PDF" : "Save Changes & Download PDF"}
          </button>
        </div>
      </form>
    </div>
  );
}
