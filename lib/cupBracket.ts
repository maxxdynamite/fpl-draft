import { resolveMatchTie } from "./cupTiebreaker";

// Fixed round -> gameweek mapping for this season's Cup.
export const ROUND_GAMEWEEKS = {
  seeding: 12,
  r1: 13,
  qf: 14,
  sf: 15,
  final: 16,
} as const;

export type RoundId = "r1" | "qf" | "sf" | "final";
export type MatchStatus = "upcoming" | "live" | "completed";

export type CupParticipant = {
  entryId: number;
  seed: number;
  teamName: string;
  managerName: string;
};

export type CupSlot = {
  participant: CupParticipant | null;
  score: number | null;
  // Set only while the slot is still waiting on an earlier match - lets the
  // UI show e.g. "Winner 8v9" instead of a blank tile.
  sourceMatchId: string | null;
};

export type CupMatch = {
  id: string;
  round: RoundId;
  gameweek: number;
  slots: [CupSlot, CupSlot];
  status: MatchStatus;
  winnerEntryId: number | null;
};

// Byes are a separate, parallel structure to the round match arrays (same
// split the original static shell used) - seed 1/2's QF slot is certain the
// moment seeding happens, it never depends on a played match.
export type CupBye = {
  seed: number;
  participant: CupParticipant | null; // null only pre-seeding
  feedsMatchId: string;
};

export type CupBracketData = {
  seeded: boolean;
  byes: CupBye[];
  rounds: { r1: CupMatch[]; qf: CupMatch[]; sf: CupMatch[] };
  final: CupMatch;
  champion: CupParticipant | null;
};

function emptySlot(sourceMatchId: string | null = null): CupSlot {
  return { participant: null, score: null, sourceMatchId };
}

// ---- seeding -------------------------------------------------------------

export function seedParticipants(
  gw12Rows: { entryId: number; eventTotal: number }[],
  managers: { entryId: number; teamName: string; managerName: string }[],
): CupParticipant[] {
  if (gw12Rows.length === 0) return [];

  const managerById = new Map(managers.map((m) => [m.entryId, m]));

  // GW12 seeding ties aren't covered by the (match) tiebreaker the user
  // specified - broken deterministically by lower entryId so seeding is
  // always total, flagged as an assumption rather than silently arbitrary.
  const sorted = [...gw12Rows].sort((a, b) => {
    if (b.eventTotal !== a.eventTotal) return b.eventTotal - a.eventTotal;
    return a.entryId - b.entryId;
  });

  return sorted.map((row, i) => {
    const manager = managerById.get(row.entryId);
    return {
      entryId: row.entryId,
      seed: i + 1,
      teamName: manager?.teamName ?? "Unknown",
      managerName: manager?.managerName ?? "Unknown",
    };
  });
}

// ---- fixed topology --------------------------------------------------------

const R1_MATCHES: { id: string; seedA: number; seedB: number }[] = [
  { id: "m89", seedA: 8, seedB: 9 },
  { id: "m413", seedA: 4, seedB: 13 },
  { id: "m512", seedA: 5, seedB: 12 },
  { id: "m710", seedA: 7, seedB: 10 },
  { id: "m314", seedA: 3, seedB: 14 },
  { id: "m611", seedA: 6, seedB: 11 },
];

const BYE_SEEDS: { seed: number; feedsMatchId: string }[] = [
  { seed: 1, feedsMatchId: "qf1" },
  { seed: 2, feedsMatchId: "qf3" },
];

type QfSource = { byeSeed: number } | { r1MatchId: string };

const QF_MATCHES: { id: string; sources: [QfSource, QfSource] }[] = [
  { id: "qf1", sources: [{ byeSeed: 1 }, { r1MatchId: "m89" }] },
  { id: "qf2", sources: [{ r1MatchId: "m413" }, { r1MatchId: "m512" }] },
  { id: "qf3", sources: [{ byeSeed: 2 }, { r1MatchId: "m710" }] },
  { id: "qf4", sources: [{ r1MatchId: "m314" }, { r1MatchId: "m611" }] },
];

const SF_MATCHES: { id: string; sources: [string, string] }[] = [
  { id: "sf1", sources: ["qf1", "qf2"] },
  { id: "sf2", sources: ["qf3", "qf4"] },
];

const FINAL_SOURCES: [string, string] = ["sf1", "sf2"];

export function buildR1Matches(seeds: CupParticipant[]): CupMatch[] {
  const bySeed = new Map(seeds.map((p) => [p.seed, p]));
  return R1_MATCHES.map(({ id, seedA, seedB }) => ({
    id,
    round: "r1",
    gameweek: ROUND_GAMEWEEKS.r1,
    slots: [
      { participant: bySeed.get(seedA) ?? null, score: null, sourceMatchId: null },
      { participant: bySeed.get(seedB) ?? null, score: null, sourceMatchId: null },
    ],
    status: "upcoming",
    winnerEntryId: null,
  }));
}

export function buildByes(seeds: CupParticipant[]): CupBye[] {
  const bySeed = new Map(seeds.map((p) => [p.seed, p]));
  return BYE_SEEDS.map(({ seed, feedsMatchId }) => ({
    seed,
    participant: bySeed.get(seed) ?? null,
    feedsMatchId,
  }));
}

// Looks up a completed match's winner (or a not-yet-decided placeholder
// pointing back at the match still in progress) - shared by every round
// after the first, since QF/SF/Final all feed off the previous round the
// same way.
function winnerSlot(matchesById: Map<string, CupMatch>, matchId: string): CupSlot {
  const match = matchesById.get(matchId);
  if (!match) return emptySlot(matchId);
  if (match.status === "completed" && match.winnerEntryId != null) {
    const winner =
      match.slots.find((s) => s.participant?.entryId === match.winnerEntryId)
        ?.participant ?? null;
    return { participant: winner, score: null, sourceMatchId: null };
  }
  return emptySlot(matchId);
}

export function buildQfMatches(r1Matches: CupMatch[], byes: CupBye[]): CupMatch[] {
  const r1ById = new Map(r1Matches.map((m) => [m.id, m]));
  const byeBySeed = new Map(byes.map((b) => [b.seed, b]));

  function resolveSource(source: QfSource): CupSlot {
    if ("byeSeed" in source) {
      const bye = byeBySeed.get(source.byeSeed);
      return { participant: bye?.participant ?? null, score: null, sourceMatchId: null };
    }
    return winnerSlot(r1ById, source.r1MatchId);
  }

  return QF_MATCHES.map(({ id, sources }) => ({
    id,
    round: "qf",
    gameweek: ROUND_GAMEWEEKS.qf,
    slots: [resolveSource(sources[0]), resolveSource(sources[1])],
    status: "upcoming",
    winnerEntryId: null,
  }));
}

export function buildSfMatches(qfMatches: CupMatch[]): CupMatch[] {
  const qfById = new Map(qfMatches.map((m) => [m.id, m]));
  return SF_MATCHES.map(({ id, sources }) => ({
    id,
    round: "sf",
    gameweek: ROUND_GAMEWEEKS.sf,
    slots: [winnerSlot(qfById, sources[0]), winnerSlot(qfById, sources[1])],
    status: "upcoming",
    winnerEntryId: null,
  }));
}

export function buildFinal(sfMatches: CupMatch[]): CupMatch {
  const sfById = new Map(sfMatches.map((m) => [m.id, m]));
  return {
    id: "final",
    round: "final",
    gameweek: ROUND_GAMEWEEKS.final,
    slots: [winnerSlot(sfById, FINAL_SOURCES[0]), winnerSlot(sfById, FINAL_SOURCES[1])],
    status: "upcoming",
    winnerEntryId: null,
  };
}

// ---- match resolution ------------------------------------------------------

export type ScoreLookup = (
  entryId: number,
  gameweek: number,
) => { score: number; live: boolean } | null;

export function resolveMatch(match: CupMatch, getScore: ScoreLookup): CupMatch {
  const [slotA, slotB] = match.slots;
  if (!slotA.participant || !slotB.participant) {
    return { ...match, status: "upcoming" };
  }

  const lookupA = getScore(slotA.participant.entryId, match.gameweek);
  const lookupB = getScore(slotB.participant.entryId, match.gameweek);
  if (!lookupA || !lookupB) {
    return { ...match, status: "upcoming" };
  }

  const nextSlots: [CupSlot, CupSlot] = [
    { ...slotA, score: lookupA.score },
    { ...slotB, score: lookupB.score },
  ];

  if (lookupA.live || lookupB.live) {
    return { ...match, slots: nextSlots, status: "live", winnerEntryId: null };
  }

  let winnerEntryId: number;
  if (lookupA.score > lookupB.score) {
    winnerEntryId = slotA.participant.entryId;
  } else if (lookupB.score > lookupA.score) {
    winnerEntryId = slotB.participant.entryId;
  } else {
    const tie = resolveMatchTie(slotA.participant.seed, slotB.participant.seed);
    winnerEntryId =
      tie === "a" ? slotA.participant.entryId : slotB.participant.entryId;
  }

  return { ...match, slots: nextSlots, status: "completed", winnerEntryId };
}

// ---- top-level orchestration (pure - all inputs pre-fetched) --------------

export type ResolveCupBracketInput = {
  managers: { entryId: number; teamName: string; managerName: string }[];
  gwScores: { gameweek: number; entryId: number; eventTotal: number }[];
  liveGameweek: {
    eventNumber: number;
    finished: boolean;
    entries: { entryId: number; eventTotal: number }[];
  } | null;
};

export function resolveCupBracket(input: ResolveCupBracketInput): CupBracketData {
  const { managers, gwScores, liveGameweek } = input;

  const gw12Rows = gwScores
    .filter((r) => r.gameweek === ROUND_GAMEWEEKS.seeding)
    .map((r) => ({ entryId: r.entryId, eventTotal: r.eventTotal }));
  const seeds = seedParticipants(gw12Rows, managers);

  const emptyFinal: CupMatch = {
    id: "final",
    round: "final",
    gameweek: ROUND_GAMEWEEKS.final,
    slots: [emptySlot(), emptySlot()],
    status: "upcoming",
    winnerEntryId: null,
  };

  if (seeds.length === 0) {
    return {
      seeded: false,
      byes: [],
      rounds: { r1: [], qf: [], sf: [] },
      final: emptyFinal,
      champion: null,
    };
  }

  const archivedByEntryAndGw = new Map<string, number>();
  for (const row of gwScores) {
    archivedByEntryAndGw.set(`${row.entryId}-${row.gameweek}`, row.eventTotal);
  }

  const getScore: ScoreLookup = (entryId, gameweek) => {
    if (liveGameweek && liveGameweek.eventNumber === gameweek) {
      const live = liveGameweek.entries.find((e) => e.entryId === entryId);
      if (live) return { score: live.eventTotal, live: !liveGameweek.finished };
    }
    const archived = archivedByEntryAndGw.get(`${entryId}-${gameweek}`);
    if (archived !== undefined) return { score: archived, live: false };
    return null;
  };

  const byes = buildByes(seeds);
  const r1 = buildR1Matches(seeds).map((m) => resolveMatch(m, getScore));
  const qf = buildQfMatches(r1, byes).map((m) => resolveMatch(m, getScore));
  const sf = buildSfMatches(qf).map((m) => resolveMatch(m, getScore));
  const final = resolveMatch(buildFinal(sf), getScore);

  const champion =
    final.status === "completed" && final.winnerEntryId != null
      ? (final.slots.find((s) => s.participant?.entryId === final.winnerEntryId)
          ?.participant ?? null)
      : null;

  return { seeded: true, byes, rounds: { r1, qf, sf }, final, champion };
}
