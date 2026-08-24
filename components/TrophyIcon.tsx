// Solid glyph, matching SpadeIcon/PoundIcon's fill convention (not the
// stroke-line icons like ArrowsLeftRightIcon/ChevronDownIcon) - reads
// cleanly as a small shape at nav size.
//
// viewBox is tightened to the path's actual ink (measured via
// getBBox: x=4 y=3 w=16 h=17 in the original 0 0 24 24 box, +1 unit
// margin on every side, square so width/height scale uniformly) rather
// than the full 24x24 box the path was authored against. Left at 0 0 24
// 24, the glyph only filled 71% of its box height (vs. ~99% for
// SpadeIcon), which read as both smaller than the other nav icons at
// the same size prop and - because a trophy's visual weight sits in its
// wide cup bowl, not its thin stem/base - optically off-centre even
// though its bounding box was geometrically centred. Cropping to the
// ink fixes both at once instead of compensating with a bigger size
// prop in one place and a manual position nudge in another.
export function TrophyIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="2.5 2 19 19" fill="currentColor" className={className}>
      <path d="M7 3h10v2h2a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4h-.1A6 6 0 0 1 13 15.9V18h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.1A6 6 0 0 1 8.1 11H8a4 4 0 0 1-4-4V6a1 1 0 0 1 1-1h2V3Zm0 4H5v1a2 2 0 0 0 2 1.83V7Zm10 0v2.83A2 2 0 0 0 19 8V7h-2Z" />
    </svg>
  );
}
