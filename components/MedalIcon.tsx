// Solid glyph, same fill convention as SpadeIcon/TrophyIcon/WrenchIcon -
// deliberately distinct from TrophyIcon, which already means "History"
// (nav) and "Cup winner" (app/history/page.tsx) - a season/competition
// championship, not a single gameweek's top score. MOTW gets its own
// shape (ribbon + medal disc) rather than reusing the trophy for both.
export function MedalIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M7 1h10v6l-5 2-5-2z" />
      <circle cx="12" cy="15.5" r="6.5" />
    </svg>
  );
}
