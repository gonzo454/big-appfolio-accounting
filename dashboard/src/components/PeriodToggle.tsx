"use client";

interface PeriodToggleProps {
  period: "mtd" | "ytd";
  onChange: (p: "mtd" | "ytd") => void;
}

export default function PeriodToggle({ period, onChange }: PeriodToggleProps) {
  return (
    <div className="inline-flex rounded-lg bg-zinc-100 p-1">
      <button
        onClick={() => onChange("mtd")}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
          period === "mtd"
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-zinc-500 hover:text-zinc-700"
        }`}
      >
        Month to Date
      </button>
      <button
        onClick={() => onChange("ytd")}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
          period === "ytd"
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-zinc-500 hover:text-zinc-700"
        }`}
      >
        Year to Date
      </button>
    </div>
  );
}
