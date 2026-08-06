import Papa from "papaparse";

export type GwScoreRow = {
  gameweek: number;
  entryId: number;
  eventTotal: number;
  rivalEntryId: number;
  rivalEventTotal: number;
  beatRival: number;
  h2hPl: number;
};

function sheetCsvUrl(sheetName: string) {
  const id = process.env.SHEETS_SPREADSHEET_ID;
  if (!id) throw new Error("SHEETS_SPREADSHEET_ID is not set");
  const params = new URLSearchParams({ tqx: "out:csv", sheet: sheetName });
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?${params}`;
}

export async function getGwScores(): Promise<GwScoreRow[]> {
  const res = await fetch(sheetCsvUrl("GW_Scores"), {
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch GW_Scores sheet: ${res.status}`);
  }
  const csv = await res.text();

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
