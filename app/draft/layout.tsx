import { DraftSubNav } from "@/components/DraftSubNav";
import { getCurrentGameweek } from "@/lib/gameweek";

export default async function DraftLayout({ children }: LayoutProps<"/draft">) {
  const gameweek = await getCurrentGameweek();

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center justify-between gap-3 mb-8">
        <DraftSubNav />
        {gameweek !== null && (
          <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
            Gameweek {gameweek}
          </span>
        )}
      </div>
      {children}
    </main>
  );
}
