"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type ViewMode = "weekly" | "monthly" | "yearly";

interface MonthlyData {
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface InvoiceRow {
  date: string;
  total: number;
}

interface ExpenseRow {
  date: string;
  amount: number;
}

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    revenue: 0,
    expenses: 0,
    profit: 0,
  });

  useEffect(() => {
    fetchData();
  }, [viewMode]);

  const fetchData = async () => {
    setLoading(true);

    const [invoicesRes, expensesRes] = await Promise.all([
      supabase
        .from("invoices")
        .select("date, total")
        .order("date", { ascending: true }),
      supabase
        .from("expenses")
        .select("date, amount")
        .order("date", { ascending: true }),
    ]);

    const invoices: InvoiceRow[] = (invoicesRes.data || []).map((r) => ({
      date: r.date,
      total: Number(r.total),
    }));
    const expenses: ExpenseRow[] = (expensesRes.data || []).map((r) => ({
      date: r.date,
      amount: Number(r.amount),
    }));

    const grouped = groupByPeriod(invoices, expenses, viewMode);
    setChartData(grouped);

    const totalRevenue = invoices.reduce((s, i) => s + i.total, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    setTotals({
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit: totalRevenue - totalExpenses,
    });

    setLoading(false);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 mt-1">Revenue, expenses & profit</p>
        </div>
        <div className="flex gap-2">
          {(["weekly", "monthly", "yearly"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                viewMode === mode
                  ? "bg-primary text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600">
            ${totals.revenue.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
          <p className="text-3xl font-bold text-red-500">
            ${totals.expenses.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Net Profit</p>
          <p
            className={`text-3xl font-bold ${
              totals.profit >= 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            ${totals.profit.toFixed(2)}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : chartData.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">
            No data yet. Create invoices and add expenses to see trends.
          </p>
        </div>
      ) : (
        <>
          {/* Revenue vs Expenses Bar Chart */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Revenue vs Expenses
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  formatter={(value) => `$${Number(value ?? 0).toFixed(2)}`}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </section>

          {/* Profit Trend Line Chart */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Profit Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  formatter={(value) => `$${Number(value ?? 0).toFixed(2)}`}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Profit"
                  stroke="#1e40af"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#1e40af" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </section>
        </>
      )}
    </div>
  );
}

// ── Helper: group invoices & expenses into time buckets ──

function groupByPeriod(
  invoices: InvoiceRow[],
  expenses: ExpenseRow[],
  mode: ViewMode
): MonthlyData[] {
  const revenueMap = new Map<string, number>();
  const expenseMap = new Map<string, number>();

  for (const inv of invoices) {
    const key = getKey(inv.date, mode);
    revenueMap.set(key, (revenueMap.get(key) || 0) + inv.total);
  }

  for (const exp of expenses) {
    const key = getKey(exp.date, mode);
    expenseMap.set(key, (expenseMap.get(key) || 0) + exp.amount);
  }

  // Merge all keys
  const allKeys = new Set([...revenueMap.keys(), ...expenseMap.keys()]);
  const sorted = [...allKeys].sort();

  return sorted.map((key) => {
    const revenue = revenueMap.get(key) || 0;
    const exp = expenseMap.get(key) || 0;
    return {
      label: formatLabel(key, mode),
      revenue,
      expenses: exp,
      profit: revenue - exp,
    };
  });
}

function getKey(dateStr: string, mode: ViewMode): string {
  const d = new Date(dateStr + "T00:00:00");
  if (mode === "yearly") {
    return `${d.getFullYear()}`;
  }
  if (mode === "monthly") {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  // weekly — use ISO week start (Monday)
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().split("T")[0];
}

function formatLabel(key: string, mode: ViewMode): string {
  if (mode === "yearly") return key;
  if (mode === "monthly") {
    const [year, month] = key.split("-");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return `${months[parseInt(month) - 1]} ${year}`;
  }
  // weekly — show "Mon DD" of the week start
  const d = new Date(key + "T00:00:00");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}
