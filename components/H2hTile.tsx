"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { H2hMatchup } from "@/lib/h2h";
import { formatPl, plColor } from "@/lib/format";

function initials(managerName: string): string {
  const parts = managerName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const STREAK_THRESHOLD = 3;

// Tier 1 (3+ weeks): solid cyan.
// Tier 2 (5+ weeks): amber gradient, pulsing glow.
// Tier 3 (7+ weeks): black "legendary" badge, rainbow halo + shimmer sweep.
function StreakBadge({ streak, hide }: { streak: number; hide: boolean }) {
  const show = streak >= STREAK_THRESHOLD;
  const tier = streak >= 7 ? 3 : streak >= 5 ? 2 : 1;

  const tierClasses =
    tier === 3
      ? "bg-[#050505] text-white streak-t3"
      : tier === 2
        ? "bg-gradient-to-br from-[#ffc23d] to-[#ff5b04] text-[#1a0900] shadow-[0_0_10px_2px_rgba(255,91,4,0.5)] streak-t2"
        : "bg-[#04f5ff] text-black shadow-[0_0_10px_2px_rgba(4,245,255,0.55)]";

  return (
    <span
      className={`relative isolate inline-block mt-2 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide transition-opacity duration-300 ${tierClasses} ${
        show ? (hide ? "opacity-0" : "opacity-100") : "invisible"
      }`}
    >
      {tier === 3 && (
        <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none streak-t3-shimmer" />
      )}
      {streak} Week Streak
    </span>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5 first:pt-0 last:pb-0">
      <span className="text-zinc-400 dark:text-zinc-500">{label}</span>
      <span className="font-semibold tabular-nums text-zinc-900 dark:text-white">
        {value}
      </span>
    </div>
  );
}

function PlayerStatsMenu({
  align,
  open,
  draftPosition,
  firstPick,
  overallRank,
  totalPoints,
  motwCount,
  sotwCount,
}: {
  align: "left" | "right";
  open: boolean;
  draftPosition: number | null;
  firstPick: string | null;
  overallRank: number | null;
  totalPoints: number | null;
  motwCount: number | null;
  sotwCount: number | null;
}) {
  return (
    <div
      className={`absolute top-full ${align === "right" ? "right-0" : "left-0"} mt-1.5 z-30 w-40 rounded-lg bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.06] dark:ring-white/[0.1] p-2 text-[11px] transition-all duration-150 group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto ${
        open ? "opacity-100 visible pointer-events-auto" : "opacity-0 invisible pointer-events-none"
      }`}
    >
      <StatRow label="Draft Order" value={draftPosition?.toString() ?? "TBD"} />
      <StatRow label="First Pick" value={firstPick ?? "TBD"} />
      <StatRow label="Overall Rank" value={overallRank?.toString() ?? "–"} />
      <StatRow label="Total Points" value={totalPoints?.toString() ?? "–"} />
      <StatRow label="MOTW" value={motwCount?.toString() ?? "–"} />
      <StatRow label="SOTW" value={sotwCount?.toString() ?? "–"} />
    </div>
  );
}

function SideHeader({
  managerName,
  teamName,
  align,
  streak,
  dark,
  draftPosition,
  firstPick,
  overallRank,
  totalPoints,
  motwCount,
  sotwCount,
}: {
  managerName: string;
  teamName: string;
  align: "left" | "right";
  streak: number;
  dark: boolean;
  draftPosition: number | null;
  firstPick: string | null;
  overallRank: number | null;
  totalPoints: number | null;
  motwCount: number | null;
  sotwCount: number | null;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hover already opens this menu via CSS group-hover, which touch
  // browsers don't reliably trigger on tap - this adds an explicit
  // click/tap toggle on top, closed by tapping anywhere outside.
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <div ref={containerRef} className="group relative cursor-default">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`block w-full appearance-none bg-transparent border-0 p-0 font-bold text-sm leading-tight truncate transition-colors duration-300 ${
            align === "right" ? "text-right" : "text-left"
          } ${dark ? "text-[#04211a]" : "text-zinc-900 dark:text-white"}`}
        >
          {managerName}
        </button>
        <PlayerStatsMenu
          align={align}
          open={open}
          draftPosition={draftPosition}
          firstPick={firstPick}
          overallRank={overallRank}
          totalPoints={totalPoints}
          motwCount={motwCount}
          sotwCount={sotwCount}
        />
      </div>
      <p
        className={`text-xs truncate mt-0.5 transition-colors duration-300 ${
          dark ? "text-[#04211a]/70" : "text-zinc-400 dark:text-zinc-500"
        }`}
      >
        {teamName}
      </p>
      <StreakBadge streak={streak} hide={dark} />
    </div>
  );
}

function ChevronIcon({ flipped }: { flipped: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      className={`transition-transform duration-300 ${flipped ? "rotate-180" : ""}`}
    >
      <path
        d="M2.5 7.5L6 4L9.5 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// All 38 gameweeks are always rendered and scrollable - what's actually
// *seen* is controlled entirely by the mask and the scroll position, not
// by how much is in the DOM. The sheet always *opens* scrolled to a
// trailing 6-week window ending at the latest played week (GW1-6 while
// the season's still within its first 6 weeks, then rolling forward to
// stay 6-wide) - that's the one part that has to look identical every
// time, regardless of what gameweek the season's on. Scrolling further
// left or right from there moves the same 6-wide unmasked window across
// the rest of the season.
//
// Getting "exactly 6, never 7" right isn't something a fixed column width
// plus an approximately-tuned mask can guarantee - the real viewport is
// wider than "badge + 6 columns", so a right-anchored scroll alone always
// leaves room for a 7th column (or a sliver of one) to peek in, no matter
// how the fade is tuned. Instead, column width is *derived* from the
// actual measured viewport width so exactly WINDOW_SIZE columns fill it
// by construction - nothing left over for anything else to show through.
//
// The same reasoning applies to the *lost* gameweek on the left (the one
// just pushed out of the window once latestGw > WINDOW_SIZE) - a mask
// with a fixed transparent-zone width can't guarantee it's fully hidden,
// because the lost column is exactly one dynamic columnWidth wide, and a
// fixed pixel value has no idea how wide that is. The transparent zone is
// solved for alongside columnWidth instead, sized to exactly cover one
// column + its gap, so the lost week is always either fully visible (as
// part of the 6) or fully hidden - never a partial ghost.
const TOTAL_GAMEWEEKS = 38;
const WINDOW_SIZE = 6;
const BADGE_WIDTH = 32; // pinned initials badge - the transparent zone must clear at least this
// Widened from 4px so the left fade (below) has real room to be soft
// without touching the lost column's own body - see FADE_WIDTH. This also
// airs out the whole strip a little, not just this one edge.
const COLUMN_GAP = 10; // gap-2.5
// Transition from transparent to opaque. Must stay under COLUMN_GAP: the
// lost column's trailing edge sits only one COLUMN_GAP before the visible
// window starts (columns are packed tight, no dedicated hiding margin), so
// any fade wider than that gap necessarily straddles the lost column's own
// body and leaves it partially visible - a real bug that showed up when
// this was 16px against a 4px gap. Kept a couple px under the gap (not
// exactly equal) as a safety margin against the sub-pixel layout rounding
// seen during testing.
const FADE_WIDTH = COLUMN_GAP - 2;
// The right edge is a deliberate scroll affordance, not a hiding
// mechanism, so it doesn't share the left side's "must be exact" constraint
// - it can cross into the 7th column's own body while softening. Opaque
// through the 6th column, a soft step down to PEEK_OPACITY over
// RIGHT_STEP_WIDTH, held flat for RIGHT_PEEK_WIDTH (long enough to actually
// read as a fixture, not a smudge), then a soft fade to fully transparent
// over RIGHT_FADE_TAIL at the card edge.
const RIGHT_STEP_WIDTH = 8;
const RIGHT_PEEK_WIDTH = 18;
const RIGHT_FADE_TAIL = 12;
const PEEK_OPACITY = 0.3;
const RIGHT_BUFFER = RIGHT_STEP_WIDTH + RIGHT_PEEK_WIDTH + RIGHT_FADE_TAIL;

export function H2hTile({ matchup }: { matchup: H2hMatchup }) {
  const [showAllGameweeks, setShowAllGameweeks] = useState(false);
  const { teamA, teamB, history } = matchup;
  const scrollRef = useRef<HTMLDivElement>(null);
  // Sane defaults before the first measurement lands, so nothing renders
  // at 0 width for a frame.
  const [columnWidth, setColumnWidth] = useState(32);
  const [transparentZone, setTransparentZone] = useState(BADGE_WIDTH);

  const historyByGw = new Map(history.map((row) => [row.gameweek, row]));
  const latestGw =
    history.length > 0 ? Math.max(...history.map((row) => row.gameweek)) : 1;

  // Measure the real viewport and size every column so exactly WINDOW_SIZE
  // fit within it - see the note above on why this has to be geometric,
  // not mask-based. There are WINDOW_SIZE visible columns *plus* one lost
  // column also needing exactly columnWidth of hiding room, so the
  // available space is divided by WINDOW_SIZE+1, not WINDOW_SIZE - solving
  // both column width and the mask's transparent-zone width together
  // rather than picking one and hoping the other lines up. Re-measures on
  // resize so it stays correct across breakpoints, not just at first mount.
  useLayoutEffect(() => {
    const area = scrollRef.current;
    if (!area) return;
    function measure() {
      const c =
        (area!.clientWidth - FADE_WIDTH - RIGHT_BUFFER - WINDOW_SIZE * COLUMN_GAP) /
        (WINDOW_SIZE + 1);
      setColumnWidth(c);
      setTransparentZone(Math.max(BADGE_WIDTH, c + COLUMN_GAP));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Jump straight to the latest played gameweek every time the sheet
  // opens, sliding the whole strip left by exactly one column-pitch per
  // gameweek past the initial 6-week window. Deliberately NOT computed
  // from the target column's DOM offsetLeft/offsetWidth - those round to
  // integer pixels, and that per-column rounding drift (measured as an
  // 8-12px error over a handful of columns) was exactly why the "lost"
  // column was still peeking through the left fade instead of sitting
  // fully behind it. Shifting by a whole number of (columnWidth +
  // COLUMN_GAP) pitches - the same float values the mask itself is built
  // from - reproduces the scrollLeft:0 geometry exactly, just starting
  // `shiftColumns` gameweeks later, so the pushed-out column always lands
  // precisely at the transparent zone's edge.
  useEffect(() => {
    if (!showAllGameweeks) return;
    const area = scrollRef.current;
    if (!area) return;
    const shiftColumns = Math.max(0, latestGw - WINDOW_SIZE);
    area.scrollLeft = shiftColumns * (columnWidth + COLUMN_GAP);
  }, [showAllGameweeks, latestGw, columnWidth]);

  return (
    <div className="relative rounded-2xl shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden">
      <div className="absolute inset-0 bg-white dark:bg-zinc-900" />
      <div
        className={`absolute inset-0 bg-gradient-to-br from-[#00ff85] to-[#04f5ff] transition-[clip-path] duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          showAllGameweeks
            ? "[clip-path:inset(0%_0%_0%_0%)]"
            : "[clip-path:inset(100%_0%_0%_0%)]"
        }`}
      />
      {/* shadow-[var(--shadow-soft)]'s dark-mode inset top highlight (the
          "emboss" every other tile in the app shows) paints as part of
          this div's own box - behind the two opaque full-cover layers
          above in stacking order, which completely hid it (confirmed by
          hiding those layers and watching it appear). Every other tile
          sets its background directly on the same ring/shadow element,
          so it has nothing covering its own inset shadow; this tile
          can't do that (the background IS the crossfade animation), so
          the highlight gets redrawn as its own layer instead, above the
          two that were hiding it. No-op in light mode, same as the
          --shadow-soft variable itself only having this line in dark. */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px dark:bg-white/[0.04]" />

      <div className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <SideHeader
            managerName={teamA.managerName}
            teamName={teamA.teamName}
            align="left"
            streak={teamA.streak}
            dark={showAllGameweeks}
            draftPosition={teamA.draftPosition}
            firstPick={teamA.firstPick}
            overallRank={teamA.overallRank}
            totalPoints={teamA.totalPoints}
            motwCount={teamA.motwCount}
            sotwCount={teamA.sotwCount}
          />
          <SideHeader
            managerName={teamB.managerName}
            teamName={teamB.teamName}
            align="right"
            streak={teamB.streak}
            dark={showAllGameweeks}
            draftPosition={teamB.draftPosition}
            firstPick={teamB.firstPick}
            overallRank={teamB.overallRank}
            totalPoints={teamB.totalPoints}
            motwCount={teamB.motwCount}
            sotwCount={teamB.sotwCount}
          />
        </div>

        {/* Fixed-height slot shared by both states — never resizes, so
            toggling only ever crossfades opacity inside it, nothing jumps.
            mt-1 (not mt-2) pulls the whole label+scores group up closer
            to the streak badge above it. */}
        <div className="relative mt-1 h-16">
          {/* Anchored to a fixed spot near the top of the box, independent
              of the numbers below it - previously this floated relative to
              the H2H score itself, which meant nudging the scores up
              dragged the label up with them instead of closing the gap
              between the two. */}
          <p
            className={`absolute inset-x-0 top-0 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 transition-opacity duration-300 ${
              showAllGameweeks ? "opacity-0" : "opacity-100"
            }`}
          >
            Head-to-Head
          </p>
          <div
            // items-center, not items-start - the two gameweek scores and
            // the H2H score are one group that shares a single vertical
            // center line. An explicit top+height band (not inset-0, and
            // not an auto-height row - auto-height just wraps the tallest
            // item with zero room to actually shift anything) is what
            // lets that shared center sit close under the label instead
            // of wherever the tallest item's own natural height puts it.
            // top-[2px] - calibrated to the H2H score's own top edge, not
            // the (much taller) GW scores' top edge. Centering a short
            // line (H2H score) and a tall line (GW scores) on the same
            // middle point unavoidably leaves more clearance above the
            // short one - tightening against the GW scores' top left the
            // H2H score still ~10px shy of the label above it, so this is
            // tuned against the H2H score specifically instead; the GW
            // scores just land wherever that puts them.
            className={`absolute inset-x-0 top-[2px] h-[50px] grid grid-cols-[1fr_auto_1fr] items-center gap-3 transition-opacity duration-300 ${
              showAllGameweeks ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <span className="text-4xl font-extrabold tabular-nums tracking-tight">
              {teamA.latestScore ?? 0}
            </span>
            <p className="text-lg font-bold tabular-nums text-center">
              <span
                className={
                  teamA.wins > teamB.wins
                    ? "text-zinc-900 dark:text-white"
                    : "text-zinc-500 dark:text-zinc-400"
                }
              >
                {teamA.wins}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400"> – </span>
              <span
                className={
                  teamB.wins > teamA.wins
                    ? "text-zinc-900 dark:text-white"
                    : "text-zinc-500 dark:text-zinc-400"
                }
              >
                {teamB.wins}
              </span>
            </p>
            <span className="text-4xl font-extrabold tabular-nums tracking-tight text-right">
              {teamB.latestScore ?? 0}
            </span>
          </div>

          <div
            className={`absolute left-0 right-0 bottom-0 -top-[8px] transition-opacity duration-300 ${
              showAllGameweeks ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="absolute left-0 top-0 bottom-0 w-8 z-10 flex flex-col items-start pl-0.5 pointer-events-none">
              <span className="h-2 mb-1.5" aria-hidden="true" />
              <span className="h-4 w-6 rounded-[5px] bg-[#04211a] text-[#00ff85] text-[8px] font-extrabold flex items-center justify-center">
                {initials(teamA.managerName)}
              </span>
              <span className="h-4 w-6 rounded-[5px] bg-[#04211a] text-[#00ff85] text-[8px] font-extrabold flex items-center justify-center mt-2.5">
                {initials(teamB.managerName)}
              </span>
            </div>

            <div
              ref={scrollRef}
              // relative - the scroll container has to be a positioned
              // ancestor itself, otherwise the scroll-to-latest effect's
              // target.offsetLeft resolves against a different, further-out
              // ancestor than the one scrollLeft actually operates in.
              // The left mask's transparent zone is `transparentZone`, not a
              // fixed guess - it's derived from the same measured
              // columnWidth as the columns themselves, so it's guaranteed to
              // fully cover exactly one column + its gap (the "lost" GW),
              // whatever the actual viewport width turns out to be. It fades
              // to opaque over FADE_WIDTH beyond that. The right side is
              // just a small cosmetic fade over RIGHT_BUFFER's empty space,
              // not a hiding mechanism - column width already guarantees
              // nothing else fits in the viewport to hide. No -mx/pl bleed
              // to the card edges (unlike the old design) - that padding put
              // offsetLeft (what the scroll math uses) and the mask's own
              // pixel values in two different coordinate spaces, 16-20px
              // apart, which was exactly why a column meant to be fully
              // hidden was still poking through by that same margin. Right
              // side: opaque through the 6th column, a soft step down to
              // PEEK_OPACITY (not a hard cut - it's fine to cross into the
              // 7th column's own body here, unlike the left side), held
              // flat long enough to read as an actual fixture, then a soft
              // fade to fully transparent at the card edge.
              className="relative no-scrollbar h-full overflow-x-auto overflow-y-hidden"
              style={{
                maskImage: `linear-gradient(to right, transparent, transparent ${transparentZone}px, black ${transparentZone + FADE_WIDTH}px, black calc(100% - ${RIGHT_BUFFER}px), rgba(0,0,0,${PEEK_OPACITY}) calc(100% - ${RIGHT_BUFFER - RIGHT_STEP_WIDTH}px), rgba(0,0,0,${PEEK_OPACITY}) calc(100% - ${RIGHT_FADE_TAIL}px), transparent)`,
                WebkitMaskImage: `linear-gradient(to right, transparent, transparent ${transparentZone}px, black ${transparentZone + FADE_WIDTH}px, black calc(100% - ${RIGHT_BUFFER}px), rgba(0,0,0,${PEEK_OPACITY}) calc(100% - ${RIGHT_BUFFER - RIGHT_STEP_WIDTH}px), rgba(0,0,0,${PEEK_OPACITY}) calc(100% - ${RIGHT_FADE_TAIL}px), transparent)`,
              }}
            >
              <div className="flex items-start gap-2.5 w-max">
                {/* Matches the mask's full-opacity point exactly, so at
                    scrollLeft:0 (GW1 visible) the first real column starts
                    right where the mask reaches full opacity, not stranded
                    mid-fade. Subtracts COLUMN_GAP because the flex `gap-2.5`
                    on this row also applies between this spacer and GW1 -
                    without the subtraction every column lands one gap later
                    than the mask/columnWidth math assumes, which is what
                    let the current gameweek bleed into the right fade. */}
                <div
                  className="flex-none"
                  style={{ width: transparentZone + FADE_WIDTH - COLUMN_GAP }}
                  aria-hidden="true"
                />
                {Array.from({ length: TOTAL_GAMEWEEKS }, (_, i) => i + 1).map(
                  (gw) => {
                    const row = historyByGw.get(gw);
                    // Computed independently, not one as the other's
                    // negation (the old `!aWin` for B) - on a tie neither
                    // side actually won, so !aWin being true there faded
                    // the wrong side out (the tied "loser" B stayed full
                    // brightness). Full brightness now means "this side
                    // won outright", faded means "did not" - covering an
                    // actual loss and a tie the same way, rather than a
                    // tie masquerading as a win for whichever side wasn't
                    // A.
                    const aWon = row ? row.aScore > row.bScore : null;
                    const bWon = row ? row.bScore > row.aScore : null;
                    return (
                      <div
                        key={gw}
                        data-gw={gw}
                        style={{ width: columnWidth }}
                        className="flex-none flex flex-col items-center"
                      >
                        <span className="h-2 mb-1.5 text-[8px] font-extrabold text-[#04211a]/60 uppercase leading-[8px]">
                          GW{gw}
                        </span>
                        <span
                          className={`h-4 flex items-center justify-center text-base font-extrabold tabular-nums leading-none text-[#04211a] ${
                            row ? (aWon ? "" : "opacity-45") : "opacity-35 font-semibold"
                          }`}
                        >
                          {row ? row.aScore : "–"}
                        </span>
                        <span
                          className={`h-4 flex items-center justify-center text-base font-extrabold tabular-nums leading-none text-[#04211a] mt-2.5 ${
                            row ? (bWon ? "" : "opacity-45") : "opacity-35 font-semibold"
                          }`}
                        >
                          {row ? row.bScore : "–"}
                        </span>
                      </div>
                    );
                  },
                )}
                {/* Matches RIGHT_BUFFER - ensures there's actually enough
                    scrollable width for scrollLeft to reach the computed
                    target without the browser clamping it early. */}
                <div
                  className="flex-none"
                  style={{ width: RIGHT_BUFFER }}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-2">
          <span
            className={`text-xs font-semibold transition-colors duration-300 ${
              showAllGameweeks ? "text-[#04211a]" : plColor(teamA.pl)
            }`}
          >
            {formatPl(teamA.pl)}
          </span>
          <button
            type="button"
            onClick={() => setShowAllGameweeks((v) => !v)}
            className={`flex items-center gap-1 text-[11px] font-semibold transition-colors duration-300 ${
              showAllGameweeks
                ? "text-[#04211a] hover:text-[#04211a]/70"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            All Gameweeks
            <ChevronIcon flipped={!showAllGameweeks} />
          </button>
          <span
            className={`text-xs font-semibold transition-colors duration-300 ${
              showAllGameweeks ? "text-[#04211a]" : plColor(teamB.pl)
            }`}
          >
            {formatPl(teamB.pl)}
          </span>
        </div>
      </div>
    </div>
  );
}
