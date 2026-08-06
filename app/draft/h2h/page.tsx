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
        className={`font-medium ${leading ? "" : "text-zinc-500 dark:text-zinc-400"}`}
      >
        {teamName}
      </p>
      <p className="text-2xl font-bold tabular-nums mt-1">{wins}</p>
      <p
        className={`text-xs font-medium mt-0.5 ${
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
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between gap-3"
          >
            <Side
              teamName={pair.teamA.teamName}
              wins={pair.teamA.wins}
              pl={pair.teamA.pl}
              leading={aLeading}
              align="left"
            />
            <span className="text-zinc-300 dark:text-zinc-700 text-sm font-medium shrink-0">
              vs
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
