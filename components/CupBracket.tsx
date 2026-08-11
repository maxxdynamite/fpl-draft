"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type {
  CupBracketData,
  CupMatch,
  CupSlot,
  RoundId,
} from "@/lib/cupBracket";

// Live shell: seeds come from Gameweek 12 (lib/cupBracket.ts), Round of 12
// from GW13, QF from GW14, SF from GW15, Final from GW16. Pre-season (no
// GW12 data yet), `data.seeded` is false and this renders the same static
// placeholder shape it always has - plain seed numbers, no names.
//
// Layout: one-sided, left to right (Round of 12 -> QF -> SF -> Final) - not
// mirrored. Every match, at every stage, is two independent single-team
// tiles stacked with a small gap, all identical width/height. A wrapper div
// (no border of its own) groups each pair for layout and gives the outgoing
// connector to the next round a place to originate from (its vertical
// centre, regardless of which tile ends up advancing). Every column shares
// a fixed height with even (justify-around) distribution.
//
// Connectors are straight right-angle lines. Gradient marks whichever round
// is the current "battlefront" (the earliest round not yet fully decided),
// plus the two byes (already certain, no game needed) - once a round
// completes, gradient moves forward to the next one. A connector is full-
// brightness gradient once its source match/bye is decided, neutral
// otherwise.
//
// Match/bye ids (m89, qf1, sf1, final, bye1, bye2) are shared between the
// live data layer (lib/cupBracket.ts) and this component's fixed EDGES
// topology below - the measurement/connector-drawing logic never needs to
// branch on whether the bracket is seeded, only each tile's *content* does.

type Edge = { from: string; to: string };

const slot = (pairId: string, i: 0 | 1) => `${pairId}-${i}`;

const EDGES: Edge[] = [
  { from: "bye1", to: slot("qf1", 0) },
  { from: "m89", to: slot("qf1", 1) },
  { from: "m413", to: slot("qf2", 0) },
  { from: "m512", to: slot("qf2", 1) },
  { from: "bye2", to: slot("qf3", 0) },
  { from: "m710", to: slot("qf3", 1) },
  { from: "m314", to: slot("qf4", 0) },
  { from: "m611", to: slot("qf4", 1) },
  { from: "qf1", to: slot("sf1", 0) },
  { from: "qf2", to: slot("sf1", 1) },
  { from: "qf3", to: slot("sf2", 0) },
  { from: "qf4", to: slot("sf2", 1) },
  { from: "sf1", to: slot("final", 0) },
  { from: "sf2", to: slot("final", 1) },
];

const FEEDS_QF: Record<"bye1" | "bye2", string> = { bye1: "qf1", bye2: "qf3" };

const COLUMN_HEIGHT = 640;
const CARD_WIDTH = "w-40";

// ---------------------------------------------------------------------------
// View model: both the unseeded static shell and the live-data bracket
// reduce to this same shape, so Tile/MatchCard/Column/StackedBracket below
// never need to know which mode produced them.

type TileContent = {
  label: string;
  score: number | null;
  emphasis: "neutral" | "winner" | "loser";
};

type DetailEntry = {
  seed: number;
  teamName: string;
  managerName: string;
  score: number | null;
};

type DetailContent =
  | { kind: "match"; gameweek: number; live: boolean; entries: [DetailEntry, DetailEntry] }
  | { kind: "bye"; entry: DetailEntry };

type PairContent = {
  id: string;
  tiles: [TileContent, TileContent];
  gradient: boolean;
  live: boolean;
  status: "upcoming" | "live" | "completed";
  detail: DetailContent | null;
};

type ByeContent = {
  id: "bye1" | "bye2";
  tile: TileContent;
  detail: DetailContent | null;
};

type ViewModel = {
  r12: PairContent[];
  qf: PairContent[];
  sf: PairContent[];
  final: PairContent;
  byes: ByeContent[];
  advancedByFrom: Map<string, boolean>;
};

// ---- unseeded (pre-season) shell -------------------------------------------

const UNSEEDED_R12: { id: string; seeds: [string, string] }[] = [
  { id: "m89", seeds: ["8", "9"] },
  { id: "m413", seeds: ["4", "13"] },
  { id: "m512", seeds: ["5", "12"] },
  { id: "m710", seeds: ["7", "10"] },
  { id: "m314", seeds: ["3", "14"] },
  { id: "m611", seeds: ["6", "11"] },
];
const UNSEEDED_QF_IDS = ["qf1", "qf2", "qf3", "qf4"];
const UNSEEDED_SF_IDS = ["sf1", "sf2"];

function buildUnseededViewModel(): ViewModel {
  // A literal single space collapses to a zero-height line box (browsers
  // drop whitespace-only text content entirely) - a non-breaking space
  // doesn't collapse. See components/CupBracket.tsx history.
  const blankTile = (): TileContent => ({ label: " ", score: null, emphasis: "neutral" });
  const seedTile = (seed: string): TileContent => ({ label: seed, score: null, emphasis: "neutral" });

  const r12: PairContent[] = UNSEEDED_R12.map(({ id, seeds }) => ({
    id,
    tiles: [seedTile(seeds[0]), seedTile(seeds[1])],
    gradient: true,
    live: false,
    status: "upcoming",
    detail: null,
  }));

  const blankPair = (id: string): PairContent => ({
    id,
    tiles: [blankTile(), blankTile()],
    gradient: false,
    live: false,
    status: "upcoming",
    detail: null,
  });

  const qf = UNSEEDED_QF_IDS.map(blankPair);
  const sf = UNSEEDED_SF_IDS.map(blankPair);
  const final = blankPair("final");

  const byes: ByeContent[] = [
    { id: "bye1", tile: seedTile("1"), detail: null },
    { id: "bye2", tile: seedTile("2"), detail: null },
  ];

  const advancedByFrom = new Map<string, boolean>([
    ["bye1", true],
    ["bye2", true],
  ]);

  return { r12, qf, sf, final, byes, advancedByFrom };
}

// ---- live, data-driven bracket ---------------------------------------------

const SOURCE_LABELS: Record<string, string> = {
  m89: "Winner 8v9",
  m413: "Winner 4v13",
  m512: "Winner 5v12",
  m710: "Winner 7v10",
  m314: "Winner 3v14",
  m611: "Winner 6v11",
  qf1: "QF Winner",
  qf2: "QF Winner",
  qf3: "QF Winner",
  qf4: "QF Winner",
  sf1: "SF Winner",
  sf2: "SF Winner",
};

function isRoundComplete(matches: CupMatch[]): boolean {
  return matches.length > 0 && matches.every((m) => m.status === "completed");
}

function tileFromSlot(slotData: CupSlot): TileContent {
  if (!slotData.participant) {
    return {
      label: (slotData.sourceMatchId && SOURCE_LABELS[slotData.sourceMatchId]) || "TBD",
      score: null,
      emphasis: "neutral",
    };
  }
  return { label: slotData.participant.teamName, score: slotData.score, emphasis: "neutral" };
}

function detailEntryFromSlot(slotData: CupSlot): DetailEntry | null {
  if (!slotData.participant) return null;
  return {
    seed: slotData.participant.seed,
    teamName: slotData.participant.teamName,
    managerName: slotData.participant.managerName,
    score: slotData.score,
  };
}

function pairFromMatch(match: CupMatch, gradient: boolean): PairContent {
  const [slotA, slotB] = match.slots;
  const tileA = tileFromSlot(slotA);
  const tileB = tileFromSlot(slotB);

  if (match.status === "completed" && match.winnerEntryId != null) {
    if (slotA.participant?.entryId === match.winnerEntryId) {
      tileA.emphasis = "winner";
      tileB.emphasis = "loser";
    } else {
      tileB.emphasis = "winner";
      tileA.emphasis = "loser";
    }
  }

  const entryA = detailEntryFromSlot(slotA);
  const entryB = detailEntryFromSlot(slotB);
  const detail: DetailContent | null =
    entryA && entryB
      ? { kind: "match", gameweek: match.gameweek, live: match.status === "live", entries: [entryA, entryB] }
      : null;

  return {
    id: match.id,
    tiles: [tileA, tileB],
    gradient,
    live: match.status === "live",
    status: match.status,
    detail,
  };
}

function buildSeededViewModel(data: CupBracketData): ViewModel {
  const r1Complete = isRoundComplete(data.rounds.r1);
  const qfComplete = isRoundComplete(data.rounds.qf);
  const sfComplete = isRoundComplete(data.rounds.sf);
  const finalComplete = data.final.status === "completed";

  const currentRound: RoundId | null = !r1Complete
    ? "r1"
    : !qfComplete
      ? "qf"
      : !sfComplete
        ? "sf"
        : !finalComplete
          ? "final"
          : null;

  const r12 = data.rounds.r1.map((m) => pairFromMatch(m, currentRound === "r1"));
  const qf = data.rounds.qf.map((m) => pairFromMatch(m, currentRound === "qf"));
  const sf = data.rounds.sf.map((m) => pairFromMatch(m, currentRound === "sf"));
  const final = pairFromMatch(data.final, currentRound === "final");

  const byeIds: ("bye1" | "bye2")[] = ["bye1", "bye2"];
  const byes: ByeContent[] = data.byes.map((bye, i) => {
    const known = bye.participant !== null;
    const tile: TileContent = {
      label: known ? bye.participant!.teamName : String(bye.seed),
      score: null,
      emphasis: known ? "winner" : "neutral",
    };
    const detail: DetailContent | null = bye.participant
      ? {
          kind: "bye",
          entry: {
            seed: bye.participant.seed,
            teamName: bye.participant.teamName,
            managerName: bye.participant.managerName,
            score: null,
          },
        }
      : null;
    return { id: byeIds[i], tile, detail };
  });

  const advancedByFrom = new Map<string, boolean>();
  for (const m of [...data.rounds.r1, ...data.rounds.qf, ...data.rounds.sf, data.final]) {
    advancedByFrom.set(m.id, m.status === "completed");
  }
  advancedByFrom.set("bye1", true);
  advancedByFrom.set("bye2", true);

  return { r12, qf, sf, final, byes, advancedByFrom };
}

// ---------------------------------------------------------------------------
// Presentational components (shared by both modes).

function Tile({
  content,
  gradient,
  registerRef,
}: {
  content: TileContent;
  gradient: boolean;
  registerRef: (el: HTMLDivElement | null) => void;
}) {
  const borderClass = gradient
    ? "bg-gradient-to-br from-[#00ff85] to-[#04f5ff]"
    : "bg-black/[0.06] dark:bg-white/[0.08]";
  const textClass =
    content.emphasis === "winner"
      ? "text-zinc-900 dark:text-white"
      : content.emphasis === "loser"
        ? "text-zinc-900 dark:text-white opacity-45"
        : "text-zinc-700 dark:text-zinc-300";
  return (
    <div
      ref={registerRef}
      className={`${CARD_WIDTH} shrink-0 rounded-xl ${borderClass} p-[2px] shadow-[var(--shadow-soft)]`}
    >
      <div className="rounded-[10px] bg-white dark:bg-zinc-900 overflow-hidden">
        <div className={`px-3 py-[7px] text-xs font-semibold flex items-center gap-2 ${textClass}`}>
          <span className="truncate flex-1">{content.label}</span>
          {content.score !== null && <span className="tabular-nums shrink-0">{content.score}</span>}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 first:pt-0 last:pb-0">
      <span className="text-zinc-400 dark:text-zinc-500">{label}</span>
      <span className="font-semibold tabular-nums text-zinc-900 dark:text-white truncate max-w-[9rem] text-right">
        {value}
      </span>
    </div>
  );
}

type PanelAlign = "left" | "center" | "right";

const PANEL_ALIGN_CLASS: Record<PanelAlign, string> = {
  left: "left-0",
  center: "left-1/2 -translate-x-1/2",
  right: "right-0",
};

function MatchDetailPanel({
  detail,
  open,
  align,
}: {
  detail: DetailContent;
  open: boolean;
  align: PanelAlign;
}) {
  return (
    <div
      className={`absolute top-full ${PANEL_ALIGN_CLASS[align]} mt-1.5 z-30 w-52 rounded-lg bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.06] dark:ring-white/[0.1] p-2.5 text-xs transition-all duration-150 ${
        open ? "opacity-100 visible pointer-events-auto" : "opacity-0 invisible pointer-events-none"
      }`}
    >
      {detail.kind === "bye" ? (
        <>
          <DetailRow label="Seed" value={String(detail.entry.seed)} />
          <DetailRow label="Team" value={detail.entry.teamName} />
          <DetailRow label="Manager" value={detail.entry.managerName} />
          <p className="mt-1.5 pt-1.5 border-t border-black/[0.06] dark:border-white/[0.08] text-zinc-400 dark:text-zinc-500">
            Bye — no opponent this round.
          </p>
        </>
      ) : (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-1.5">
            Gameweek {detail.gameweek}
            {detail.live ? " · Live" : ""}
          </p>
          {detail.entries.map((entry, i) => (
            <div
              key={entry.seed}
              className={i === 1 ? "mt-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]" : ""}
            >
              <DetailRow label="Seed" value={String(entry.seed)} />
              <DetailRow label="Team" value={entry.teamName} />
              <DetailRow label="Manager" value={entry.managerName} />
              <DetailRow label="Score" value={entry.score !== null ? String(entry.score) : "Not played yet"} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function onKeyActivate(onToggle: () => void) {
  return (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };
}

function MatchCard({
  id,
  tiles,
  gradient,
  live,
  detail,
  expanded,
  onToggle,
  registerRef,
  panelAlign,
}: {
  id: string;
  tiles: [TileContent, TileContent];
  gradient: boolean;
  live: boolean;
  detail: DetailContent | null;
  expanded: boolean;
  onToggle: () => void;
  registerRef: (id: string) => (el: HTMLDivElement | null) => void;
  panelAlign: PanelAlign;
}) {
  const clickable = detail !== null;
  return (
    <div ref={registerRef(id)} className="relative">
      {live && (
        <span
          className="cup-live absolute -left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[#00ff85]"
          aria-hidden="true"
        />
      )}
      <div
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={clickable ? onToggle : undefined}
        onKeyDown={clickable ? onKeyActivate(onToggle) : undefined}
        className={`flex flex-col gap-1.5 ${clickable ? "cursor-pointer" : ""}`}
      >
        <Tile content={tiles[0]} gradient={gradient} registerRef={registerRef(slot(id, 0))} />
        <Tile content={tiles[1]} gradient={gradient} registerRef={registerRef(slot(id, 1))} />
      </div>
      {detail && <MatchDetailPanel detail={detail} open={expanded} align={panelAlign} />}
    </div>
  );
}

function ByeCard({
  content,
  expanded,
  onToggle,
  registerRef,
  panelAlign,
}: {
  content: ByeContent;
  expanded: boolean;
  onToggle: () => void;
  registerRef: (id: string) => (el: HTMLDivElement | null) => void;
  panelAlign: PanelAlign;
}) {
  const clickable = content.detail !== null;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        Bye
      </span>
      <div className="relative">
        <div
          role={clickable ? "button" : undefined}
          tabIndex={clickable ? 0 : undefined}
          onClick={clickable ? onToggle : undefined}
          onKeyDown={clickable ? onKeyActivate(onToggle) : undefined}
          className={clickable ? "cursor-pointer" : ""}
        >
          <Tile content={content.tile} gradient registerRef={registerRef(content.id)} />
        </div>
        {content.detail && <MatchDetailPanel detail={content.detail} open={expanded} align={panelAlign} />}
      </div>
    </div>
  );
}

function Column({
  title,
  pairs,
  byes,
  expandedId,
  onToggle,
  registerRef,
  panelAlign,
}: {
  title: string;
  pairs: PairContent[];
  byes?: ByeContent[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  registerRef: (id: string) => (el: HTMLDivElement | null) => void;
  panelAlign: PanelAlign;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {title}
      </p>
      <div className="flex flex-col justify-around" style={{ height: COLUMN_HEIGHT }}>
        {pairs.map((pair) => {
          const bye = byes?.find((b) => FEEDS_QF[b.id] === pair.id);
          const pairEl = (
            <MatchCard
              key={pair.id}
              id={pair.id}
              tiles={pair.tiles}
              gradient={pair.gradient}
              live={pair.live}
              detail={pair.detail}
              expanded={expandedId === pair.id}
              onToggle={() => onToggle(pair.id)}
              registerRef={registerRef}
              panelAlign={panelAlign}
            />
          );
          if (!bye) return pairEl;
          return (
            <div key={pair.id} className="flex flex-col items-center gap-3">
              <ByeCard
                content={bye}
                expanded={expandedId === bye.id}
                onToggle={() => onToggle(bye.id)}
                registerRef={registerRef}
                panelAlign={panelAlign}
              />
              {pairEl}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- small-screen fallback --------------------------------------------------
// No SVG/refs - pure stacked list grouped by round, sharing the same view
// model (and therefore the same status/winner colours) as the desktop tree.

function StackedStatusPill({ status, isBye }: { status: PairContent["status"]; isBye?: boolean }) {
  if (isBye) {
    return (
      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-gradient-to-br from-[#00ff85] to-[#04f5ff] text-[#04211a]">
        Bye
      </span>
    );
  }
  const label = status === "live" ? "Live" : status === "completed" ? "Final" : "Upcoming";
  const cls =
    status === "live"
      ? "bg-[#00ff85]/15 text-[#00825a] dark:text-[#00ff85]"
      : status === "completed"
        ? "bg-black/[0.06] dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300"
        : "bg-black/[0.04] dark:bg-white/[0.05] text-zinc-400 dark:text-zinc-500";
  return (
    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  );
}

function StackedRow({ tile, isBye }: { tile: TileContent; isBye?: boolean }) {
  const textClass =
    tile.emphasis === "winner"
      ? "text-zinc-900 dark:text-white"
      : tile.emphasis === "loser"
        ? "text-zinc-900 dark:text-white opacity-45"
        : "text-zinc-700 dark:text-zinc-300";
  return (
    <div className={`flex items-center gap-2 text-sm font-semibold ${textClass}`}>
      <span className="truncate flex-1">{tile.label}</span>
      {tile.score !== null && <span className="tabular-nums shrink-0">{tile.score}</span>}
      {isBye && <span className="shrink-0 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">Bye</span>}
    </div>
  );
}

function StackedMatch({ pair }: { pair: PairContent }) {
  return (
    <div className="rounded-xl bg-black/[0.02] dark:bg-white/[0.03] px-3 py-2.5 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <StackedStatusPill status={pair.status} />
        {pair.live && <span className="cup-live h-1.5 w-1.5 rounded-full bg-[#00ff85]" aria-hidden="true" />}
      </div>
      <StackedRow tile={pair.tiles[0]} />
      <StackedRow tile={pair.tiles[1]} />
    </div>
  );
}

function StackedBye({ bye }: { bye: ByeContent }) {
  return (
    <div className="rounded-xl bg-black/[0.02] dark:bg-white/[0.03] px-3 py-2.5 flex flex-col gap-1.5">
      <StackedStatusPill status="upcoming" isBye />
      <StackedRow tile={bye.tile} isBye />
    </div>
  );
}

function StackedRound({ title, pairs, byes }: { title: string; pairs: PairContent[]; byes?: ByeContent[] }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {title}
      </p>
      <div className="flex flex-col gap-2">
        {pairs.map((pair) => {
          const bye = byes?.find((b) => FEEDS_QF[b.id] === pair.id);
          return (
            <div key={pair.id} className="flex flex-col gap-2">
              {bye && <StackedBye key={bye.id} bye={bye} />}
              <StackedMatch pair={pair} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StackedBracket({ vm }: { vm: ViewModel }) {
  return (
    <div className="flex flex-col gap-5">
      <StackedRound title="Round of 12" pairs={vm.r12} />
      <StackedRound title="Quarter-Final" pairs={vm.qf} byes={vm.byes} />
      <StackedRound title="Semi-Final" pairs={vm.sf} />
      <StackedRound title="Final" pairs={[vm.final]} />
    </div>
  );
}

// ---------------------------------------------------------------------------

export function CupBracket({ data }: { data: CupBracketData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [paths, setPaths] = useState<{ id: string; d: string; advanced: boolean }[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const vm = useMemo(
    () => (data.seeded ? buildSeededViewModel(data) : buildUnseededViewModel()),
    [data],
  );

  const registerRef = (id: string) => (el: HTMLDivElement | null) => {
    nodeRefs.current[id] = el;
  };

  const toggleExpanded = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  useLayoutEffect(() => {
    function measure() {
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();

      const next = EDGES.map((edge) => {
        const fromEl = nodeRefs.current[edge.from];
        const toEl = nodeRefs.current[edge.to];
        if (!fromEl || !toEl) return null;

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        const x1 = fromRect.right - containerRect.left;
        const y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
        const x2 = toRect.left - containerRect.left;
        const y2 = toRect.top + toRect.height / 2 - containerRect.top;

        // Straight right-angle bracket connector: out horizontally, up/
        // down at the midpoint, in horizontally.
        const midX = x1 + (x2 - x1) / 2;
        const d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
        return { id: `${edge.from}-${edge.to}`, d, advanced: vm.advancedByFrom.get(edge.from) ?? false };
      }).filter((p): p is { id: string; d: string; advanced: boolean } => p !== null);

      setPaths(next);
    }

    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [vm]);

  return (
    <div className="min-w-0 rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] px-4 sm:px-6 pt-3 pb-4 sm:pb-6">
      {/* min-w-0 is required, not decorative - as a CSS grid item this
          card defaults to min-width:auto, which would let it grow to fit
          the bracket's full intrinsic width instead of respecting the
          grid's 1fr track, and overflow-x-auto below would never actually
          activate (whole page gets horizontal scroll instead). Top padding
          is pt-3 (not the same p-4/p-6 as the sides/bottom) specifically to
          match the sidebar leaderboard's own pt-3 above its title, so the
          two title rows land on the same line. */}
      <div className="hidden md:block overflow-x-auto">
        <div ref={containerRef} className="relative min-w-max pb-2">
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="cup-connector" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#00ff85" />
                <stop offset="100%" stopColor="#04f5ff" />
              </linearGradient>
            </defs>
            {paths.map((p) => (
              <path
                key={p.id}
                d={p.d}
                fill="none"
                stroke={p.advanced ? "url(#cup-connector)" : "#71717a"}
                strokeWidth={2}
                strokeOpacity={p.advanced ? 1 : 0.3}
                strokeLinecap="round"
              />
            ))}
          </svg>
          <div className="relative flex gap-8">
            <Column
              title="Round of 12"
              pairs={vm.r12}
              expandedId={expandedId}
              onToggle={toggleExpanded}
              registerRef={registerRef}
              panelAlign="left"
            />
            <Column
              title="Quarter-Final"
              pairs={vm.qf}
              byes={vm.byes}
              expandedId={expandedId}
              onToggle={toggleExpanded}
              registerRef={registerRef}
              panelAlign="center"
            />
            <Column
              title="Semi-Final"
              pairs={vm.sf}
              expandedId={expandedId}
              onToggle={toggleExpanded}
              registerRef={registerRef}
              panelAlign="center"
            />
            <Column
              title="Final"
              pairs={[vm.final]}
              expandedId={expandedId}
              onToggle={toggleExpanded}
              registerRef={registerRef}
              panelAlign="right"
            />
          </div>
        </div>
      </div>
      <div className="md:hidden">
        <StackedBracket vm={vm} />
      </div>
    </div>
  );
}
