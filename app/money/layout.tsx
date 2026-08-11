import { getPlayersData } from "@/lib/players";

export default async function MoneyLayout({ children }: LayoutProps<"/money">) {
  // Real Premier League calendar - same source Money's own pot rules use
  // to decide seasonOver (lib/money.ts), not the Draft section's separate,
  // out-of-sync competition schedule.
  const { currentGameweek } = await getPlayersData();
  const gameweekNumber = currentGameweek > 0 ? currentGameweek : 1;

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-4 sm:pb-6">
      {/* No right-side action button - Money is read-only, so there's
          nothing to click through to, and no h-10 pinning needed since
          there's no second flex child to cause a height mismatch. */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Gameweek {gameweekNumber}
        </h1>
      </div>
      {children}
    </main>
  );
}
