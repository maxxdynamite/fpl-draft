// Picks are open before the season starts, then lock once it kicks off -
// except for a reopening during the real-world January transfer window,
// where a swap costs real money (tracked informally outside this app, not
// enforced here). Adjust these two dates each season.
const JANUARY_WINDOW_START = "2027-01-01T00:00:00Z";
const JANUARY_WINDOW_END = "2027-02-03T23:59:59Z";

export function isPickingWindowOpen(seasonStartTime: string | null): boolean {
  const now = new Date();
  if (!seasonStartTime || now < new Date(seasonStartTime)) return true; // pre-season
  return now >= new Date(JANUARY_WINDOW_START) && now <= new Date(JANUARY_WINDOW_END);
}
