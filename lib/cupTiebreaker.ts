// The real tiebreak rule isn't decided yet - kept as its own one-function
// file so swapping it later (bench points, sudden death, etc.) is a single
// isolated change with no ripple into lib/cupBracket.ts.
//
// Default: the higher seed (lower seed number) advances on a tied score.
export function resolveMatchTie(seedA: number, seedB: number): "a" | "b" {
  return seedA < seedB ? "a" : "b";
}
