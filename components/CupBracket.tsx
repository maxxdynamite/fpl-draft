"use client";

import { useLayoutEffect, useRef, useState } from "react";

// Static shell: seeding for the gameweek that determines seeds 1-14 hasn't
// happened yet (TBC, closer to Christmas), so this is the fixed matchup
// shape by seed number only - no manager names, no live winner computation.
// Seeds 1 and 2 get a bye straight to the quarter-final; modelling the byes
// as ordinary nodes (rather than a special-cased "odd" round) keeps every
// connector in the tree structurally identical - every round-1 slot feeds
// forward via one edge, whether its source is a real match or a bye.

type BracketNode =
  | { id: string; kind: "match"; a: string; b: string }
  | { id: string; kind: "bye"; label: string }
  | { id: string; kind: "final"; a: string; b: string };

type Round = { title: string; nodes: BracketNode[] };
type Edge = { from: string; to: string };

const ROUNDS: Round[] = [
  {
    title: "Round of 12",
    nodes: [
      { id: "bye1", kind: "bye", label: "Seed 1" },
      { id: "m89", kind: "match", a: "Seed 8", b: "Seed 9" },
      { id: "m413", kind: "match", a: "Seed 4", b: "Seed 13" },
      { id: "m512", kind: "match", a: "Seed 5", b: "Seed 12" },
      { id: "bye2", kind: "bye", label: "Seed 2" },
      { id: "m710", kind: "match", a: "Seed 7", b: "Seed 10" },
      { id: "m314", kind: "match", a: "Seed 3", b: "Seed 14" },
      { id: "m611", kind: "match", a: "Seed 6", b: "Seed 11" },
    ],
  },
  {
    title: "Quarter-Final",
    nodes: [
      { id: "qf1", kind: "match", a: "Seed 1", b: "Winner: 8 v 9" },
      { id: "qf2", kind: "match", a: "Winner: 4 v 13", b: "Winner: 5 v 12" },
      { id: "qf3", kind: "match", a: "Seed 2", b: "Winner: 7 v 10" },
      { id: "qf4", kind: "match", a: "Winner: 3 v 14", b: "Winner: 6 v 11" },
    ],
  },
  {
    title: "Semi-Final",
    nodes: [
      { id: "sf1", kind: "match", a: "QF1 Winner", b: "QF2 Winner" },
      { id: "sf2", kind: "match", a: "QF3 Winner", b: "QF4 Winner" },
    ],
  },
  {
    title: "Final",
    nodes: [{ id: "final", kind: "final", a: "SF1 Winner", b: "SF2 Winner" }],
  },
];

const EDGES: Edge[] = [
  { from: "bye1", to: "qf1" },
  { from: "m89", to: "qf1" },
  { from: "m413", to: "qf2" },
  { from: "m512", to: "qf2" },
  { from: "bye2", to: "qf3" },
  { from: "m710", to: "qf3" },
  { from: "m314", to: "qf4" },
  { from: "m611", to: "qf4" },
  { from: "qf1", to: "sf1" },
  { from: "qf2", to: "sf1" },
  { from: "qf3", to: "sf2" },
  { from: "qf4", to: "sf2" },
  { from: "sf1", to: "final" },
  { from: "sf2", to: "final" },
];

const COLUMN_HEIGHT = 640;

function MatchCard({
  a,
  b,
  registerRef,
}: {
  a: string;
  b: string;
  registerRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={registerRef}
      className="w-40 shrink-0 rounded-xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden text-xs font-semibold text-zinc-700 dark:text-zinc-300"
    >
      <div className="px-3 py-2 border-b border-black/[0.04] dark:border-white/[0.06] truncate">
        {a}
      </div>
      <div className="px-3 py-2 truncate">{b}</div>
    </div>
  );
}

function ByeCard({
  label,
  registerRef,
}: {
  label: string;
  registerRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={registerRef}
      className="w-40 shrink-0 rounded-xl bg-gradient-to-br from-[#00ff85] to-[#04f5ff] p-[1.5px]"
    >
      <div className="rounded-[10px] bg-white dark:bg-zinc-900 px-3 py-2.5 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
        <span className="text-[9px] font-extrabold uppercase tracking-wide bg-gradient-to-br from-[#00ff85] to-[#04f5ff] bg-clip-text text-transparent shrink-0">
          Bye
        </span>
      </div>
    </div>
  );
}

function FinalCard({
  a,
  b,
  registerRef,
}: {
  a: string;
  b: string;
  registerRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div ref={registerRef} className="relative w-40 shrink-0">
      {/* Same blurred-gradient-glow technique as the qualified headshot
          glow - the final gets the celebratory treatment, everything
          else in the bracket stays neutral so this actually stands out. */}
      <span
        aria-hidden="true"
        className="absolute -inset-1.5 rounded-xl bg-gradient-to-br from-[#00ff85] to-[#04f5ff] opacity-70 blur-md -z-10"
      />
      <div className="rounded-xl bg-gradient-to-br from-[#00ff85] to-[#04f5ff] p-[1.5px]">
        <div className="rounded-[10px] bg-white dark:bg-zinc-900 overflow-hidden text-xs font-bold text-zinc-900 dark:text-white">
          <div className="px-3 py-2 border-b border-black/[0.06] dark:border-white/[0.08] truncate">
            {a}
          </div>
          <div className="px-3 py-2 truncate">{b}</div>
        </div>
      </div>
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
        const y2 = toRect.top + toRect.height / 2 - containerRect.top;

        // Horizontally-biased S-curve: control points pulled toward the
        // midpoint x so the line leaves/arrives roughly level, curving
        // through the gap instead of a sharp diagonal.
        const midX = x1 + (x2 - x1) / 2;
        const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
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
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
        Seeds 1 and 2 get a bye straight to the quarter-final. Seeding is
        decided by a gameweek closer to Christmas (TBC) - highest score that
        week is seed 1, down to lowest as seed 14.
      </p>
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
                  {round.nodes.map((node) => {
                    const registerRef = (el: HTMLDivElement | null) => {
                      nodeRefs.current[node.id] = el;
                    };
                    if (node.kind === "bye") {
                      return (
                        <ByeCard key={node.id} label={node.label} registerRef={registerRef} />
                      );
                    }
                    if (node.kind === "final") {
                      return (
                        <FinalCard
                          key={node.id}
                          a={node.a}
                          b={node.b}
                          registerRef={registerRef}
                        />
                      );
                    }
                    return (
                      <MatchCard key={node.id} a={node.a} b={node.b} registerRef={registerRef} />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
