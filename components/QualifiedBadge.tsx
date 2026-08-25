// Shown next to a manager's name once all 4 of their picks have scored -
// used on both the participant card and the leaderboard, so it's a shared
// component rather than two copies of the same styling. The leaderboard
// is denser, so it gets the smaller size.
//
// Bare gradient-text Q, not a filled circle badge - same brand gradient
// as the logo wordmark and the avatar glow ring, applied straight to the
// glyph instead of a background shape behind it. No font import: the app
// already sets Manrope as its default font-sans (see globals.css's
// --font-sans), so this inherits it rather than pulling in Inter (the
// previous circle badge's font, a mismatch with the rest of the app).
export function QualifiedBadge({ size = "default" }: { size?: "default" | "sm" }) {
  const sizeClass = size === "sm" ? "text-[13px]" : "text-base";
  return (
    <span
      className={`inline-flex shrink-0 items-center font-extrabold leading-none bg-gradient-to-br from-[#00ff85] to-[#04f5ff] bg-clip-text text-transparent ${sizeClass}`}
      title="Qualified — all 4 picks have scored"
    >
      Q
    </span>
  );
}
