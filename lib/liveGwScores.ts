import { getLeagueDetails } from "./leagueInfo";

export type LiveGwEntry = {
  entryId: number;
  eventTotal: number;
};

export type LiveGameweek = {
  eventNumber: number;
  finished: boolean;
  entries: LiveGwEntry[];
};

// Mirrors apps-script/Code.js's syncCurrentGameweek(): current_event comes
// from /api/game, standings/scores come from league/details, and
// standings[].leagueEntry has to be translated to the global entry_id via
// league_entries before it means anything to the rest of this app. Unlike
// GW_Scores (synced at most once a day), this hits the live API directly so
// a round in progress doesn't have to wait for the next sync.
export async function getLiveGameweek(): Promise<LiveGameweek | null> {
  const res = await fetch("https://draft.premierleague.com/api/game", {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch game state: ${res.status}`);
  }
  const game = await res.json();
  const eventNumber: number | null = game.current_event ?? null;
  if (!eventNumber) return null; // pre-season / between gameweeks - not an error

  const details = await getLeagueDetails(60);
  const entryIdByLeagueEntry = new Map(
    details.leagueEntries.map((le) => [le.id, le.entryId]),
  );

  const entries: LiveGwEntry[] = details.standings
    .map((s) => {
      const entryId = entryIdByLeagueEntry.get(s.leagueEntry);
      if (entryId === undefined) return null;
      return { entryId, eventTotal: s.eventTotal };
    })
    .filter((e): e is LiveGwEntry => e !== null);

  return {
    eventNumber,
    finished: Boolean(game.current_event_finished),
    entries,
  };
}
