import { getGwScores } from "./gwScores";

export type GameweekInfo = {
  number: number;
  finished: boolean;
};

// The gameweek number comes from the latest entry in GW_Scores — same
// "current" notion the rest of the app uses (H2H latest score, weekly
// awards), not the live FPL fixture calendar, so it stays in sync with
// whatever data has actually been synced. Finished status isn't tracked
// in the sheet though, so that part comes from the live Draft API.
export async function getCurrentGameweek(): Promise<GameweekInfo | null> {
  const gwScores = await getGwScores();
  if (gwScores.length === 0) return null;
  const number = Math.max(...gwScores.map((row) => row.gameweek));

  const res = await fetch(
    "https://draft.premierleague.com/api/bootstrap-static",
    { next: { revalidate: 300 } },
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch bootstrap-static: ${res.status}`);
  }
  const data = await res.json();
  const events: Array<{ id: number; finished: boolean }> =
    data.events?.data ?? [];
  const finished = events.find((e) => e.id === number)?.finished ?? false;

  return { number, finished };
}
