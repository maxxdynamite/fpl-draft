import { getWeeklyAwards } from "@/lib/weeklyAwards";
import { TrophyIcon } from "./TrophyIcon";
import { WrenchIcon } from "./WrenchIcon";

const motwColor = "text-[#00b368] dark:text-[#00ff85]";
const sotwColor = "text-[#e90052] dark:text-[#ff2d78]";

export async function WeeklyAwardTablets() {
  const awards = await getWeeklyAwards();
  if (!awards) return null;

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden">
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <TrophyIcon size={22} className={motwColor} />
        <span className="flex-1 min-w-0 truncate text-zinc-900 dark:text-white text-[12.5px] font-bold">
          {awards.motwTeam}
        </span>
        <span className={`text-[15px] font-extrabold tabular-nums ${motwColor}`}>
          {awards.motwPoints}
        </span>
      </div>
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-t border-black/[0.04] dark:border-white/[0.06]">
        <WrenchIcon size={22} className={sotwColor} />
        <span className="flex-1 min-w-0 truncate text-zinc-900 dark:text-white text-[12.5px] font-bold">
          {awards.sotwTeam}
        </span>
        <span className={`text-[15px] font-extrabold tabular-nums ${sotwColor}`}>
          {awards.sotwPoints}
        </span>
      </div>
    </div>
  );
}
