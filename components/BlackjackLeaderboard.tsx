import type { BlackjackParticipant } from "@/lib/blackjack";
import { BLACKJACK_TARGET } from "@/lib/blackjack";
import { STATUS_META } from "@/lib/blackjackStatus";
import { QualifiedBadge } from "./QualifiedBadge";

export function BlackjackLeaderboard({
  participants,
}: {
  participants: BlackjackParticipant[];
}) {
  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden">
      <p className="px-3 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        BB Blackjack · target {BLACKJACK_TARGET}
      </p>
      <ul>
        {participants.map((p, i) => {
          const meta = STATUS_META[p.status];
          const isBust = p.status === "bust";
          return (
            <li
              key={p.entryId}
              className="flex items-center gap-2 px-3 py-1.5 border-t border-black/[0.04] dark:border-white/[0.06] text-xs"
            >
              <span className="w-5 shrink-0 tabular-nums text-zinc-400 dark:text-zinc-500 font-medium">
                {i + 1}
              </span>
              {/* Dot stays on meta.dotClass (black for bust) regardless of
                  the greyed-out name/score - it's the one element that
                  doesn't fade, same black as the tile's bust pill. The ring
                  is leaderboard-only (not baked into dotClass, which the
                  tile's own smaller pill dot also reads from) - every dot
                  here gets the same deliberate edge for consistency.
                  Translucent rather than a flat zinc shade, since a flat
                  ring-zinc-300 would be invisible against the no-picks dot
                  (same zinc-300 fill) - an opacity-based overlay darkens/
                  lightens any fill instead of trying to match one. */}
              <span
                className={`h-2 w-2 shrink-0 rounded-full ring-1 ring-black/[0.12] dark:ring-white/[0.12] ${meta.dotClass}`}
                aria-hidden="true"
              />
              <span className="flex-1 flex items-center gap-1.5 min-w-0">
                <span
                  className={`font-medium truncate ${
                    isBust ? "text-zinc-400 dark:text-zinc-500" : ""
                  }`}
                >
                  {p.managerName}
                </span>
                {p.allScored && <QualifiedBadge size="sm" />}
              </span>
              <span
                className={`tabular-nums font-bold ${
                  isBust ? "text-zinc-400 dark:text-zinc-500" : ""
                }`}
              >
                {p.totalGoals}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
