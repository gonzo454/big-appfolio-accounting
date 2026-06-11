"use client";

import { useState, useRef, useCallback, ReactNode } from "react";

type PanelState = "collapsed" | "normal" | "expanded";

interface CollapsiblePanelProps {
  title: string;
  /** Right-side header content (totals, badges, etc.) */
  headerRight?: ReactNode;
  /** Default panel state */
  defaultState?: PanelState;
  /** Max height in px when in "normal" mode (scrollable). 0 = no limit. */
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
  defaultState = "normal",
  normalMaxHeight = 500,
  className = "",
  id,
  children,
}: CollapsiblePanelProps) {
  const [state, setState] = useState<PanelState>(defaultState);
  const contentRef = useRef<HTMLDivElement>(null);
  const [resizeHeight, setResizeHeight] = useState<number | null>(null);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);

  const cycle = useCallback(() => {
    setState((s) => {
      if (s === "collapsed") return "normal";
      if (s === "normal") return "expanded";
      return "collapsed";
    });
    setResizeHeight(null);
  }, []);

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (state === "collapsed") return;
      e.preventDefault();
      dragStartY.current = e.clientY;
      dragStartH.current =
        resizeHeight ??
        contentRef.current?.scrollHeight ??
        normalMaxHeight;

      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientY - dragStartY.current;
        setResizeHeight(Math.max(80, dragStartH.current + delta));
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [state, resizeHeight, normalMaxHeight]
  );

  const stateIcon =
    state === "collapsed" ? "▶" : state === "normal" ? "▼" : "⬇";
  const stateLabel =
    state === "collapsed"
      ? "Click to open"
      : state === "normal"
        ? "Click to expand fully"
        : "Click to collapse";

  const contentStyle: React.CSSProperties =
    state === "collapsed"
      ? { maxHeight: 0, overflow: "hidden" }
      : state === "expanded" && resizeHeight === null
        ? {}
        : {
            maxHeight: resizeHeight ?? normalMaxHeight,
            overflowY: "auto" as const,
          };

  return (
    <div
      id={id}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div
        className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        onClick={cycle}
        title={stateLabel}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 transition-transform">
            {stateIcon}
          </span>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        {headerRight}
      </div>

      {/* Content */}
      <div ref={contentRef} style={contentStyle} className="transition-[max-height] duration-200">
        {children}
      </div>

      {/* Resize handle */}
      {state !== "collapsed" && (
        <div
          className="h-2 cursor-ns-resize bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors flex items-center justify-center"
          onMouseDown={onResizeStart}
          title="Drag to resize"
        >
          <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-500 rounded" />
        </div>
      )}
    </div>
  );
}
