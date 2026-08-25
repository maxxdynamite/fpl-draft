import { getRecapData, tokensToText } from "@/lib/recap";
import { CopyButton } from "@/components/CopyButton";
import { ShareButton } from "@/components/ShareButton";

export default async function RecapPage() {
  const data = await getRecapData();

  // getRecapData() returns null before the very first gameweek has
  // synced - nothing to recap yet, not an error.
  if (!data) {
    return (
      <main className="flex-1 w-full max-w-md mx-auto px-4 sm:px-6 pt-6 pb-10">
        <h1 className="text-xl font-bold mb-3">Weekly Recap</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No gameweek has finished and synced yet - check back once one has.
        </p>
      </main>
    );
  }

  const lines = [
    `GW${data.gameweek} done. ${tokensToText(data.headline)}`,
    data.closestMatch
      ? data.closestMatch.isTie
        ? `Closest game of the week wasn't close at all — it was a dead heat. ${data.closestMatch.winnerName} (${data.closestMatch.winnerTeam}) and ${data.closestMatch.loserName} (${data.closestMatch.loserTeam}) both posted ${data.closestMatch.winnerScore}, so no bragging rights for anyone.`
        : `Closest game of the week: ${data.closestMatch.winnerName} (${data.closestMatch.winnerTeam}) scraped past ${data.closestMatch.loserName} (${data.closestMatch.loserTeam}), ${data.closestMatch.winnerScore}–${data.closestMatch.loserScore}.`
      : null,
    // Everything else in H2H that didn't already get its own sentence
    // above - manager names only (no team names) to keep this a quick
    // rundown rather than another round of full call-outs.
    data.otherMatches.length > 0
      ? `Elsewhere in H2H: ${data.otherMatches
          .map((m) =>
            m.isTie
              ? `${m.winnerName} and ${m.loserName} tied at ${m.winnerScore}`
              : `${m.winnerName} beat ${m.loserName} ${m.winnerScore}–${m.loserScore}`,
          )
          .join("; ")}.`
      : null,
    data.hotStreak
      ? `${data.hotStreak.managerName} (${data.hotStreak.teamName}) is ${data.hotStreak.streak} games deep into an H2H win streak. Someone ought to check on the rest of the league.`
      : null,
    data.motw && data.sotw
      ? `🏆 MOTW: ${data.motw.teamName} (${data.motw.points} pts)\n🔧 SOTW: ${data.sotw.teamName} (${data.sotw.points} pts) — someone had to.`
      : null,
    data.seasonHigh && data.seasonLow
      ? `Season high so far belongs to ${data.seasonHigh.teamName} — ${data.seasonHigh.score} back in GW${data.seasonHigh.gameweek}. The low bar is held by ${data.seasonLow.teamName}, ${data.seasonLow.score} in GW${data.seasonLow.gameweek}, and nobody's rushing to take it off them.`
      : null,
    data.overallTop && data.overallBottom
      ? `In the table that actually matters, ${data.overallTop.teamName} lead the way on ${data.overallTop.totalPoints} pts. ${data.overallBottom.teamName} are propping up the rest of the league on ${data.overallBottom.totalPoints} — building character, presumably.`
      : null,
    // Scheme included (not just the bare domain) so WhatsApp reliably
    // treats it as a tappable link even embedded in an image caption,
    // not just as a plain-text message on its own - see ShareButton's
    // own comment on what that combination does and doesn't get you.
    `Everything else is in the app 👉 https://badblokesweekly.vercel.app`,
  ].filter((l): l is string => l !== null);
  const caption = lines.join("\n\n");

  return (
    <main className="flex-1 w-full max-w-md mx-auto px-4 sm:px-6 pt-6 pb-10">
      <h1 className="text-xl font-bold mb-3">Weekly Recap</h1>

      <img
        src="/api/recap/image"
        alt={`Gameweek ${data.gameweek} recap`}
        className="w-full rounded-2xl shadow-[var(--shadow-soft)]"
      />

      {/* Shares the image and caption together in one native share sheet
          where supported (see ShareButton) - falls back to pointing at
          Copy caption + long-press-to-save below when it isn't. */}
      <div className="mt-4">
        <ShareButton
          imageUrl="/api/recap/image"
          caption={caption}
          fileName={`gameweek-${data.gameweek}-recap.png`}
          title={`Gameweek ${data.gameweek} Recap`}
        />
      </div>

      <div className="mt-5 rounded-xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Caption
          </p>
          <CopyButton text={caption} />
        </div>
        <p className="text-sm whitespace-pre-line text-zinc-700 dark:text-zinc-300">
          {caption}
        </p>
      </div>
    </main>
  );
}
