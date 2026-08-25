import Papa from "papaparse";
import { fetchSheetCsv } from "./sheets";

export type StandingsRow = {
  entryId: number;
  teamName: string;
  totalPoints: number;
  rank: number;
  h2hWins: number;
  pl: number;
};

export async function getStandings(): Promise<StandingsRow[]> {
  const csv = await fetchSheetCsv("Standings", 300); // 5 minutes — daily-updated data doesn't need to be hammered

  const { data } = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  return data
    .map((row) => ({
      entryId: Number(row.entry_id),
      teamName: row.team_name,
      totalPoints: Number(row.total_points),
      rank: Number(row.rank),
      h2hWins: Number(row.h2h_wins),
      pl: Number(row.p_l),
    }))
    .sort((a, b) => a.rank - b.rank);
}
