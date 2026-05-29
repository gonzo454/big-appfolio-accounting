import { NextRequest } from "next/server";
import { fetchReport, firstOfYear, today, parseAmount } from "@/lib/appfolio";

interface IncomeRow {
  account_name?: string;
  account_number?: string;
  month_to_date?: string;
  year_to_date?: string;
  last_year_to_date?: string;
}

// BIG Management revenue accounts (suffix -00 indicates BIG entity)
const BIG_REVENUE_ACCOUNTS: Record<string, string> = {
  "5820-0000-00": "Management Fees",
  "5820-1000-00": "Asset Management Fees",
  "5750-0000-00": "Leasing Commission Income",
  "5755-0000-00": "Sale Commission",
  "5760-0000-00": "Internet & Computer Services",
  "5720-1000-00": "Insurance Fee",
  "5700-0000-00": "Miscellaneous Income",
  "5700-0001-00": "Interest Income",
  "5875-1010-00": "General Manager",
  "5875-1020-00": "Operations Manager",
  "5875-1050-00": "Breakfast Attendant",
  "5875-1060-00": "Front Desk Agent",
  "5875-1070-00": "Night Audit",
  "5875-1085-00": "Hotel Housekeeping Manager",
  "5875-1090-00": "Room Inspector",
  "5875-1110-00": "Laundry Room Wages",
  "5875-1120-00": "Public Area Attendant",
  "5873-0000-00": "Merchant Account Fees",
};

// BIG Management expense accounts (suffix -00 indicates BIG entity)
const BIG_EXPENSE_PREFIXES = [
  "6304-", "6305-", "6306-", "6307-", "6308-",
  "6425-", "7000-", "7210-", "7220-", "7230-", "7240-",
  "7250-", "7260-", "7301-", "7302-", "7304-", "7310-",
  "7400-", "7410-", "7415-", "7420-", "7430-", "7440-",
  "7450-", "7470-", "7500-", "7505-", "7507-", "7510-",
  "7516-", "7520-", "7605-", "7610-", "7620-", "7670-",
  "7700-", "7800-", "7802-", "7905-",
];

function isBigAccount(accountNumber: string): boolean {
  return accountNumber.endsWith("-00");
}

function isBigRevenue(accountNumber: string): boolean {
  return accountNumber in BIG_REVENUE_ACCOUNTS;
}

function isBigExpense(accountNumber: string): boolean {
  if (!isBigAccount(accountNumber)) return false;
  return BIG_EXPENSE_PREFIXES.some((p) => accountNumber.startsWith(p));
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const from = params.get("from") || firstOfYear();
  const to = params.get("to") || today();

  try {
    const rows = await fetchReport<IncomeRow>("income_statement", {
      posted_on_from: from,
      posted_on_to: to,
    });

    const revenueAccounts: {
      name: string;
      number: string;
      mtd: number;
      ytd: number;
      lastYearYtd: number;
    }[] = [];
    const expenseAccounts: typeof revenueAccounts = [];

    for (const r of rows) {
      const num = (r.account_number || "").trim();
      const name = (r.account_name || "").trim();
      if (!num || !name) continue;

      const mtd = parseAmount(r.month_to_date);
      const ytd = parseAmount(r.year_to_date);
      const lastYearYtd = parseAmount(r.last_year_to_date);

      if (isBigRevenue(num)) {
        revenueAccounts.push({ name, number: num, mtd, ytd, lastYearYtd });
      } else if (isBigExpense(num)) {
        expenseAccounts.push({ name, number: num, mtd, ytd, lastYearYtd });
      }
    }

    const totalRevenue = revenueAccounts.reduce((s, a) => s + a.ytd, 0);
    const totalRevenueLY = revenueAccounts.reduce((s, a) => s + a.lastYearYtd, 0);
    const totalExpenses = expenseAccounts.reduce((s, a) => s + Math.abs(a.ytd), 0);
    const totalExpensesLY = expenseAccounts.reduce((s, a) => s + Math.abs(a.lastYearYtd), 0);
    const netIncome = totalRevenue - totalExpenses;
    const netIncomeLY = totalRevenueLY - totalExpensesLY;

    // Key revenue categories
    const mgmtFees = revenueAccounts
      .filter((a) => a.number.startsWith("5820-"))
      .reduce((s, a) => s + a.ytd, 0);
    const commissions = revenueAccounts
      .filter((a) => a.number.startsWith("5750-") || a.number.startsWith("5755-"))
      .reduce((s, a) => s + a.ytd, 0);
    const hotelStaffing = revenueAccounts
      .filter((a) => a.number.startsWith("5875-"))
      .reduce((s, a) => s + a.ytd, 0);

    return Response.json({
      summary: {
        totalRevenue,
        totalRevenueLY,
        revenueChange: totalRevenueLY !== 0 ? ((totalRevenue - totalRevenueLY) / Math.abs(totalRevenueLY)) * 100 : 0,
        totalExpenses,
        totalExpensesLY,
        expenseChange: totalExpensesLY !== 0 ? ((totalExpenses - totalExpensesLY) / Math.abs(totalExpensesLY)) * 100 : 0,
        netIncome,
        netIncomeLY,
        netIncomeChange: netIncomeLY !== 0 ? ((netIncome - netIncomeLY) / Math.abs(netIncomeLY)) * 100 : 0,
        mgmtFees,
        commissions,
        hotelStaffing,
      },
      revenueAccounts: revenueAccounts.filter((a) => a.ytd !== 0 || a.lastYearYtd !== 0),
      expenseAccounts: expenseAccounts.filter((a) => a.ytd !== 0 || a.lastYearYtd !== 0),
      period: { from, to },
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
