import { getPlayersData } from "@/lib/players";

export default async function MoneyLayout({ children }: LayoutProps<"/money">) {
  // Real Premier League calendar - same source Money's own pot rules use
  // to decide seasonOver (lib/money.ts), not the Draft section's separate,
  // out-of-sync competition schedule.
  const { currentGameweek } = await getPlayersData();
  const gameweekNumber = currentGameweek > 0 ? currentGameweek : 1;

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-4 sm:pb-6">
      {/* h-10 matches the Draft/Blackjack sections' title rows - without
          it, a bare h1 here is shorter than their h1+sibling rows, so
          "Gameweek N" and the content below it would sit at a different
          height on Money than on the other two sections, even though this
          row has no second flex child of its own to align against. */}
      <div className="flex items-center mb-5 h-10">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Gameweek {gameweekNumber}
        </h1>
      </div>
      {children}
    </main>
  );
}
