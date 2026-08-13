import { getManagers } from "@/lib/managers";
import { getStandings } from "@/lib/standings";
import { getGwScores } from "@/lib/gwScores";
import { getBlackjackLeaderboard } from "@/lib/blackjack";
import { getPlayersData } from "@/lib/players";
import { getLiveGameweek } from "@/lib/liveGwScores";
import { resolveCupBracket } from "@/lib/cupBracket";
import { getH2hMatchups } from "@/lib/h2h";
import { PotTile, type PotRow } from "@/components/PotTile";
import { DraftH2hTile } from "@/components/DraftH2hTile";
import { MotwSotwTile } from "@/components/MotwSotwTile";
import { TotalMoneyTile, type TotalRow } from "@/components/TotalMoneyTile";

const DRAFT_ENTRY = 20;
const CUP_ENTRY = 10;
const BLACKJACK_ENTRY = 10;

export default async function MoneyPage() {
  const [managers, standings, gwScores, blackjackParticipants, { currentGameweek }, liveGameweek, matchups] =
    await Promise.all([
      getManagers(),
      getStandings(),
      getGwScores(),
      getBlackjackLeaderboard(),
      getPlayersData(),
      getLiveGameweek(),
      getH2hMatchups(),
    ]);

  // Real Premier League calendar - before a ball's been kicked, standings
  // "rank" is just an arbitrary tie-break over all-zero points, so a live
  // pot preview built from it would be actively misleading rather than
  // merely empty. Every money source defaults to £0 for everyone until
  // there's real gameweek data to project from.
  const seasonStarted = currentGameweek > 0;
  const managersByEntry = new Map(managers.map((m) => [m.entryId, m]));

  // Draft league pot - every manager's live net if the season ended today:
  // 1st nets +180 (200 - 20 entry), 2nd +40 (60 - 20), 3rd £0 (20 back -
  // 20 entry), everyone else just -£20. Becomes final once the real
  // season's actually finished.
  const draftRows: PotRow[] = standings.map((s, i) => {
    const payout = i === 0 ? 200 : i === 1 ? 60 : i === 2 ? 20 : 0;
    return {
      entryId: s.entryId,
      managerName: managersByEntry.get(s.entryId)?.managerName ?? "Unknown",
      net: payout - DRAFT_ENTRY,
    };
  });

  // Cup pot - winner takes all. Bracket elimination doesn't have a
  // meaningful "currently leading" score the way a points total does, so
  // everyone just nets -£10 until a champion's actually crowned.
  const bracket = resolveCupBracket({ managers, gwScores, liveGameweek });
  const cupRows: PotRow[] = managers.map((m) => ({
    entryId: m.entryId,
    managerName: m.managerName,
    net:
      bracket.champion?.entryId === m.entryId
        ? CUP_ENTRY * (managers.length - 1)
        : -CUP_ENTRY,
  }));

  // Blackjack pot - winner takes all. A busted total can't win even if
  // it's numerically highest, and nobody counts as "leading" until at
  // least one manager has actually made picks. Ties broken by lower
  // entryId, same precedent as the Cup's seeding tie-break.
  const blackjackContenders = blackjackParticipants.filter(
    (p) => p.status !== "bust" && p.players !== null,
  );
  let blackjackLeader = blackjackContenders[0] ?? null;
  for (const p of blackjackContenders) {
    if (
      p.totalGoals > (blackjackLeader?.totalGoals ?? -Infinity) ||
      (p.totalGoals === blackjackLeader?.totalGoals && p.entryId < blackjackLeader.entryId)
    ) {
      blackjackLeader = p;
    }
  }
  const blackjackRows: PotRow[] = blackjackParticipants.map((p) => ({
    entryId: p.entryId,
    managerName: p.managerName,
    net:
      blackjackLeader?.entryId === p.entryId
        ? BLACKJACK_ENTRY * (blackjackParticipants.length - 1)
        : -BLACKJACK_ENTRY,
  }));

  const motwSotwRows = standings.map((s) => ({
    entryId: s.entryId,
    managerName: managersByEntry.get(s.entryId)?.managerName ?? "Unknown",
    motwCount: s.motwCount,
    sotwCount: s.sotwCount,
  }));

  // Nothing's settled pre-season, so every pot/wager defaults to £0 for
  // everyone rather than a projection built off meaningless all-zero
  // standings - real computations above stay intact for once the season
  // actually gets going.
  const displayDraftRows = seasonStarted ? draftRows : draftRows.map((r) => ({ ...r, net: 0 }));
  const displayCupRows = seasonStarted ? cupRows : cupRows.map((r) => ({ ...r, net: 0 }));
  const displayBlackjackRows = seasonStarted
    ? blackjackRows
    : blackjackRows.map((r) => ({ ...r, net: 0 }));
  const displayMatchups = seasonStarted
    ? matchups
    : matchups.map((m) => ({
        ...m,
        teamA: { ...m.teamA, pl: 0 },
        teamB: { ...m.teamB, pl: 0 },
      }));
  const displayMotwSotwRows = seasonStarted
    ? motwSotwRows
    : motwSotwRows.map((r) => ({ ...r, motwCount: 0, sotwCount: 0 }));

  // Grand total across every money source, per manager - summed from
  // exactly the rows each tile above actually renders, so this always
  // matches what's on screen.
  const totalByEntry = new Map<number, number>();
  function addTotal(entryId: number, amount: number) {
    totalByEntry.set(entryId, (totalByEntry.get(entryId) ?? 0) + amount);
  }
  displayDraftRows.forEach((r) => addTotal(r.entryId, r.net));
  displayCupRows.forEach((r) => addTotal(r.entryId, r.net));
  displayBlackjackRows.forEach((r) => addTotal(r.entryId, r.net));
  displayMatchups.forEach((m) => {
    addTotal(m.teamA.entryId, m.teamA.pl);
    addTotal(m.teamB.entryId, m.teamB.pl);
  });
  displayMotwSotwRows.forEach((r) => addTotal(r.entryId, (r.motwCount - r.sotwCount) * 5));

  const totalRows: TotalRow[] = managers.map((m) => ({
    entryId: m.entryId,
    managerName: m.managerName,
    net: totalByEntry.get(m.entryId) ?? 0,
  }));

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 items-start sm:grid-cols-3">
        <TotalMoneyTile rows={totalRows} />
        <PotTile
          title="Draft Overall"
          entryFee={DRAFT_ENTRY}
          entrantCount={managers.length}
          rows={displayDraftRows}
        />
        <DraftH2hTile matchups={displayMatchups} />
      </div>
      <div className="grid gap-4 items-start sm:grid-cols-3">
        <MotwSotwTile rows={displayMotwSotwRows} />
        <PotTile
          title="Christmas Cup"
          entryFee={CUP_ENTRY}
          entrantCount={managers.length}
          rows={displayCupRows}
        />
        <PotTile
          title="Blackjack"
          entryFee={BLACKJACK_ENTRY}
          entrantCount={blackjackParticipants.length}
          rows={displayBlackjackRows}
        />
      </div>
    </div>
  );
}
