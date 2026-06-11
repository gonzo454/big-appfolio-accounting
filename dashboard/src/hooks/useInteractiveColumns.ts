"use client";

import { useState, useCallback, useRef } from "react";

export interface ColumnDef {
  key: string;
  label: string;
  align?: "left" | "right";
  /** Minimum width in px */
  minWidth?: number;
  /** Initial width in px (undefined = auto) */
  initialWidth?: number;
}

export function useInteractiveColumns(initialColumns: ColumnDef[]) {
  const [columns, setColumns] = useState(initialColumns);
  const [widths, setWidths] = useState<Record<string, number | undefined>>(() => {
    const w: Record<string, number | undefined> = {};
    for (const c of initialColumns) w[c.key] = c.initialWidth;
    return w;
  });

  const resizeStart = useRef<{ key: string; startX: number; startW: number } | null>(null);

  // --- Column Resize ---
  const onResizeStart = useCallback(
    (key: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const th = (e.target as HTMLElement).closest("th");
      const startW = widths[key] ?? th?.offsetWidth ?? 120;
      resizeStart.current = { key, startX: e.clientX, startW };

      const onMove = (ev: MouseEvent) => {
        if (!resizeStart.current) return;
        const delta = ev.clientX - resizeStart.current.startX;
        const col = columns.find((c) => c.key === resizeStart.current!.key);
        const min = col?.minWidth ?? 60;
        setWidths((prev) => ({
          ...prev,
          [resizeStart.current!.key]: Math.max(min, resizeStart.current!.startW + delta),
        }));
      };
      const onUp = () => {
        resizeStart.current = null;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [columns, widths]
  );

  // --- Column Drag & Drop ---
  const dragCol = useRef<string | null>(null);

  const onDragStart = useCallback((key: string, e: React.DragEvent) => {
    dragCol.current = key;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", key);
    (e.target as HTMLElement).style.opacity = "0.5";
  }, []);

  const onDragEnd = useCallback((e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
    dragCol.current = null;
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (targetKey: string, e: React.DragEvent) => {
      e.preventDefault();
      const src = dragCol.current;
      if (!src || src === targetKey) return;
      setColumns((prev) => {
        const arr = [...prev];
        const srcIdx = arr.findIndex((c) => c.key === src);
        const tgtIdx = arr.findIndex((c) => c.key === targetKey);
        if (srcIdx < 0 || tgtIdx < 0) return prev;
        const [moved] = arr.splice(srcIdx, 1);
        arr.splice(tgtIdx, 0, moved);
        return arr;
      });
      dragCol.current = null;
    },
    []
  );

  return {
    columns,
    widths,
    onResizeStart,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
  };
}
