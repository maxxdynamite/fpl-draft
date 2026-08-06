export default function BlackjackPage() {
  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Blackjack
        </h1>
      </header>
      <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] p-16 text-center">
        <p className="text-lg font-bold">Coming soon</p>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm font-medium">
          Blackjack side game isn&apos;t tracked here yet.
        </p>
      </div>
    </main>
  );
}
