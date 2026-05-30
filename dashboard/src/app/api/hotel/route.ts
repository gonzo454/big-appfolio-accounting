import { NextRequest } from "next/server";
import { fetchReport, firstOfYear, firstOfMonth, today, parseAmount } from "@/lib/appfolio";

interface IncomeRow {
  account_name?: string;
  account_number?: string;
  month_to_date?: string;
  year_to_date?: string;
  last_year_to_date?: string;
}

// Badger Hotel revenue accounts (4400-xxxx series)
const HOTEL_REVENUE_ACCOUNTS: Record<string, string> = {
  "4400-1000-00": "Hotel Revenue",
  "4400-2000-00": "Room Exempt",
  "4400-3000-00": "Hotel Meeting Room Catering",
  "4400-4000-00": "Hotel Meeting Room",
  "4400-5000-00": "Hotel Market",
  "4400-6000-00": "Hotel Laundry Income",
  "4400-7000-00": "Hotel Shuttle Service Income",
  "4400-8000-00": "Hotel Guest Deposit",
  "4400-9000-00": "Miscellaneous Hotel Income",
};

// Badger Hotel expense accounts
const HOTEL_EXPENSE_ACCOUNTS: Record<string, string> = {
  // Labor
  "5875-1010-00": "General Manager",
  "5875-1020-00": "Operations Manager",
  "5875-1050-00": "Breakfast Attendant",
  "5875-1060-00": "Front Desk Agent",
  "5875-1070-00": "Night Audit",
  "5875-1085-00": "Hotel Housekeeping Manager",
  "5875-1090-00": "Room Inspector",
  "5875-1110-00": "Laundry Room Wages",
  "5875-1120-00": "Public Area Attendant",
  "6304-1000-00": "Hotel Wages",
  "6305-2450-00": "Hotel Housekeeping",
  // Operating
  "6210-0100-00": "Uniforms",
  "6210-0500-00": "Guest Room Supplies",
  "6210-0600-00": "Laundry Supplies",
  "6210-0700-00": "Market Supplies",
  "6210-0800-00": "Breakfast Food Supplies",
  "6210-0810-00": "Breakfast Supplies",
  "6210-0910-00": "Meeting Room Supplies",
  "6210-0930-00": "Decorations",
  "6210-1501-00": "Pool Supplies",
  "6210-3210-00": "Hotel Vehicle Repair/Service",
  "6210-3220-00": "Hotel Vehicle Gas",
  "6210-3530-00": "Miscellaneous Hotel Equipment",
  "6210-3941-00": "Hotel Guest Room Keys/Jackets",
  "6210-9620-00": "Hotel Ice Machine Repair",
  "6210-9640-00": "Laundry Equipment Repair",
  "6435-0000-00": "Hotel Telephone",
  "7304-0000-00": "Hotel Franchise Fees",
  "7670-0000-00": "TA Commissions",
};

function isHotelRevenue(num: string): boolean {
  return num in HOTEL_REVENUE_ACCOUNTS;
}

function isHotelExpense(num: string): boolean {
  return num in HOTEL_EXPENSE_ACCOUNTS;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const period = params.get("period") || "mtd";
  const from = params.get("from") || (period === "ytd" ? firstOfYear() : firstOfMonth());
  const to = params.get("to") || today();

  try {
    const rows = await fetchReport<IncomeRow>("income_statement", {
      from_date: firstOfYear(),
      to_date: today(),
    });

    const revenueAccounts: { name: string; number: string; amount: number; mtd: number; ytd: number; lastYearAmount: number }[] = [];
    const expenseAccounts: { name: string; number: string; amount: number; mtd: number; ytd: number; lastYearAmount: number }[] = [];

    for (const row of rows) {
      const num = (row.account_number || "").trim();
      const name = (row.account_name || "").trim();
      const mtd = parseAmount(row.month_to_date);
      const ytd = parseAmount(row.year_to_date);
      const ly = parseAmount(row.last_year_to_date);

      if (isHotelRevenue(num)) {
        revenueAccounts.push({ name: HOTEL_REVENUE_ACCOUNTS[num] || name, number: num, amount: ytd, mtd, ytd, lastYearAmount: ly });
      } else if (isHotelExpense(num)) {
        expenseAccounts.push({ name: HOTEL_EXPENSE_ACCOUNTS[num] || name, number: num, amount: ytd, mtd, ytd, lastYearAmount: ly });
      }
    }

    const totalRevenue = revenueAccounts.reduce((s, a) => s + a.ytd, 0);
    const totalRevenueMtd = revenueAccounts.reduce((s, a) => s + a.mtd, 0);
    const totalRevenueLY = revenueAccounts.reduce((s, a) => s + a.lastYearAmount, 0);
    const totalExpenses = expenseAccounts.reduce((s, a) => s + a.ytd, 0);
    const totalExpensesMtd = expenseAccounts.reduce((s, a) => s + a.mtd, 0);
    const totalExpensesLY = expenseAccounts.reduce((s, a) => s + a.lastYearAmount, 0);
    const netIncome = totalRevenue + totalExpenses;
    const netIncomeLY = totalRevenueLY + totalExpensesLY;

    return Response.json({
      revenueAccounts,
      expenseAccounts,
      summary: {
        totalRevenue,
        totalRevenueMtd,
        totalRevenueLY,
        revenueChange: totalRevenueLY !== 0 ? ((totalRevenue - totalRevenueLY) / Math.abs(totalRevenueLY)) * 100 : 0,
        totalExpenses,
        totalExpensesMtd,
        totalExpensesLY,
        expenseChange: totalExpensesLY !== 0 ? ((Math.abs(totalExpenses) - Math.abs(totalExpensesLY)) / Math.abs(totalExpensesLY)) * 100 : 0,
        netIncome,
        netIncomeLY,
        netIncomeChange: netIncomeLY !== 0 ? ((netIncome - netIncomeLY) / Math.abs(netIncomeLY)) * 100 : 0,
      },
      period: { from, to },
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
