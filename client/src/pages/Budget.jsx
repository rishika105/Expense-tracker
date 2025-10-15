import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { getExpenseTotals } from "../services/expenseService";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const PRIMARY = "#2563eb"; // blue-600
const DANGER = "#ef4444"; // red-500
const REMAIN = "#e2e8f0"; // slate-200

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

export default function Budget() {
  const token = useSelector((s) => s?.auth?.token);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totals, setTotals] = useState(null);
  const [currency, setCurrency] = useState("INR");

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
        if (!ignore) setError(err?.message || "Failed to load budget info");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    if (token) run();
    return () => {
      ignore = true;
    };
  }, [token]);

  const budgetInfo = totals?.budgetInfo;
  const hasBudget =
    typeof budgetInfo?.budget === "number" && budgetInfo.budget > 0;
  const used =
    typeof budgetInfo?.currentPeriodTotal === "number"
      ? budgetInfo.currentPeriodTotal
      : 0;
  const remaining = hasBudget ? Math.max(0, budgetInfo.budget - used) : 0;
  const exceeded = hasBudget && used > budgetInfo.budget;

  const chartData = useMemo(() => {
    if (!hasBudget) return [];
    return [
      {
        name: exceeded ? "Over Budget" : "Used",
        value: exceeded ? budgetInfo.budget : used,
        color: exceeded ? DANGER : PRIMARY,
      },
      {
        name: exceeded ? "Exceeded" : "Remaining",
        value: exceeded ? used - budgetInfo.budget : remaining,
        color: exceeded ? PRIMARY : REMAIN,
      },
    ].filter((d) => d.value > 0);
  }, [hasBudget, used, remaining, exceeded, budgetInfo]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Budget</h1>
          <p className="text-slate-600 mt-2">
            Track your current {budgetInfo?.resetCycle || "monthly"} budget
            period and stay on target.
          </p>
        </header>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* Status + Donut */}
        <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Current period
                </h2>
                {hasBudget ? (
                  <p className="text-sm text-slate-600">
                    {budgetInfo?.periodDescription} •{" "}
                    {budgetInfo?.periodStart?.slice(0, 10)} to{" "}
                    {budgetInfo?.periodEnd?.slice(0, 10)}
                  </p>
                ) : (
                  <p className="text-sm text-slate-600">
                    You haven't set a budget yet. Set one in Preferences.
                  </p>
                )}
              </div>
              {hasBudget && (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    exceeded
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {exceeded ? "Over budget" : "On track"}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={80}
                      outerRadius={120}
                    >
                      {chartData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                      }}
                      formatter={(v, n) => [
                        formatCurrency(Number(v), currency),
                        n,
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col justify-center">
                <dl className="space-y-3">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-slate-600">Budget</dt>
                    <dd className="text-sm font-semibold text-slate-900">
                      {formatCurrency(budgetInfo?.budget || 0, currency)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-slate-600">Used</dt>
                    <dd
                      className={`text-sm font-semibold ${
                        exceeded ? "text-red-600" : "text-slate-900"
                      }`}
                    >
                      {formatCurrency(used, currency)} (
                      {budgetInfo?.percentageUsed || 0}%)
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-slate-600">
                      {exceeded ? "Exceeded by" : "Remaining"}
                    </dt>
                    <dd
                      className={`text-sm font-semibold ${
                        exceeded ? "text-red-600" : "text-slate-900"
                      }`}
                    >
                      {exceeded
                        ? formatCurrency(
                            used - (budgetInfo?.budget || 0),
                            currency
                          )
                        : formatCurrency(remaining, currency)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-slate-600">Reset cycle</dt>
                    <dd className="text-sm font-semibold capitalize text-slate-900">
                      {budgetInfo?.resetCycle || "-"}
                    </dd>
                  </div>
                </dl>
                {!hasBudget && (
                  <p className="mt-4 text-sm text-slate-600">
                    Set your budget in Preferences to start tracking over/under
                    status for each period.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-base font-semibold text-slate-900">
              Tips
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
              <li>
                Split large purchases across categories to keep insights
                accurate.
              </li>
              <li>
                Use notes on transactions to remember purpose and context.
              </li>
              <li>
                Review your top categories weekly to avoid end-of-period
                surprises.
              </li>
              <li>
                Adjust your budget if your average monthly spend changes
                significantly.
              </li>
            </ul>
          </div>
        </section>

        {/* FAQs */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-3 text-base font-semibold text-slate-900">FAQs</h3>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <p className="font-medium text-slate-900">
                How does multi-currency work?
              </p>
              <p className="text-sm text-slate-700">
                You can log expenses in any currency. We convert them to your
                base currency for analytics and totals. You can change the
                currency per transaction if needed.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <p className="font-medium text-slate-900">
                What is the budget reset cycle?
              </p>
              <p className="text-sm text-slate-700">
                Choose monthly, weekly, or yearly. We track used vs remaining
                within each period and reset automatically when the cycle
                completes.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <p className="font-medium text-slate-900">
                Can I change my budget mid-period?
              </p>
              <p className="text-sm text-slate-700">
                Yes. Updates take effect immediately and remaining values adjust
                based on the new budget.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <p className="font-medium text-slate-900">
                Where can I set or update my budget?
              </p>
              <p className="text-sm text-slate-700">
                Go to Preferences and set your base currency, budget,
                notifications, and reset cycle.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <p className="text-base font-semibold text-slate-900 mb-1">
                How is the date range formatted?
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                The date range follows the{" "}
                <span className="font-medium">ISO standard</span>: weeks start
                on <span className="font-medium">Monday</span> and end on{" "}
                <span className="font-medium">Sunday</span>. Each month runs
                from the{" "}
                <span className="font-medium">1st to the last day</span>, and
                the year is counted from
                <span className="font-medium"> January 1 to December 31</span>.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
