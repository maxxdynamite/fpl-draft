// Solid glyph, matching SpadeIcon/PoundIcon's fill convention (not the
// stroke-line icons like ArrowsLeftRightIcon/ChevronDownIcon) - reads
// cleanly as a small shape at nav size.
export function TrophyIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M7 3h10v2h2a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4h-.1A6 6 0 0 1 13 15.9V18h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.1A6 6 0 0 1 8.1 11H8a4 4 0 0 1-4-4V6a1 1 0 0 1 1-1h2V3Zm0 4H5v1a2 2 0 0 0 2 1.83V7Zm10 0v2.83A2 2 0 0 0 19 8V7h-2Z" />
    </svg>
  );
}
