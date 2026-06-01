import { fetchReport, parseAmount, firstOfYear, today } from "@/lib/appfolio";
import { computeSectionPnL } from "@/lib/gl-parser";

interface AccountTotalRow {
  property_name?: string;
  net_amount?: string;
  ending_balance?: string;
}

export async function GET() {
  try {
    const rows = await fetchReport<AccountTotalRow>("account_totals");

    const properties = rows
      .filter((r) => r.property_name && r.property_name.trim())
      .map((r) => ({
        name: r.property_name!.trim(),
        netAmount: parseAmount(r.net_amount),
        endingBalance: parseAmount(r.ending_balance),
      }));

    // Badger Hotel Group is not in AppFolio account_totals — inject from GL
    if (!properties.some((p) => p.name === "Badger Hotel Group")) {
      const sections = computeSectionPnL(firstOfYear(), today());
      properties.push({
        name: "Badger Hotel Group",
        netAmount: Math.round(sections.hotel.noi),
        endingBalance: 0,
      });
    }

    return Response.json({ properties });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
