export function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtFull(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

export function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function sortDesc(
  obj: Record<string, number>
): [string, number][] {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]);
}
