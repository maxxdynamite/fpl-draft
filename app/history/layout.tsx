export default function HistoryLayout({ children }: LayoutProps<"/history">) {
  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-4 sm:pb-6">
      {/* h-10 matches the Draft/Blackjack/Money section title rows - this
          section isn't scoped to a live gameweek like the other three, so
          there's no status pill to align against, just the plain title. */}
      <div className="flex items-center mb-5 h-10">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          History
        </h1>
      </div>
      {children}
    </main>
  );
}
