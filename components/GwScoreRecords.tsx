import { getGwScoreRecords } from "@/lib/seasonStats";

export async function GwScoreRecords() {
  const { highest, lowest } = await getGwScoreRecords();
  if (!highest && !lowest) return null;

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden mt-4">
      <p className="px-3 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        Season Records
      </p>
      {highest && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-t border-black/[0.04] dark:border-white/[0.06] text-xs">
          <span className="flex-1 min-w-0">
            <span className="block font-medium truncate">
              {highest.teamName}
            </span>
            <span className="block text-[10px] text-zinc-400 dark:text-zinc-500">
              Highest · GW{highest.gameweek}
            </span>
          </span>
          <span className="tabular-nums font-bold text-[#00b368] dark:text-[#00ff85]">
            {highest.score}
          </span>
        </div>
      )}
      {lowest && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-t border-black/[0.04] dark:border-white/[0.06] text-xs">
          <span className="flex-1 min-w-0">
            <span className="block font-medium truncate">
              {lowest.teamName}
            </span>
            <span className="block text-[10px] text-zinc-400 dark:text-zinc-500">
              Lowest · GW{lowest.gameweek}
            </span>
          </span>
          <span className="tabular-nums font-bold text-[#e90052] dark:text-[#ff2d78]">
            {lowest.score}
          </span>
        </div>
      )}
    </div>
  );
}
