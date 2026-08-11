"use client";

import { useLayoutEffect, useRef, useState } from "react";

// Static shell: seeding for the gameweek that determines seeds 1-14 hasn't
// happened yet (TBC, closer to Christmas), so this is the fixed matchup
// shape by seed number only - no manager names, no live winner computation.
// Every node is just a two-slot card; a slot is either a known seed number
// (round 1, or the two seeds that get a bye straight to the QF) or null
// ("vacant" - rendered blank until a real result exists to fill it).

type Slot = string | null;
type BracketNode = { id: string; top: Slot; bottom: Slot };
type Round = { title: string; nodes: BracketNode[]; subtle?: boolean };
// toSlot: which row of the destination card this edge feeds (0 = top, 1 = bottom).
type Edge = { from: string; to: string; toSlot: 0 | 1 };

const ROUNDS: Round[] = [
  {
    title: "Round of 12",
    subtle: true,
    nodes: [
      { id: "m89", top: "8", bottom: "9" },
      { id: "m413", top: "4", bottom: "13" },
      { id: "m512", top: "5", bottom: "12" },
      { id: "m710", top: "7", bottom: "10" },
      { id: "m314", top: "3", bottom: "14" },
      { id: "m611", top: "6", bottom: "11" },
    ],
  },
  {
    title: "Quarter-Final",
    // Seeds 1 and 2 are introduced here (bye straight to the QF) rather
    // than appearing as a round-1 entry with nothing to play against.
    nodes: [
      { id: "qf1", top: "1", bottom: null },
      { id: "qf2", top: null, bottom: null },
      { id: "qf3", top: "2", bottom: null },
      { id: "qf4", top: null, bottom: null },
    ],
  },
  {
    title: "Semi-Final",
    nodes: [
      { id: "sf1", top: null, bottom: null },
      { id: "sf2", top: null, bottom: null },
    ],
  },
  {
    title: "Final",
    nodes: [{ id: "final", top: null, bottom: null }],
  },
];

const EDGES: Edge[] = [
  { from: "m89", to: "qf1", toSlot: 1 },
  { from: "m413", to: "qf2", toSlot: 0 },
  { from: "m512", to: "qf2", toSlot: 1 },
  { from: "m710", to: "qf3", toSlot: 1 },
  { from: "m314", to: "qf4", toSlot: 0 },
  { from: "m611", to: "qf4", toSlot: 1 },
  { from: "qf1", to: "sf1", toSlot: 0 },
  { from: "qf2", to: "sf1", toSlot: 1 },
  { from: "qf3", to: "sf2", toSlot: 0 },
  { from: "qf4", to: "sf2", toSlot: 1 },
  { from: "sf1", to: "final", toSlot: 0 },
  { from: "sf2", to: "final", toSlot: 1 },
];

const COLUMN_HEIGHT = 640;

function MatchCard({
  top,
  bottom,
  registerRef,
  subtle,
  final: isFinal,
}: {
  top: Slot;
  bottom: Slot;
  registerRef: (el: HTMLDivElement | null) => void;
  subtle?: boolean;
  final?: boolean;
}) {
  const rowClass = subtle
    ? "px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 truncate"
    : `px-3 py-2 text-xs truncate ${
        isFinal
          ? "font-bold text-zinc-900 dark:text-white"
          : "font-semibold text-zinc-700 dark:text-zinc-300"
      }`;
  const dividerClass = isFinal
    ? "border-b border-black/[0.06] dark:border-white/[0.08]"
    : "border-b border-black/[0.04] dark:border-white/[0.06]";

  const inner = (
    <div
      className={`rounded-xl overflow-hidden ${
        isFinal ? "rounded-[10px]" : "bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06]"
      } ${isFinal ? "bg-white dark:bg-zinc-900" : ""}`}
    >
      <div className={`${rowClass} ${dividerClass}`}>{top ?? " "}</div>
      <div className={rowClass}>{bottom ?? " "}</div>
    </div>
  );

  if (isFinal) {
    return (
      <div ref={registerRef} className="relative w-40 shrink-0">
        {/* Same blurred-gradient-glow technique as the qualified headshot
            glow - the final gets the celebratory treatment regardless of
            whether it's filled in yet, everything else stays neutral. */}
        <span
          aria-hidden="true"
          className="absolute -inset-1.5 rounded-xl bg-gradient-to-br from-[#00ff85] to-[#04f5ff] opacity-70 blur-md -z-10"
        />
        <div className="rounded-xl bg-gradient-to-br from-[#00ff85] to-[#04f5ff] p-[1.5px]">
          {inner}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={registerRef}
      className={`shrink-0 rounded-xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden ${
        subtle ? "w-16" : "w-40"
      }`}
    >
      <div className={`${rowClass} ${dividerClass}`}>{top ?? " "}</div>
      <div className={rowClass}>{bottom ?? " "}</div>
    </div>
  );
}

export function CupBracket() {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [paths, setPaths] = useState<{ id: string; d: string }[]>([]);

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
        const rowHeight = toRect.height / 2;
        const y2 = toRect.top + rowHeight * (edge.toSlot + 0.5) - containerRect.top;

        // Conventional right-angle bracket connector: out horizontally,
        // up/down at the midpoint, in horizontally.
        const midX = x1 + (x2 - x1) / 2;
        const d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
        return { id: `${edge.from}-${edge.to}`, d };
      }).filter((p): p is { id: string; d: string } => p !== null);

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
    <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] p-4 sm:p-6">
      <div className="overflow-x-auto">
        <div ref={containerRef} className="relative min-w-max py-2">
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
                stroke="url(#cup-connector)"
                strokeWidth={2}
                strokeOpacity={0.55}
                strokeLinecap="round"
              />
            ))}
          </svg>
          <div className="relative flex gap-16">
            {ROUNDS.map((round) => (
              <div key={round.title} className="flex flex-col items-center gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  {round.title}
                </p>
                <div
                  className="flex flex-col justify-around"
                  style={{ height: COLUMN_HEIGHT }}
                >
                  {round.nodes.map((node) => (
                    <MatchCard
                      key={node.id}
                      top={node.top}
                      bottom={node.bottom}
                      subtle={round.subtle}
                      final={node.id === "final"}
                      registerRef={(el) => {
                        nodeRefs.current[node.id] = el;
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
