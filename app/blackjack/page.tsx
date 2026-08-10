import { getBlackjackLeaderboard } from "@/lib/blackjack";
import { BlackjackLeaderboard } from "@/components/BlackjackLeaderboard";
import { BlackjackParticipantCard } from "@/components/BlackjackParticipantCard";

export default async function BlackjackPage() {
  const participants = await getBlackjackLeaderboard();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 items-start">
      <div className="grid gap-4 sm:grid-cols-2">
        {participants.map((participant) => (
          <BlackjackParticipantCard
            key={participant.entryId}
            participant={participant}
          />
        ))}
      </div>
      <aside className="lg:sticky lg:top-24">
        <BlackjackLeaderboard participants={participants} />
      </aside>
    </div>
  );
}
