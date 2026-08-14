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
// of qf1/qf3's two slots. An earlier version duplicated the bye into its
// own boxed cell wired to qf1/qf3 by a connector, which was really just a
// line between two cells showing the same team - that connector is what
// produced a stray green fragment poking out (a real, sub-pixel-length
// path segment between two adjacent same-content boxes) and let the
// gradient border overlap itself at the seam.
//
// Pre-season, "Bye" sits right-aligned in that same tile (rightLabel, the
// same slot a score would occupy), brand-gradient text, rather than a
// separate cell or a topLabel floating above the row - the pairing's
// other slot stays genuinely blank, since nothing plays into it. Once
// seeded, that other slot holds a real value instead ("Winner 8v9", then
// a real team once decided) - there's nowhere left to put a rightLabel,
// so the live view keeps the small "Bye" topLabel above the row instead.
//
// Connectors are straight right-angle lines, full-brightness gradient once
// their source match is decided, neutral otherwise. Shown at every
// breakpoint - they only ever looked like clutter on mobile back when it
// had its own cramped gap and uneven justify-around spacing; now that
// both breakpoints share this tree with real measured alignment (next
// paragraph), they're short and mostly flat everywhere, reinforcing the
// alignment rather than fighting it.
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
//
// One shared tree for both breakpoints, structurally identical at every
// viewport - every pair, in every round after Round of 12, gets a per-pair
// vertical nudge (translateY, computed in the
// alignment effect below) so it sits centred on the *average of its own
// immediate sources' real rendered centres*, cascading round by round
// (QF aligns to Round of 12, SF aligns to QF's now-aligned centres, Final
// aligns to SF's). This is deliberately real DOM measurement, the same
// technique the connector paths already use, rather than a CSS-only
// layout trick: an earlier CSS Grid version that sized each downstream
// cell by *spanning* the full row-range under its sources centred it
// against the whole depth of that subtree instead of against its sources'
// own visual centres, which reads as "not quite aligned with the ties
// above it" once a subtree gets lopsided (exactly the qf1/qf3 bye case).
// Which pair(s) feed which is derived from EDGES itself
// (computeGroupSizes), not hardcoded, so that asymmetry falls out
// automatically rather than needing special-casing.

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

const CARD_WIDTH = "w-40";
const CONNECTOR_GAP = 6;
const FLAT_THRESHOLD = 20;

// ---------------------------------------------------------------------------
// View model: both the unseeded static shell and the live-data bracket
// reduce to this same shape, so Tile/MatchCard/Column below never need to
// know which mode produced them.

type TileContent = {
  label: string;
  score: number | null;
  // Right-aligned status word, e.g. "Bye" - distinct from score (always
  // numeric, tabular) and rendered in the brand gradient. Same slot a
  // score would occupy, but never both at once in practice.
  rightLabel?: string | null;
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
  const seedTile = (seed: string): TileContent => ({
    label: seed,
    score: null,
    emphasis: "neutral",
    gradient: false,
  });

  const r12: PairContent[] = UNSEEDED_R12.map(({ id, seeds }) => ({
    id,
    tiles: [seedTile(seeds[0]), seedTile(seeds[1])],
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
  // Seed 1's bye lives directly in qf1's own first slot, seed 2's in
  // qf3's - "Bye" itself sits right-aligned in that same tile (rightLabel),
  // the same slot a score would occupy, rather than a separate cell or a
  // topLabel floating above the row. The pair's other slot stays blank -
  // nothing plays into it.
  const qf1 = qf.find((p) => p.id === "qf1")!;
  qf1.tiles[0] = { ...seedTile("1"), rightLabel: "Bye" };
  const qf3 = qf.find((p) => p.id === "qf3")!;
  qf3.tiles[0] = { ...seedTile("2"), rightLabel: "Bye" };

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
        {/* One standard height everywhere (was a flat py-[7px] before
            that) - constant regardless of round or breakpoint, never
            shrunk to fit more pairs in less space. */}
        <div
          className={`relative px-3 py-3 text-xs flex items-center gap-2 ${isChampion ? "font-bold" : "font-semibold"} ${textClass}`}
        >
          <span className="truncate flex-1">{content.label}</span>
          {content.score !== null && <span className="tabular-nums shrink-0">{content.score}</span>}
          {/* shrink-0, not flex-1 like the label - bg-clip-text needs a
              box sized to the text itself, not stretched to fill the
              row, or the gradient spans mostly-empty space and the
              glyphs only ever land on its "from" end (reads as flat
              green, not a gradient at all). */}
          {content.rightLabel != null && (
            <span className="shrink-0 bg-gradient-to-r from-[#00ff85] to-[#04f5ff] bg-clip-text text-transparent">
              {content.rightLabel}
            </span>
          )}
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
  // The alignment effect (CupBracket) writes this element's translateY
  // directly via nodeRefs, not through a React-controlled style prop -
  // it needs to reset-then-remeasure-then-reapply synchronously within a
  // single pass to get the pre-nudge ("natural") position right every
  // time, and a React state round-trip in between is exactly what made an
  // earlier version of this compound its own error on every recompute.
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
        className={`flex flex-col gap-1 ${clickable ? "cursor-pointer" : ""}`}
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
      <div className="flex flex-col justify-around h-[640px]">
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

// For each pair in toPairs, how many pairs in fromPairs feed it, in
// display order - derived from EDGES rather than hardcoded, so the bye
// asymmetry (qf1/qf3 each have only one real Round of 12 source, qf2/qf4
// have two) falls out automatically instead of needing a special case.
function computeGroupSizes(fromPairs: PairContent[], toPairs: PairContent[]): number[] {
  const fromIds = new Set(fromPairs.map((p) => p.id));
  return toPairs.map(
    (toPair) => EDGES.filter((e) => fromIds.has(e.from) && e.to.startsWith(`${toPair.id}-`)).length,
  );
}

export function CupBracket({ data }: { data: CupBracketData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [paths, setPaths] = useState<{ id: string; d: string; advanced: boolean }[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const vm = useMemo(
    () => (data.seeded ? buildSeededViewModel(data) : buildUnseededViewModel()),
    [data],
  );

  const allRounds = useMemo(
    () => [
      { title: "Round of 12", pairs: vm.r12 },
      { title: "Quarter-Final", pairs: vm.qf },
      { title: "Semi-Final", pairs: vm.sf },
      { title: "Final", pairs: [vm.final] },
    ],
    [vm],
  );

  const registerRef = (id: string) => (el: HTMLDivElement | null) => {
    nodeRefs.current[id] = el;
  };

  const toggleExpanded = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  useLayoutEffect(() => {
    // Every pair after Round of 12 gets a direct (non-React-controlled)
    // translateY on the exact element registerRef already tracks, nudging
    // it to sit centred on the average of its own immediate sources' real
    // rendered centres - cascading round by round, so SF aligns to QF's
    // now-corrected centres rather than QF's pre-alignment ones, and Final
    // to SF's. Round of 12 itself never moves (it's the anchor).
    //
    // This writes to the DOM directly, not through React state: an
    // earlier version stored offsets in state and recovered each pair's
    // "natural" (pre-nudge) position on every recompute by subtracting
    // whatever offset was already applied - measured minus applied. That
    // only holds if "applied" and the actual painted transform agree, but
    // ResizeObserver can fire again (e.g. web font finishing load) before
    // React has re-rendered and the browser has painted the *previous*
    // computation's transform - subtracting a not-yet-painted offset from
    // a still-old measurement compounds the error every time it happens
    // (confirmed live: the same pair's offset came out roughly 2x too
    // large across two reloads). Resetting transforms to none and
    // re-measuring synchronously, every time, has no such failure mode -
    // "natural" is never a derived value, only ever a fresh measurement.
    function applyAlignment() {
      for (let r = 1; r < allRounds.length; r++) {
        allRounds[r].pairs.forEach((pair) => {
          const el = nodeRefs.current[pair.id];
          if (el) el.style.transform = "";
        });
      }

      function centerOf(id: string): number | null {
        const tileA = nodeRefs.current[slot(id, 0)];
        const tileB = nodeRefs.current[slot(id, 1)];
        if (!tileA || !tileB) return null;
        const aRect = tileA.getBoundingClientRect();
        const bRect = tileB.getBoundingClientRect();
        return (aRect.top + aRect.height / 2 + bRect.top + bRect.height / 2) / 2;
      }

      // Each round's *aligned* centre (after its own nudge is applied),
      // not its natural one - this is what makes the next round cascade
      // off corrected positions. Round of 12 has no nudge, so its own
      // measured centre already is its aligned one.
      const alignedCenter: Record<string, number> = {};
      allRounds[0].pairs.forEach((p) => {
        const c = centerOf(p.id);
        if (c !== null) alignedCenter[p.id] = c;
      });

      for (let r = 1; r < allRounds.length; r++) {
        const prevPairs = allRounds[r - 1].pairs;
        const groupSizes = computeGroupSizes(prevPairs, allRounds[r].pairs);
        let cursor = 0;
        allRounds[r].pairs.forEach((pair, i) => {
          const group = prevPairs.slice(cursor, cursor + groupSizes[i]);
          cursor += groupSizes[i];
          const sourceCenters = group.map((p) => alignedCenter[p.id]).filter((c): c is number => c !== undefined);
          const natural = centerOf(pair.id);
          if (natural === null || sourceCenters.length === 0) return;
          const target = sourceCenters.reduce((a, b) => a + b, 0) / sourceCenters.length;
          alignedCenter[pair.id] = target;
          const el = nodeRefs.current[pair.id];
          if (el) el.style.transform = `translateY(${target - natural}px)`;
        });
      }
    }

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
        // like a stray notch. Below FLAT_THRESHOLD, skip the bend entirely
        // and snap to one dead-level horizontal line instead - a diagonal
        // would break the "always grid-aligned" language every other
        // connector uses, but a couple of px of visual noise is genuinely
        // imperceptible, so treating it as flat isn't a lie.
        const midX = x1 + (x2 - x1) / 2;
        const yFlat = (y1 + y2) / 2;
        const isFlat = Math.abs(y2 - y1) < FLAT_THRESHOLD;
        // A perfectly flat line (both endpoints at the exact same y) has a
        // zero-height bounding box - the advanced/decided state's stroke is
        // an objectBoundingBox gradient, and per the SVG spec a gradient in
        // that coordinate system paints nothing at all when the bounding
        // box has zero width or height. A sub-pixel offset (invisible to
        // the eye, nothing like the earlier visible diagonal) keeps the
        // box non-degenerate so the gradient actually renders.
        const d = isFlat
          ? `M ${x1} ${yFlat} L ${x2} ${yFlat + 0.5}`
          : `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
        return { id: `${edge.from}-${edge.to}`, d, advanced: vm.advancedByFrom.get(edge.from) ?? false };
      }).filter((p): p is { id: string; d: string; advanced: boolean } => p !== null);

      setPaths(next);
    }

    function run() {
      applyAlignment();
      measure();
    }

    run();
    const observer = new ResizeObserver(run);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener("resize", run);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", run);
    };
  }, [vm, allRounds]);

  return (
    <div className="min-w-0 rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] px-4 sm:px-6 pt-2 md:pt-3 pb-3 sm:pb-6">
      {/* min-w-0 is required, not decorative - as a CSS grid item this
          card defaults to min-width:auto, which would let it grow to fit
          the bracket's full intrinsic width instead of respecting the
          grid's 1fr track, and overflow-x-auto below would never actually
          activate (whole page gets horizontal scroll instead). Top padding
          is pt-3 at md and up (not the same p-4/p-6 as the sides/bottom)
          specifically to match the sidebar leaderboard's own pt-3 above its
          title, so the two title rows land on the same line - that pairing
          is desktop-only (the sidebar stacks below on mobile, not
          alongside), so mobile trims to pt-2/pb-3 instead. */}
      {/* One tree at every breakpoint - overflow-x-auto is what turns it
          into either mobile's hand-panned strip or desktop's free scroll,
          nothing else differs structurally. */}
      <div className="overflow-x-auto">
        <div ref={containerRef} className="relative min-w-max pb-2">
          {/* Shown at every breakpoint - was desktop-only while mobile
              still used its own cramped gap and uneven justify-around
              spacing (connectors read as clutter there). Both breakpoints
              now share this tree with real measured alignment (the effect
              above), so connectors are short and mostly flat everywhere,
              not just on desktop. */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
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
                // A flat connector only spans the column gap minus its two
                // end insets (~20px), well short of an elbow's total
                // length - 0.3 opacity read as invisible on that little
                // surface area. Bumped every neutral connector to 0.6
                // uniformly rather than singling the short ones out, so
                // the whole bracket's undecided lines share one colour
                // AND one opacity, not just one colour.
                strokeOpacity={p.advanced ? 1 : 0.6}
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
    </div>
  );
}
