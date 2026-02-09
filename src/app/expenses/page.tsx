"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const CATEGORIES = [
  "Parts",
  "Tools & Equipment",
  "Rent",
  "Utilities",
  "Insurance",
  "Supplies",
  "Vendor / Wholesale",
  "Marketing",
  "Other",
];

interface Expense {
  id: string;
  date: string;
  category: string;
  vendor: string | null;
  description: string;
  amount: number;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching expenses:", error);
    } else {
      setExpenses(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase.from("expenses").insert({
        date,
        category,
        vendor: vendor || null,
        description,
        amount: parseFloat(amount),
      });

      if (error) throw error;

      setMessage({ type: "success", text: "Expense added!" });
      // Reset form
      setDescription("");
      setAmount("");
      setVendor("");
      // Refresh the list
      fetchExpenses();
    } catch (err) {
      console.error("Failed to save expense:", err);
      setMessage({
        type: "error",
        text: "Failed to save expense. Check your Supabase connection.",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm("Delete this expense?")) return;

    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete expense:", error);
    } else {
      setExpenses(expenses.filter((exp) => exp.id !== id));
    }
  };

  const totalExpenses = expenses.reduce(
    (sum, exp) => sum + Number(exp.amount),
    0
  );

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Expenses</h2>
        <p className="text-gray-500 mt-1">Track shop expenses</p>
      </div>

      {/* Add Expense Form */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Add Expense
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="expDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date *
              </label>
              <input
                type="date"
                id="expDate"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition"
              />
            </div>
            <div>
              <label
                htmlFor="expCategory"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category *
              </label>
              <select
                id="expCategory"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="expVendor"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Vendor
              </label>
              <input
                type="text"
                id="expVendor"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="AutoZone, O'Reilly, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition"
              />
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="expDescription"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description *
              </label>
              <input
                type="text"
                id="expDescription"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brake pads bulk order, shop rent, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition"
              />
            </div>
            <div>
              <label
                htmlFor="expAmount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  id="expAmount"
                  required
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition"
                />
              </div>
            </div>
          </div>

          {message && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm font-medium ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Add Expense"}
            </button>
          </div>
        </form>
      </section>

      {/* Expenses List */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            All Expenses
          </h3>
          <p className="text-sm text-gray-500">
            Total:{" "}
            <span className="font-bold text-gray-900">
              ${totalExpenses.toFixed(2)}
            </span>
          </p>
        </div>

        {loading ? (
          <p className="p-6 text-gray-500">Loading...</p>
        ) : expenses.length === 0 ? (
          <p className="p-12 text-center text-gray-500">
            No expenses recorded yet.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Date
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Category
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Description
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Vendor
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-3 text-sm text-gray-900">
                    {formatDate(exp.date)}
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700">
                    {exp.description}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {exp.vendor || "—"}
                  </td>
                  <td className="px-6 py-3 text-sm font-semibold text-gray-900 text-right">
                    ${Number(exp.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => deleteExpense(exp.id)}
                      className="text-gray-400 hover:text-red-500 transition text-sm"
                      title="Delete expense"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${month}/${day}/${year}`;
}
