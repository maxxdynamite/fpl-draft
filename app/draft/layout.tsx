import { DraftSubNav } from "@/components/DraftSubNav";
import { MiniLeaderboard } from "@/components/MiniLeaderboard";

export default function DraftLayout({ children }: LayoutProps<"/draft">) {
  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Draft
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium">
          2026/27 season
        </p>
      </header>

      <DraftSubNav />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8 items-start">
        <div>{children}</div>
        <aside className="lg:sticky lg:top-24">
          <MiniLeaderboard />
        </aside>
      </div>
    </main>
  );
}
