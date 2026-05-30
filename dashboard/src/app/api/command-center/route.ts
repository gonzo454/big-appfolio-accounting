import { fetchReport, firstOfYear, today, parseAmount } from "@/lib/appfolio";

interface IncomeRow {
  account_name?: string;
  account_number?: string;
  month_to_date?: string;
  year_to_date?: string;
}

interface RentRollRow {
  status?: string;
  lease_to?: string;
}

interface ArRow {
  total_amount?: string;
}

// --- Entity-scoped account classification per Opus spec ---
// Note: AppFolio income_statement API returns portfolio-wide account totals.
// True entity filtering requires GL-level data. These account sets approximate
// entity separation until GL-based entity filtering is available.

// BIG Management (Blackdeer entity) — revenue accounts
const BIG_REVENUE_ACCOUNTS = [
  "5820-0000", "5820-1000", // management + asset mgmt fees
  "5750-0000", "5755-0000", // leasing + sale commissions
  "5760-0000", "5700-0000", // IT services + misc income (Blackdeer)
];

// BIG Management — expense accounts (Blackdeer entity)
const BIG_EXPENSE_ACCOUNTS = [
  "6304-0000", "6304-0100", // salaries
  "6305-0000", "6305-0300", "6305-1000", "6305-2000", "6305-2100", "6305-3200", "6305-3500", // benefits
  "6306-1000", // payroll taxes
  "7000-0000", // office expenses
  "7302-0000", // consulting (Metify)
  "7400-0000", "7410-0000", "7415-0000", "7420-0000", "7430-0000", "7440-0000", // rent/office
  "7520-0000", // licenses
  "7605-0000", // legal
  "7610-0000", "7610-1000", // accounting
  "7620-0000", // professional fees
  "7700-0000", // insurance
  "7800-0000", "7802-0000", // other
];

// Hotel (Badger Hotel Group entity) — revenue
const HOTEL_REVENUE_ACCOUNTS = [
  "4400-1000", "4400-2000", "4400-3000", "4400-4000",
  "4400-5000", "4400-6000", "4400-7000", "4400-8000",
  // EXCLUDE 4400-9000 per spec (suspense/clearing account)
];

// Hotel — expense accounts
const HOTEL_EXPENSE_ACCOUNTS = [
  "5875-1010", "5875-1020", "5875-1050", "5875-1060", "5875-1070",
  "5875-1085", "5875-1090", "5875-1110", "5875-1120", // labor
  "6304-1000", "6305-2450", // hotel wages/housekeeping
  "6210-0100", "6210-0500", "6210-0600", "6210-0700", "6210-0800",
  "6210-0810", "6210-0910", "6210-0930", "6210-1501", "6210-3210",
  "6210-3220", "6210-3530", "6210-3941", "6210-9620", "6210-9640", // supplies/ops
  "6435-0000", // telephone
  "7304-0000", // franchise fees
  "7670-0000", // TA commissions
];

// JRW Portfolio — accounts to EXCLUDE from operating expense
const JRW_EXCLUDE_EXPENSE = ["6600-", "6650-"]; // depreciation, amortization
// JRW — exclude from income
const JRW_EXCLUDE_INCOME = ["5756-"]; // gain on sale (not operating)

function matchesAny(num: string, accounts: string[]): boolean {
  return accounts.some((a) => num.startsWith(a));
}

function isBigRevenue(num: string): boolean {
  return matchesAny(num, BIG_REVENUE_ACCOUNTS);
}

function isBigExpense(num: string): boolean {
  return matchesAny(num, BIG_EXPENSE_ACCOUNTS);
}

function isHotelRevenue(num: string): boolean {
  return matchesAny(num, HOTEL_REVENUE_ACCOUNTS);
}

function isHotelExpense(num: string): boolean {
  return matchesAny(num, HOTEL_EXPENSE_ACCOUNTS);
}

function isJrwIncome(num: string): boolean {
  const prefix = num.charAt(0);
  if (!((prefix === "4" || prefix === "5") && !isBigRevenue(num) && !isHotelRevenue(num) && !num.startsWith("5875-"))) return false;
  if (matchesAny(num, JRW_EXCLUDE_INCOME)) return false;
  return true;
}

function isJrwExpense(num: string): boolean {
  const prefix = num.charAt(0);
  if (!((prefix === "6" || prefix === "7") && !isBigExpense(num) && !isHotelExpense(num))) return false;
  if (matchesAny(num, JRW_EXCLUDE_EXPENSE)) return false;
  return true;
}

export async function GET() {
  try {
    const [incomeRows, rentRows, arRows] = await Promise.all([
      fetchReport<IncomeRow>("income_statement", {
        from_date: firstOfYear(),
        to_date: today(),
      }),
      fetchReport<RentRollRow>("rent_roll"),
      fetchReport<ArRow>("aged_receivables_detail", {
        as_of_date: today(),
      }),
    ]);

    // --- JRW Portfolio: NOI = property income - operating expense ---
    let jrwIncome = 0;
    let jrwExpenses = 0;
    for (const row of incomeRows) {
      const num = (row.account_number || "").trim();
      const ytd = parseAmount(row.year_to_date);
      if (isJrwIncome(num)) jrwIncome += ytd;
      if (isJrwExpense(num)) jrwExpenses += ytd;
    }
    const jrwNoi = jrwIncome + jrwExpenses; // expenses are negative in the data

    const totalUnits = rentRows.length;
    const occupied = rentRows.filter((r) => {
      const s = (r.status || "").toLowerCase();
      return s.includes("current") || s.includes("occupied");
    }).length;
    const occupancyRate = totalUnits > 0 ? Math.round((occupied / totalUnits) * 100) : 0;
    const propertyCount = 14;

    // --- BIG Management: net income = total income - total expense, margin = NI / income ---
    let bigIncome = 0;
    let bigExpenses = 0;
    for (const row of incomeRows) {
      const num = (row.account_number || "").trim();
      const ytd = parseAmount(row.year_to_date);
      if (isBigRevenue(num)) bigIncome += ytd;
      if (isBigExpense(num)) bigExpenses += ytd; // negative
    }
    const bigNetIncome = bigIncome + bigExpenses;
    const bigMargin = bigIncome > 0 ? Math.round((bigNetIncome / bigIncome) * 100) : 0;

    // Fee revenue subset (for display)
    let bigFeeRevenue = 0;
    for (const row of incomeRows) {
      const num = (row.account_number || "").trim();
      if (num.startsWith("5820-0000") || num.startsWith("5820-1000") ||
          num.startsWith("5750-0000") || num.startsWith("5755-0000")) {
        bigFeeRevenue += parseAmount(row.year_to_date);
      }
    }

    // --- Badger Hotel: Room Revenue + GOP ---
    let hotelRevenue = 0;
    let hotelRoomRevenue = 0;
    let hotelExpenses = 0;
    for (const row of incomeRows) {
      const num = (row.account_number || "").trim();
      const ytd = parseAmount(row.year_to_date);
      if (isHotelRevenue(num)) {
        hotelRevenue += ytd;
        if (num.startsWith("4400-1000") || num.startsWith("4400-2000")) {
          hotelRoomRevenue += ytd;
        }
      }
      if (isHotelExpense(num)) hotelExpenses += ytd; // negative
    }
    const hotelGop = hotelRevenue + hotelExpenses;

    // --- Alerts ---
    const now = new Date();
    const ninetyDays = new Date(now.getTime() + 90 * 86400000);
    const leasesExpiring = rentRows.filter((r) => {
      if (!r.lease_to) return false;
      const d = new Date(r.lease_to);
      return d >= now && d <= ninetyDays;
    }).length;

    const agedReceivables = arRows.reduce((sum, r) => sum + parseAmount(r.total_amount), 0);

    // --- Fee Reconciliation per spec §7 ---
    // Management leg: BIG 5820-0000 income vs property 6300-0000 + 7301-0000 expense
    // Asset-mgmt leg: BIG 5820-1000 income vs property 7300-0000 expense
    let bigMgmtIncome = 0;
    let bigAssetIncome = 0;
    let propertyMgmtExpense = 0;
    let propertyAssetExpense = 0;
    for (const row of incomeRows) {
      const num = (row.account_number || "").trim();
      const ytd = parseAmount(row.year_to_date);
      if (num.startsWith("5820-0000")) bigMgmtIncome += ytd;
      if (num.startsWith("5820-1000")) bigAssetIncome += ytd;
      if (num.startsWith("6300-0000") || num.startsWith("7301-0000")) {
        propertyMgmtExpense += Math.abs(ytd);
      }
      if (num.startsWith("7300-0000")) {
        propertyAssetExpense += Math.abs(ytd);
      }
    }
    const varianceMgmt = bigMgmtIncome - propertyMgmtExpense;
    const varianceAsset = bigAssetIncome - propertyAssetExpense;
    const feeReconciliationGap = Math.round(Math.abs(varianceMgmt + varianceAsset));

    // --- Monthly Trends ---
    const currentMonth = new Date().getMonth();
    const year = new Date().getFullYear();
    const monthlyFetches = [];
    for (let m = 0; m <= currentMonth; m++) {
      const from = `${year}-${String(m + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(year, m + 1, 0).getDate();
      const to = m === currentMonth ? today() : `${year}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      monthlyFetches.push(
        fetchReport<IncomeRow>("income_statement", { posted_on_from: from, posted_on_to: to })
          .then((rows) => {
            let jrw = 0, big = 0, hotel = 0;
            for (const r of rows) {
              const num = (r.account_number || "").trim();
              const mtd = parseAmount(r.month_to_date);
              if (isJrwIncome(num)) jrw += mtd;
              if (isJrwExpense(num)) jrw += mtd;
              if (isBigRevenue(num)) big += mtd;
              if (isHotelRevenue(num)) hotel += mtd;
            }
            return { jrw, big, hotel };
          })
          .catch(() => ({ jrw: 0, big: 0, hotel: 0 }))
      );
    }
    const monthlyData = await Promise.all(monthlyFetches);
    const jrwTrend = monthlyData.map((m) => m.jrw);
    const bigTrend = monthlyData.map((m) => m.big);
    const hotelTrend = monthlyData.map((m) => m.hotel);

    return Response.json({
      jrw: {
        noi: Math.round(jrwNoi),
        occupancyRate,
        propertyCount,
        monthlyTrend: jrwTrend,
      },
      big: {
        feeRevenue: Math.round(bigFeeRevenue),
        totalIncome: Math.round(bigIncome),
        totalExpenses: Math.round(Math.abs(bigExpenses)),
        netIncome: Math.round(bigNetIncome),
        margin: bigMargin,
        propertiesManaged: propertyCount,
        monthlyTrend: bigTrend,
      },
      hotel: {
        roomRevenue: Math.round(hotelRoomRevenue),
        totalRevenue: Math.round(hotelRevenue),
        gop: Math.round(hotelGop),
        monthlyTrend: hotelTrend,
      },
      alerts: {
        leasesExpiring,
        agedReceivables: Math.round(agedReceivables),
        feeReconciliationGap,
      },
      period: {
        from: firstOfYear(),
        to: today(),
        basis: "YTD",
      },
    });
  } catch (err) {
    console.error("Command center error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
