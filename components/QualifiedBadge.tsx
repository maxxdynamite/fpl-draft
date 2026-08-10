import { Unbounded } from "next/font/google";

const unbounded = Unbounded({ weight: "800", subsets: ["latin"] });

// Shown next to a manager's name once all 4 of their picks have scored -
// used on both the participant card and the leaderboard, so it's a shared
// component rather than two copies of the same styling. The leaderboard
// is denser, so it gets the smaller size.
export function QualifiedBadge({ size = "default" }: { size?: "default" | "sm" }) {
  // Font-size is held at the same ~78% of the circle's diameter in both
  // sizes, so the glyph reads as identically "zoomed" whether it's the
  // tile's 18px badge or the leaderboard's 14px one - previously the
  // leaderboard's 9px was a smaller ratio (64%) than the tile's, so the Q
  // looked shrunken relative to its background there.
  const sizeClass = size === "sm" ? "h-3.5 w-3.5 text-[11px]" : "h-[18px] w-[18px] text-[14px]";
  return (
    <span
      className={`${unbounded.className} inline-flex items-center justify-center shrink-0 rounded-full bg-gradient-to-br from-[#00ff85] to-[#04f5ff] text-[#04211a] leading-none ${sizeClass}`}
      title="Qualified — all 4 picks have scored"
    >
      Q
    </span>
  );
}
