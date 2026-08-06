import { getManagers } from "./managers";
import { getStandings } from "./standings";

export type H2hPair = {
  teamA: { entryId: number; teamName: string; wins: number; pl: number };
  teamB: { entryId: number; teamName: string; wins: number; pl: number };
};

// Pairs each manager with their season-long rival, using each rival
// relationship once (lower entry_id first) rather than twice.
export async function getH2hPairs(): Promise<H2hPair[]> {
  const [managers, standings] = await Promise.all([
    getManagers(),
    getStandings(),
  ]);

  const standingsByEntry = new Map(standings.map((s) => [s.entryId, s]));
  const managersByEntry = new Map(managers.map((m) => [m.entryId, m]));

  const pairs: H2hPair[] = [];
  const seen = new Set<number>();

  for (const manager of managers) {
    if (seen.has(manager.entryId)) continue;
    const rival = managersByEntry.get(manager.rivalEntryId);
    if (!rival) continue;

    seen.add(manager.entryId);
    seen.add(rival.entryId);

    const a = standingsByEntry.get(manager.entryId);
    const b = standingsByEntry.get(rival.entryId);

    pairs.push({
      teamA: {
        entryId: manager.entryId,
        teamName: manager.teamName,
        wins: a?.h2hWins ?? 0,
        pl: a?.pl ?? 0,
      },
      teamB: {
        entryId: rival.entryId,
        teamName: rival.teamName,
        wins: b?.h2hWins ?? 0,
        pl: b?.pl ?? 0,
      },
    });
  }

  return pairs;
}
