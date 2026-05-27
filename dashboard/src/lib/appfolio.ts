import { unstable_cache } from "next/cache";

const APPFOLIO_CLIENT_ID = process.env.APPFOLIO_CLIENT_ID!;
const APPFOLIO_CLIENT_SECRET = process.env.APPFOLIO_CLIENT_SECRET!;
const APPFOLIO_DATABASE = process.env.APPFOLIO_DATABASE!;

async function fetchReportRaw(
  reportName: string,
  body: Record<string, string> = {}
) {
  const credentials = Buffer.from(
    `${APPFOLIO_CLIENT_ID}:${APPFOLIO_CLIENT_SECRET}`
  ).toString("base64");
  const url = `https://${APPFOLIO_DATABASE}.appfolio.com/api/v2/reports/${reportName}.json`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AppFolio API ${res.status} on ${reportName}: ${text}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function firstOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function firstOfYear(): string {
  return `${new Date().getFullYear()}-01-01`;
}

export interface Transaction {
  payment_amount: string;
  property_name: string;
  payee_name: string;
  gl_account_name: string;
  occurred_date: string;
  remarks: string;
  check_id: string;
  bank_account_name: string;
}

export interface AnalyzedData {
  totalDisbursed: number;
  transactionCount: number;
  byProperty: Record<string, number>;
  byVendor: Record<string, number>;
  byGL: Record<string, number>;
  vendorDetail: Record<
    string,
    Record<string, { total: number; properties: Record<string, number> }>
  >;
  glTransactions: Record<
    string,
    {
      vendor: string;
      amt: number;
      prop: string;
      date: string;
      remarks: string;
    }[]
  >;
  transactions: Transaction[];
  dateRange: { from: string; to: string };
}

const getCachedCheckRegister = unstable_cache(
  async (fromDate: string, toDate: string) => {
    return fetchReportRaw("check_register_detail", {
      from_date: fromDate,
      to_date: toDate,
    });
  },
  ["appfolio-check-register"],
  { revalidate: 300 }
);

export async function getCheckRegister(
  period: "mtd" | "ytd" = "mtd"
): Promise<Transaction[]> {
  const fromDate = period === "ytd" ? firstOfYear() : firstOfMonth();
  return getCachedCheckRegister(fromDate, today());
}

export function analyzeTransactions(
  txns: Transaction[],
  period: "mtd" | "ytd" = "mtd"
): AnalyzedData {
  const byProperty: Record<string, number> = {};
  const byVendor: Record<string, number> = {};
  const byGL: Record<string, number> = {};
  const vendorDetail: AnalyzedData["vendorDetail"] = {};
  const glTransactions: AnalyzedData["glTransactions"] = {};
  let totalDisbursed = 0;

  for (const t of txns) {
    const amt = parseFloat(t.payment_amount || "0");
    const prop = t.property_name || "Unknown";
    const vendor = t.payee_name || "Unknown";
    const gl = t.gl_account_name || "Uncategorized";
    const date = t.occurred_date || "";
    const remarks = t.remarks || "";

    totalDisbursed += amt;
    byProperty[prop] = (byProperty[prop] || 0) + amt;
    byVendor[vendor] = (byVendor[vendor] || 0) + amt;
    byGL[gl] = (byGL[gl] || 0) + amt;

    if (!glTransactions[gl]) glTransactions[gl] = [];
    glTransactions[gl].push({ vendor, amt, prop, date, remarks });

    if (!vendorDetail[vendor]) vendorDetail[vendor] = {};
    if (!vendorDetail[vendor][gl])
      vendorDetail[vendor][gl] = { total: 0, properties: {} };
    vendorDetail[vendor][gl].total += amt;
    vendorDetail[vendor][gl].properties[prop] =
      (vendorDetail[vendor][gl].properties[prop] || 0) + amt;
  }

  const fromDate = period === "ytd" ? firstOfYear() : firstOfMonth();

  return {
    totalDisbursed,
    transactionCount: txns.length,
    byProperty,
    byVendor,
    byGL,
    vendorDetail,
    glTransactions,
    transactions: txns,
    dateRange: { from: fromDate, to: today() },
  };
}
