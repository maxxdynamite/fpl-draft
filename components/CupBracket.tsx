"use client";

import { useLayoutEffect, useRef, useState } from "react";

// Static shell: seeding for the gameweek that determines seeds 1-14 hasn't
// happened yet (TBC, closer to Christmas), so this is the fixed matchup
// shape by seed number only - no manager names, no live winner computation.
//
// Layout: one-sided, left to right (Round of 12 -> QF -> SF -> Final ->
// Winner) - not mirrored. Every match, at every stage including Round of
// 12, is two independent single-team tiles stacked with a small gap, all
// identical width and height - no card ever shows two teams merged into
// one box. A "pair" wrapper div (no border of its own) groups each pair
// of tiles for layout and gives the outgoing connector to the next round
// a place to originate from (its vertical centre - the midpoint between
// the two tiles - regardless of which one ends up advancing). Every
// column shares the same fixed height with an even (justify-around)
// distribution, so fewer tiles in a later round naturally spread out
// further - equal spacing without hand-tuned per-round gaps.
//
// Connectors are plain straight right-angle lines throughout.
//
// Gradient: tiles that belong to the *current* stage (right now, that's
// Round of 12 - the next matches to actually be played) are gradient-
// bordered, plus anything already decided independent of a result (the
// two byes - seed 1/2's place in the QF needs no game). The connector
// leaving a bye is gradient at full brightness, since that path is
// already certain. Round of 12's own outgoing connectors stay neutral -
// being "the current stage" doesn't mean its results are decided yet.
// Everything downstream (QF/SF/Final/Winner tiles and connectors) is
// neutral until this shell is updated to reflect real results, at which
// point the gradient moves forward one stage at a time.

type Slot = string | null;
type PairNode = { id: string; slots: [Slot, Slot] };
type Edge = { from: string; to: string; advanced: boolean };

const R12: PairNode[] = [
  { id: "m89", slots: ["8", "9"] },
  { id: "m413", slots: ["4", "13"] },
  { id: "m512", slots: ["5", "12"] },
  { id: "m710", slots: ["7", "10"] },
  { id: "m314", slots: ["3", "14"] },
  { id: "m611", slots: ["6", "11"] },
];

const QF: PairNode[] = [
  { id: "qf1", slots: [null, null] },
  { id: "qf2", slots: [null, null] },
  { id: "qf3", slots: [null, null] },
  { id: "qf4", slots: [null, null] },
];
const SF: PairNode[] = [
  { id: "sf1", slots: [null, null] },
  { id: "sf2", slots: [null, null] },
];
const FINAL: PairNode = { id: "final", slots: [null, null] };

const BYES = [
  { id: "bye1", seed: "1", feedsQF: "qf1" },
  { id: "bye2", seed: "2", feedsQF: "qf3" },
];

// slot(pairId, 0|1) is the individual tile's ref id within a pair.
const slot = (pairId: string, i: 0 | 1) => `${pairId}-${i}`;

const EDGES: Edge[] = [
  { from: "bye1", to: slot("qf1", 0), advanced: true },
  { from: "m89", to: slot("qf1", 1), advanced: false },
  { from: "m413", to: slot("qf2", 0), advanced: false },
  { from: "m512", to: slot("qf2", 1), advanced: false },
  { from: "bye2", to: slot("qf3", 0), advanced: true },
  { from: "m710", to: slot("qf3", 1), advanced: false },
  { from: "m314", to: slot("qf4", 0), advanced: false },
  { from: "m611", to: slot("qf4", 1), advanced: false },
  { from: "qf1", to: slot("sf1", 0), advanced: false },
  { from: "qf2", to: slot("sf1", 1), advanced: false },
  { from: "qf3", to: slot("sf2", 0), advanced: false },
  { from: "qf4", to: slot("sf2", 1), advanced: false },
  { from: "sf1", to: slot("final", 0), advanced: false },
  { from: "sf2", to: slot("final", 1), advanced: false },
  { from: "final", to: "winner", advanced: false },
];

const COLUMN_HEIGHT = 640;
const CARD_WIDTH = "w-40";

function Tile({
  value,
  gradient,
  registerRef,
}: {
  value: Slot;
  gradient: boolean;
  registerRef: (el: HTMLDivElement | null) => void;
}) {
  const content = (
    <div className="px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
      {value ?? " "}
    </div>
  );
  if (gradient) {
    return (
      <div
        ref={registerRef}
        className={`${CARD_WIDTH} shrink-0 rounded-xl bg-gradient-to-br from-[#00ff85] to-[#04f5ff] p-[1.5px]`}
      >
        <div className="rounded-[10px] bg-white dark:bg-zinc-900 overflow-hidden">{content}</div>
      </div>
    );
  }
  return (
    <div
      ref={registerRef}
      className={`${CARD_WIDTH} shrink-0 rounded-xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden`}
    >
      {content}
    </div>
  );
}

function Pair({
  pair,
  gradient,
  registerRef,
}: {
  pair: PairNode;
  gradient: boolean;
  registerRef: (id: string) => (el: HTMLDivElement | null) => void;
}) {
  return (
    <div ref={registerRef(pair.id)} className="flex flex-col gap-1.5">
      <Tile value={pair.slots[0]} gradient={gradient} registerRef={registerRef(slot(pair.id, 0))} />
      <Tile value={pair.slots[1]} gradient={gradient} registerRef={registerRef(slot(pair.id, 1))} />
    </div>
  );
}

function Column({
  title,
  pairs,
  gradient,
  registerRef,
}: {
  title: string;
  pairs: PairNode[];
  gradient?: boolean;
  registerRef: (id: string) => (el: HTMLDivElement | null) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {title}
      </p>
      <div className="flex flex-col justify-around" style={{ height: COLUMN_HEIGHT }}>
        {pairs.map((pair) => {
          const bye = BYES.find((b) => b.feedsQF === pair.id);
          const pairEl = <Pair key={pair.id} pair={pair} gradient={gradient ?? false} registerRef={registerRef} />;
          if (!bye) return pairEl;
          return (
            <div key={pair.id} className="flex flex-col items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  Bye
                </span>
                <Tile value={bye.seed} gradient registerRef={registerRef(bye.id)} />
              </div>
              {pairEl}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CupBracket() {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [paths, setPaths] = useState<{ id: string; d: string; advanced: boolean }[]>([]);

  const registerRef = (id: string) => (el: HTMLDivElement | null) => {
    nodeRefs.current[id] = el;
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
        return { id: `${edge.from}-${edge.to}`, d, advanced: edge.advanced };
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
  }, []);

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
      <div className="overflow-x-auto">
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
            <Column title="Round of 12" pairs={R12} gradient registerRef={registerRef} />
            <Column title="Quarter-Final" pairs={QF} registerRef={registerRef} />
            <Column title="Semi-Final" pairs={SF} registerRef={registerRef} />
            <div className="flex flex-col items-center gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Final
              </p>
              <div
                className="flex flex-col items-center justify-center gap-3"
                style={{ height: COLUMN_HEIGHT }}
              >
                <Pair pair={FINAL} gradient={false} registerRef={registerRef} />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    Winner
                  </span>
                  <Tile value={null} gradient={false} registerRef={registerRef("winner")} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
