import type { BlackjackParticipant } from "@/lib/blackjack";
import { BLACKJACK_TARGET } from "@/lib/blackjack";
import { STATUS_META } from "@/lib/blackjackStatus";
import { QualifiedBadge } from "./QualifiedBadge";
import { SpadeIcon } from "./SpadeIcon";
import { PlayerAvatar } from "./PlayerAvatar";

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
          ) : participant.status === "winner" ? (
            // Won the pot without an actual 21-goal blackjack (see
            // applyWinnerStatus, lib/blackjack.ts) - same gradient fill as
            // Blackjack above (still a real win, still worth the brand
            // treatment), but static: no shimmer sweep, and a plain black
            // dot instead of the spade, since this isn't literally a
            // blackjack hand.
            <span className="relative inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-gradient-to-br from-[#00ff85] to-[#04f5ff] text-[#04211a]">
              <span className="h-1.5 w-1.5 rounded-full bg-black" />
              {meta.label}
            </span>
          ) : isBust ? (
            // Solid black fill, not the neutral wrapper every other status
            // uses - a distinct "this hand is dead" treatment. Dot is white
            // (not a colour from STATUS_META) so it reads against the
            // black fill instead of disappearing into it. Two triggers
            // land here: totalGoals > 21, and totalGoals === 21 without
            // every pick having scored (see computeStatus) - both are
            // dead ends, so both get the same "hand is over" treatment.
            <span className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-black text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              {meta.label}
            </span>
          ) : participant.status === "selected" ? (
            // Pre-season: picks are in but there's no pace to read yet.
            // Solid white fill (inverse of the bust pill) - the ring keeps
            // it visible against the card's own white background in light
            // mode, where a plain white-on-white pill would vanish.
            <span className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-white text-black ring-1 ring-zinc-200 dark:ring-zinc-700">
              <span className="h-1.5 w-1.5 rounded-full bg-black" />
              {meta.label}
            </span>
          ) : participant.status === "edge" ? (
            // Sitting exactly on 21 with games still to play - the
            // tensest state in the game (zero buffer, the very next goal
            // from anyone busts it). Inverts At Risk's red-text-on-neutral
            // pill into a solid red-500 fill (same red-500 At Risk itself
            // uses, not a different shade) with a pulsing glow - the same
            // loud, fixed-colour treatment Blackjack/Bust above get,
            // rather than the plain dot+text every other pace tier uses.
            // Black text/dot, not white - reads more like hazard tape on
            // the red than a plain inverted pill.
            <span className="blackjack-edge-pulse inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-500 text-black">
              <span className="h-1.5 w-1.5 rounded-full bg-black" />
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
          {/* Hidden rather than shown as "▲0" - most cards on a given
              gameweek will have nothing to report, and this on every
              single one would just be noise. Its presence is the signal.
              shrink-0 so bg-clip-text has a box sized to the label itself,
              not stretched by the row - same reasoning as CupBracket.tsx's
              own gradient-text score label. */}
          {!isBust && participant.goalsThisGw > 0 && (
            <span className="shrink-0 text-[10px] font-extrabold tabular-nums bg-gradient-to-r from-[#00ff85] to-[#04f5ff] bg-clip-text text-transparent">
              ▲{participant.goalsThisGw}
            </span>
          )}
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

      {/* Slotted into the same 19.5px gap the player grid below used to
          own outright (mt-2 + h-[5px] + mt-[6.5px] = 19.5px, unchanged) -
          adding a progress bar without growing the card at all, rather
          than tacking on a new row that would break the 194px match with
          the Draft H2H tile (see that margin's own comment below). Only
          rendered once there are real picks to show progress for - a
          placeholder-slot card has no totalGoals worth plotting. */}
      {participant.players && (
        <div className="relative mt-2 h-[5px] rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
          <div
            className={`h-full rounded-full ${meta.dotClass}`}
            style={{ width: `${Math.min(100, (participant.totalGoals / BLACKJACK_TARGET) * 100)}%` }}
          />
          {/* Hidden, not zeroed, once expectedPace is null (see its own
              comment, lib/blackjack.ts) - a tick sitting at 0% would read
              as "you should have 0 goals by now", not "pace doesn't apply
              here anymore". */}
          {participant.expectedPace !== null && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
              style={{ left: `${Math.min(100, (participant.expectedPace / BLACKJACK_TARGET) * 100)}%` }}
            />
          )}
        </div>
      )}

      {/* mt-[19.5px] (no bar above) or mt-[6.5px] (bar above already
          accounts for 13px of the gap) - the extra 3.5px on the no-bar
          path brings the card's total height to an even 194px, matching
          the Draft H2H tile exactly (same p-4 sm:p-5 padding on both, but
          H2H's separate fixed-height score block adds a few px this
          card's header+score row doesn't have on its own). Both paths
          land on the same total height. */}
      <div className={`grid grid-cols-4 gap-2 ${participant.players ? "mt-[6.5px]" : "mt-[19.5px]"}`}>
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
                    <PlayerAvatar
                      photoUrl={player.photoUrl}
                      alt={player.name}
                      containerClassName="h-10 w-10 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800"
                      imageSize={52}
                      imageClassName={`h-[52px] w-[52px] object-cover object-top transition-opacity ${
                        playerGreyed ? "opacity-40 grayscale" : ""
                      }`}
                      fallbackClassName={`h-5 w-5 text-zinc-400 dark:text-zinc-500 transition-opacity ${
                        playerGreyed ? "opacity-40" : ""
                      }`}
                      headroomOffset="pt-1"
                    />
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
