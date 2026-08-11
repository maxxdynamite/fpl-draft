"use client";

import { useLayoutEffect, useRef, useState } from "react";

// Static shell: seeding for the gameweek that determines seeds 1-14 hasn't
// happened yet (TBC, closer to Christmas), so this is the fixed matchup
// shape by seed number only - no manager names, no live winner computation.
//
// From the quarter-final onward, each match is two independent single-slot
// tiles (not one two-row card) stacked with a small gap - a pair wrapper
// div (no border of its own) groups them for layout and gives the
// outgoing connector to the next round a place to originate from (its
// vertical centre, i.e. the midpoint between the two tiles). Round of 12
// keeps the two-row merged card, and byes keep their existing standalone
// badge - neither of those changed here.
//
// Progressive styling: the brand gradient (full brightness) marks a
// genuinely *finalised* result, not just "this round is up next" - a
// Round of 12 fixture hasn't been played, so it stays neutral like every
// other undecided match. Byes are the one exception: seed 1/2's place in
// the QF is certain from the start, no game required, so their cell and
// connector are gradient immediately. As this shell is updated to reflect
// real results, the gradient moves forward one decided match at a time.

type Slot = string | null;
type MatchNode = { id: string; top: Slot; bottom: Slot };
type PairNode = { id: string; slots: [Slot, Slot] };
// advanced: gradient-coloured, full brightness (this result is decided) vs neutral.
type Edge = { from: string; to: string; advanced: boolean };

const ROUND_OF_12: MatchNode[] = [
  { id: "m89", top: "8", bottom: "9" },
  { id: "m413", top: "4", bottom: "13" },
  { id: "m512", top: "5", bottom: "12" },
  { id: "m710", top: "7", bottom: "10" },
  { id: "m314", top: "3", bottom: "14" },
  { id: "m611", top: "6", bottom: "11" },
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
const WINNER: MatchNode = { id: "winner", top: "Winner", bottom: null };

const BYES = [
  { id: "bye1", seed: "1", feedsQF: "qf1" },
  { id: "bye2", seed: "2", feedsQF: "qf3" },
];

// slot(pairId, 0|1) is the individual tile's ref id within a pair.
const slot = (pairId: string, i: 0 | 1) => `${pairId}-${i}`;

const EDGES: Edge[] = [
  // Byes are a certain outcome from the start (no match to decide them),
  // so their connector is gradient immediately. Every Round of 12 match
  // is still unplayed, so its connector stays neutral until it's actually
  // decided.
  { from: "bye1", to: slot("qf1", 0), advanced: true },
  { from: "m89", to: slot("qf1", 1), advanced: false },
  { from: "m413", to: slot("qf2", 0), advanced: false },
  { from: "m512", to: slot("qf2", 1), advanced: false },
  { from: "bye2", to: slot("qf3", 0), advanced: true },
  { from: "m710", to: slot("qf3", 1), advanced: false },
  { from: "m314", to: slot("qf4", 0), advanced: false },
  { from: "m611", to: slot("qf4", 1), advanced: false },
  // From here, "from" is a pair wrapper id (qf1, sf1, final, ...) - its
  // own bounding box spans exactly the two tiles it wraps, so its right
  // edge/vertical-centre is the correct merge point regardless of which
  // of the two tiles ends up being the actual winner.
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

function CardShell({
  gradient,
  children,
  registerRef,
}: {
  gradient: boolean;
  children: React.ReactNode;
  registerRef: (el: HTMLDivElement | null) => void;
}) {
  if (gradient) {
    return (
      <div
        ref={registerRef}
        className={`${CARD_WIDTH} shrink-0 rounded-xl bg-gradient-to-br from-[#00ff85] to-[#04f5ff] p-[1.5px]`}
      >
        <div className="rounded-[10px] bg-white dark:bg-zinc-900 overflow-hidden">{children}</div>
      </div>
    );
  }
  return (
    <div
      ref={registerRef}
      className={`${CARD_WIDTH} shrink-0 rounded-xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden`}
    >
      {children}
    </div>
  );
}

// Round of 12 only - the two-row merged card.
function MatchCard({
  top,
  bottom,
  subtle,
  registerRef,
}: {
  top: Slot;
  bottom: Slot;
  subtle?: boolean;
  registerRef: (el: HTMLDivElement | null) => void;
}) {
  const rowClass = subtle
    ? "px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 truncate"
    : "px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate";

  return (
    <CardShell gradient={false} registerRef={registerRef}>
      <div className={`${rowClass} border-b border-black/[0.04] dark:border-white/[0.06]`}>
        {top ?? " "}
      </div>
      <div className={rowClass}>{bottom ?? " "}</div>
    </CardShell>
  );
}

// QF/SF/Final - a single independent tile representing one slot.
function SlotTile({
  value,
  registerRef,
}: {
  value: Slot;
  registerRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <CardShell gradient={false} registerRef={registerRef}>
      <div className="px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
        {value ?? " "}
      </div>
    </CardShell>
  );
}

function ByeBadge({
  seed,
  registerRef,
}: {
  seed: string;
  registerRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        Bye
      </span>
      <CardShell gradient registerRef={registerRef}>
        <div className="px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 truncate">
          {seed}
        </div>
      </CardShell>
    </div>
  );
}

function Pair({
  pair,
  registerRef,
}: {
  pair: PairNode;
  registerRef: (id: string) => (el: HTMLDivElement | null) => void;
}) {
  return (
    <div ref={registerRef(pair.id)} className="flex flex-col gap-1.5">
      <SlotTile value={pair.slots[0]} registerRef={registerRef(slot(pair.id, 0))} />
      <SlotTile value={pair.slots[1]} registerRef={registerRef(slot(pair.id, 1))} />
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

        // Conventional right-angle bracket connector: out horizontally,
        // up/down at the midpoint, in horizontally.
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
            <div className="flex flex-col items-center gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Round of 12
              </p>
              <div className="flex flex-col justify-around" style={{ height: COLUMN_HEIGHT }}>
                {ROUND_OF_12.map((node) => (
                  <MatchCard
                    key={node.id}
                    top={node.top}
                    bottom={node.bottom}
                    subtle
                    registerRef={registerRef(node.id)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Quarter-Final
              </p>
              <div className="flex flex-col justify-around" style={{ height: COLUMN_HEIGHT }}>
                {QF.map((pair) => {
                  const bye = BYES.find((b) => b.feedsQF === pair.id);
                  const pairEl = <Pair key={pair.id} pair={pair} registerRef={registerRef} />;
                  if (!bye) return pairEl;
                  return (
                    <div key={pair.id} className="flex flex-col items-center gap-3">
                      <ByeBadge seed={bye.seed} registerRef={registerRef(bye.id)} />
                      {pairEl}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Semi-Final
              </p>
              <div className="flex flex-col justify-around" style={{ height: COLUMN_HEIGHT }}>
                {SF.map((pair) => (
                  <Pair key={pair.id} pair={pair} registerRef={registerRef} />
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Final
              </p>
              <div
                className="flex flex-col items-center justify-center gap-3"
                style={{ height: COLUMN_HEIGHT }}
              >
                <Pair pair={FINAL} registerRef={registerRef} />
                <MatchCard
                  top={WINNER.top}
                  bottom={WINNER.bottom}
                  registerRef={registerRef(WINNER.id)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
