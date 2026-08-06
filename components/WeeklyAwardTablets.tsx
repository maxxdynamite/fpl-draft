import { getWeeklyAwards } from "@/lib/weeklyAwards";

function TrophyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 4h10v4a5 5 0 0 1-10 0V4Z"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M7 5H4a1 1 0 0 0-1 1v1a4 4 0 0 0 4 4M17 5h3a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 13v3m-3 4h6m-5 0c0-2 1-2.5 2-4 1 1.5 2 2 2 4"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SpannerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M14.7 6.3a4 4 0 0 0-5.4 4.9L4 16.5V20h3.5l5.3-5.3a4 4 0 0 0 4.9-5.4l-2.6 2.6-2.1-2.1 2.6-2.6Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export async function WeeklyAwardTablets() {
  const awards = await getWeeklyAwards();
  if (!awards) return null;

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex items-center gap-2 rounded-full bg-[#00ff85] px-3 py-1.5">
        <TrophyIcon />
        <span className="text-xs font-bold text-white truncate">
          MOTW: {awards.motwTeam}
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-[#e90052] px-3 py-1.5">
        <SpannerIcon />
        <span className="text-xs font-bold text-white truncate">
          SOTW: {awards.sotwTeam}
        </span>
      </div>
    </div>
  );
}
