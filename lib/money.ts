import { getManagers } from "./managers";
import { getStandings } from "./standings";
import { getGwScores } from "./gwScores";
import { findBlackjackWinner, getBlackjackLeaderboard, TOTAL_GAMEWEEKS } from "./blackjack";
import { getPlayersData } from "./players";
import { getLiveGameweek } from "./liveGwScores";
import { resolveCupBracket, ROUND_GAMEWEEKS } from "./cupBracket";

// "Money" is a read-only ledger, composed entirely from data already
// tracked elsewhere in the app. Two shapes of rule live here:
//
// - Pairwise rules return MoneyEvent[] - a specific manager owing a
//   specific other manager a specific amount at a specific gameweek. These
//   feed both the who-owes-whom grid (netted per pair) and the
//   chronological log.
// - The Draft league's 1st/2nd/3rd payout can't be pairwise (11 losing
//   managers' entry fees fund three different winners in different
//   amounts, with no single counterparty per debt), so it stays a simple
//   per-manager summary instead, same shape as the rest of the app's
//   leaderboards.

export type MoneyEvent = {
  label: string;
  gameweek: number;
  fromEntryId: number; // ower
  fromName: string;
  toEntryId: number; // owed
  toName: string;
  amount: number; // always positive
};

export type MoneyCell = { fromEntryId: number; toEntryId: number; amount: number };

export type MoneyManager = { entryId: number; teamName: string; managerName: string };

export type PotEntry = { label: string; amount: number };
export type PotManager = {
  entryId: number;
  teamName: string;
  managerName: string;
  net: number;
  entries: PotEntry[];
};

export type MoneyLedger = {
  managers: MoneyManager[];
  cells: MoneyCell[];
  events: MoneyEvent[]; // most recent gameweek first
  draftPot: PotManager[];
};

type NamedManager = { entryId: number; teamName: string; managerName: string };

// 1. H2H wager - GW_Scores' h2h_pl is already the real per-gameweek money
// swing between each manager and their one fixed season-long rival
// (lib/managers.ts's rivalEntryId, embedded per-row here as rivalEntryId
// too) - only the winning side of each week's pairing is taken, so each
// result is logged once, not twice.
export function h2hWagerRule(
  gwScores: { gameweek: number; entryId: number; rivalEntryId: number; h2hPl: number }[],
  managersByEntry: Map<number, NamedManager>,
): MoneyEvent[] {
  const events: MoneyEvent[] = [];
  for (const row of gwScores) {
    if (row.h2hPl <= 0) continue;
    const from = managersByEntry.get(row.rivalEntryId);
    const to = managersByEntry.get(row.entryId);
    if (!from || !to) continue;
    events.push({
      label: "H2H wager",
      gameweek: row.gameweek,
      fromEntryId: row.rivalEntryId,
      fromName: from.managerName,
      toEntryId: row.entryId,
      toName: to.managerName,
      amount: row.h2hPl,
    });
  }
  return events;
}

// 2. MOTW/SOTW - every gameweek, whoever tops the eventTotal table (Manager
// of the Week) gets £5 from whoever's bottom (Spanner of the Week). No
// per-gameweek history is stored anywhere for this (only season totals in
// Standings, and this-week-only in lib/weeklyAwards.ts), so it's
// recomputed fresh from GW_Scores for every gameweek that's been played.
export function motwSotwRule(
  gwScores: { gameweek: number; entryId: number; eventTotal: number }[],
  managersByEntry: Map<number, NamedManager>,
): MoneyEvent[] {
  const events: MoneyEvent[] = [];
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
    const from = managersByEntry.get(sotw.entryId);
    const to = managersByEntry.get(motw.entryId);
    if (!from || !to) continue;
    events.push({
      label: "MOTW/SOTW",
      gameweek,
      fromEntryId: sotw.entryId,
      fromName: from.managerName,
      toEntryId: motw.entryId,
      toName: to.managerName,
      amount: 5,
    });
  }
  return events;
}

// 3. Blackjack pot - £10 entry each (14 managers = £140), winner takes all,
// only once the real Premier League season is actually finished. Winner
// is findBlackjackWinner (lib/blackjack.ts) - highest total among
// everyone who isn't bust, so a busted total (>21, or 21 without every
// pick scoring) can never win even if it's numerically the highest,
// matching the card game's own rule, and the winner doesn't need to have
// hit an actual 21-goal blackjack, just the best surviving total. Same
// function also decides whose on-screen status becomes "winner" instead
// of "fell-short" - both must agree on the exact same person, which is
// why there's one shared implementation rather than two that could
// drift. Ties broken by lower entryId, same precedent as the Cup's
// seeding tie-break. Pairwise: every other participant owes the winner
// their £10 entry (the winner's own entry cancels out against their own
// share of the pot, so it never appears as a debt to themselves).
export function blackjackPotRule(
  participants: { entryId: number; totalGoals: number; status: string }[],
  seasonOver: boolean,
  managersByEntry: Map<number, NamedManager>,
): MoneyEvent[] {
  if (!seasonOver || participants.length === 0) return [];

  const winner = findBlackjackWinner(participants);
  if (!winner) return [];

  const to = managersByEntry.get(winner.entryId);
  if (!to) return [];

  return participants
    .filter((p) => p.entryId !== winner.entryId)
    .map((p) => {
      const from = managersByEntry.get(p.entryId);
      return from
        ? {
            label: "Blackjack pot",
            gameweek: TOTAL_GAMEWEEKS,
            fromEntryId: p.entryId,
            fromName: from.managerName,
            toEntryId: winner.entryId,
            toName: to.managerName,
            amount: 10,
          }
        : null;
    })
    .filter((e): e is MoneyEvent => e !== null);
}

// 4. Cup pot - £10 entry each, winner takes all, only once a champion has
// actually been decided. resolveCupBracket() already computes `champion` -
// this just reuses it. Logged at the final's gameweek, since that's when
// the champion - and therefore who owes whom - is actually known.
export function cupPotRule(
  entrants: NamedManager[],
  champion: { entryId: number } | null,
): MoneyEvent[] {
  if (!champion) return [];
  const to = entrants.find((m) => m.entryId === champion.entryId);
  if (!to) return [];

  return entrants
    .filter((m) => m.entryId !== champion.entryId)
    .map((from) => ({
      label: "Cup pot",
      gameweek: ROUND_GAMEWEEKS.final,
      fromEntryId: from.entryId,
      fromName: from.managerName,
      toEntryId: champion.entryId,
      toName: to.managerName,
      amount: 10,
    }));
}

// 5. Draft league - £20 entry each, paid out 1st £200 / 2nd £60 / 3rd gets
// their own £20 back - only once the season's actually over. Not pairwise:
// eleven losing managers' entry fees fund three different winners in
// different amounts, with no single counterparty per debt, so this stays a
// plain per-manager summary instead of feeding the grid/log.
// 200 + 60 + 20 = £280 = 14 x £20, the full pot with nothing left over.
const DRAFT_ENTRY = 20;
const DRAFT_PAYOUTS: Record<number, number> = { 1: 200, 2: 60, 3: 20 };

export function draftPotRule(
  standings: { entryId: number; rank: number }[],
  seasonOver: boolean,
): Map<number, PotEntry[]> {
  const result = new Map<number, PotEntry[]>();
  if (!seasonOver) return result;

  for (const s of standings) {
    const list = result.get(s.entryId) ?? [];
    list.push({ label: "Draft entry", amount: -DRAFT_ENTRY });
    const payout = DRAFT_PAYOUTS[s.rank];
    if (payout) {
      const place = s.rank === 1 ? "1st" : s.rank === 2 ? "2nd" : "3rd";
      const suffix = s.rank === 3 ? " (entry back)" : "";
      list.push({ label: `Draft ${place} place${suffix}`, amount: payout });
    }
    result.set(s.entryId, list);
  }
  return result;
}

// Nets every event down to at most one entry per unordered manager pair -
// if a matrix cell existed in both directions it would mean two managers
// each independently owe the other money, which should just show as one
// smaller debt in whichever direction is net positive, not two entries.
export function netCells(events: MoneyEvent[]): MoneyCell[] {
  const netByPair = new Map<string, number>(); // key lo-hi -> net amount owed from lo to hi (+) or hi to lo (-)
  for (const e of events) {
    const lo = Math.min(e.fromEntryId, e.toEntryId);
    const hi = Math.max(e.fromEntryId, e.toEntryId);
    const key = `${lo}-${hi}`;
    const sign = e.fromEntryId === lo ? 1 : -1;
    netByPair.set(key, (netByPair.get(key) ?? 0) + sign * e.amount);
  }

  const cells: MoneyCell[] = [];
  for (const [key, net] of netByPair) {
    if (net === 0) continue;
    const [lo, hi] = key.split("-").map(Number);
    if (net > 0) {
      cells.push({ fromEntryId: lo, toEntryId: hi, amount: net });
    } else {
      cells.push({ fromEntryId: hi, toEntryId: lo, amount: -net });
    }
  }
  return cells;
}

export async function getMoneyLedger(): Promise<MoneyLedger> {
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
  const managersByEntry = new Map(managers.map((m) => [m.entryId, m]));
  const bracket = resolveCupBracket({ managers, gwScores, liveGameweek });

  const events = [
    ...h2hWagerRule(gwScores, managersByEntry),
    ...motwSotwRule(gwScores, managersByEntry),
    ...blackjackPotRule(blackjackParticipants, seasonOver, managersByEntry),
    ...cupPotRule(managers, bracket.champion),
  ].sort((a, b) => b.gameweek - a.gameweek || a.label.localeCompare(b.label));

  const cells = netCells(events);

  const draftByEntry = draftPotRule(standings, seasonOver);
  const draftPot: PotManager[] = managers.map((m) => {
    const entries = draftByEntry.get(m.entryId) ?? [];
    const net = entries.reduce((sum, e) => sum + e.amount, 0);
    return {
      entryId: m.entryId,
      teamName: m.teamName,
      managerName: m.managerName,
      net,
      entries,
    };
  });

  return {
    managers: managers.map((m) => ({
      entryId: m.entryId,
      teamName: m.teamName,
      managerName: m.managerName,
    })),
    cells,
    events,
    draftPot,
  };
}
