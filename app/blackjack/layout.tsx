import Link from "next/link";

export default function BlackjackLayout({ children }: LayoutProps<"/blackjack">) {
  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-4 sm:pb-6">
      <div className="flex items-center justify-between gap-4 mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Blackjack
        </h1>
        <Link
          href="/blackjack/picks"
          className="px-4 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-[#00ff85] to-[#04f5ff] text-[#04211a] shadow-[var(--shadow-soft)] hover:opacity-90 transition-opacity"
        >
          Make Your Picks
        </Link>
      </div>
      {children}
    </main>
  );
}
