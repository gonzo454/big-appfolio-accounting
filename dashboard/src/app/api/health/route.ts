import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const clientId = (process.env.APPFOLIO_CLIENT_ID || "").trim();
  const clientSecret = (process.env.APPFOLIO_CLIENT_SECRET || "").trim();
  const database = (process.env.APPFOLIO_DATABASE || "").trim();

  const envStatus = {
    APPFOLIO_CLIENT_ID: clientId ? "set" : "MISSING",
    APPFOLIO_CLIENT_SECRET: clientSecret ? "set" : "MISSING",
    APPFOLIO_DATABASE: database ? "set" : "MISSING",
  };

  // Attempt a minimal API call
  let apiTest = "not attempted";
  if (clientId && clientSecret && database) {
    try {
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const res = await fetch(
        `https://${database}.appfolio.com/api/v2/reports/account_totals.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${credentials}`,
          },
          body: JSON.stringify({ paginate_results: false }),
        }
      );
      if (res.ok) {
        apiTest = `success (status ${res.status})`;
      } else {
        const text = await res.text();
        apiTest = `failed (status ${res.status}): ${text.slice(0, 200)}`;
      }
    } catch (err) {
      apiTest = `error: ${err instanceof Error ? err.message : String(err)}`;
    }
  } else {
    apiTest = "skipped - missing env vars";
  }

  return Response.json({
    status: "ok",
    env: envStatus,
    apiTest,
    timestamp: new Date().toISOString(),
  });
}
