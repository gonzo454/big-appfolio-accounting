"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAppFolioData } from "@/lib/useAppFolioData";
import { fmt, fmtFull, sortDesc } from "@/lib/format";
import StatCard from "@/components/StatCard";
import PeriodToggle from "@/components/PeriodToggle";
import DataTable from "@/components/DataTable";

function GLContent() {
  const searchParams = useSearchParams();
  const selectedGL = searchParams.get("name");
  const { data, loading, error, period, changePeriod } = useAppFolioData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-zinc-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500 text-sm">{error || "No data"}</div>
      </div>
    );
  }

  const glAccounts = sortDesc(data.byGL);

  if (selectedGL) {
    const txns = data.glTransactions[selectedGL] || [];
    const totalSpend = data.byGL[selectedGL] || 0;

    const byVendor: Record<string, number> = {};
    const byProperty: Record<string, number> = {};
    for (const t of txns) {
      byVendor[t.vendor] = (byVendor[t.vendor] || 0) + t.amt;
      byProperty[t.prop] = (byProperty[t.prop] || 0) + t.amt;
    }

    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <a
              href="/gl"
              className="text-sm text-zinc-500 hover:text-zinc-700"
            >
              &larr; All GL Accounts
            </a>
            <h2 className="text-2xl font-semibold text-zinc-900 mt-1">
              {selectedGL}
            </h2>
          </div>
          <PeriodToggle period={period} onChange={changePeriod} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Spend" value={fmt(totalSpend)} />
          <StatCard
            label="Transactions"
            value={txns.length.toString()}
          />
          <StatCard
            label="Vendors"
            value={Object.keys(byVendor).length.toString()}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <DataTable title="By Vendor" rows={sortDesc(byVendor)} showAll />
          <DataTable title="By Property" rows={sortDesc(byProperty)} showAll />
        </div>

        <div className="bg-white rounded-xl border border-zinc-200">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h3 className="text-sm font-semibold text-zinc-900">
              All Transactions
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left">
                  <th className="px-5 py-3 font-medium text-zinc-500">Date</th>
                  <th className="px-5 py-3 font-medium text-zinc-500">
                    Vendor
                  </th>
                  <th className="px-5 py-3 font-medium text-zinc-500">
                    Property
                  </th>
                  <th className="px-5 py-3 font-medium text-zinc-500">
                    Remarks
                  </th>
                  <th className="px-5 py-3 font-medium text-zinc-500 text-right">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {txns
                  .sort((a, b) => b.amt - a.amt)
                  .map((t, i) => (
                    <tr key={i} className="hover:bg-zinc-50">
                      <td className="px-5 py-3 text-zinc-600">{t.date}</td>
                      <td className="px-5 py-3 text-zinc-900">{t.vendor}</td>
                      <td className="px-5 py-3 text-zinc-600">{t.prop}</td>
                      <td className="px-5 py-3 text-zinc-400 max-w-xs truncate">
                        {t.remarks}
                      </td>
                      <td className="px-5 py-3 text-zinc-900 text-right font-medium">
                        {fmtFull(t.amt)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold text-zinc-900">GL Accounts</h2>
        <PeriodToggle period={period} onChange={changePeriod} />
      </div>
      <DataTable
        title="All GL Accounts by Spend"
        rows={glAccounts}
        linkPrefix="/gl"
        showAll
      />
    </div>
  );
}

export default function GLPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <div className="text-zinc-400 text-sm">Loading...</div>
        </div>
      }
    >
      <GLContent />
    </Suspense>
  );
}
