"use client";

import { useEffect, useState } from "react";

function ClockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

// A real ticking clock, not a coarsened "6d 14h" - hours/minutes/seconds
// always shown and always live, with a day count prefixed only once
// there's a full day or more left (no "0d" clutter once it drops below
// that).
function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const clock = `${hours}h ${minutes}m ${seconds}s`;
  return days > 0 ? `${days}d ${clock}` : clock;
}

export function DraftCountdown({ draftDt }: { draftDt: string }) {
  const target = new Date(draftDt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // Ticks every second throughout - it's a real clock now (seconds are
    // always shown), not a coarsened distance that only needed per-second
    // updates once close.
    const id = setInterval(() => setNow(Date.now()), 1_000);
    // Deferred rather than an immediate setNow(Date.now()) call - keeps
    // every state update inside a callback (interval/timeout), not
    // executed synchronously as part of the effect body itself.
    const firstTick = setTimeout(() => setNow(Date.now()), 0);
    return () => {
      clearInterval(id);
      clearTimeout(firstTick);
    };
  }, [target]);

  // Nothing to show before the client clock is known (avoids a
  // hydration-mismatching guess) or once the draft's actually happened -
  // the parent already gates on draftStatus, this is just a second,
  // client-side backstop against a stale server-rendered countdown
  // sitting at 0d 0h after the moment passes.
  if (now === null || now >= target) return null;

  return (
    <span
      // Same brand-gradient chip convention as the Blackjack picks/submit
      // pills - #04211a (not pure black) is the deep near-black used
      // against this gradient everywhere else, not a one-off here.
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tabular-nums bg-gradient-to-r from-[#00ff85] to-[#04f5ff] text-[#04211a]"
      title={new Date(draftDt).toLocaleString(undefined, {
        dateStyle: "full",
        timeStyle: "short",
      })}
    >
      <ClockIcon />
      Draft begins: {formatRemaining(target - now)}
    </span>
  );
}
