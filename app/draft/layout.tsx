import { DraftSubNav } from "@/components/DraftSubNav";
import { getCurrentGameweek } from "@/lib/gameweek";

export default async function DraftLayout({ children }: LayoutProps<"/draft">) {
  const gameweek = await getCurrentGameweek();

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex items-center gap-4 mb-5">
        <DraftSubNav />
        {gameweek !== null && (
          <div className="flex items-baseline gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Gameweek {gameweek.number}
            </h1>
            <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">
              {gameweek.finished ? "Complete" : "In Progress"}
            </span>
          </div>
        )}
      </div>
      {children}
    </main>
  );
}
