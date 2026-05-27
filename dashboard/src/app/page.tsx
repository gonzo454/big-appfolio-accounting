"use client";

import { useAppFolioData } from "@/lib/useAppFolioData";
import { fmt, sortDesc } from "@/lib/format";
import StatCard from "@/components/StatCard";
import DataTable from "@/components/DataTable";
import PeriodToggle from "@/components/PeriodToggle";

export default function OverviewPage() {
  const { data, loading, error, period, changePeriod } = useAppFolioData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-zinc-400 text-sm">Loading financial data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <p className="text-sm font-medium text-red-800">Error loading data</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const properties = sortDesc(data.byProperty);
  const vendors = sortDesc(data.byVendor);
  const glAccounts = sortDesc(data.byGL);
  const uniqueProperties = Object.keys(data.byProperty).length;
  const uniqueVendors = Object.keys(data.byVendor).length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">
            Financial Overview
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {data.dateRange.from} — {data.dateRange.to}
          </p>
        </div>
        <PeriodToggle period={period} onChange={changePeriod} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Disbursed"
          value={fmt(data.totalDisbursed)}
          sub={period === "mtd" ? "Month to date" : "Year to date"}
        />
        <StatCard
          label="Transactions"
          value={data.transactionCount.toLocaleString()}
          sub="Check register entries"
        />
        <StatCard
          label="Properties"
          value={uniqueProperties.toString()}
          sub="With activity"
        />
        <StatCard
          label="Vendors"
          value={uniqueVendors.toString()}
          sub="Unique payees"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataTable
          title="Top Properties by Spend"
          rows={properties}
          linkPrefix="/properties"
        />
        <DataTable
          title="Top Vendors by Spend"
          rows={vendors}
          linkPrefix="/vendors"
        />
        <DataTable
          title="Top GL Accounts by Spend"
          rows={glAccounts}
          linkPrefix="/gl"
        />
      </div>
    </div>
  );
}
