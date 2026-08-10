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
  bust: {
    label: "Bust",
    dotClass: "bg-rose-500",
    textClass: "text-rose-600 dark:text-rose-400",
  },
  blackjack: {
    label: "Blackjack!",
    dotClass: "bg-gradient-to-br from-[#00ff85] to-[#04f5ff]",
    textClass: "text-[#00b368] dark:text-[#00ff85]",
  },
  ahead: {
    label: "Ahead of pace",
    dotClass: "bg-amber-500",
    textClass: "text-amber-600 dark:text-amber-400",
  },
  "on-pace": {
    label: "On pace",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-600 dark:text-emerald-400",
  },
  behind: {
    label: "Behind pace",
    dotClass: "bg-zinc-400 dark:bg-zinc-500",
    textClass: "text-zinc-500 dark:text-zinc-400",
  },
};
