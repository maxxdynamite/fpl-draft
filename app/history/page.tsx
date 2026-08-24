import { TrophyIcon } from "@/components/TrophyIcon";

// Placeholder shell - past winners get added by hand once the historical
// results are tracked down, there's no live/sheet source for them the way
// every other section's data is fetched.
export default function HistoryPage() {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] py-16 px-6 flex flex-col items-center text-center">
      <TrophyIcon size={28} className="text-zinc-300 dark:text-zinc-600" />
      <p className="mt-4 font-bold text-zinc-900 dark:text-white">
        No winners on record yet
      </p>
      <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500 max-w-sm">
        Past champions of every competition will show up here once they&apos;re added.
      </p>
    </div>
  );
}
