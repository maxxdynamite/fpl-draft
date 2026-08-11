import { MiniLeaderboard } from "@/components/MiniLeaderboard";
import { CupBracket } from "@/components/CupBracket";
import { getManagers } from "@/lib/managers";
import { getGwScores } from "@/lib/gwScores";
import { getLiveGameweek } from "@/lib/liveGwScores";
import { resolveCupBracket } from "@/lib/cupBracket";

export default async function CupPage() {
  const [managers, gwScores, liveGameweek] = await Promise.all([
    getManagers(),
    getGwScores(),
    getLiveGameweek(),
  ]);
  const bracket = resolveCupBracket({ managers, gwScores, liveGameweek });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6 items-start">
      <CupBracket data={bracket} />
      <aside className="lg:sticky lg:top-24">
        <MiniLeaderboard />
      </aside>
    </div>
  );
}
