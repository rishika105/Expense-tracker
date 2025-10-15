import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { getExpenses, getExpenseTotals } from "../services/expenseService";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { categories } from "../assets/data/categories";

const PRIMARY = "#2563eb"; // blue-600
const ACCENT = "#0ea5e9"; // sky-500
const SLATE_500 = "#64748b";
const SLATE_700 = "#334155";
const CATEGORY_COLORS = [
  "#2563eb",
  "#0ea5e9",
  "#059669",
  "#f59e0b",
  "#ef4444",
  "#14b8a6",
  "#8b5cf6",
  "#f97316",
  "#22c55e",
  "#06b6d4",
];

function formatCurrency(n, ccy = "INR") {
  if (typeof n !== "number") return "-";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: ccy,
    }).format(n);
  } catch {
    return `${ccy} ${n.toFixed(2)}`;
  }
}

function toYearMonth(dateStr) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabel(ym) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

// Helper for human-readable date range and quick-range utilities
function formatDateHuman(d) {
  if (!d) return "";

  // Handle both "2025-10-14" and "2025-10-14T00:00:00.000Z" formats
  const dateStr = d.includes("T") ? d.split("T")[0] : d;

  try {
    // Use the Date object to handle parsing consistently
    const date = new Date(dateStr + "T00:00:00"); // Add time to avoid timezone issues
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (e) {
    // Fallback to your original logic if Date parsing fails
    const [year, month, day] = dateStr.split("-").map(Number);
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${monthNames[month - 1]} ${day}, ${year}`;
  }
}

function formatRangeHuman(s, e) {
  return `${formatDateHuman(s)} to ${formatDateHuman(e)}`;
}
// Get current week (Monday to Sunday)
function getCurrentWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Calculate this Monday
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));

  // Calculate this Sunday
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  return {
    start: formatDateForInput(start), // Use local date
    end: formatDateForInput(end), // Use local date
  };
}

function getCurrentYearRange() {
  const now = new Date();
  const year = now.getFullYear();

  const start = new Date(year, 0, 1); // Jan 1
  const end = new Date(year, 11, 31); // Dec 31

  return {
    start: formatDateForInput(start),
    end: formatDateForInput(end),
  };
}

// Helper function to format dates for input[type="date"]
function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLastYearRange() {
  const now = new Date();
  const start = new Date(now.getFullYear() - 1, 0, 1); // Jan 1 of last year
  const end = new Date(now.getFullYear() - 1, 11, 31); // Dec 31 of last year
  return {
    start: formatDateForInput(start),
    end: formatDateForInput(end),
  };
}

export default function Analytics() {
  // token from auth slice
  const token = useSelector((s) => s?.auth?.token);

  // filters
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const r = getCurrentMonthRange(); // Change from week to month
    return r.start;
  });
  const [endDate, setEndDate] = useState(() => {
    const r = getCurrentMonthRange(); // Change from week to month
    return r.end;
  });
  const [rangeKey, setRangeKey] = useState("current-month"); // Update default
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totals, setTotals] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [currency, setCurrency] = useState("INR");

  // pagination for fetching more raw expenses if needed
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(200);
  const [hasNext, setHasNext] = useState(false);

  // fetch totals (week/month/year & budgetInfo)
  useEffect(() => {
    let ignore = false;
    async function run() {
      try {
        setError("");
        const data = await getExpenseTotals(token);
        if (!ignore) {
          setTotals(data);
          setCurrency(data?.currency || "INR");
        }
      } catch (err) {
        if (!ignore) setError(err?.message || "Failed to load totals");
      }
    }
    if (token) run();
    return () => {
      ignore = true;
    };
  }, [token]);

  // fetch expenses with filters
  useEffect(() => {
    let ignore = false;
    async function run() {
      try {
        setLoading(true);
        setError("");
        const filters = {
          page,
          limit,
          ...(category ? { category } : {}),
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
          sort: "date_desc",
        };
        const data = await getExpenses(filters, token);
        if (!ignore) {
          setExpenses(data?.expenses || []);
          setHasNext(Boolean(data?.pagination?.hasNext));
          setCurrency(data?.currency || "INR");
        }
      } catch (err) {
        if (!ignore) setError(err?.message || "Failed to load expenses");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    if (token) run();
    return () => {
      ignore = true;
    };
  }, [token, category, startDate, endDate, page, limit]);
  // This runs whenever startDate, endDate, category, page, or limit change
  // Fetches new expenses from API with the updated date range

  // derive category list from expenses


  // aggregate: monthly trend in base amounts if available otherwise amount
  const monthlyTrend = useMemo(() => {
    const map = new Map();
    for (const e of expenses) {
      const ym = toYearMonth(e.date);
      const val =
        typeof e.baseAmount === "number" ? e.baseAmount : Number(e.amount) || 0;
      map.set(ym, (map.get(ym) || 0) + val);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([ym, total]) => ({
        ym,
        label: monthLabel(ym),
        total: Number(total.toFixed(2)),
      }));
  }, [expenses]);

  // aggregate: category breakdown
  const categoryBreakdown = useMemo(() => {
    const map = new Map();
    for (const e of expenses) {
      const key = e.category || "Uncategorized";
      const val =
        typeof e.baseAmount === "number" ? e.baseAmount : Number(e.amount) || 0;
      map.set(key, (map.get(key) || 0) + val);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], idx) => ({
        name,
        value: Number(value.toFixed(2)),
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }));
  }, [expenses]);

  // aggregate: payment method bars
  const paymentBreakdown = useMemo(() => {
    const map = new Map();
    for (const e of expenses) {
      const key = e.paymentMethod || "Other";
      const val =
        typeof e.baseAmount === "number" ? e.baseAmount : Number(e.amount) || 0;
      map.set(key, (map.get(key) || 0) + val);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, total]) => ({ name, total: Number(total.toFixed(2)) }));
  }, [expenses]);

  const budgetInfo = totals?.budgetInfo;
  const week = totals?.totals?.week;
  const month = totals?.totals?.month;
  const year = totals?.totals?.year;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Analytics</h1>
            <p className="text-slate-600 mt-2">
              Insights across your spending. Filter by date and category to
              explore.
            </p>
          </div>
        </header>

        {/* Filters */}
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Start date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                End date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Items per fetch
              </label>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {[50, 100, 200, 500].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </section>

        {/* KPI Cards */}
        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">
              {week?.period || "This Week"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatCurrency(week?.total || 0, currency)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {week?.count || 0} transactions
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">
              {month?.period || "This Month"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatCurrency(month?.total || 0, currency)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {month?.count || 0} transactions
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">
              {year?.period || "This Year"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatCurrency(year?.total || 0, currency)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {year?.count || 0} transactions
            </p>
          </div>
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Category Breakdown (now primary, larger) */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Category breakdown
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">
                  {formatRangeHuman(startDate, endDate)}
                </span>
                <select
                  value={rangeKey}
                  onChange={(e) => {
                    const key = e.target.value;
                    const ranges = {
                      "current-week": getCurrentWeekRange,
                      "current-month": getCurrentMonthRange,
                      "current-year": getCurrentYearRange,
                      "last-year": getLastYearRange,
                    };
                    if (ranges[key]) {
                      const r = ranges[key]();
                      setStartDate(r.start); //here it triggers the filter to enter query for api
                      setEndDate(r.end);
                      setRangeKey(key);
                    }
                  }}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="current-week">Current Week</option>
                  <option value="current-month">This Month</option>
                  <option value="current-year">This Year</option>
                  <option value="last-year">Last Year</option>
                </select>
              </div>
            </div>
            <div className="h-[28rem]">
              {categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={170}
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                      }}
                      formatter={(val, n, props) => [
                        formatCurrency(Number(val), currency),
                        props?.payload?.name,
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <svg
                        className="h-8 w-8 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-slate-500">No data to represent</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Try selecting a different date range
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Trend (moved to side on lg) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 text-base font-semibold text-slate-900">
              Monthly spending trend
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fill: SLATE_700 }} />
                  <YAxis tick={{ fill: SLATE_700 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                    formatter={(value) => [
                      formatCurrency(Number(value), currency),
                      "Total",
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={PRIMARY}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Payment Method */}
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 text-base font-semibold text-slate-900">
            Spending by payment method
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fill: SLATE_700 }} />
                <YAxis tick={{ fill: SLATE_700 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                  formatter={(v) => [
                    formatCurrency(Number(v), currency),
                    "Total",
                  ]}
                />
                <Legend />
                <Bar dataKey="total" fill={ACCENT} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </main>
  );
}
