import { getManagers } from "@/lib/managers";
import { getStandings } from "@/lib/standings";
import { getGwScores } from "@/lib/gwScores";
import { getBlackjackLeaderboard } from "@/lib/blackjack";
import { getPlayersData } from "@/lib/players";
import { getPlGameweekStatus } from "@/lib/plGameweekStatus";
import { getLiveGameweek } from "@/lib/liveGwScores";
import { resolveCupBracket } from "@/lib/cupBracket";
import { getH2hMatchups } from "@/lib/h2h";
import { computeMotwSotwTallies } from "@/lib/gwScores";
import { PotTile, type PotRow } from "@/components/PotTile";
import { DraftH2hTile } from "@/components/DraftH2hTile";
import { MotwSotwTile } from "@/components/MotwSotwTile";
import { TotalMoneyTile, type TotalRow } from "@/components/TotalMoneyTile";

const DRAFT_ENTRY = 20;
const CUP_ENTRY = 10;
const BLACKJACK_ENTRY = 10;
// Adjust each season if the real Premier League calendar ever changes -
// same convention as lib/pickingWindow.ts's hardcoded transfer window dates.
const FINAL_GAMEWEEK = 38;

export default async function MoneyPage() {
  const [
    managers,
    standings,
    gwScores,
    blackjackParticipants,
    { currentGameweek },
    plStatus,
    liveGameweek,
    matchups,
  ] = await Promise.all([
    getManagers(),
    getStandings(),
    getGwScores(),
    getBlackjackLeaderboard(),
    getPlayersData(),
    getPlGameweekStatus(),
    getLiveGameweek(),
    getH2hMatchups(),
  ]);

  // Real Premier League calendar - before a ball's been kicked, standings
  // "rank" is just an arbitrary tie-break over all-zero points, so a live
  // pot preview built from it would be actively misleading rather than
  // merely empty. Every money source defaults to £0 for everyone until
  // there's real gameweek data to project from.
  const seasonStarted = currentGameweek > 0;
  // Season-long pots (Draft Overall, Blackjack) don't settle on any
  // gameweek's result individually - only once the whole season's done,
  // gameweek 38 officially locked. A "leading if it ended today" style
  // preview would misrepresent an outcome that's still genuinely
  // undecided, same reasoning as gating H2H/MOTW-SOTW on
  // liveGameweek.finished rather than showing it live all season.
  const seasonComplete =
    plStatus !== null && plStatus.gameweekNumber === FINAL_GAMEWEEK && plStatus.finished;
  const managersByEntry = new Map(managers.map((m) => [m.entryId, m]));

  // Draft league pot - only settles once the season's actually finished
  // (see seasonComplete above); nothing to project before then, since
  // "currently 1st" isn't a real outcome until gameweek 38 locks.
  // 1st nets +180 (200 - 20 entry), 2nd +40 (60 - 20), 3rd £0 (20 back -
  // 20 entry), everyone else just -£20.
  const draftRows: PotRow[] = standings.map((s, i) => {
    const payout = i === 0 ? 200 : i === 1 ? 60 : i === 2 ? 20 : 0;
    return {
      entryId: s.entryId,
      managerName: managersByEntry.get(s.entryId)?.managerName ?? "Unknown",
      net: payout - DRAFT_ENTRY,
    };
  });

  // Cup pot - winner takes all, settles whenever a champion's actually
  // crowned (can happen well before gameweek 38 - the Cup itself finishes
  // around Christmas). Everyone stays at £0 until then; bracket elimination
  // doesn't have a meaningful "currently leading" projection the way a
  // points total does, so there's nothing sensible to show early anyway.
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

  // Computed from GW_Scores directly, not Standings' motw_count/sotw_count
  // columns - see computeMotwSotwTallies' own comment for why those are
  // unreliable.
  const motwSotwTallies = computeMotwSotwTallies(gwScores);
  const motwSotwRows = standings.map((s) => ({
    entryId: s.entryId,
    managerName: managersByEntry.get(s.entryId)?.managerName ?? "Unknown",
    motwCount: motwSotwTallies.get(s.entryId)?.motwCount ?? 0,
    sotwCount: motwSotwTallies.get(s.entryId)?.sotwCount ?? 0,
  }));

  // Same "wager, not just display" bar as lib/h2h.ts's H2H stake
  // projection: must wait for liveGameweek.finished (FPL's official
  // lockdown), not just live/provisional, since bonus/defensive
  // contribution points can still shuffle who's actually top/bottom right
  // up until then. Strict >, not >=, for the same double-counting reason
  // as everywhere else - equal means it's already synced and settled.
  const syncedLatestGw =
    gwScores.length > 0 ? Math.max(...gwScores.map((r) => r.gameweek)) : null;
  const canProjectLiveMotwSotw =
    liveGameweek !== null &&
    liveGameweek.finished &&
    (syncedLatestGw === null || liveGameweek.eventNumber > syncedLatestGw) &&
    liveGameweek.entries.length > 0;
  // Same first-occurrence tie-break as lib/weeklyAwards.ts's official
  // MOTW/SOTW determination, applied here to the live entries instead.
  const liveMotwEntryId = canProjectLiveMotwSotw
    ? liveGameweek!.entries.reduce((best, e) => (e.eventTotal > best.eventTotal ? e : best)).entryId
    : null;
  const liveSotwEntryId = canProjectLiveMotwSotw
    ? liveGameweek!.entries.reduce((worst, e) => (e.eventTotal < worst.eventTotal ? e : worst)).entryId
    : null;
  const liveMotwSotwRows = motwSotwRows.map((r) => ({
    ...r,
    motwCount: r.motwCount + (r.entryId === liveMotwEntryId ? 1 : 0),
    sotwCount: r.sotwCount + (r.entryId === liveSotwEntryId ? 1 : 0),
  }));

  // Draft Overall and Blackjack only pay out once the season's actually
  // over (seasonComplete); the Cup pays out whenever its own champion is
  // crowned, independent of the season. Everyone stays at £0 until their
  // pot's real completion condition, not a running "if it ended today"
  // projection.
  const displayDraftRows = seasonComplete ? draftRows : draftRows.map((r) => ({ ...r, net: 0 }));
  const displayCupRows =
    bracket.champion !== null ? cupRows : cupRows.map((r) => ({ ...r, net: 0 }));
  const displayBlackjackRows = seasonComplete
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
    ? liveMotwSotwRows
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
    // Single flowing grid, not fixed rows of three - Draft Overall/Cup/
    // Blackjack only render once they're actually relevant (see
    // seasonComplete/bracket.champion below), so a hardcoded row layout
    // would otherwise leave visible gaps while they're hidden.
    <div className="grid gap-4 items-start sm:grid-cols-3">
      <TotalMoneyTile rows={totalRows} />
      <DraftH2hTile matchups={displayMatchups} />
      <MotwSotwTile rows={displayMotwSotwRows} />
      {seasonComplete && (
        <PotTile
          title="Draft Overall"
          entryFee={DRAFT_ENTRY}
          entrantCount={managers.length}
          rows={displayDraftRows}
        />
      )}
      {bracket.champion !== null && (
        <PotTile
          title="Christmas Cup"
          entryFee={CUP_ENTRY}
          entrantCount={managers.length}
          rows={displayCupRows}
        />
      )}
      {seasonComplete && (
        <PotTile
          title="Blackjack"
          entryFee={BLACKJACK_ENTRY}
          entrantCount={blackjackParticipants.length}
          rows={displayBlackjackRows}
        />
      )}
    </div>
  );
}
