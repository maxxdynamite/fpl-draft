// Shown next to a manager's name once all 4 of their picks have scored -
// used on both the participant card and the leaderboard, so it's a shared
// component rather than two copies of the same styling.
export function QualifiedBadge() {
  return (
    <span
      className="inline-flex items-center justify-center h-4 w-4 shrink-0 rounded-full bg-gradient-to-br from-[#00ff85] to-[#04f5ff] text-[#04211a] text-[9px] font-extrabold leading-none"
      title="Qualified — all 4 picks have scored"
    >
      Q
    </span>
  );
}
