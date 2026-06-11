import { NextRequest } from "next/server";
import { fetchReport, parseAmount, firstOfYear, firstOfMonth, firstOfQuarter, today, cachedJson } from "@/lib/appfolio";
import { ENTITY_PROPERTY_IDS } from "@/lib/appfolio-entities";
import { getOwnership } from "@/lib/ownership";
import { getPropertyConfig } from "@/lib/property-config";

interface GLRow {
  account_name?: string;
  property_name?: string;
  post_date?: string;
  debit?: string;
  credit?: string;
}

interface IncomeRow {
  account_name?: string;
  month_to_date?: string;
  year_to_date?: string;
}

function extractTotals(rows: IncomeRow[], column: "month_to_date" | "year_to_date") {
  let totalIncome = 0;
  let totalExpenses = 0;
  for (const row of rows) {
    const name = (row.account_name || "").toLowerCase().trim();
    const amount = parseAmount(row[column]);
    if (name === "total income") totalIncome = amount;
    if (name === "total expense" || name === "total expenses") totalExpenses = Math.abs(amount);
  }
  return { totalIncome, totalExpenses };
}

function sameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

function dayBefore(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split("T")[0];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const ownershipView = searchParams.get("view") === "joe";
    const period = searchParams.get("period") || "ytd";
    const paramFrom = searchParams.get("from");
    const paramTo = searchParams.get("to");

    let rangeFrom: string;
    let rangeTo: string;

    if (paramFrom && paramTo) {
      rangeFrom = paramFrom;
      rangeTo = paramTo;
    } else if (period === "mtd") {
      rangeFrom = firstOfMonth();
      rangeTo = today();
    } else if (period === "qtd") {
      rangeFrom = firstOfQuarter();
      rangeTo = today();
    } else {
      rangeFrom = firstOfYear();
      rangeTo = today();
    }

    const isMtd = sameMonth(rangeFrom, rangeTo);
    const isYtd = rangeFrom.endsWith("-01-01") || period === "ytd";
    const needsSubtraction = !isMtd && !isYtd;

    const hotelFilter = { properties_ids: [ENTITY_PROPERTY_IDS.hotel] };

    // Build fetch promises
    const fetches: Promise<unknown>[] = [
      // GL for all non-hotel properties
      fetchReport<GLRow>("general_ledger", {
        posted_on_from: rangeFrom,
        posted_on_to: rangeTo,
      }),
      // Hotel IS for the main period
      fetchReport<IncomeRow>("income_statement", {
        posted_on_from: rangeFrom,
        posted_on_to: rangeTo,
        properties: hotelFilter,
      }),
    ];

    // For QTD subtraction: also fetch Hotel baseline IS
    if (needsSubtraction) {
      const beforeFrom = dayBefore(rangeFrom);
      fetches.push(
        fetchReport<IncomeRow>("income_statement", {
          posted_on_from: beforeFrom.slice(0, 8) + "01",
          posted_on_to: beforeFrom,
          properties: hotelFilter,
        })
      );
    }

    const results = await Promise.all(fetches);
    const glRows = results[0] as GLRow[];
    const hotelIS = results[1] as IncomeRow[];
    const hotelBaselineIS = (results[2] || []) as IncomeRow[];

    // Aggregate income - expenses per property from GL (excluding Hotel)
    const propertyMap = new Map<string, number>();

    for (const r of glRows) {
      const propName = (r.property_name || "").trim();
      if (!propName) continue;
      // Skip Hotel from GL — we use income_statement for it
      if (propName === "Badger Hotel Group") continue;

      const acctField = (r.account_name || "").trim();
      const acctMatch = acctField.match(/^(\d{4}-\d{4}(-\d{2})?)/);
      if (!acctMatch) continue;
      let account = acctMatch[1];
      if (account.endsWith("-00")) account = account.slice(0, -3);

      const prefix = account.charAt(0);
      if (prefix !== "4" && prefix !== "5" && prefix !== "6" && prefix !== "7") continue;

      const debit = parseFloat(r.debit || "0") || 0;
      const credit = parseFloat(r.credit || "0") || 0;

      let amount = 0;
      if (prefix === "4") {
        amount = credit - debit;
      } else if (prefix === "5") {
        if (account.startsWith("5756")) continue;
        amount = credit - debit;
      } else {
        // 6xxx, 7xxx: expense accounts
        amount = -(debit - credit);
      }

      propertyMap.set(propName, (propertyMap.get(propName) || 0) + amount);
    }

    // Hotel: compute from income_statement with proper period handling
    let hotelNet: number;
    if (isMtd) {
      const t = extractTotals(hotelIS, "month_to_date");
      hotelNet = t.totalIncome - t.totalExpenses;
    } else if (isYtd) {
      const t = extractTotals(hotelIS, "year_to_date");
      hotelNet = t.totalIncome - t.totalExpenses;
    } else {
      // QTD/custom: YTD subtraction
      const end = extractTotals(hotelIS, "year_to_date");
      const start = extractTotals(hotelBaselineIS, "year_to_date");
      hotelNet = (end.totalIncome - start.totalIncome) - (end.totalExpenses - start.totalExpenses);
    }
    propertyMap.set("Badger Hotel Group", Math.round(hotelNet));

    // Convert to array and filter archived
    const properties = Array.from(propertyMap.entries())
      .filter(([name]) => !getPropertyConfig(name).archived)
      .map(([name, netAmount]) => ({
        name,
        netAmount: Math.round(netAmount),
        endingBalance: 0,
      }));

    const result = properties.map((p) => {
      const pct = getOwnership(p.name);
      return {
        ...p,
        netAmount: ownershipView ? Math.round(p.netAmount * pct) : p.netAmount,
        ownershipPct: pct,
      };
    });

    // Sort by net amount descending
    result.sort((a, b) => b.netAmount - a.netAmount);

    return cachedJson({ properties: result, ownershipView });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
