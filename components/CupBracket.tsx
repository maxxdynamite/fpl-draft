"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CupBracketData, CupMatch, CupSlot } from "@/lib/cupBracket";

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
// Byes: seed 1/2 don't get a separate standalone tile - they simply ARE one
// of qf1/qf3's two slots (a "Bye" label sits above that specific tile
// instead). An earlier version duplicated the bye into its own boxed cell
// wired to qf1/qf3 by a connector, which was really just a line between two
// cells showing the same team - that connector is what produced a stray
// green fragment poking out (a real, sub-pixel-length path segment between
// two adjacent same-content boxes) and let the gradient border overlap
// itself at the seam.
//
// Connectors are straight right-angle lines, full-brightness gradient once
// their source match is decided, neutral otherwise.
//
// Gradient follows each team through the bracket, not "whichever round is
// current": a tile is gradient whenever a real team occupies it AND that
// team hasn't lost there - i.e. the match is still undecided (including a
// bye, which is undecided by definition until its first real game) or they
// won it. The moment a team loses, that one cell drops the gradient; every
// earlier cell they won stays lit, tracing their whole run. The Final's
// winner gets the champion treatment instead of a plain gradient border -
// a fully gradient-filled cell with a shimmer sweep across it.
//
// Match ids (m89, qf1, sf1, final) are shared between the live data layer
// (lib/cupBracket.ts) and this component's fixed EDGES topology below - the
// measurement/connector-drawing logic never needs to branch on whether the
// bracket is seeded, only each tile's *content* does.

type Edge = { from: string; to: string };

const slot = (pairId: string, i: 0 | 1) => `${pairId}-${i}`;

const EDGES: Edge[] = [
  { from: "m89", to: slot("qf1", 1) },
  { from: "m413", to: slot("qf2", 0) },
  { from: "m512", to: slot("qf2", 1) },
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

const COLUMN_HEIGHT = 640;
const CARD_WIDTH = "w-40";
const CONNECTOR_GAP = 6;
const FLAT_THRESHOLD = 20;

// ---------------------------------------------------------------------------
// View model: both the unseeded static shell and the live-data bracket
// reduce to this same shape, so Tile/MatchCard/Column/StackedBracket below
// never need to know which mode produced them.

type TileContent = {
  label: string;
  score: number | null;
  emphasis: "neutral" | "winner" | "loser" | "champion";
  gradient: boolean;
};

type DetailEntry = {
  seed: number;
  teamName: string;
  managerName: string;
  score: number | null;
};

type DetailContent = {
  gameweek: number;
  live: boolean;
  entries: [DetailEntry, DetailEntry];
};

type PairContent = {
  id: string;
  tiles: [TileContent, TileContent];
  // Label shown above tiles[0] specifically - only ever "Bye" today.
  topLabel: string | null;
  live: boolean;
  status: "upcoming" | "live" | "completed";
  detail: DetailContent | null;
};

type ViewModel = {
  r12: PairContent[];
  qf: PairContent[];
  sf: PairContent[];
  final: PairContent;
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
  const blankTile = (): TileContent => ({ label: " ", score: null, emphasis: "neutral", gradient: false });
  const seedTile = (seed: string, gradient: boolean): TileContent => ({
    label: seed,
    score: null,
    emphasis: "neutral",
    gradient,
  });

  const r12: PairContent[] = UNSEEDED_R12.map(({ id, seeds }) => ({
    id,
    tiles: [seedTile(seeds[0], true), seedTile(seeds[1], true)],
    topLabel: null,
    live: false,
    status: "upcoming",
    detail: null,
  }));

  const blankPair = (id: string): PairContent => ({
    id,
    tiles: [blankTile(), blankTile()],
    topLabel: null,
    live: false,
    status: "upcoming",
    detail: null,
  });

  const qf = UNSEEDED_QF_IDS.map(blankPair);
  // Seed 1's bye lives directly in qf1's own first slot, seed 2's in qf3's.
  const qf1 = qf.find((p) => p.id === "qf1")!;
  qf1.tiles[0] = seedTile("1", true);
  qf1.topLabel = "Bye";
  const qf3 = qf.find((p) => p.id === "qf3")!;
  qf3.tiles[0] = seedTile("2", true);
  qf3.topLabel = "Bye";

  const sf = UNSEEDED_SF_IDS.map(blankPair);
  const final = blankPair("final");

  return { r12, qf, sf, final, advancedByFrom: new Map() };
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

// A slot is gradient whenever it holds a real team that hasn't lost there -
// either the match is still undecided (they're alive, pending the result)
// or they won it. A slot with no team yet (still waiting on an earlier
// match) is never gradient - there's no one there to highlight.
function tileFromSlot(slotData: CupSlot, matchDecided: boolean, won: boolean): TileContent {
  if (!slotData.participant) {
    return {
      label: (slotData.sourceMatchId && SOURCE_LABELS[slotData.sourceMatchId]) || "TBD",
      score: null,
      emphasis: "neutral",
      gradient: false,
    };
  }
  return {
    label: slotData.participant.teamName,
    score: slotData.score,
    emphasis: "neutral",
    gradient: !matchDecided || won,
  };
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

function pairFromMatch(match: CupMatch): PairContent {
  const [slotA, slotB] = match.slots;
  const decided = match.status === "completed" && match.winnerEntryId != null;
  const aWon = decided && slotA.participant?.entryId === match.winnerEntryId;
  const bWon = decided && slotB.participant?.entryId === match.winnerEntryId;

  const tileA = tileFromSlot(slotA, decided, aWon);
  const tileB = tileFromSlot(slotB, decided, bWon);

  if (decided) {
    // The Final's winner gets the champion treatment instead of a plain
    // "winner" gradient border - everyone else just advances.
    const winnerEmphasis = match.round === "final" ? "champion" : "winner";
    if (aWon) {
      tileA.emphasis = winnerEmphasis;
      tileB.emphasis = "loser";
    } else {
      tileB.emphasis = winnerEmphasis;
      tileA.emphasis = "loser";
    }
  }

  const entryA = detailEntryFromSlot(slotA);
  const entryB = detailEntryFromSlot(slotB);
  const detail: DetailContent | null =
    entryA && entryB
      ? { gameweek: match.gameweek, live: match.status === "live", entries: [entryA, entryB] }
      : null;

  return {
    id: match.id,
    tiles: [tileA, tileB],
    topLabel: null,
    live: match.status === "live",
    status: match.status,
    detail,
  };
}

function buildSeededViewModel(data: CupBracketData): ViewModel {
  const r12 = data.rounds.r1.map((m) => pairFromMatch(m));
  const qf = data.rounds.qf.map((m) => pairFromMatch(m));
  const sf = data.rounds.sf.map((m) => pairFromMatch(m));
  const final = pairFromMatch(data.final);

  // A bye's own cell needs no game to be alive - that already falls out of
  // the gradient rule above (undecided QF match -> gradient) once seeded.
  // Only the "Bye" label itself needs setting explicitly here.
  for (const bye of data.byes) {
    const pair = qf.find((p) => p.id === bye.feedsMatchId);
    if (!pair) continue;
    pair.topLabel = "Bye";
  }

  const advancedByFrom = new Map<string, boolean>();
  for (const m of [...data.rounds.r1, ...data.rounds.qf, ...data.rounds.sf, data.final]) {
    advancedByFrom.set(m.id, m.status === "completed");
  }

  return { r12, qf, sf, final, advancedByFrom };
}

// ---------------------------------------------------------------------------
// Presentational components (shared by both modes).

function Tile({
  content,
  registerRef,
}: {
  content: TileContent;
  registerRef: (el: HTMLDivElement | null) => void;
}) {
  const isChampion = content.emphasis === "champion";
  const borderClass = content.gradient
    ? "bg-gradient-to-br from-[#00ff85] to-[#04f5ff]"
    : "bg-black/[0.06] dark:bg-white/[0.08]";
  // The champion cell keeps the exact same two-layer box model as every
  // other tile (so its height stays identical) - both layers just use the
  // same gradient instead of a white/zinc-900 inner fill, so no sliver of
  // background shows through and the whole cell reads as gradient-filled.
  const innerClass = isChampion
    ? "bg-gradient-to-br from-[#00ff85] to-[#04f5ff] cup-champion-shimmer"
    : "bg-white dark:bg-zinc-900";
  const textClass = isChampion
    ? "text-[#04211a]"
    : content.emphasis === "winner"
      ? "text-zinc-900 dark:text-white"
      : content.emphasis === "loser"
        ? "text-zinc-900 dark:text-white opacity-45"
        : "text-zinc-700 dark:text-zinc-300";
  return (
    <div
      ref={registerRef}
      className={`${CARD_WIDTH} shrink-0 rounded-xl ${borderClass} p-[2px] shadow-[var(--shadow-soft)]`}
    >
      <div className={`relative rounded-[10px] overflow-hidden ${innerClass}`}>
        <div
          className={`relative px-3 py-[7px] text-xs flex items-center gap-2 ${isChampion ? "font-bold" : "font-semibold"} ${textClass}`}
        >
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
  topLabel,
  live,
  detail,
  expanded,
  onToggle,
  registerRef,
  panelAlign,
}: {
  id: string;
  tiles: [TileContent, TileContent];
  topLabel: string | null;
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
        {topLabel && (
          <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 text-center">
            {topLabel}
          </span>
        )}
        <Tile content={tiles[0]} registerRef={registerRef(slot(id, 0))} />
        <Tile content={tiles[1]} registerRef={registerRef(slot(id, 1))} />
      </div>
      {detail && <MatchDetailPanel detail={detail} open={expanded} align={panelAlign} />}
    </div>
  );
}

function Column({
  title,
  pairs,
  expandedId,
  onToggle,
  registerRef,
  panelAlign,
}: {
  title: string;
  pairs: PairContent[];
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
        {pairs.map((pair) => (
          <MatchCard
            key={pair.id}
            id={pair.id}
            tiles={pair.tiles}
            topLabel={pair.topLabel}
            live={pair.live}
            detail={pair.detail}
            expanded={expandedId === pair.id}
            onToggle={() => onToggle(pair.id)}
            registerRef={registerRef}
            panelAlign={panelAlign}
          />
        ))}
      </div>
    </div>
  );
}

// ---- small-screen fallback --------------------------------------------------
// No SVG/refs - pure stacked list grouped by round, sharing the same view
// model (and therefore the same status/winner colours) as the desktop tree.

function StackedStatusPill({ status }: { status: PairContent["status"] }) {
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

function StackedRow({ tile, badge }: { tile: TileContent; badge?: string | null }) {
  if (tile.emphasis === "champion") {
    return (
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-[#00ff85] to-[#04f5ff] cup-champion-shimmer px-2 py-1 flex items-center gap-2">
        <span className="relative truncate flex-1 text-sm font-bold text-[#04211a]">{tile.label}</span>
        {tile.score !== null && (
          <span className="relative tabular-nums shrink-0 text-sm font-bold text-[#04211a]">{tile.score}</span>
        )}
      </div>
    );
  }
  const textClass =
    tile.emphasis === "winner"
      ? "text-zinc-900 dark:text-white"
      : tile.emphasis === "loser"
        ? "text-zinc-900 dark:text-white opacity-45"
        : "text-zinc-700 dark:text-zinc-300";
  return (
    <div className={`flex items-center gap-2 text-sm font-semibold ${textClass}`}>
      {badge && (
        <span className="shrink-0 text-[9px] font-semibold uppercase text-zinc-400 dark:text-zinc-500">
          {badge}
        </span>
      )}
      <span className="truncate flex-1">{tile.label}</span>
      {tile.score !== null && <span className="tabular-nums shrink-0">{tile.score}</span>}
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
      <StackedRow tile={pair.tiles[0]} badge={pair.topLabel} />
      <StackedRow tile={pair.tiles[1]} />
    </div>
  );
}

function StackedRound({ title, pairs }: { title: string; pairs: PairContent[] }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {title}
      </p>
      <div className="flex flex-col gap-2">
        {pairs.map((pair) => (
          <StackedMatch key={pair.id} pair={pair} />
        ))}
      </div>
    </div>
  );
}

function StackedBracket({ vm }: { vm: ViewModel }) {
  return (
    <div className="flex flex-col gap-5">
      <StackedRound title="Round of 12" pairs={vm.r12} />
      <StackedRound title="Quarter-Final" pairs={vm.qf} />
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
        const fromTileA = nodeRefs.current[slot(edge.from, 0)];
        const fromTileB = nodeRefs.current[slot(edge.from, 1)];
        const toEl = nodeRefs.current[edge.to];
        if (!fromTileA || !fromTileB || !toEl) return null;

        const aRect = fromTileA.getBoundingClientRect();
        const bRect = fromTileB.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        // Origin is the midpoint between the pair's own two tiles, not the
        // wrapper's own bounding box - a "Bye" label sitting only above
        // tile 0 (nothing matching below tile 1) makes the wrapper taller
        // and lopsided, so its own box-height/2 landed above the true
        // midpoint between the two tiles it's meant to average.
        //
        // CONNECTOR_GAP insets both ends off the tile edge - a connector
        // that touches the border reads as part of the cell rather than a
        // distinct line feeding into it.
        const x1 = aRect.right - containerRect.left + CONNECTOR_GAP;
        const y1 = (aRect.top + aRect.height / 2 + bRect.top + bRect.height / 2) / 2 - containerRect.top;
        const x2 = toRect.left - containerRect.left - CONNECTOR_GAP;
        const y2 = toRect.top + toRect.height / 2 - containerRect.top;

        // Straight right-angle bracket connector: out horizontally, up/
        // down at the midpoint, in horizontally. When the two ends are
        // already nearly level (a source pair's midpoint can coincidentally
        // land within a few px of its destination), the elbow's vertical
        // leg is too short to read as a deliberate bend - it just looks
        // like a stray notch. Below FLAT_THRESHOLD, skip the elbow and
        // draw one plain diagonal instead.
        const midX = x1 + (x2 - x1) / 2;
        const d =
          Math.abs(y2 - y1) < FLAT_THRESHOLD
            ? `M ${x1} ${y1} L ${x2} ${y2}`
            : `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
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
                strokeLinecap="butt"
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
