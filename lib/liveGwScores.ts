import { getLeagueDetails } from "./leagueInfo";
import type { GameweekStatus } from "@/components/GameweekStatusLabel";

export type LiveGwEntry = {
  entryId: number;
  eventTotal: number;
};

export type LiveGameweek = {
  eventNumber: number;
  finished: boolean;
  // Every fixture in this gameweek has been played to full-time, but FPL's
  // official lockdown (`finished` above) hasn't happened yet - bonus points
  // and defensive contribution points can still move. Distinct from
  // `finished` per-fixture too: FPL's own fixtures API tracks
  // finished_provisional (full-time) separately from finished (checked and
  // locked), which is exactly this gap.
  allMatchesPlayed: boolean;
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

  const [details, fixturesRes] = await Promise.all([
    getLeagueDetails(60),
    fetch(`https://fantasy.premierleague.com/api/fixtures/?event=${eventNumber}`, {
      next: { revalidate: 60 },
    }),
  ]);
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

  const fixtures: Array<{ finished_provisional: boolean }> = fixturesRes.ok
    ? await fixturesRes.json()
    : [];
  const allMatchesPlayed =
    fixtures.length > 0 && fixtures.every((f) => f.finished_provisional);

  return {
    eventNumber,
    finished: Boolean(game.current_event_finished),
    allMatchesPlayed,
    entries,
  };
}

// Single source of truth for the Live/Provisional/Complete status pill
// shown on Draft, Blackjack, and Money - all three describe the same
// real-world gameweek, so they need to agree on what state it's in even
// though each page tracks its own gameweek NUMBER from whichever source
// suits its own content (Draft's synced/live number, Blackjack's real
// Premier League calendar for pace calculations). Deliberately sourced
// from this file's own getLiveGameweek() (the FPL Draft API) rather than
// lib/plGameweekStatus.ts's classic-FPL-API equivalent - the two don't
// always flip their own "finished" flag at the same time, and the Draft
// API's has consistently proven the more reliable lockdown signal.
//
// syncedGameweekNumber is only relevant to callers (like Draft) that
// have their own sheet-synced tracker which can lag behind the live feed
// by up to a gameweek - it decides whether to trust the live feed at all
// this call, mirroring Draft's own useLive check. Callers with no such
// tracker (Blackjack, Money) pass null, which always prefers live
// whenever it's available - there's nothing sheet-based for it to lag
// behind in the first place.
export function computeGameweekStatus(
  liveGameweek: LiveGameweek | null,
  syncedGameweekNumber: number | null,
): GameweekStatus | null {
  const useLive =
    liveGameweek !== null &&
    (syncedGameweekNumber === null || liveGameweek.eventNumber >= syncedGameweekNumber);
  const showStatus = useLive || syncedGameweekNumber !== null;
  if (!showStatus) return null;
  if (!useLive || liveGameweek!.finished) return "Complete";
  return liveGameweek!.allMatchesPlayed ? "Provisional" : "Live";
}
