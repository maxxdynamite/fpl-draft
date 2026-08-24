import { getRecapData, tokensToText } from "@/lib/recap";
import { CopyButton } from "@/components/CopyButton";
import { ShareButton } from "@/components/ShareButton";

// MOCKUP MODE - see the comment on lib/recap.ts's getRecapData(). This
// page (and the /api/recap/image route it points at) narrates whatever
// the live gameweek's scores currently are, not a genuinely finished
// one. Dev-only for now, on purpose - not something the group should see
// until it's gated on the gameweek actually being locked.
export default async function RecapPage() {
  const data = await getRecapData();

  const lines = [
    `GW${data.gameweek} done. ${tokensToText(data.headline)}`,
    data.closestMatch
      ? `Closest game of the week: ${data.closestMatch.winnerName} edged ${data.closestMatch.loserName} ${data.closestMatch.winnerScore}–${data.closestMatch.loserScore}.`
      : null,
    data.hotStreak
      ? `${data.hotStreak.managerName} is riding a ${data.hotStreak.streak}-game H2H win streak — nobody's stopped them yet.`
      : null,
    data.motw && data.sotw
      ? `🏆 MOTW: ${data.motw.teamName} (${data.motw.points} pts)\n🔧 SOTW: ${data.sotw.teamName} (${data.sotw.points} pts)`
      : null,
    data.seasonHigh && data.seasonLow
      ? `Season extremes so far: ${data.seasonHigh.teamName}'s ${data.seasonHigh.score} in GW${data.seasonHigh.gameweek} is the high point, ${data.seasonLow.teamName}'s ${data.seasonLow.score} in GW${data.seasonLow.gameweek} the low.`
      : null,
    data.overallTop && data.overallBottom
      ? `Overall table: ${data.overallTop.teamName} leads on ${data.overallTop.totalPoints} pts, ${data.overallBottom.teamName} props up the bottom on ${data.overallBottom.totalPoints}.`
      : null,
    data.bottomManagerName
      ? `Spare a thought for ${data.bottomManagerName}, bottom of the pile on ${data.bottomScore}.`
      : null,
    // Scheme included (not just the bare domain) so WhatsApp reliably
    // treats it as a tappable link even embedded in an image caption,
    // not just as a plain-text message on its own - see ShareButton's
    // own comment on what that combination does and doesn't get you.
    `The full recap (and then some) is in the app 👉 https://badblokesweekly.vercel.app`,
  ].filter((l): l is string => l !== null);
  const caption = lines.join("\n\n");

  return (
    <main className="flex-1 w-full max-w-md mx-auto px-4 sm:px-6 pt-6 pb-10">
      <div className="mb-4 rounded-lg bg-amber-500/10 ring-1 ring-amber-500/30 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
        Dev-only mockup — narrates the live gameweek as if it's finished,
        not gated on the real lockdown yet.
      </div>

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
