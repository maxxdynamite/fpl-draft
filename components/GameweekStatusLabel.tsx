export type GameweekStatus = "Live" | "Provisional" | "Complete";

// Shares the h1's bold weight (matching stroke thickness - no optical
// baseline-unevenness from a lighter weight next to bold) but a smaller
// size and muted colour for the hierarchy cue instead. Relies on the
// parent using items-baseline for alignment; no manual offset needed.
export function GameweekStatusLabel({ status }: { status: GameweekStatus | null }) {
  if (!status) return null;
  return (
    <span className="text-sm font-bold uppercase text-zinc-400 dark:text-zinc-500">
      {status}
    </span>
  );
}
