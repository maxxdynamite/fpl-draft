import { getMotwSotwLeaders } from "@/lib/seasonStats";

export async function MotwSotwLeaderboard() {
  const { motw, sotw } = await getMotwSotwLeaders();
  if (motw.length === 0 && sotw.length === 0) return null;

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden mt-4">
      {motw.length > 0 && (
        <>
          <p className="px-3 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Most MOTW
          </p>
          <ul>
            {motw.map((leader, i) => (
              <li
                key={leader.entryId}
                className="flex items-center gap-2 px-3 py-1.5 border-t border-black/[0.04] dark:border-white/[0.06] text-xs"
              >
                <span className="w-3.5 tabular-nums text-zinc-400 dark:text-zinc-500 font-medium">
                  {i + 1}
                </span>
                <span className="flex-1 font-medium truncate">
                  {leader.teamName}
                </span>
                <span className="tabular-nums font-bold text-[#00b368] dark:text-[#00ff85]">
                  {leader.count}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      {sotw.length > 0 && (
        <>
          <p
            className={`px-3 pb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 pt-3 ${
              motw.length > 0
                ? "border-t border-black/[0.04] dark:border-white/[0.06]"
                : ""
            }`}
          >
            Most SOTW
          </p>
          <ul>
            {sotw.map((leader, i) => (
              <li
                key={leader.entryId}
                className="flex items-center gap-2 px-3 py-1.5 border-t border-black/[0.04] dark:border-white/[0.06] text-xs"
              >
                <span className="w-3.5 tabular-nums text-zinc-400 dark:text-zinc-500 font-medium">
                  {i + 1}
                </span>
                <span className="flex-1 font-medium truncate">
                  {leader.teamName}
                </span>
                <span className="tabular-nums font-bold text-[#e90052] dark:text-[#ff2d78]">
                  {leader.count}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
