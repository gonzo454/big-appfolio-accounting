import { getCheckRegister, analyzeTransactions } from "@/lib/appfolio";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const period =
    (request.nextUrl.searchParams.get("period") as "mtd" | "ytd") || "mtd";

  try {
    const txns = await getCheckRegister(period);
    const data = analyzeTransactions(txns, period);
    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
