import { Space_Grotesk } from "next/font/google";

// Space Grotesk's Q has a long, straight diagonal tail that cuts across
// the bowl instead of Manrope's small curved one - much more legible as
// a "Q" at badge size, which is the whole point of this glyph.
const spaceGrotesk = Space_Grotesk({ weight: "700", subsets: ["latin"] });

// Shown next to a manager's name once all 4 of their picks have scored -
// used on both the participant card and the leaderboard, so it's a shared
// component rather than two copies of the same styling. The leaderboard
// is denser, so it gets the smaller size.
export function QualifiedBadge({ size = "default" }: { size?: "default" | "sm" }) {
  const sizeClass = size === "sm" ? "h-3.5 w-3.5 text-[9px]" : "h-[18px] w-[18px] text-sm";
  return (
    <span
      className={`${spaceGrotesk.className} inline-flex items-center justify-center shrink-0 rounded-full bg-gradient-to-br from-[#00ff85] to-[#04f5ff] text-[#04211a] leading-none ${sizeClass}`}
      title="Qualified — all 4 picks have scored"
    >
      Q
    </span>
  );
}
