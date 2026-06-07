export const PER_MTOK = 1_000_000;

export function priceLabel(value: string | null): string {
  if (value === null) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  if (n === 0) return "free";
  const perM = n * PER_MTOK;
  if (perM >= 1) return `$${perM.toFixed(2)}/Mtok`;
  if (perM >= 0.01) return `$${perM.toFixed(3)}/Mtok`;
  return `$${perM.toFixed(4)}/Mtok`;
}

export function contextLabel(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

export function daysBetween(a: string, b: string): number {
  const ms = Date.parse(b) - Date.parse(a);
  return Math.round(ms / 86_400_000);
}

export function lifespanLabel(first: string, last: string): string {
  const d = daysBetween(first, last);
  if (d < 1) return "less than a day";
  if (d < 30) return `${d} day${d === 1 ? "" : "s"}`;
  if (d < 365) return `${Math.round(d / 30)} months`;
  const years = (d / 365).toFixed(1);
  return `${years} years`;
}
