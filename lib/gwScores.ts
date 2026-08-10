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
