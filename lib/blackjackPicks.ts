import Papa from "papaparse";
import { fetchSheetCsv } from "./sheets";

export type BlackjackPicks = {
  entryId: number;
  playerIds: number[]; // always length 4 once submitted
  updatedAt: string;
};

// Reads the BlackjackPicks tab - the only *written-to* sheet in this app,
// via app/api/blackjack/picks/route.ts. Same public-CSV read pattern as
// every other sheet-backed source (see lib/sheets.ts), but always fresh
// (no cache): the picks page redirects back to the leaderboard right
// after a save, so anything less than "always fresh" here means a user
// can land back on their own just-saved picks and see them missing.
export async function getBlackjackPicks(): Promise<BlackjackPicks[]> {
  const csv = await fetchSheetCsv("BlackjackPicks", 0);

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
