import { getWeeklyAwards } from "@/lib/weeklyAwards";

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2" />
      <path d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2" />
      <path d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3" />
      <path d="M4 22h16" />
      <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
      <path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3" />
    </svg>
  );
}

function SpannerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" />
    </svg>
  );
}

const motwColor = "text-[#00b368] dark:text-[#00ff85]";
const sotwColor = "text-[#e90052] dark:text-[#ff2d78]";

export async function WeeklyAwardTablets() {
  const awards = await getWeeklyAwards();
  if (!awards) return null;

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden mb-4">
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <TrophyIcon className={motwColor} />
        <span className="flex-1 min-w-0 truncate text-zinc-900 dark:text-white text-[12.5px] font-bold">
          {awards.motwTeam}
        </span>
        <span className={`text-[15px] font-extrabold tabular-nums ${motwColor}`}>
          {awards.motwPoints}
        </span>
      </div>
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-t border-black/[0.04] dark:border-white/[0.06]">
        <SpannerIcon className={sotwColor} />
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
