// Rounded to the penny before formatting - a MOTW/SOTW stake split across
// an odd number of tied managers (lib/gwScores.ts's computeMotwSotwMoney)
// lands on a repeating decimal otherwise (e.g. 5/3 = 1.6666...).
function formatPoundAmount(pl: number): string {
  const rounded = Math.round(Math.abs(pl) * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(2);
}

export function formatPl(pl: number) {
  const rounded = Math.round(pl * 100) / 100;
  if (rounded > 0) return `+£${formatPoundAmount(rounded)}`;
  if (rounded < 0) return `-£${formatPoundAmount(rounded)}`;
  return `£0`;
}

export function plColor(pl: number) {
  if (pl > 0) return "text-emerald-600 dark:text-emerald-400";
  if (pl < 0) return "text-rose-600 dark:text-rose-400";
  return "text-zinc-400";
}

// "A" / "A & B" / "A, B & C" - used anywhere a tied MOTW/SOTW award (or
// any other multi-winner list) needs to read as a sentence, not a raw
// array dump.
export function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} & ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} & ${items[items.length - 1]}`;
}
