import Link from "next/link";
import { getPlayersData } from "@/lib/players";

export default async function BlackjackLayout({ children }: LayoutProps<"/blackjack">) {
  // Real Premier League calendar, same source the pace logic itself uses
  // (lib/blackjack.ts) - not the Draft section's own gameweek tracker,
  // which is a separate, out-of-sync competition schedule. Falls back to
  // Gameweek 1 pre-season (currentGameweek is 0 before a ball's kicked),
  // same convention as the Draft layout's own pre-season fallback.
  const { currentGameweek } = await getPlayersData();
  const gameweekNumber = currentGameweek > 0 ? currentGameweek : 1;

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-4 sm:pb-6">
      <div className="flex items-center justify-between gap-4 mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Gameweek {gameweekNumber}
        </h1>
        <Link
          href="/blackjack/picks"
          className="px-4 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-[#00ff85] to-[#04f5ff] text-[#04211a] shadow-[var(--shadow-soft)] hover:opacity-90 transition-opacity"
        >
          Make Your Picks
        </Link>
      </div>
      {children}
    </main>
  );
}
