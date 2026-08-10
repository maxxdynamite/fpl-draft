import Papa from "papaparse";
import { fetchSheetCsv } from "./sheets";

export type BlackjackPicks = {
  entryId: number;
  playerIds: number[]; // always length 4 once submitted
  updatedAt: string;
};

// Reads the BlackjackPicks tab - the only *written-to* sheet in this app,
// via app/api/blackjack/picks/route.ts. Same public-CSV read pattern as
// every other sheet-backed source (see lib/sheets.ts).
export async function getBlackjackPicks(): Promise<BlackjackPicks[]> {
  const csv = await fetchSheetCsv("BlackjackPicks", 60);

  const { data } = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  return data
    .filter((row) => row.entry_id)
    .map((row) => ({
      entryId: Number(row.entry_id),
      playerIds: [
        row.player_id_1,
        row.player_id_2,
        row.player_id_3,
        row.player_id_4,
      ]
        .filter(Boolean)
        .map(Number),
      updatedAt: row.updated_at,
    }));
}
