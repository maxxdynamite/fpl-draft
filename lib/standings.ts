import Papa from "papaparse";

export type StandingsRow = {
  entryId: number;
  teamName: string;
  totalPoints: number;
  rank: number;
  h2hWins: number;
  pl: number;
  motwCount: number;
  sotwCount: number;
};

function sheetCsvUrl(sheetName: string) {
  const id = process.env.SHEETS_SPREADSHEET_ID;
  if (!id) throw new Error("SHEETS_SPREADSHEET_ID is not set");
  const params = new URLSearchParams({ tqx: "out:csv", sheet: sheetName });
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?${params}`;
}

export async function getStandings(): Promise<StandingsRow[]> {
  const res = await fetch(sheetCsvUrl("Standings"), {
    next: { revalidate: 300 }, // 5 minutes — daily-updated data doesn't need to be hammered
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Standings sheet: ${res.status}`);
  }
  const csv = await res.text();

  const { data } = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  return data
    .map((row) => ({
      entryId: Number(row.entry_id),
      teamName: row.team_name,
      totalPoints: Number(row.total_points),
      rank: Number(row.rank),
      h2hWins: Number(row.h2h_wins),
      pl: Number(row.p_l),
      motwCount: Number(row.motw_count),
      sotwCount: Number(row.sotw_count),
    }))
    .sort((a, b) => a.rank - b.rank);
}
