import { MiniLeaderboard } from "@/components/MiniLeaderboard";
import { CupBracket } from "@/components/CupBracket";

export default function CupPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6 items-start">
      <CupBracket />
      <aside className="lg:sticky lg:top-24">
        <MiniLeaderboard />
      </aside>
    </div>
  );
}
