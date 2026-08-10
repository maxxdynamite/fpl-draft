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
  // True black, not near-black - low contrast on dark cards is an accepted
  // trade-off rather than a bug to fix.
  bust: {
    label: "Bust",
    dotClass: "bg-black",
    textClass: "text-black",
  },
  blackjack: {
    label: "Blackjack",
    dotClass: "bg-gradient-to-br from-[#00ff85] to-[#04f5ff]",
    textClass: "text-[#00b368] dark:text-[#00ff85]",
  },
  "at-risk": {
    label: "At Risk",
    dotClass: "bg-red-500",
    textClass: "text-red-600 dark:text-red-400",
  },
  "over-target": {
    label: "Over Target",
    dotClass: "bg-orange-500",
    textClass: "text-orange-600 dark:text-orange-400",
  },
  "on-target": {
    label: "On Target",
    dotClass: "bg-green-500",
    textClass: "text-green-600 dark:text-green-400",
  },
  "under-target": {
    label: "Under Target",
    dotClass: "bg-blue-500",
    textClass: "text-blue-600 dark:text-blue-400",
  },
  "miles-off": {
    label: "Miles Off It",
    dotClass: "bg-purple-500",
    textClass: "text-purple-600 dark:text-purple-400",
  },
};
