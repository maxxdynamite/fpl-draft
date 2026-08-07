import { DraftSubNav } from "@/components/DraftSubNav";
import { getCurrentGameweek } from "@/lib/gameweek";

export default async function DraftLayout({ children }: LayoutProps<"/draft">) {
  const gameweek = await getCurrentGameweek();

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center gap-4 mb-8">
        {gameweek !== null && (
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Gameweek {gameweek}
          </h1>
        )}
        <DraftSubNav />
      </div>
      {children}
    </main>
  );
}
