import { DraftSubNav } from "@/components/DraftSubNav";
import { MiniLeaderboard } from "@/components/MiniLeaderboard";

export default function DraftLayout({ children }: LayoutProps<"/draft">) {
  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <DraftSubNav />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6 items-start">
        <div>{children}</div>
        <aside className="lg:sticky lg:top-24">
          <MiniLeaderboard />
        </aside>
      </div>
    </main>
  );
}
