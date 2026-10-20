import Papa from "papaparse";
import { fetchSheetCsv } from "./sheets";

export type GwScoreRow = {
  gameweek: number;
  entryId: number;
  eventTotal: number;
  rivalEntryId: number;
  rivalEventTotal: number;
  beatRival: number;
  h2hPl: number;
};

export async function getGwScores(): Promise<GwScoreRow[]> {
  const csv = await fetchSheetCsv("GW_Scores", 300);

  const { data } = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  return data
    .filter((row) => row.gameweek && row.entry_id)
    .map((row) => ({
      gameweek: Number(row.gameweek),
      entryId: Number(row.entry_id),
      eventTotal: Number(row.event_total),
      rivalEntryId: Number(row.rival_entry_id),
      rivalEventTotal: Number(row.rival_event_total),
      beatRival: Number(row.beat_rival),
      h2hPl: Number(row.h2h_pl),
    }))
    .sort((a, b) => a.gameweek - b.gameweek);
}

// This gameweek's top and bottom eventTotal, as every tied entryId rather
// than a single arbitrary pick - a gameweek with only one entrant, or
// where everyone scored the same, has nobody actually "above" or "below"
// anyone else, so both come back empty. Shared by every MOTW/SOTW
// consumer below (season tallies, the latest-gameweek badge, and the
// money split) so the tie rule only lives in one place.
export function groupTiedMotwSotw(
  rows: { entryId: number; eventTotal: number }[],
): { motwEntryIds: number[]; sotwEntryIds: number[] } {
  if (rows.length === 0) return { motwEntryIds: [], sotwEntryIds: [] };
  const maxTotal = Math.max(...rows.map((r) => r.eventTotal));
  const minTotal = Math.min(...rows.map((r) => r.eventTotal));
  if (maxTotal === minTotal) return { motwEntryIds: [], sotwEntryIds: [] };
  return {
    motwEntryIds: rows.filter((r) => r.eventTotal === maxTotal).map((r) => r.entryId),
    sotwEntryIds: rows.filter((r) => r.eventTotal === minTotal).map((r) => r.entryId),
  };
}

// Season-cumulative MOTW/SOTW tallies, computed directly from GW_Scores
// rather than the sheet's own motw_count/sotw_count columns - those are
// driven by a MAXIFS-inside-ARRAYFORMULA formula that doesn't reliably
// broadcast per-row in Google Sheets, so they're stuck at 0. Every manager
// tied for top (or bottom) a given week gets the full count, via
// groupTiedMotwSotw above.
export function computeMotwSotwTallies(
  gwScores: { gameweek: number; entryId: number; eventTotal: number }[],
): Map<number, { motwCount: number; sotwCount: number }> {
  const byGameweek = new Map<number, { entryId: number; eventTotal: number }[]>();
  for (const row of gwScores) {
    const list = byGameweek.get(row.gameweek) ?? [];
    list.push({ entryId: row.entryId, eventTotal: row.eventTotal });
    byGameweek.set(row.gameweek, list);
  }

  const tallies = new Map<number, { motwCount: number; sotwCount: number }>();
  const bump = (entryId: number, key: "motwCount" | "sotwCount") => {
    const t = tallies.get(entryId) ?? { motwCount: 0, sotwCount: 0 };
    t[key]++;
    tallies.set(entryId, t);
  };

  for (const rows of byGameweek.values()) {
    const { motwEntryIds, sotwEntryIds } = groupTiedMotwSotw(rows);
    for (const id of motwEntryIds) bump(id, "motwCount");
    for (const id of sotwEntryIds) bump(id, "sotwCount");
  }

  return tallies;
}

// This gameweek's MOTW/SOTW specifically (the H2H tiles' own badge next
// to a manager's name), not the season tally computeMotwSotwTallies
// above returns - "did this manager just win it" vs "how many times has
// this manager ever won it". Scoped to only the latest gameweek in
// gwScores; everyone tied comes back, not just one.
export function getLatestMotwSotwEntryIds(
  gwScores: { gameweek: number; entryId: number; eventTotal: number }[],
): { motwEntryIds: number[]; sotwEntryIds: number[] } {
  if (gwScores.length === 0) return { motwEntryIds: [], sotwEntryIds: [] };
  const latestGameweek = Math.max(...gwScores.map((r) => r.gameweek));
  const rows = gwScores.filter((r) => r.gameweek === latestGameweek);
  return groupTiedMotwSotw(rows);
}

// Season-cumulative £ net per manager from the MOTW/SOTW stake. A tie
// splits a fixed £{stake} pot evenly across whoever's tied, on each side
// independently, rather than paying the full stake per tied manager - the
// total that actually moves stays £{stake} a week no matter how many ways
// it's split (the owner's explicit call: a fixed weekly pot, not a stake
// per tied pairing).
export function computeMotwSotwMoney(
  gwScores: { gameweek: number; entryId: number; eventTotal: number }[],
  stake = 5,
): Map<number, number> {
  const byGameweek = new Map<number, { entryId: number; eventTotal: number }[]>();
  for (const row of gwScores) {
    const list = byGameweek.get(row.gameweek) ?? [];
    list.push({ entryId: row.entryId, eventTotal: row.eventTotal });
    byGameweek.set(row.gameweek, list);
  }

  const net = new Map<number, number>();
  const add = (entryId: number, amount: number) => {
    net.set(entryId, (net.get(entryId) ?? 0) + amount);
  };

  for (const rows of byGameweek.values()) {
    const { motwEntryIds, sotwEntryIds } = groupTiedMotwSotw(rows);
    if (motwEntryIds.length === 0) continue;
    const winnerShare = stake / motwEntryIds.length;
    const payerShare = stake / sotwEntryIds.length;
    for (const id of motwEntryIds) add(id, winnerShare);
    for (const id of sotwEntryIds) add(id, -payerShare);
  }

  return net;
}
