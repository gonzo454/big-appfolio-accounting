"use client";

import { useState } from "react";
import { fmt } from "@/lib/format";

interface DataTableProps {
  title: string;
  rows: [string, number][];
  linkPrefix?: string;
  showAll?: boolean;
}

export default function DataTable({
  title,
  rows,
  linkPrefix,
  showAll = false,
}: DataTableProps) {
  const [expanded, setExpanded] = useState(showAll);
  const total = rows.reduce((sum, [, v]) => sum + v, 0);
  const visible = expanded ? rows : rows.slice(0, 10);

  return (
    <div className="bg-white rounded-xl border border-zinc-200">
      <div className="px-5 py-4 border-b border-zinc-100">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      </div>
      <div className="divide-y divide-zinc-50">
        {visible.map(([name, amount]) => {
          const pct = total > 0 ? (amount / total) * 100 : 0;
          const content = (
            <div className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-700 truncate">{name}</p>
                <div className="mt-1.5 w-full bg-zinc-100 rounded-full h-1.5">
                  <div
                    className="bg-zinc-800 h-1.5 rounded-full"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
              <div className="ml-4 text-right shrink-0">
                <p className="text-sm font-medium text-zinc-900">
                  {fmt(amount)}
                </p>
                <p className="text-xs text-zinc-400">{pct.toFixed(1)}%</p>
              </div>
            </div>
          );

          if (linkPrefix) {
            return (
              <a
                key={name}
                href={`${linkPrefix}?name=${encodeURIComponent(name)}`}
                className="block"
              >
                {content}
              </a>
            );
          }
          return <div key={name}>{content}</div>;
        })}
      </div>
      {rows.length > 10 && !showAll && (
        <div className="px-5 py-3 border-t border-zinc-100">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            {expanded
              ? "Show less"
              : `Show all ${rows.length} items`}
          </button>
        </div>
      )}
    </div>
  );
}
