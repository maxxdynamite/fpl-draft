export function formatPl(pl: number) {
  if (pl > 0) return `+£${pl}`;
  if (pl < 0) return `-£${Math.abs(pl)}`;
  return `£0`;
}
