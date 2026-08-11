"use client";

import { useLayoutEffect, useRef, useState } from "react";

// Static shell: seeding for the gameweek that determines seeds 1-14 hasn't
// happened yet (TBC, closer to Christmas), so this is the fixed matchup
// shape by seed number only - no manager names, no live winner computation.
//
// Progressive styling: the brand gradient marks whichever stage is
// "active" - for now that's Round of 12 (plus the two byes, which sit at
// the same tournament depth as Round of 12 despite being drawn in the QF
// column). Every other stage stays neutral until this shell is updated to
// reflect real results, at which point the gradient moves forward one
// stage at a time (both the connectors leaving a decided round AND the
// cells that were advanced into pick up the border).

type Slot = string | null;
type BracketNode = { id: string; top: Slot; bottom: Slot };
type Round = { title: string; nodes: BracketNode[]; subtle?: boolean };
// toSlot: which row of the destination card this edge feeds (0 = top, 1 = bottom).
// advanced: gradient-coloured (this stage has been decided) vs neutral.
type Edge = { from: string; to: string; toSlot: 0 | 1; advanced: boolean };

const ROUND_OF_12: BracketNode[] = [
  { id: "m89", top: "8", bottom: "9" },
  { id: "m413", top: "4", bottom: "13" },
  { id: "m512", top: "5", bottom: "12" },
  { id: "m710", top: "7", bottom: "10" },
  { id: "m314", top: "3", bottom: "14" },
  { id: "m611", top: "6", bottom: "11" },
];

const BYES = [
  { id: "bye1", seed: "1", feedsQF: "qf1" as const },
  { id: "bye2", seed: "2", feedsQF: "qf3" as const },
];

const ROUNDS: Round[] = [
  { title: "Round of 12", subtle: true, nodes: ROUND_OF_12 },
  {
    title: "Quarter-Final",
    nodes: [
      { id: "qf1", top: null, bottom: null },
      { id: "qf2", top: null, bottom: null },
      { id: "qf3", top: null, bottom: null },
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
  { from: "bye1", to: "qf1", toSlot: 0, advanced: true },
  { from: "m89", to: "qf1", toSlot: 1, advanced: true },
  { from: "m413", to: "qf2", toSlot: 0, advanced: true },
  { from: "m512", to: "qf2", toSlot: 1, advanced: true },
  { from: "bye2", to: "qf3", toSlot: 0, advanced: true },
  { from: "m710", to: "qf3", toSlot: 1, advanced: true },
  { from: "m314", to: "qf4", toSlot: 0, advanced: true },
  { from: "m611", to: "qf4", toSlot: 1, advanced: true },
  { from: "qf1", to: "sf1", toSlot: 0, advanced: false },
  { from: "qf2", to: "sf1", toSlot: 1, advanced: false },
  { from: "qf3", to: "sf2", toSlot: 0, advanced: false },
  { from: "qf4", to: "sf2", toSlot: 1, advanced: false },
  { from: "sf1", to: "final", toSlot: 0, advanced: false },
  { from: "sf2", to: "final", toSlot: 1, advanced: false },
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

function MatchCard({
  top,
  bottom,
  subtle,
  gradient,
  registerRef,
}: {
  top: Slot;
  bottom: Slot;
  subtle?: boolean;
  gradient: boolean;
  registerRef: (el: HTMLDivElement | null) => void;
}) {
  const rowClass = subtle
    ? "px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 truncate"
    : "px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate";

  return (
    <CardShell gradient={gradient} registerRef={registerRef}>
      <div className={`${rowClass} border-b border-black/[0.04] dark:border-white/[0.06]`}>
        {top ?? " "}
      </div>
      <div className={rowClass}>{bottom ?? " "}</div>
    </CardShell>
  );
}

function ByeBadge({
  seed,
  gradient,
  registerRef,
}: {
  seed: string;
  gradient: boolean;
  registerRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        Bye
      </span>
      <CardShell gradient={gradient} registerRef={registerRef}>
        <div className="px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 truncate">
          {seed}
        </div>
      </CardShell>
    </div>
  );
}

export function CupBracket() {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [paths, setPaths] = useState<{ id: string; d: string; advanced: boolean }[]>([]);

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
                stroke={p.advanced ? "url(#cup-connector)" : "#71717a"}
                strokeWidth={2}
                strokeOpacity={p.advanced ? 0.55 : 0.3}
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
                    const bye = BYES.find((b) => b.feedsQF === node.id);
                    const card = (
                      <MatchCard
                        key={node.id}
                        top={node.top}
                        bottom={node.bottom}
                        subtle={round.subtle}
                        gradient={round.subtle ?? false}
                        registerRef={(el) => {
                          nodeRefs.current[node.id] = el;
                        }}
                      />
                    );
                    if (!bye) return card;
                    return (
                      <div key={node.id} className="flex flex-col items-center gap-3">
                        <ByeBadge
                          seed={bye.seed}
                          gradient
                          registerRef={(el) => {
                            nodeRefs.current[bye.id] = el;
                          }}
                        />
                        {card}
                      </div>
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
