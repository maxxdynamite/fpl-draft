"use client";

// The Cup page is the first one in this app that needs two live third-party
// endpoints (draft.premierleague.com's /api/game and /api/league/.../details)
// plus two sheet reads to all succeed - real fetch failures should land here
// with a way to retry, rather than Next's generic unstyled error page.
export default function CupError({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] px-6 py-10 text-center">
      <p className="text-sm font-semibold text-zinc-900 dark:text-white">
        Couldn&apos;t load the Cup bracket
      </p>
      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
        The FPL data source didn&apos;t respond. Try again in a moment.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 px-4 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-[#00ff85] to-[#04f5ff] text-[#04211a] shadow-[var(--shadow-soft)] hover:opacity-90 transition-opacity"
      >
        Try again
      </button>
    </div>
  );
}
