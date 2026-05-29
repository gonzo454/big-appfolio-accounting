import { NextRequest, NextResponse } from "next/server";
import prospects from "@/data/prospects.json";

interface Prospect {
  priority: string;
  score: number;
  ownerName: string;
  ownerType: string;
  propertyType: string;
  propertySubtype: string;
  propertyAddress: string;
  municipality: string;
  zip: string;
  mailingAddress: string;
  ownerProximity: string;
  assessedValue: number;
  improvementValue: number;
  acres: number;
  parcelId: string;
}

const allProspects = prospects as Prospect[];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const q = searchParams.get("q")?.toLowerCase() || "";
  const propertyType = searchParams.get("propertyType") || "";
  const proximity = searchParams.get("proximity") || "";
  const priority = searchParams.get("priority") || "";
  const municipality = searchParams.get("municipality") || "";
  const sortBy = searchParams.get("sortBy") || "score";
  const sortDir = searchParams.get("sortDir") || "desc";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 6000);

  let filtered = allProspects;

  if (q) {
    filtered = filtered.filter(
      (p) =>
        p.ownerName.toLowerCase().includes(q) ||
        p.propertyAddress.toLowerCase().includes(q) ||
        p.municipality.toLowerCase().includes(q) ||
        p.parcelId.toLowerCase().includes(q)
    );
  }
  if (propertyType) {
    filtered = filtered.filter((p) => p.propertyType === propertyType);
  }
  if (proximity) {
    filtered = filtered.filter((p) => p.ownerProximity === proximity);
  }
  if (priority) {
    filtered = filtered.filter((p) => p.priority === priority);
  }
  if (municipality) {
    filtered = filtered.filter((p) => p.municipality === municipality);
  }

  const sortKey = sortBy as keyof Prospect;
  filtered = [...filtered].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    }
    const aStr = String(aVal);
    const bStr = String(bVal);
    return sortDir === "desc"
      ? bStr.localeCompare(aStr)
      : aStr.localeCompare(bStr);
  });

  const total = filtered.length;
  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + limit);

  return NextResponse.json({
    prospects: paginated,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
