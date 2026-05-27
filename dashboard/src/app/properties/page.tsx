"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAppFolioData } from "@/lib/useAppFolioData";
import { fmt, fmtFull, sortDesc } from "@/lib/format";
import StatCard from "@/components/StatCard";
import PeriodToggle from "@/components/PeriodToggle";
import DataTable from "@/components/DataTable";

function PropertiesContent() {
  const searchParams = useSearchParams();
  const selectedProperty = searchParams.get("name");
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

  const properties = sortDesc(data.byProperty);

  if (selectedProperty) {
    const propertyTxns = data.transactions.filter(
      (t) => t.property_name === selectedProperty
    );
    const totalSpend = data.byProperty[selectedProperty] || 0;

    const vendorBreakdown: Record<string, number> = {};
    const glBreakdown: Record<string, number> = {};
    for (const t of propertyTxns) {
      const amt = parseFloat(t.payment_amount || "0");
      const vendor = t.payee_name || "Unknown";
      const gl = t.gl_account_name || "Uncategorized";
      vendorBreakdown[vendor] = (vendorBreakdown[vendor] || 0) + amt;
      glBreakdown[gl] = (glBreakdown[gl] || 0) + amt;
    }

    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <a
              href="/properties"
              className="text-sm text-zinc-500 hover:text-zinc-700"
            >
              &larr; All Properties
            </a>
            <h2 className="text-2xl font-semibold text-zinc-900 mt-1">
              {selectedProperty}
            </h2>
          </div>
          <PeriodToggle period={period} onChange={changePeriod} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Spend" value={fmt(totalSpend)} />
          <StatCard
            label="Transactions"
            value={propertyTxns.length.toString()}
          />
          <StatCard
            label="Vendors"
            value={Object.keys(vendorBreakdown).length.toString()}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <DataTable
            title="Vendors"
            rows={sortDesc(vendorBreakdown)}
            showAll
          />
          <DataTable
            title="GL Accounts"
            rows={sortDesc(glBreakdown)}
            showAll
          />
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
                    GL Account
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
                {propertyTxns
                  .sort(
                    (a, b) =>
                      new Date(b.occurred_date).getTime() -
                      new Date(a.occurred_date).getTime()
                  )
                  .map((t, i) => (
                    <tr key={i} className="hover:bg-zinc-50">
                      <td className="px-5 py-3 text-zinc-600">
                        {t.occurred_date}
                      </td>
                      <td className="px-5 py-3 text-zinc-900">
                        {t.payee_name}
                      </td>
                      <td className="px-5 py-3 text-zinc-600">
                        {t.gl_account_name}
                      </td>
                      <td className="px-5 py-3 text-zinc-400 max-w-xs truncate">
                        {t.remarks}
                      </td>
                      <td className="px-5 py-3 text-zinc-900 text-right font-medium">
                        {fmtFull(parseFloat(t.payment_amount || "0"))}
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
        <h2 className="text-2xl font-semibold text-zinc-900">Properties</h2>
        <PeriodToggle period={period} onChange={changePeriod} />
      </div>
      <DataTable
        title="All Properties by Spend"
        rows={properties}
        linkPrefix="/properties"
        showAll
      />
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <div className="text-zinc-400 text-sm">Loading...</div>
        </div>
      }
    >
      <PropertiesContent />
    </Suspense>
  );
}
