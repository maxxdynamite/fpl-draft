import Image from "next/image";
import type { BlackjackParticipant } from "@/lib/blackjack";
import { BLACKJACK_TARGET } from "@/lib/blackjack";
import { STATUS_META } from "@/lib/blackjackStatus";
import { QualifiedBadge } from "./QualifiedBadge";
import { SpadeIcon } from "./SpadeIcon";

export function BlackjackParticipantCard({
  participant,
}: {
  participant: BlackjackParticipant;
}) {
  const meta = STATUS_META[participant.status];
  const isBust = participant.status === "bust";

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p
              className={`font-bold text-sm leading-tight truncate ${
                isBust ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-900 dark:text-white"
              }`}
            >
              {participant.managerName}
            </p>
            {participant.allScored && <QualifiedBadge />}
          </div>
          {participant.status === "blackjack" ? (
            // Loud and celebratory rather than just another coloured label -
            // solid brand-gradient fill (matching the Q badge/picks-chip
            // convention) with a shimmer sweep, instead of the neutral pill
            // every other status uses.
            <span className="blackjack-shimmer relative overflow-hidden inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-gradient-to-br from-[#00ff85] to-[#04f5ff] text-[#04211a]">
              <SpadeIcon size={10} />
              {meta.label}
            </span>
          ) : isBust ? (
            // Solid black fill, not the neutral wrapper every other status
            // uses - a distinct "this hand is dead" treatment. Dot is white
            // (not a colour from STATUS_META) so it reads against the
            // black fill instead of disappearing into it.
            <span className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-black text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              {meta.label}
            </span>
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-black/[0.03] dark:bg-white/[0.06] ${meta.textClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
              {meta.label}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1.5 shrink-0">
          <span
            className={`text-4xl font-extrabold tabular-nums tracking-tight ${
              isBust ? "text-zinc-400 dark:text-zinc-500" : ""
            }`}
          >
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
              const playerGreyed = isBust || hasntScored;
              return (
                <div key={player.id} className="flex flex-col items-center text-center">
                  {/* Circle is the mask (overflow-hidden) and the fallback
                      fill behind the photo. The photo is rendered larger
                      than the circle and top-anchored so it crops in
                      tighter on the head/shoulders, but with a small pt so
                      the background shows as a deliberate gap above the
                      photo rather than the photo touching the top edge. */}
                  <div className="relative z-0">
                    {participant.allScored && !isBust && (
                      // A heavier blur averages the gradient into one
                      // blended hue, so this stays well short of the
                      // original 8px/-inset-1.5 version - wider than the
                      // tightest cut, but the green-to-cyan split still
                      // needs to read clearly rather than mush together.
                      // Suppressed on bust even if every pick individually
                      // scored - a busted hand doesn't get to celebrate.
                      <span
                        aria-hidden="true"
                        className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#00ff85] to-[#04f5ff] opacity-90 blur-[5px] -z-10"
                      />
                    )}
                    {/* Solid, not translucent - the glow sits directly
                        behind this circle, and a translucent fill let its
                        colour bleed through the pt-1 gap above the head,
                        which read as the circle itself changing colour. */}
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-start justify-center pt-1">
                      <Image
                        src={player.photoUrl}
                        alt={player.name}
                        width={52}
                        height={52}
                        className={`h-[52px] w-[52px] object-cover object-top transition-opacity ${
                          playerGreyed ? "opacity-40 grayscale" : ""
                        }`}
                      />
                    </div>
                  </div>
                  {/* Name/club normally stay full-brightness even for an
                      individual player on 0 (only their photo/tally dim) -
                      but on bust every player's info greys uniformly,
                      matching the greyed name/tally at the top of the
                      tile. */}
                  <p
                    className={`text-[11px] font-semibold mt-1 truncate w-full transition-opacity ${
                      isBust ? "opacity-40" : ""
                    }`}
                  >
                    {player.name}
                  </p>
                  <p
                    className={`text-[9px] text-zinc-400 dark:text-zinc-500 transition-opacity ${
                      isBust ? "opacity-40" : ""
                    }`}
                  >
                    {player.club.shortName}
                  </p>
                  <p
                    className={`text-xs font-bold tabular-nums mt-0.5 transition-opacity ${
                      playerGreyed ? "opacity-40" : ""
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
