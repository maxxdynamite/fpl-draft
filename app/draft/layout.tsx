import { DraftSubNav } from "@/components/DraftSubNav";

export default function DraftLayout({ children }: LayoutProps<"/draft">) {
  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10 sm:py-16">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Draft
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          2026/27 season
        </p>
      </header>
      <DraftSubNav />
      {children}
    </main>
  );
}
