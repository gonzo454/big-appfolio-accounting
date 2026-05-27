"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAppFolioData } from "@/lib/useAppFolioData";
import { fmt, fmtFull, sortDesc } from "@/lib/format";
import StatCard from "@/components/StatCard";
import PeriodToggle from "@/components/PeriodToggle";
import DataTable from "@/components/DataTable";

function VendorsContent() {
  const searchParams = useSearchParams();
  const selectedVendor = searchParams.get("name");
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

  const vendors = sortDesc(data.byVendor);

  if (selectedVendor) {
    const detail = data.vendorDetail[selectedVendor] || {};
    const totalSpend = data.byVendor[selectedVendor] || 0;

    const glBreakdown = Object.entries(detail)
      .map(([gl, d]) => [gl, d.total] as [string, number])
      .sort((a, b) => b[1] - a[1]);

    const vendorTxns = data.transactions.filter(
      (t) => t.payee_name === selectedVendor
    );

    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <a
              href="/vendors"
              className="text-sm text-zinc-500 hover:text-zinc-700"
            >
              &larr; All Vendors
            </a>
            <h2 className="text-2xl font-semibold text-zinc-900 mt-1">
              {selectedVendor}
            </h2>
          </div>
          <PeriodToggle period={period} onChange={changePeriod} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Spend" value={fmt(totalSpend)} />
          <StatCard
            label="GL Categories"
            value={glBreakdown.length.toString()}
          />
          <StatCard
            label="Transactions"
            value={vendorTxns.length.toString()}
          />
        </div>

        <div className="mb-8">
          <DataTable title="Spend by GL Account" rows={glBreakdown} showAll />
        </div>

        {glBreakdown.map(([gl]) => {
          const glDetail = detail[gl];
          if (!glDetail) return null;
          const propEntries = sortDesc(glDetail.properties);
          if (propEntries.length <= 1) return null;
          return (
            <div key={gl} className="mb-4">
              <DataTable
                title={`${gl} — by Property`}
                rows={propEntries}
                showAll
              />
            </div>
          );
        })}

        <div className="bg-white rounded-xl border border-zinc-200 mt-6">
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
                    Property
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
                {vendorTxns
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
                        {t.property_name}
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
        <h2 className="text-2xl font-semibold text-zinc-900">Vendors</h2>
        <PeriodToggle period={period} onChange={changePeriod} />
      </div>
      <DataTable
        title="All Vendors by Spend"
        rows={vendors}
        linkPrefix="/vendors"
        showAll
      />
    </div>
  );
}

export default function VendorsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <div className="text-zinc-400 text-sm">Loading...</div>
        </div>
      }
    >
      <VendorsContent />
    </Suspense>
  );
}
