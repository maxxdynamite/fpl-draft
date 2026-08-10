import { getManagers } from "@/lib/managers";
import { getPlayersData } from "@/lib/players";
import { getBlackjackPicks } from "@/lib/blackjackPicks";
import { isPickingWindowOpen } from "@/lib/pickingWindow";
import { BlackjackPicksForm } from "@/components/BlackjackPicksForm";

export default async function BlackjackPicksPage() {
  const [managers, { players, clubs, seasonStartTime }, picks] =
    await Promise.all([getManagers(), getPlayersData(), getBlackjackPicks()]);

  const open = isPickingWindowOpen(seasonStartTime);

  if (!open) {
    return (
      <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] p-16 text-center">
        <p className="text-lg font-bold">Picks are locked</p>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm font-medium">
          They reopen during the January transfer window for a swap.
        </p>
      </div>
    );
  }

  return (
    <BlackjackPicksForm
      managers={managers.map((m) => ({
        entryId: m.entryId,
        managerName: m.managerName,
        teamName: m.teamName,
      }))}
      players={players}
      clubs={clubs}
      existingPicks={picks}
    />
  );
}
