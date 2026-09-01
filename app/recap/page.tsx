import { getRecapData, buildTemplateCaption, RECAP_LINK_LINE } from "@/lib/recap";
import { getRecapSummary } from "@/lib/recapSummary";
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

  // AI-written recap, fresh each gameweek - falls back to the old fixed
  // template on any failure (no key, network error, refusal, empty
  // response) so the caption is never broken or missing when someone's
  // about to share it. See lib/recapSummary.ts for why failures aren't
  // cached - a transient failure doesn't lock the whole gameweek out of
  // the AI version.
  let caption: string;
  try {
    caption = `${await getRecapSummary(data)}\n\n${RECAP_LINK_LINE}`;
  } catch {
    caption = buildTemplateCaption(data);
  }

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
