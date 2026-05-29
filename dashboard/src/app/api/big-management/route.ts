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

// BIG Management's own operating expenses (whitelist approach)
// Only includes costs BIG bears as a management company — NOT property-level
// expenses that building owners pay (hotel ops, property insurance, rent
// payable, TA commissions, advertising, maintenance, utilities, etc.)
const BIG_EXPENSE_ACCOUNTS: Record<string, string> = {
  // Staff wages & payroll
  "6304-0000-00": "Salaries & Wages",
  "6304-0100-00": "Accounting Wages",
  "6305-0000-00": "Salaries & Wages Mgmt",
  "6305-0300-00": "Worker's Comp",
  "6305-1000-00": "Life Insurance",
  "6305-2000-00": "Medical Insurance",
  "6305-2100-00": "Dental Insurance",
  "6305-3200-00": "HSA Contribution",
  "6305-3500-00": "Payroll Fees",
  "6306-1000-00": "Payroll Taxes",
  // Office & technology
  "7000-2000-00": "Microsoft Office",
  "7000-2300-00": "Google Apps",
  "7400-0000-00": "Office Administrations",
  "7420-0000-00": "Office Supplies - Non-recoverable",
  "7420-2000-00": "Postage & Shipping",
  "7430-0000-00": "Computer Repairs & Support",
  "7430-0110-00": "IT Support - Rhyme",
  "7440-0000-00": "Computer Software & License Fees",
  // Professional services
  "7302-0000-00": "Consulting Service",
  "7605-0000-00": "Legal & Evictions",
  "7610-0000-00": "Accounting & Tax Services",
  "7610-1000-00": "AppFolio",
  "7620-1000-00": "Permits & Licenses",
  // Employee & misc
  "7520-0000-00": "Employee Relations",
  "7700-0000-00": "Miscellaneous Expense - Non-recoverable",
  "7800-0000-00": "Bank Fees",
  "7802-0000-00": "Late Fees",
  // Management fee BIG pays out
  "7301-0000-00": "Management Fee",
};

function isBigRevenue(accountNumber: string): boolean {
  return accountNumber in BIG_REVENUE_ACCOUNTS;
}

function isBigExpense(accountNumber: string): boolean {
  return accountNumber in BIG_EXPENSE_ACCOUNTS;
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
