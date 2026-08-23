export type PlGameweekStatus = {
  gameweekNumber: number;
  finished: boolean;
  // Every fixture in this gameweek has been played to full-time, but not
  // yet officially locked - see lib/liveGwScores.ts's identical field for
  // the Draft-API equivalent of this same distinction.
  allMatchesPlayed: boolean;
};

// Real Premier League calendar (general FPL API), not the Draft league's
// own tracker - same deliberate separation lib/players.ts's
// currentGameweek already keeps, since Blackjack is a real-world-goals
// competition, not tied to the Draft league's schedule. Used for
// Blackjack's Live/Provisional/Complete status label.
export async function getPlGameweekStatus(): Promise<PlGameweekStatus | null> {
  const res = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch bootstrap-static: ${res.status}`);
  }
  const data = await res.json();
  const events: Array<{ id: number; finished: boolean; is_current: boolean }> =
    data.events ?? [];

  const currentEvent = events.find((e) => e.is_current);
  if (currentEvent) {
    const fixturesRes = await fetch(
      `https://fantasy.premierleague.com/api/fixtures/?event=${currentEvent.id}`,
      { next: { revalidate: 60 } },
    );
    const fixtures: Array<{ finished_provisional: boolean }> = fixturesRes.ok
      ? await fixturesRes.json()
      : [];
    const allMatchesPlayed =
      fixtures.length > 0 && fixtures.every((f) => f.finished_provisional);

    return {
      gameweekNumber: currentEvent.id,
      finished: currentEvent.finished,
      allMatchesPlayed,
    };
  }

  // No gameweek is "current" - either pre-season (nothing finished yet,
  // nothing to report) or the gap between one gameweek locking and the
  // next kicking off, where the last-finished gameweek is simply Complete.
  const finishedEvents = events.filter((e) => e.finished);
  if (finishedEvents.length === 0) return null;
  const lastFinished = finishedEvents[finishedEvents.length - 1];
  return { gameweekNumber: lastFinished.id, finished: true, allMatchesPlayed: true };
}
