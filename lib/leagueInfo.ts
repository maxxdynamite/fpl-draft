export const LEAGUE_ID = 11903;

export type LeagueEntry = {
  id: number; // league-internal id - standings[].leagueEntry references this, NOT entryId
  entryId: number; // the global entry_id used everywhere else in this app (Managers/GW_Scores)
  entryName: string;
  playerFirstName: string;
  playerLastName: string;
};

export type StandingEntry = {
  leagueEntry: number; // matches LeagueEntry.id - must be translated via league_entries to get entryId
  eventTotal: number;
  total: number;
};

export type LeagueDetails = {
  name: string;
  standings: StandingEntry[];
  leagueEntries: LeagueEntry[];
  draftDt: string | null; // ISO timestamp of the scheduled snake draft
  draftStatus: string; // "pre" before it happens, something else once it's started/done
};

// Same endpoint backs both the league name (rarely changes, cached an hour)
// and live per-entry current-gameweek scores (lib/liveGwScores.ts, cached a
// minute) - Next's fetch cache keys on the full options object, so the two
// revalidate windows land as independent cache entries, not a shared one.
export async function getLeagueDetails(
  revalidateSeconds: number,
): Promise<LeagueDetails> {
  const res = await fetch(
    `https://draft.premierleague.com/api/league/${LEAGUE_ID}/details`,
    { next: { revalidate: revalidateSeconds } },
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch league details: ${res.status}`);
  }
  const data = await res.json();

  const standings: StandingEntry[] = (data.standings ?? []).map(
    (s: { league_entry: number; event_total: number; total: number }) => ({
      leagueEntry: s.league_entry,
      eventTotal: s.event_total,
      total: s.total,
    }),
  );

  const leagueEntries: LeagueEntry[] = (data.league_entries ?? []).map(
    (le: {
      id: number;
      entry_id: number;
      entry_name: string;
      player_first_name: string;
      player_last_name: string;
    }) => ({
      id: le.id,
      entryId: le.entry_id,
      entryName: le.entry_name,
      playerFirstName: le.player_first_name,
      playerLastName: le.player_last_name,
    }),
  );

  return {
    name: data.league.name,
    standings,
    leagueEntries,
    draftDt: data.league.draft_dt ?? null,
    draftStatus: data.league.draft_status,
  };
}

export async function getLeagueName(): Promise<string> {
  // league name essentially never changes mid-season
  const details = await getLeagueDetails(3600);
  return details.name;
}

export async function getDraftSchedule(): Promise<{
  draftDt: string | null;
  draftStatus: string;
}> {
  // Set once when the league's created and never changes after - same
  // caching rationale as getLeagueName.
  const details = await getLeagueDetails(3600);
  return { draftDt: details.draftDt, draftStatus: details.draftStatus };
}
