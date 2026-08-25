// Solid glyph, same fill convention as SpadeIcon/TrophyIcon/WrenchIcon -
// MOTW's own mark, distinct from TrophyIcon (History nav, Cup winner)
// and WrenchIcon (SOTW).
export function CrownIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3 19h18v2H3z" />
      <path d="M4 18 3 8l5 4 4-7 4 7 5-4-1 10H4Z" />
    </svg>
  );
}
