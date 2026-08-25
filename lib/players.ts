const POSITION_LABELS: Record<number, string> = {
  1: "GKP",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

export type Club = {
  id: number;
  name: string;
  shortName: string;
};

export type Player = {
  id: number;
  name: string;
  club: Club;
  position: string;
  goals: number;
  photoUrl: string;
  status: string; // "a" available, "i" injured, "s" suspended, "u" unavailable, "d" doubtful
};

export type PlayersData = {
  players: Player[];
  clubs: Club[];
  seasonStartTime: string | null;
  currentGameweek: number;
};

// The general FPL game API (not the Draft-specific one used elsewhere in
// this app) - the only source for the full player pool and live goal
// tallies. Revalidate matches the rest of the app's data-freshness
// convention; goal counts don't need to be any fresher than that.
export async function getPlayersData(): Promise<PlayersData> {
  const res = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch bootstrap-static: ${res.status}`);
  }
  const data = await res.json();

  const clubsById = new Map<number, Club>(
    data.teams.map((t: { id: number; name: string; short_name: string }) => [
      t.id,
      { id: t.id, name: t.name, shortName: t.short_name },
    ]),
  );

  const events: Array<{ finished: boolean; is_current: boolean }> = data.events ?? [];
  const firstEvent = data.events?.[0];

  // Finished gameweeks, plus one more if a gameweek is currently live (in
  // progress counts as partial pace, not zero) - this is the real Premier
  // League calendar, not this app's own Draft league gameweek tracker,
  // which is a separate competition on a separate (and currently
  // out-of-sync) schedule.
  //
  // The "+1 if live" bonus only applies when the current gameweek is
  // actually unfinished - is_current alone isn't enough to tell. The
  // classic FPL API keeps the just-finished gameweek marked is_current
  // right up until the next one's own deadline passes, so a naive
  // events.some(is_current) check double-counted it: once via the
  // finished filter, once more via this bonus, showing "Gameweek 2"
  // while gameweek 2 hadn't even kicked off yet.
  const currentEvent = events.find((e) => e.is_current);
  const currentGameweek =
    events.filter((e) => e.finished).length + (currentEvent && !currentEvent.finished ? 1 : 0);

  // Before a season's first gameweek, bootstrap-static still reports last
  // season's final goals_scored rather than resetting to 0 - real
  // behaviour of the API, not a caching issue. Zero it out ourselves so
  // nobody looks like they've already scored before a ball's been kicked.
  const seasonHasStarted = currentGameweek > 0;

  const players: Player[] = data.elements.map(
    (el: {
      id: number;
      web_name: string;
      team: number;
      element_type: number;
      goals_scored: number;
      code: number;
      status: string;
    }) => ({
      id: el.id,
      name: el.web_name,
      club: clubsById.get(el.team)!,
      position: POSITION_LABELS[el.element_type] ?? "?",
      goals: seasonHasStarted ? el.goals_scored : 0,
      // The bare (unversioned) "premierleague" path also resolves with a
      // "p" prefix, but silently serves stale, outdated photos - confirmed
      // by diffing it against what fantasy.premierleague.com itself
      // actually loads, which uses this season-versioned path with no
      // prefix. PL bumps this version segment periodically; if photos go
      // stale again, re-check what the live site is using.
      //
      // The 110x140 portrait crop (not the near-square "40x40"/80x80
      // variant) is deliberate: rendered with object-cover inside a square
      // circular mask, it overflows vertically by design, which is exactly
      // the slack object-top needs to push the visible window toward the
      // top of the frame and clear headroom above the head. The near-square
      // variant has almost no overflow to work with.
      photoUrl: `https://resources.premierleague.com/premierleague25/photos/players/110x140/${el.code}.png`,
      status: el.status,
    }),
  );

  return {
    players,
    clubs: [...clubsById.values()].sort((a, b) => a.name.localeCompare(b.name)),
    seasonStartTime: firstEvent?.deadline_time ?? null,
    currentGameweek,
  };
}
