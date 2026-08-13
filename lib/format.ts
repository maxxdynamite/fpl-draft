export function formatPl(pl: number) {
  if (pl > 0) return `+£${pl}`;
  if (pl < 0) return `-£${Math.abs(pl)}`;
  return `£0`;
}

export function plColor(pl: number) {
  if (pl > 0) return "text-emerald-600 dark:text-emerald-400";
  if (pl < 0) return "text-rose-600 dark:text-rose-400";
  return "text-zinc-400";
}
