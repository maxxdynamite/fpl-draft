import { getManagers } from "./managers";
import { getStandings } from "./standings";
import { getGwScores } from "./gwScores";
import { getBlackjackLeaderboard, TOTAL_GAMEWEEKS } from "./blackjack";
import { getPlayersData } from "./players";
import { getLiveGameweek } from "./liveGwScores";
import { resolveCupBracket } from "./cupBracket";

// "The Tab" is a read-only ledger, composed entirely from data already
// tracked elsewhere in the app - every "rule" below is a small, independent
// pure function that turns already-fetched data into entries for whichever
// managers it concerns. Adding a new money rule later means writing one
// more function and adding it to the list in getTabLedger() - nothing else
// needs to change.

export type TabEntry = {
  label: string;
  amount: number; // positive = credit (owed TO this manager), negative = debit
};

export type TabManager = {
  entryId: number;
  teamName: string;
  managerName: string;
  net: number;
  entries: TabEntry[];
};

type ManagerIdentity = { entryId: number; teamName: string; managerName: string };

function addEntry(map: Map<number, TabEntry[]>, entryId: number, entry: TabEntry) {
  const list = map.get(entryId);
  if (list) {
    list.push(entry);
  } else {
    map.set(entryId, [entry]);
  }
}

// 1. H2H wager - the Standings sheet's p_l column is already the season-long
// net figure from the H2H win/loss stakes system, nothing left to compute.
export function h2hWagerRule(
  standings: { entryId: number; pl: number }[],
): Map<number, TabEntry[]> {
  const result = new Map<number, TabEntry[]>();
  for (const s of standings) {
    if (s.pl === 0) continue;
    addEntry(result, s.entryId, { label: "H2H wager", amount: s.pl });
  }
  return result;
}

// 2. MOTW/SOTW - every gameweek, whoever tops the eventTotal table (Manager
// of the Week) gets £5 from whoever's bottom (Spanner of the Week). No
// per-gameweek history is stored anywhere (only season totals in Standings,
// and this-week-only in lib/weeklyAwards.ts), so this recomputes it fresh
// from GW_Scores for every gameweek that's been played - which also means
// each entry here is naturally itemizable per gameweek for the expand view,
// not just a single opaque season total.
export function motwSotwRule(
  gwScores: { gameweek: number; entryId: number; eventTotal: number }[],
): Map<number, TabEntry[]> {
  const result = new Map<number, TabEntry[]>();
  const byGameweek = new Map<number, { entryId: number; eventTotal: number }[]>();
  for (const row of gwScores) {
    const list = byGameweek.get(row.gameweek) ?? [];
    list.push({ entryId: row.entryId, eventTotal: row.eventTotal });
    byGameweek.set(row.gameweek, list);
  }

  for (const [gameweek, rows] of byGameweek) {
    if (rows.length === 0) continue;
    let motw = rows[0];
    let sotw = rows[0];
    for (const row of rows) {
      if (row.eventTotal > motw.eventTotal) motw = row;
      if (row.eventTotal < sotw.eventTotal) sotw = row;
    }
    if (motw.entryId === sotw.entryId) continue; // only one entrant that week
    addEntry(result, motw.entryId, { label: `MOTW · GW${gameweek}`, amount: 5 });
    addEntry(result, sotw.entryId, { label: `SOTW · GW${gameweek}`, amount: -5 });
  }
  return result;
}

// 3. Blackjack pot - £10 entry each (14 managers = £140), winner takes all,
// only once the real Premier League season is actually finished. A busted
// total (>21) can never win the pot even if it's numerically the highest,
// matching the card game's own rule - the existing getBlackjackLeaderboard
// sort doesn't exclude busts (it's a live pace tracker, not a pot-winner
// determination), so this picks its own winner instead of reusing that
// order. Ties broken by lower entryId, same precedent as the Cup's seeding
// tie-break.
export function blackjackPotRule(
  participants: { entryId: number; totalGoals: number; status: string }[],
  seasonOver: boolean,
): Map<number, TabEntry[]> {
  const result = new Map<number, TabEntry[]>();
  if (!seasonOver || participants.length === 0) return result;

  for (const p of participants) {
    addEntry(result, p.entryId, { label: "Blackjack entry", amount: -10 });
  }

  const contenders = participants.filter((p) => p.status !== "bust");
  if (contenders.length === 0) return result;

  let winner = contenders[0];
  for (const p of contenders) {
    if (
      p.totalGoals > winner.totalGoals ||
      (p.totalGoals === winner.totalGoals && p.entryId < winner.entryId)
    ) {
      winner = p;
    }
  }
  addEntry(result, winner.entryId, {
    label: "Blackjack pot",
    amount: participants.length * 10,
  });
  return result;
}

// 4. Cup pot - £10 entry each once the bracket's seeded (entries are owed
// from the start of the competition, not just once it's decided), winner
// takes all once a champion has actually been crowned. resolveCupBracket()
// already computes both `seeded` and `champion` - this just reuses them
// rather than re-deriving anything.
export function cupPotRule(
  entrants: ManagerIdentity[],
  seeded: boolean,
  champion: { entryId: number } | null,
): Map<number, TabEntry[]> {
  const result = new Map<number, TabEntry[]>();
  if (!seeded) return result;

  for (const m of entrants) {
    addEntry(result, m.entryId, { label: "Cup entry", amount: -10 });
  }
  if (champion) {
    addEntry(result, champion.entryId, {
      label: "Cup pot",
      amount: entrants.length * 10,
    });
  }
  return result;
}

// 5. Draft league - £20 entry each, paid out 1st £200 / 2nd £60 / 3rd gets
// their own £20 back (nets to £0 for 3rd, not new winnings) - only once the
// season's actually over, since standings before then aren't final.
// 200 + 60 + 20 = £280 = 14 x £20, the full pot with nothing left over.
const DRAFT_ENTRY = 20;
const DRAFT_PAYOUTS: Record<number, number> = { 1: 200, 2: 60, 3: 20 };

export function draftPotRule(
  standings: { entryId: number; rank: number }[],
  seasonOver: boolean,
): Map<number, TabEntry[]> {
  const result = new Map<number, TabEntry[]>();
  if (!seasonOver) return result;

  for (const s of standings) {
    addEntry(result, s.entryId, { label: "Draft entry", amount: -DRAFT_ENTRY });
    const payout = DRAFT_PAYOUTS[s.rank];
    if (payout) {
      const place = s.rank === 1 ? "1st" : s.rank === 2 ? "2nd" : "3rd";
      const suffix = s.rank === 3 ? " (entry back)" : "";
      addEntry(result, s.entryId, { label: `Draft ${place} place${suffix}`, amount: payout });
    }
  }
  return result;
}

function mergeRule(target: Map<number, TabEntry[]>, source: Map<number, TabEntry[]>) {
  for (const [entryId, entries] of source) {
    for (const entry of entries) {
      addEntry(target, entryId, entry);
    }
  }
}

export async function getTabLedger(): Promise<TabManager[]> {
  const [managers, standings, gwScores, blackjackParticipants, { currentGameweek }, liveGameweek] =
    await Promise.all([
      getManagers(),
      getStandings(),
      getGwScores(),
      getBlackjackLeaderboard(),
      getPlayersData(),
      getLiveGameweek(),
    ]);

  const seasonOver = currentGameweek >= TOTAL_GAMEWEEKS;

  const bracket = resolveCupBracket({ managers, gwScores, liveGameweek });

  const entriesByManager = new Map<number, TabEntry[]>();
  mergeRule(entriesByManager, h2hWagerRule(standings));
  mergeRule(entriesByManager, motwSotwRule(gwScores));
  mergeRule(entriesByManager, blackjackPotRule(blackjackParticipants, seasonOver));
  mergeRule(entriesByManager, cupPotRule(managers, bracket.seeded, bracket.champion));
  mergeRule(entriesByManager, draftPotRule(standings, seasonOver));

  const result: TabManager[] = managers.map((m) => {
    const entries = entriesByManager.get(m.entryId) ?? [];
    const net = entries.reduce((sum, e) => sum + e.amount, 0);
    return {
      entryId: m.entryId,
      teamName: m.teamName,
      managerName: m.managerName,
      net,
      entries,
    };
  });

  return result.sort((a, b) => b.net - a.net);
}
