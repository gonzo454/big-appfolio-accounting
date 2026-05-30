"use client";

import { useEffect, useState, useRef, useCallback, Fragment } from "react";
import { ExportButtons } from "@/components/ExportButtons";

interface Account {
  name: string;
  number: string;
  amount: number;
  mtd: number;
  ytd: number;
  lastYearAmount: number;
}

interface Transaction {
  date: string;
  vendor: string;
  property: string;
  description: string;
  amount: number;
}

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
}

const fmt = (n: number) =>
  "$" +
  Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const pct = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(1) + "%";

function firstOfYear() {
  return `${new Date().getFullYear()}-01-01`;
}
function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function BigPnlPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [revenueAccounts, setRevenueAccounts] = useState<Account[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(firstOfYear());
  const [to, setTo] = useState(todayStr());
  const initialized = useRef(false);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<Transaction[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expandedAccountTotal, setExpandedAccountTotal] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/big-management?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => {
        setSummary(d.summary || null);
        setRevenueAccounts(d.revenueAccounts || []);
        setExpenseAccounts(d.expenseAccounts || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    load();
  }, [load]);

  function toggleDrillDown(accountNum: string, accountAmount: number) {
    if (expanded === accountNum) {
      setExpanded(null);
      setDetail([]);
      return;
    }
    setExpanded(accountNum);
    setExpandedAccountTotal(Math.abs(accountAmount));
    setDetailLoading(true);
    const params = new URLSearchParams({ account: accountNum });
    params.set("from", from);
    params.set("to", to);
    fetch(`/api/big-management/detail?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setDetail(d.transactions || []))
      .catch(() => setDetail([]))
      .finally(() => setDetailLoading(false));
  }

  const allRows = [
    ...revenueAccounts.map((a) => ({ ...a, section: "Revenue" })),
    ...expenseAccounts.map((a) => ({
      ...a,
      section: "Expense",
      ytd: Math.abs(a.ytd),
      mtd: Math.abs(a.mtd),
      lastYearAmount: Math.abs(a.lastYearAmount),
    })),
  ];

  function renderDrillDown() {
    return (
      <tr>
        <td colSpan={6} className="p-0">
          <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 border-t border-gray-200 dark:border-gray-600">
            {detailLoading ? (
              <p className="text-xs text-gray-500 py-1">Loading...</p>
            ) : detail.length === 0 ? (
              <p className="text-xs text-gray-400 py-1">No transactions found</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left py-1 pr-2 font-medium">Date</th>
                    <th className="text-left py-1 pr-2 font-medium">Vendor / Payee</th>
                    <th className="text-left py-1 pr-2 font-medium">Property</th>
                    <th className="text-left py-1 pr-2 font-medium">Description</th>
                    <th className="text-right py-1 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {detail.map((t, i) => (
                    <tr key={i} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                      <td className="py-1 pr-2 text-gray-500 whitespace-nowrap">{t.date || "—"}</td>
                      <td className="py-1 pr-2 text-gray-900 dark:text-white font-medium">{t.vendor}</td>
                      <td className="py-1 pr-2 text-gray-600 dark:text-gray-300">{t.property || "—"}</td>
                      <td className="py-1 pr-2 text-gray-500 truncate max-w-[150px]">{t.description || "—"}</td>
                      <td className="py-1 text-right font-mono text-gray-900 dark:text-white">{fmt(t.amount)}</td>
                    </tr>
                  ))}
                  {(() => {
                    const detailSum = detail.reduce((s, t) => s + t.amount, 0);
                    const remainder = expandedAccountTotal - detailSum;
                    if (Math.abs(remainder) < 0.01) return null;
                    return (
                      <tr className="bg-gray-100 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600">
                        <td className="py-1 pr-2 text-gray-400">—</td>
                        <td colSpan={3} className="py-1 pr-2 text-gray-500 italic">
                          Payroll, journal entries & other
                        </td>
                        <td className="py-1 text-right font-mono text-gray-500 italic">{fmt(remainder)}</td>
                      </tr>
                    );
                  })()}
                  <tr className="border-t-2 border-gray-300 dark:border-gray-500 font-semibold">
                    <td className="py-1 pr-2" />
                    <td colSpan={3} className="py-1 pr-2 text-gray-700 dark:text-gray-200">Total</td>
                    <td className="py-1 text-right font-mono text-gray-900 dark:text-white">{fmt(expandedAccountTotal)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          BIG Management — P&L Statement
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Profit & Loss for Blackdeer Investment Group as a management company
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {allRows.length > 0 && (
          <ExportButtons
            fileName="BIG_Management_PnL"
            title="BIG Management P&L Statement"
            headers={["Section", "Account", "Number", "MTD", "YTD", "Last Year YTD"]}
            rows={allRows.map((a) => [
              a.section,
              a.name,
              a.number,
              fmt(a.mtd),
              fmt(a.ytd),
              fmt(a.lastYearAmount),
            ])}
          />
        )}
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border rounded px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border rounded px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
          <button
            onClick={() => {
              load();
            }}
            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : !summary ? (
        <div className="text-center py-20 text-gray-500">No data available</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
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
                    YoY
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {/* Revenue Header */}
                <tr className="bg-green-50 dark:bg-green-900/20">
                  <td
                    colSpan={6}
                    className="px-4 py-2 font-bold text-green-700 dark:text-green-400"
                  >
                    Revenue
                  </td>
                </tr>
                {revenueAccounts.map((a) => {
                  const yoy =
                    a.lastYearAmount !== 0
                      ? ((a.ytd - a.lastYearAmount) / Math.abs(a.lastYearAmount)) *
                        100
                      : 0;
                  const isOpen = expanded === a.number;
                  return (
                    <Fragment key={a.number}>
                      <tr
                        className="hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
                        onClick={() => toggleDrillDown(a.number, a.ytd)}
                      >
                        <td className="px-4 py-2 pl-8 text-gray-900 dark:text-white">
                          <span className="text-xs text-gray-400 mr-1">
                            {isOpen ? "▼" : "▶"}
                          </span>
                          {a.name}
                        </td>
                        <td className="px-4 py-2 text-gray-500 font-mono text-xs">
                          {a.number}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-gray-900 dark:text-white">
                          {fmt(a.mtd)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-green-600">
                          {fmt(a.ytd)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-gray-500">
                          {fmt(a.lastYearAmount)}
                        </td>
                        <td
                          className={`px-4 py-2 text-right font-mono text-sm ${
                            yoy > 0
                              ? "text-green-600"
                              : yoy < 0
                              ? "text-red-600"
                              : "text-gray-400"
                          }`}
                        >
                          {a.lastYearAmount !== 0 ? pct(yoy) : "—"}
                        </td>
                      </tr>
                      {isOpen && renderDrillDown()}
                    </Fragment>
                  );
                })}
                {/* Revenue Total */}
                <tr className="bg-green-50 dark:bg-green-900/20 font-bold border-t-2 border-green-200 dark:border-green-800">
                  <td className="px-4 py-2 text-green-700 dark:text-green-400">
                    Total Revenue
                  </td>
                  <td />
                  <td className="px-4 py-2 text-right font-mono text-green-700">
                    {fmt(revenueAccounts.reduce((s, a) => s + a.mtd, 0))}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-green-700">
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

                {/* Spacer */}
                <tr>
                  <td colSpan={6} className="py-2" />
                </tr>

                {/* Expense Header */}
                <tr className="bg-red-50 dark:bg-red-900/20">
                  <td
                    colSpan={6}
                    className="px-4 py-2 font-bold text-red-700 dark:text-red-400"
                  >
                    Expenses
                  </td>
                </tr>
                {expenseAccounts
                  .slice()
                  .sort((a, b) => Math.abs(b.ytd) - Math.abs(a.ytd))
                  .map((a) => {
                    const absYtd = Math.abs(a.ytd);
                    const absLY = Math.abs(a.lastYearAmount);
                    const yoy =
                      absLY !== 0 ? ((absYtd - absLY) / absLY) * 100 : 0;
                    const isOpen = expanded === a.number;
                    return (
                      <Fragment key={a.number}>
                        <tr
                          className="hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
                          onClick={() => toggleDrillDown(a.number, a.ytd)}
                        >
                          <td className="px-4 py-2 pl-8 text-gray-900 dark:text-white">
                            <span className="text-xs text-gray-400 mr-1">
                              {isOpen ? "▼" : "▶"}
                            </span>
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
                            className={`px-4 py-2 text-right font-mono text-sm ${
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
                        {isOpen && renderDrillDown()}
                      </Fragment>
                    );
                  })}
                {/* Expense Total */}
                <tr className="bg-red-50 dark:bg-red-900/20 font-bold border-t-2 border-red-200 dark:border-red-800">
                  <td className="px-4 py-2 text-red-700 dark:text-red-400">
                    Total Expenses
                  </td>
                  <td />
                  <td className="px-4 py-2 text-right font-mono text-red-700">
                    {fmt(
                      expenseAccounts.reduce(
                        (s, a) => s + Math.abs(a.mtd),
                        0
                      )
                    )}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-red-700">
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

                {/* Spacer */}
                <tr>
                  <td colSpan={6} className="py-2" />
                </tr>

                {/* Net Income */}
                <tr
                  className={`font-bold text-lg border-t-4 ${
                    summary.netIncome >= 0
                      ? "border-green-300 bg-green-100 dark:bg-green-900/30"
                      : "border-red-300 bg-red-100 dark:bg-red-900/30"
                  }`}
                >
                  <td
                    className={`px-4 py-3 ${
                      summary.netIncome >= 0
                        ? "text-green-800 dark:text-green-300"
                        : "text-red-800 dark:text-red-300"
                    }`}
                  >
                    Net Income
                  </td>
                  <td />
                  <td
                    className={`px-4 py-3 text-right font-mono ${
                      revenueAccounts.reduce((s, a) => s + a.mtd, 0) -
                        expenseAccounts.reduce(
                          (s, a) => s + Math.abs(a.mtd),
                          0
                        ) >=
                      0
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {(() => {
                      const netMtd = revenueAccounts.reduce((s, a) => s + a.mtd, 0) -
                        expenseAccounts.reduce((s, a) => s + Math.abs(a.mtd), 0);
                      return (netMtd < 0 ? "-" : "") + fmt(netMtd);
                    })()}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono ${
                      summary.netIncome >= 0
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {summary.netIncome < 0 ? "-" : ""}
                    {fmt(summary.netIncome)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-500">
                    {summary.netIncomeLY < 0 ? "-" : ""}
                    {fmt(summary.netIncomeLY)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono ${
                      summary.netIncomeChange >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {summary.netIncomeLY !== 0 ? pct(summary.netIncomeChange) : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
