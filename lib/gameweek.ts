import { getGwScores } from "./gwScores";

// Latest gameweek present in GW_Scores — same "current" notion the rest of
// the app uses (H2H latest score, weekly awards), not the live FPL fixture
// calendar, so it stays in sync with whatever data has actually been synced.
export async function getCurrentGameweek(): Promise<number | null> {
  const gwScores = await getGwScores();
  if (gwScores.length === 0) return null;
  return Math.max(...gwScores.map((row) => row.gameweek));
}
