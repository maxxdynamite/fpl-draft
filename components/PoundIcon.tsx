// Rendered as real text rather than a traced path - a hand-drawn £ glyph
// risks looking subtly wrong, while the font's own "£" character is
// guaranteed to read correctly at any size.
export function PoundIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="currentColor" className={className}>
      <text
        x="50%"
        y="53%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="40"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        £
      </text>
    </svg>
  );
}
