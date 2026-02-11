"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { generateInvoicePDF } from "@/lib/generateInvoicePDF";
import { supabase } from "@/lib/supabase";

interface LineItem {
  id: number;
  description: string;
  price: string;
}

type WarrantyOption = "none" | "6months" | "1year" | "2years" | "custom";

const warrantyLabels: Record<WarrantyOption, string> = {
  none: "No Warranty",
  "6months": "6 Months",
  "1year": "1 Year",
  "2years": "2 Years",
  custom: "Custom",
};

export default function InvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [carModel, setCarModel] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: 1, description: "", price: "" },
  ]);
  const [warranty, setWarranty] = useState<WarrantyOption>("6months");
  const [customWarranty, setCustomWarranty] = useState("");
  const [notes, setNotes] = useState("");
  const [nextId, setNextId] = useState(2);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [scannedBanner, setScannedBanner] = useState(false);

  // Load scanned invoice data from sessionStorage
  useEffect(() => {
    if (searchParams.get("from") !== "scan") return;

    const stored = sessionStorage.getItem("scannedInvoice");
    if (!stored) return;

    try {
      const data = JSON.parse(stored);
      sessionStorage.removeItem("scannedInvoice");

      if (data.customerName) setCustomerName(data.customerName);
      if (data.customerPhone) setCustomerPhone(data.customerPhone);
      if (data.carModel) setCarModel(data.carModel);
      if (data.date) setDate(data.date);
      if (data.notes) setNotes(data.notes);

      // Map warranty text to radio option
      if (data.warranty) {
        const warrantyMap: Record<string, WarrantyOption> = {
          "No Warranty": "none",
          "6 Months": "6months",
          "1 Year": "1year",
          "2 Years": "2years",
        };
        const matched = warrantyMap[data.warranty];
        if (matched) {
          setWarranty(matched);
        } else {
          setWarranty("custom");
          setCustomWarranty(data.warranty);
        }
      }

      // Load line items
      if (data.lineItems && data.lineItems.length > 0) {
        const items = data.lineItems.map(
          (item: { description: string; price: number }, i: number) => ({
            id: i + 1,
            description: item.description || "",
            price: item.price ? String(item.price) : "",
          })
        );
        setLineItems(items);
        setNextId(items.length + 1);
      }

      setScannedBanner(true);
    } catch {
      // Ignore parse errors
    }
  }, [searchParams]);

  const total = lineItems.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    return sum + price;
  }, 0);

  const addLineItem = () => {
    setLineItems([...lineItems, { id: nextId, description: "", price: "" }]);
    setNextId(nextId + 1);
  };

  const removeLineItem = (id: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLineItem = (
    id: number,
    field: "description" | "price",
    value: string
  ) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const saveDraft = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      setMessage({ type: "error", text: "Name and phone number are required for a draft." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const warrantyValue =
        warranty === "custom" ? customWarranty : warrantyLabels[warranty];

      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          customer_name: customerName,
          customer_phone: customerPhone,
          car_model: carModel || null,
          date,
          total,
          warranty: warrantyValue,
          notes: notes || null,
          status: "draft",
        })
        .select("id")
        .single();

      if (invoiceError) throw invoiceError;

      // Save any line items that have data
      const filledItems = lineItems.filter((item) => item.description.trim());
      if (filledItems.length > 0) {
        const { error: itemsError } = await supabase.from("line_items").insert(
          filledItems.map((item) => ({
            invoice_id: invoice.id,
            description: item.description,
            price: parseFloat(item.price) || 0,
          }))
        );
        if (itemsError) throw itemsError;
      }

      setMessage({ type: "success", text: "Draft saved! You can finish it later from the Invoices page." });
    } catch (err) {
      console.error("Failed to save draft:", err);
      setMessage({ type: "error", text: "Failed to save draft. Check your Supabase connection." });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const warrantyValue =
      warranty === "custom" ? customWarranty : warrantyLabels[warranty];

    const invoiceData = {
      customerName,
      customerPhone,
      carModel,
      date,
      lineItems: lineItems.map((item) => ({
        description: item.description,
        price: parseFloat(item.price) || 0,
      })),
      total,
      warranty: warrantyValue,
      notes,
    };

    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          customer_name: customerName,
          customer_phone: customerPhone,
          car_model: carModel,
          date,
          total,
          warranty: warrantyValue,
          notes: notes || null,
          status: "completed",
        })
        .select("id")
        .single();

      if (invoiceError) throw invoiceError;

      const { error: itemsError } = await supabase.from("line_items").insert(
        invoiceData.lineItems.map((item) => ({
          invoice_id: invoice.id,
          description: item.description,
          price: item.price,
        }))
      );

      if (itemsError) throw itemsError;

      const doc = generateInvoicePDF(invoiceData);
      const fileName = `Invoice_${customerName.replace(/\s+/g, "_")}_${date}.pdf`;
      doc.save(fileName);

      setMessage({ type: "success", text: "Invoice saved and PDF downloaded!" });
    } catch (err) {
      console.error("Failed to save invoice:", err);
      const doc = generateInvoicePDF(invoiceData);
      const fileName = `Invoice_${customerName.replace(/\s+/g, "_")}_${date}.pdf`;
      doc.save(fileName);

      setMessage({
        type: "error",
        text: "PDF downloaded, but failed to save to database. Check your Supabase connection.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Scanned data banner */}
      {scannedBanner && (
        <div className="p-4 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-sm font-medium flex items-center justify-between">
          <span>Auto-filled from scanned invoice. Review the data and make any corrections.</span>
          <button
            type="button"
            onClick={() => setScannedBanner(false)}
            className="text-blue-600 hover:text-blue-800 font-bold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* Customer & Vehicle Info */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
            1
          </span>
          Customer & Vehicle Info
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="customerName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Customer Name *
            </label>
            <input
              type="text"
              id="customerName"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition"
            />
          </div>
          <div>
            <label
              htmlFor="customerPhone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number *
            </label>
            <input
              type="tel"
              id="customerPhone"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="(714) 555-1234"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition"
            />
          </div>
          <div>
            <label
              htmlFor="carModel"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Car Model
            </label>
            <input
              type="text"
              id="carModel"
              value={carModel}
              onChange={(e) => setCarModel(e.target.value)}
              placeholder="2020 Honda Civic"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition"
            />
          </div>
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date *
            </label>
            <input
              type="date"
              id="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition"
            />
          </div>
        </div>

        {/* Save Draft — right after customer info */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={saveDraft}
            disabled={saving}
            className="px-5 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-primary hover:text-primary transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save as Draft — finish later"}
          </button>
          <p className="text-xs text-gray-400 mt-1">Only name and phone required</p>
        </div>
      </section>

      {/* Work Done / Line Items */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
            2
          </span>
          Work Performed
        </h2>
        <div className="space-y-3">
          {lineItems.map((item, index) => (
            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className="text-sm text-gray-400 w-6 text-right hidden sm:block">
                {index + 1}.
              </span>
              <span className="text-sm text-gray-400 sm:hidden">
                Item {index + 1}
              </span>
              <input
                type="text"
                required
                value={item.description}
                onChange={(e) =>
                  updateLineItem(item.id, "description", e.target.value)
                }
                placeholder="Oil change, brake pads, etc."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition"
              />
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) =>
                      updateLineItem(item.id, "price", e.target.value)
                    }
                    placeholder="0.00"
                    className="w-full sm:w-32 pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeLineItem(item.id)}
                  disabled={lineItems.length === 1}
                  className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Remove item"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addLineItem}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-light transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Add Line Item
        </button>

        {/* Total */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
          <div className="text-right">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-3xl font-bold text-gray-900">
              ${total.toFixed(2)}
            </p>
          </div>
        </div>
      </section>

      {/* Warranty */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
            3
          </span>
          Warranty
        </h2>
        <div className="flex flex-wrap gap-3">
          {(
            Object.keys(warrantyLabels) as WarrantyOption[]
          ).map((option) => (
            <label
              key={option}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition ${
                warranty === option
                  ? "border-primary bg-blue-50 text-primary font-medium"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                name="warranty"
                value={option}
                checked={warranty === option}
                onChange={() => setWarranty(option)}
                className="sr-only"
              />
              {warrantyLabels[option]}
            </label>
          ))}
        </div>
        {warranty === "custom" && (
          <div className="mt-4">
            <label
              htmlFor="customWarranty"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Custom Warranty Description
            </label>
            <input
              type="text"
              id="customWarranty"
              value={customWarranty}
              onChange={(e) => setCustomWarranty(e.target.value)}
              placeholder="e.g., 3 months on labor, 1 year on parts"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition"
            />
          </div>
        )}
      </section>

      {/* Notes / Recommendations */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
            4
          </span>
          Notes & Mechanic Recommendations
        </h2>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Recommend transmission flush at 100k miles. Front tires showing wear — suggest replacement within 3 months."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition resize-y"
        />
      </section>

      {/* Status Message */}
      {message && (
        <div
          className={`p-4 rounded-lg text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => {
            if (confirm("Clear the form?")) {
              setCustomerName("");
              setCustomerPhone("");
              setCarModel("");
              setDate(new Date().toISOString().split("T")[0]);
              setLineItems([{ id: 1, description: "", price: "" }]);
              setNextId(2);
              setWarranty("6months");
              setCustomWarranty("");
              setNotes("");
            }
          }}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
        >
          Clear Form
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Create Invoice"}
        </button>
      </div>
    </form>
  );
}
