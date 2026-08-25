// Solid glyph, same fill convention as SpadeIcon/TrophyIcon/WrenchIcon -
// MOTW's own mark, distinct from TrophyIcon (History nav, Cup winner)
// and WrenchIcon (SOTW).
//
// viewBox cropped to the path's actual ink (bbox x:3-21 y:5-21, +1 unit
// margin on every side, square so width/height scale uniformly) rather
// than the full 24x24 box the path was authored against - same fix
// TrophyIcon's own comment documents for the same reason. Left at 0 0 24
// 24, the crown only filled ~67% of its box height vs. WrenchIcon's
// ~83% (drawn corner-to-corner diagonally), which read as visibly
// shorter than the wrench at the same size prop even though both
// nominally shared a 24x24 box.
export function CrownIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="2 3 20 20" fill="currentColor" className={className}>
      <path d="M3 19h18v2H3z" />
      <path d="M4 18 3 8l5 4 4-7 4 7 5-4-1 10H4Z" />
    </svg>
  );
}
