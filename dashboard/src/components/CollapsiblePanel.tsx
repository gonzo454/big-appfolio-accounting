"use client";

import { useState, ReactNode } from "react";

interface CollapsiblePanelProps {
  title: string;
  /** Right-side header content (totals, badges, etc.) */
  headerRight?: ReactNode;
  /** Max height in px in standard view (scrollable). */
  normalMaxHeight?: number;
  /** Additional className for the outer container */
  className?: string;
  /** Section anchor id */
  id?: string;
  children: ReactNode;
}

export function CollapsiblePanel({
  title,
  headerRight,
  normalMaxHeight = 500,
  className = "",
  id,
  children,
}: CollapsiblePanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      id={id}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div
        className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        onClick={() => setExpanded((e) => !e)}
        title={expanded ? "Click to return to standard view" : "Click to expand to full view"}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 transition-transform">
            {expanded ? "▼" : "▶"}
          </span>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        {headerRight}
      </div>

      {/* Content */}
      <div
        style={expanded ? {} : { maxHeight: normalMaxHeight, overflowY: "auto" }}
        className="transition-[max-height] duration-200"
      >
        {children}
      </div>
    </div>
  );
}
