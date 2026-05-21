import { NextRequest } from "next/server";
import { fetchReport, firstOfMonth, today, parseAmount } from "@/lib/appfolio";

interface IncomeRow {
  account_name?: string;
  account_number?: string;
  month_to_date?: string;
  year_to_date?: string;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const from = params.get("from") || firstOfMonth();
  const to = params.get("to") || today();
  const period = params.get("period") || "mtd";

  try {
    const rows = await fetchReport<IncomeRow>("income_statement", {
      from_date: from,
      to_date: to,
    });

    const column = period === "ytd" ? "year_to_date" : "month_to_date";

    let totalIncome = 0;
    let totalExpenses = 0;
    let section: "income" | "expense" = "income";
    const accounts: { name: string; number: string; amount: number; type: string }[] = [];

    for (const row of rows) {
      const name = (row.account_name || "").trim();
      const lowerName = name.toLowerCase();
      const amount = parseAmount(row[column]);

      if (lowerName === "total income") {
        totalIncome = amount;
        section = "expense";
        continue;
      }
      if (lowerName === "total expense" || lowerName === "total expenses") {
        totalExpenses = Math.abs(amount);
        continue;
      }
      if (lowerName === "net income" || lowerName === "net operating income") {
        continue;
      }

      if (row.account_number && amount !== 0) {
        accounts.push({ name, number: row.account_number, amount: Math.abs(amount), type: section });
      }
    }

    return Response.json({
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      accounts,
      period: { from, to, column },
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
