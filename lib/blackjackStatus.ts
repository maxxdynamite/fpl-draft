import type { BlackjackStatus } from "./blackjack";

export const STATUS_META: Record<
  BlackjackStatus,
  { label: string; dotClass: string; textClass: string }
> = {
  "no-picks": {
    label: "No picks yet",
    dotClass: "bg-zinc-300 dark:bg-zinc-600",
    textClass: "text-zinc-400 dark:text-zinc-500",
  },
  // Tile gets a fully custom white pill (see BlackjackParticipantCard) -
  // this entry is really only consumed by the leaderboard's dot marker.
  selected: {
    label: "Selected",
    dotClass: "bg-white",
    textClass: "text-zinc-900 dark:text-white",
  },
  // GW1-3, picks in but too little of the season played for the pace
  // ladder to mean anything yet (see GRACE_PERIOD_GAMEWEEKS in
  // lib/blackjack.ts). Deliberately the same green as "on-target" below -
  // this isn't a warning, it's "you're fine, just too early to call".
  "early-days": {
    label: "Early Days",
    dotClass: "bg-green-500",
    textClass: "text-green-600 dark:text-green-400",
  },
  // True black, not near-black - low contrast on dark cards is an accepted
  // trade-off rather than a bug to fix.
  bust: {
    label: "Bust",
    dotClass: "bg-black",
    textClass: "text-black",
  },
  // Tile gets a fully custom pulsing red pill (see BlackjackParticipantCard)
  // - this entry is really only consumed by the leaderboard's dot marker,
  // same as bust/blackjack/selected above. Same red as "at-risk" below
  // (bg-red-500), deliberately - they're the same colour, "edge" is just
  // the loud, filled, glowing version of it.
  edge: {
    label: "On The Edge",
    dotClass: "bg-red-500",
    textClass: "text-black",
  },
  blackjack: {
    label: "Blackjack",
    dotClass: "bg-gradient-to-br from-[#00ff85] to-[#04f5ff]",
    textClass: "text-[#00b368] dark:text-[#00ff85]",
  },
  // Season over, never reached 21 - a final result, not a "keep chasing"
  // pace read. One shade more saturated than "no-picks" above (a
  // submitted, played-out season should read as more "real" than never
  // having picked at all) but deliberately not bust's punitive black -
  // finishing short isn't disqualifying the way busting or missing
  // qualification is.
  "fell-short": {
    label: "Fell Short",
    dotClass: "bg-zinc-400 dark:bg-zinc-500",
    textClass: "text-zinc-500 dark:text-zinc-400",
  },
  "at-risk": {
    label: "At Risk",
    dotClass: "bg-red-500",
    textClass: "text-red-600 dark:text-red-400",
  },
  // Label wording is "pace", but the key stays "-target" - it matches
  // the underlying spreadsheet formula's own naming (lib/blackjack.ts)
  // and there's no user-facing reason to touch the internal identifier.
  "over-target": {
    label: "Over Pace",
    dotClass: "bg-orange-500",
    textClass: "text-orange-600 dark:text-orange-400",
  },
  "on-target": {
    label: "On Pace",
    dotClass: "bg-green-500",
    textClass: "text-green-600 dark:text-green-400",
  },
  "under-target": {
    label: "Under Pace",
    dotClass: "bg-blue-500",
    textClass: "text-blue-600 dark:text-blue-400",
  },
  "miles-off": {
    label: "Miles Off It",
    dotClass: "bg-purple-500",
    textClass: "text-purple-600 dark:text-purple-400",
  },
};
