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

// Season-cumulative MOTW/SOTW tallies, computed directly from GW_Scores
// rather than the sheet's own motw_count/sotw_count columns - those are
// driven by a MAXIFS-inside-ARRAYFORMULA formula that doesn't reliably
// broadcast per-row in Google Sheets, so they're stuck at 0. Same
// per-gameweek top/bottom-scorer logic as lib/money.ts's motwSotwRule
// (first row wins a tie, and a gameweek with only one entrant awards
// neither), just tallying counts instead of emitting money events.
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
    if (rows.length === 0) continue;
    let motw = rows[0];
    let sotw = rows[0];
    for (const row of rows) {
      if (row.eventTotal > motw.eventTotal) motw = row;
      if (row.eventTotal < sotw.eventTotal) sotw = row;
    }
    if (motw.entryId === sotw.entryId) continue; // only one entrant that week
    bump(motw.entryId, "motwCount");
    bump(sotw.entryId, "sotwCount");
  }

  return tallies;
}
