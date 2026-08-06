import { getH2hPairs } from "@/lib/h2h";
import { formatPl } from "@/lib/format";

function Side({
  teamName,
  wins,
  pl,
  leading,
  align,
}: {
  teamName: string;
  wins: number;
  pl: number;
  leading: boolean;
  align: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <p
        className={`font-semibold text-sm truncate ${
          leading
            ? "text-zinc-900 dark:text-white"
            : "text-zinc-400 dark:text-zinc-500"
        }`}
      >
        {teamName}
      </p>
      <p className="text-3xl font-extrabold tabular-nums mt-1.5 tracking-tight">
        {wins}
      </p>
      <p
        className={`text-xs font-semibold mt-1 ${
          pl > 0
            ? "text-emerald-600 dark:text-emerald-400"
            : pl < 0
              ? "text-rose-600 dark:text-rose-400"
              : "text-zinc-400"
        }`}
      >
        {formatPl(pl)}
      </p>
    </div>
  );
}

export default async function H2hPage() {
  const pairs = await getH2hPairs();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {pairs.map((pair) => {
        const aLeading = pair.teamA.wins > pair.teamB.wins;
        const bLeading = pair.teamB.wins > pair.teamA.wins;
        return (
          <div
            key={`${pair.teamA.entryId}-${pair.teamB.entryId}`}
            className="rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] p-5 flex items-center justify-between gap-4"
          >
            <Side
              teamName={pair.teamA.teamName}
              wins={pair.teamA.wins}
              pl={pair.teamA.pl}
              leading={aLeading}
              align="left"
            />
            <span className="shrink-0 h-8 w-8 rounded-full bg-black/[0.04] dark:bg-white/[0.06] shadow-[var(--shadow-pressed)] flex items-center justify-center text-[11px] font-bold text-zinc-400 dark:text-zinc-500">
              VS
            </span>
            <Side
              teamName={pair.teamB.teamName}
              wins={pair.teamB.wins}
              pl={pair.teamB.pl}
              leading={bLeading}
              align="right"
            />
          </div>
        );
      })}
    </div>
  );
}
