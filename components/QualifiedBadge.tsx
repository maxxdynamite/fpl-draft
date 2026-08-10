// Shown next to a manager's name once all 4 of their picks have scored -
// used on both the participant card and the leaderboard, so it's a shared
// component rather than two copies of the same styling. The leaderboard
// is denser, so it gets the smaller size.
export function QualifiedBadge({ size = "default" }: { size?: "default" | "sm" }) {
  const sizeClass = size === "sm" ? "h-3.5 w-3.5 text-[9px]" : "h-[18px] w-[18px] text-sm";
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 rounded-full bg-gradient-to-br from-[#00ff85] to-[#04f5ff] text-[#04211a] font-extrabold leading-none ${sizeClass}`}
      // Manrope's variable font only goes up to weight 800 (font-extrabold),
      // so a heavier font-weight class alone can't add more boldness -
      // text-stroke genuinely thickens the glyph beyond what the font file
      // supports, rather than silently clamping to the same weight.
      style={{ WebkitTextStroke: "0.5px currentColor" }}
      title="Qualified — all 4 picks have scored"
    >
      Q
    </span>
  );
}
