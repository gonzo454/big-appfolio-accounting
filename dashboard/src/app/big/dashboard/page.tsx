"use client";

import { useEffect, useState, useRef } from "react";
import { ExportButtons } from "@/components/ExportButtons";

interface Summary {
  totalRevenue: number;
  totalRevenueLY: number;
  revenueChange: number;
  totalExpenses: number;
  totalExpensesLY: number;
  expenseChange: number;
  netIncome: number;
  netIncomeLY: number;
  netIncomeChange: number;
  mgmtFees: number;
  commissions: number;
  hotelStaffing: number;
}

interface Account {
  name: string;
  number: string;
  mtd: number;
  ytd: number;
  lastYearYtd: number;
}

const fmt = (n: number) =>
  "$" +
  Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const pct = (n: number) =>
  (n >= 0 ? "+" : "") + n.toFixed(1) + "%";

export default function BigDashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [revenueAccounts, setRevenueAccounts] = useState<Account[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    fetch("/api/big-management")
      .then((r) => r.json())
      .then((d) => {
        setSummary(d.summary || null);
        setRevenueAccounts(d.revenueAccounts || []);
        setExpenseAccounts(d.expenseAccounts || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const allAccounts = [...revenueAccounts, ...expenseAccounts];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          BIG Management Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Blackdeer Investment Group — Management Company Performance
        </p>
      </div>

      {allAccounts.length > 0 && (
        <ExportButtons
          fileName="BIG_Management"
          title="BIG Management Company — Financial Summary"
          headers={["Account", "Number", "MTD", "YTD", "Last Year YTD"]}
          rows={allAccounts.map((a) => [
            a.name,
            a.number,
            fmt(a.mtd),
            fmt(a.ytd),
            fmt(a.lastYearYtd),
          ])}
        />
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : !summary ? (
        <div className="text-center py-20 text-gray-500">
          No data available
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Total Revenue"
              value={summary.totalRevenue}
              change={summary.revenueChange}
              positive
            />
            <KpiCard
              label="Total Expenses"
              value={summary.totalExpenses}
              change={summary.expenseChange}
              invertColor
            />
            <KpiCard
              label="Net Income"
              value={summary.netIncome}
              change={summary.netIncomeChange}
              positive
            />
            <KpiCard
              label="Management Fees"
              value={summary.mgmtFees}
              subtitle="Core revenue stream"
            />
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <p className="text-xs font-medium text-gray-500 uppercase">
                Management & Asset Fees
              </p>
              <p
                className="font-bold text-green-600 mt-1"
                style={{ fontSize: "clamp(1rem, 2.5vw, 1.5rem)" }}
              >
                {fmt(summary.mgmtFees)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <p className="text-xs font-medium text-gray-500 uppercase">
                Leasing & Sale Commissions
              </p>
              <p
                className="font-bold text-blue-600 mt-1"
                style={{ fontSize: "clamp(1rem, 2.5vw, 1.5rem)" }}
              >
                {fmt(summary.commissions)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <p className="text-xs font-medium text-gray-500 uppercase">
                Hotel Staffing Revenue
              </p>
              <p
                className="font-bold text-purple-600 mt-1"
                style={{ fontSize: "clamp(1rem, 2.5vw, 1.5rem)" }}
              >
                {fmt(summary.hotelStaffing)}
              </p>
            </div>
          </div>

          {/* Revenue Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
              <h3 className="font-semibold text-green-700">
                Revenue — {revenueAccounts.length} accounts
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600 dark:text-gray-300">
                      Account
                    </th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600 dark:text-gray-300">
                      Number
                    </th>
                    <th className="text-right px-4 py-2 font-semibold text-gray-600 dark:text-gray-300">
                      MTD
                    </th>
                    <th className="text-right px-4 py-2 font-semibold text-gray-600 dark:text-gray-300">
                      YTD
                    </th>
                    <th className="text-right px-4 py-2 font-semibold text-gray-600 dark:text-gray-300">
                      Last Year YTD
                    </th>
                    <th className="text-right px-4 py-2 font-semibold text-gray-600 dark:text-gray-300">
                      YoY Change
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {revenueAccounts.map((a) => {
                    const yoy =
                      a.lastYearYtd !== 0
                        ? ((a.ytd - a.lastYearYtd) / Math.abs(a.lastYearYtd)) *
                          100
                        : 0;
                    return (
                      <tr
                        key={a.number}
                        className="hover:bg-gray-50 dark:hover:bg-gray-750"
                      >
                        <td className="px-4 py-2 text-gray-900 dark:text-white">
                          {a.name}
                        </td>
                        <td className="px-4 py-2 text-gray-500 font-mono text-xs">
                          {a.number}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-gray-900 dark:text-white">
                          {fmt(a.mtd)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-gray-900 dark:text-white">
                          {fmt(a.ytd)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-gray-500">
                          {fmt(a.lastYearYtd)}
                        </td>
                        <td
                          className={`px-4 py-2 text-right font-mono font-medium ${
                            yoy > 0
                              ? "text-green-600"
                              : yoy < 0
                              ? "text-red-600"
                              : "text-gray-400"
                          }`}
                        >
                          {a.lastYearYtd !== 0 ? pct(yoy) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-green-50 dark:bg-green-900/20 font-bold">
                    <td className="px-4 py-2 text-gray-900 dark:text-white">
                      Total Revenue
                    </td>
                    <td className="px-4 py-2" />
                    <td className="px-4 py-2 text-right font-mono text-gray-900 dark:text-white">
                      {fmt(
                        revenueAccounts.reduce((s, a) => s + a.mtd, 0)
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-gray-900 dark:text-white">
                      {fmt(summary.totalRevenue)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-gray-500">
                      {fmt(summary.totalRevenueLY)}
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-mono ${
                        summary.revenueChange >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {pct(summary.revenueChange)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Expenses */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
              <h3 className="font-semibold text-red-700">
                Expenses — {expenseAccounts.length} accounts
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600 dark:text-gray-300">
                      Account
                    </th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600 dark:text-gray-300">
                      Number
                    </th>
                    <th className="text-right px-4 py-2 font-semibold text-gray-600 dark:text-gray-300">
                      MTD
                    </th>
                    <th className="text-right px-4 py-2 font-semibold text-gray-600 dark:text-gray-300">
                      YTD
                    </th>
                    <th className="text-right px-4 py-2 font-semibold text-gray-600 dark:text-gray-300">
                      Last Year YTD
                    </th>
                    <th className="text-right px-4 py-2 font-semibold text-gray-600 dark:text-gray-300">
                      YoY Change
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {expenseAccounts
                    .slice()
                    .sort(
                      (a, b) => Math.abs(b.ytd) - Math.abs(a.ytd)
                    )
                    .map((a) => {
                      const absYtd = Math.abs(a.ytd);
                      const absLY = Math.abs(a.lastYearYtd);
                      const yoy =
                        absLY !== 0
                          ? ((absYtd - absLY) / absLY) * 100
                          : 0;
                      return (
                        <tr
                          key={a.number}
                          className="hover:bg-gray-50 dark:hover:bg-gray-750"
                        >
                          <td className="px-4 py-2 text-gray-900 dark:text-white">
                            {a.name}
                          </td>
                          <td className="px-4 py-2 text-gray-500 font-mono text-xs">
                            {a.number}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-red-600">
                            {fmt(Math.abs(a.mtd))}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-red-600">
                            {fmt(absYtd)}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-gray-500">
                            {fmt(absLY)}
                          </td>
                          <td
                            className={`px-4 py-2 text-right font-mono font-medium ${
                              yoy > 0
                                ? "text-red-600"
                                : yoy < 0
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                          >
                            {absLY !== 0 ? pct(yoy) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  <tr className="bg-red-50 dark:bg-red-900/20 font-bold">
                    <td className="px-4 py-2 text-gray-900 dark:text-white">
                      Total Expenses
                    </td>
                    <td className="px-4 py-2" />
                    <td className="px-4 py-2 text-right font-mono text-red-600">
                      {fmt(
                        expenseAccounts.reduce(
                          (s, a) => s + Math.abs(a.mtd),
                          0
                        )
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-red-600">
                      {fmt(summary.totalExpenses)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-gray-500">
                      {fmt(summary.totalExpensesLY)}
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-mono ${
                        summary.expenseChange > 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {pct(summary.expenseChange)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Net Income Bar */}
          <div
            className={`rounded-xl p-5 shadow-sm border text-center ${
              summary.netIncome >= 0
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            }`}
          >
            <p className="text-xs font-medium text-gray-500 uppercase">
              BIG Management Net Income (YTD)
            </p>
            <p
              className={`font-bold mt-1 ${
                summary.netIncome >= 0 ? "text-green-700" : "text-red-700"
              }`}
              style={{ fontSize: "clamp(1.25rem, 3vw, 2rem)" }}
            >
              {summary.netIncome < 0 ? "-" : ""}
              {fmt(summary.netIncome)}
            </p>
            {summary.netIncomeLY !== 0 && (
              <p
                className={`text-sm mt-1 ${
                  summary.netIncomeChange >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {pct(summary.netIncomeChange)} vs last year (
                {fmt(summary.netIncomeLY)})
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  change,
  subtitle,
  positive,
  invertColor,
}: {
  label: string;
  value: number;
  change?: number;
  subtitle?: string;
  positive?: boolean;
  invertColor?: boolean;
}) {
  const changeColor = (c: number) => {
    if (invertColor) return c > 0 ? "text-red-600" : "text-green-600";
    return c >= 0 ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
      <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
      <p
        className={`font-bold mt-1 ${
          positive
            ? value >= 0
              ? "text-green-600"
              : "text-red-600"
            : "text-gray-900 dark:text-white"
        }`}
        style={{ fontSize: "clamp(1rem, 2.5vw, 1.5rem)" }}
      >
        {value < 0 ? "-" : ""}
        {fmt(value)}
      </p>
      {change !== undefined && (
        <p className={`text-xs mt-1 ${changeColor(change)}`}>
          {pct(change)} YoY
        </p>
      )}
      {subtitle && (
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
