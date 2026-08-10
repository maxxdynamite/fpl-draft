import type { BlackjackParticipant } from "@/lib/blackjack";
import { BLACKJACK_TARGET } from "@/lib/blackjack";
import { STATUS_META } from "@/lib/blackjackStatus";

export function BlackjackLeaderboard({
  participants,
}: {
  participants: BlackjackParticipant[];
}) {
  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden">
      <p className="px-3 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        Leaderboard · target {BLACKJACK_TARGET}
      </p>
      <ul>
        {participants.map((p, i) => {
          const meta = STATUS_META[p.status];
          return (
            <li
              key={p.entryId}
              className="flex items-center gap-2 px-3 py-1.5 border-t border-black/[0.04] dark:border-white/[0.06] text-xs"
            >
              <span className="w-5 shrink-0 tabular-nums text-zinc-400 dark:text-zinc-500 font-medium">
                {i + 1}
              </span>
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${meta.dotClass}`}
                aria-hidden="true"
              />
              <span className="flex-1 font-medium truncate">
                {p.managerName}
              </span>
              <span className="tabular-nums font-bold">{p.totalGoals}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
