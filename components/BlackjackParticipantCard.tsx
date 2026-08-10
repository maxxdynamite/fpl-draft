import Image from "next/image";
import type { BlackjackParticipant } from "@/lib/blackjack";
import { BLACKJACK_TARGET } from "@/lib/blackjack";
import { STATUS_META } from "@/lib/blackjackStatus";
import { QualifiedBadge } from "./QualifiedBadge";

export function BlackjackParticipantCard({
  participant,
}: {
  participant: BlackjackParticipant;
}) {
  const meta = STATUS_META[participant.status];

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="font-bold text-sm leading-tight truncate text-zinc-900 dark:text-white">
              {participant.managerName}
            </p>
            {participant.allScored && <QualifiedBadge />}
          </div>
          <span
            className={`inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-black/[0.03] dark:bg-white/[0.06] ${meta.textClass}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
            {meta.label}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5 shrink-0">
          <span className="text-4xl font-extrabold tabular-nums tracking-tight">
            {participant.totalGoals}
          </span>
          <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">
            / {BLACKJACK_TARGET}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-4">
        {participant.players
          ? participant.players.map((player) => {
              const hasntScored = player.goals === 0;
              return (
                <div key={player.id} className="flex flex-col items-center text-center">
                  {/* Circle is the mask (overflow-hidden) and the fallback
                      fill behind the photo. The photo is rendered larger
                      than the circle and top-anchored so it crops in
                      tighter on the head/shoulders, but with a small pt so
                      the background shows as a deliberate gap above the
                      photo rather than the photo touching the top edge. */}
                  <div className="relative z-0">
                    {participant.allScored && (
                      // A heavier blur averages the gradient into one
                      // blended hue - a light blur keeps the green-to-cyan
                      // direction visible while still softening the edge,
                      // and a tight inset keeps the glow close to the photo
                      // instead of spreading into a big halo.
                      <span
                        aria-hidden="true"
                        className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-[#00ff85] to-[#04f5ff] opacity-60 blur-[3px] -z-10"
                      />
                    )}
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-black/[0.04] dark:bg-white/[0.06] flex items-start justify-center pt-1">
                      <Image
                        src={player.photoUrl}
                        alt={player.name}
                        width={52}
                        height={52}
                        className={`h-[52px] w-[52px] object-cover object-top transition-opacity ${
                          hasntScored ? "opacity-40 grayscale" : ""
                        }`}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold mt-1 truncate w-full">
                    {player.name}
                  </p>
                  <p className="text-[9px] text-zinc-400 dark:text-zinc-500">
                    {player.club.shortName}
                  </p>
                  <p
                    className={`text-xs font-bold tabular-nums mt-0.5 transition-opacity ${
                      hasntScored ? "opacity-40" : ""
                    }`}
                  >
                    {player.goals}
                  </p>
                </div>
              );
            })
          : Array.from({ length: 4 }, (_, i) => (
              // Placeholder slots so a card without picks yet takes up the
              // exact same height as one with picks - otherwise the grid
              // looks like a ragged masonry layout instead of even rows.
              <div key={i} className="flex flex-col items-center text-center">
                <div className="h-10 w-10 rounded-full bg-black/[0.05] dark:bg-white/[0.06]" />
                <div className="h-[11px] w-9 rounded-sm bg-black/[0.05] dark:bg-white/[0.06] mt-1.5" />
                <div className="h-[9px] w-6 rounded-sm bg-black/[0.04] dark:bg-white/[0.05] mt-1" />
                <div className="h-3 w-4 rounded-sm bg-black/[0.05] dark:bg-white/[0.06] mt-1" />
              </div>
            ))}
      </div>
    </div>
  );
}
