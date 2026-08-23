"use client";

import { useState } from "react";

type HistoryResponse = {
  weekly: number[];
  cumulative: number[];
  currentGameweek: number;
  totalGameweeks: number;
  target: number;
};

function ChevronIcon({ flipped }: { flipped: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      className={`transition-transform duration-300 ${flipped ? "rotate-180" : ""}`}
    >
      <path
        d="M2.5 7.5L6 4L9.5 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// The chart's own coordinate space - independent of the card's actual
// rendered width, since the <svg> scales it to 100% with
// preserveAspectRatio="none".
const VB_WIDTH = 400;
const VB_HEIGHT = 168;
const PAD_LEFT = 26;
const PAD_RIGHT = 8;
const PAD_TOP = 10;
const PAD_BOTTOM = 20;

function SeasonChart({ data }: { data: HistoryResponse }) {
  const { cumulative, currentGameweek, totalGameweeks, target } = data;
  // Headroom above the target line so it doesn't sit flush against the
  // chart's top edge, and above whatever a bust total actually reached
  // (which can exceed target).
  const yMax = Math.max(target, ...cumulative) + 3;

  const x = (gw: number) => PAD_LEFT + (gw / currentGameweek) * (VB_WIDTH - PAD_LEFT - PAD_RIGHT);
  const y = (v: number) => VB_HEIGHT - PAD_BOTTOM - (v / yMax) * (VB_HEIGHT - PAD_TOP - PAD_BOTTOM);

  const gridStep = yMax > 30 ? 10 : 5;
  const gridValues: number[] = [];
  for (let g = 0; g <= yMax; g += gridStep) gridValues.push(g);

  // ~6 x-axis labels regardless of how many gameweeks are actually
  // played, rather than one per gameweek (illegible past a handful of
  // weeks) or a fixed step (empty past GW-that-many early season).
  const labelStep = Math.max(1, Math.ceil(currentGameweek / 6));
  const xLabels: number[] = [];
  for (let g = 1; g <= currentGameweek; g += labelStep) xLabels.push(g);

  // Same trajectory computeStatus's pace ladder reads off (see
  // expectedPace, lib/blackjack.ts) - drawn from season start (GW0, 0
  // goals) to the current gameweek, so this line is the literal
  // visualisation of whatever the status pill is already summarising in
  // one word.
  const paceEndY = y((target * currentGameweek) / totalGameweeks);

  const linePoints = cumulative.map((v, i) => `${x(i + 1)},${y(v)}`).join(" ");
  const areaPoints = `${x(0)},${y(0)} ${linePoints} ${x(currentGameweek)},${y(0)}`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
        width="100%"
        height={VB_HEIGHT}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Cumulative goals by gameweek, ${cumulative[cumulative.length - 1]} of ${target} through gameweek ${currentGameweek}`}
      >
        {gridValues.map((g) => (
          <g key={g}>
            <line
              x1={PAD_LEFT}
              y1={y(g)}
              x2={VB_WIDTH - PAD_RIGHT}
              y2={y(g)}
              className="stroke-black/[0.06] dark:stroke-white/[0.08]"
              strokeWidth={1}
            />
            <text
              x={PAD_LEFT - 6}
              y={y(g) + 3}
              textAnchor="end"
              className="fill-zinc-400 dark:fill-zinc-500"
              fontSize={9}
            >
              {g}
            </text>
          </g>
        ))}

        {xLabels.map((gw) => (
          <text
            key={gw}
            x={x(gw)}
            y={VB_HEIGHT - 6}
            textAnchor="middle"
            className="fill-zinc-400 dark:fill-zinc-500"
            fontSize={9}
          >
            GW{gw}
          </text>
        ))}

        {/* Target line, only if it's actually in view - a badly busted
            total can push yMax well past it, but it's still worth
            drawing whenever it fits. */}
        {target <= yMax && (
          <line
            x1={PAD_LEFT}
            y1={y(target)}
            x2={VB_WIDTH - PAD_RIGHT}
            y2={y(target)}
            className="stroke-zinc-400 dark:stroke-zinc-500"
            strokeWidth={1.5}
            strokeDasharray="2 4"
          />
        )}

        <line
          x1={x(0)}
          y1={y(0)}
          x2={x(currentGameweek)}
          y2={paceEndY}
          className="stroke-zinc-400 dark:stroke-zinc-500"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />

        <defs>
          <linearGradient id="history-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00ff85" />
            <stop offset="100%" stopColor="#04f5ff" />
          </linearGradient>
          <linearGradient id="history-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#04f5ff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#04f5ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#history-fill)" />
        <polyline
          points={linePoints}
          fill="none"
          stroke="url(#history-line)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {cumulative.map((v, i) => {
          const isLast = i === cumulative.length - 1;
          return (
            <circle
              key={i}
              cx={x(i + 1)}
              cy={y(v)}
              r={isLast ? 3.5 : 2}
              className={isLast ? "fill-[#04f5ff]" : "fill-white dark:fill-zinc-900"}
              stroke="#04f5ff"
              strokeWidth={1.25}
            />
          );
        })}
      </svg>
      <div className="flex items-center gap-4 mt-1 text-[9px] font-semibold text-zinc-400 dark:text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-0.5 rounded-full bg-gradient-to-r from-[#00ff85] to-[#04f5ff]" />
          Cumulative
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-0.5 rounded-full bg-zinc-400 dark:bg-zinc-500" style={{ opacity: 0.6 }} />
          Pace
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-0.5 rounded-full bg-zinc-400 dark:bg-zinc-500" style={{ opacity: 0.35 }} />
          Target
        </span>
      </div>
    </div>
  );
}

export function BlackjackHistoryChart({ entryId }: { entryId: number }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [data, setData] = useState<HistoryResponse | null>(null);

  async function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && status === "idle") {
      setStatus("loading");
      try {
        const res = await fetch(`/api/blackjack/history?entryId=${entryId}`);
        if (!res.ok) throw new Error(await res.text());
        setData(await res.json());
        setStatus("loaded");
      } catch (err) {
        console.error("[BlackjackHistoryChart]", err);
        setStatus("error");
      }
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        All Gameweeks
        <ChevronIcon flipped={!open} />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pt-3">
            {status === "loading" && (
              <div className="h-[168px] animate-pulse rounded-lg bg-black/[0.03] dark:bg-white/[0.04]" />
            )}
            {status === "error" && (
              <p className="text-[11px] text-red-500 dark:text-red-400">
                Couldn&apos;t load season history — try again.
              </p>
            )}
            {status === "loaded" && data && <SeasonChart data={data} />}
          </div>
        </div>
      </div>
    </div>
  );
}
