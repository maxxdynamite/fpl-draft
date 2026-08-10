import { BlackjackLeaderboard } from "@/components/BlackjackLeaderboard";
import { BlackjackParticipantCard } from "@/components/BlackjackParticipantCard";
import {
  computeStatus,
  type BlackjackParticipant,
} from "@/lib/blackjack";
import type { Player } from "@/lib/players";

// Dev-only style preview, not linked from anywhere in the real nav - hits
// every status/qualification combination with real player photos so
// styling changes can be reviewed without needing real picks/gameweeks to
// line up. Reuses the actual components and the actual computeStatus
// logic, so this stays accurate to the real app rather than drifting into
// its own hand-maintained "looks right" copy.

// Mid-season gameweek so every pace band (ahead/on-pace/behind) is
// actually reachable - pre-season everything would trivially read "ahead".
const PREVIEW_GAMEWEEK = 15;

function player(
  id: number,
  name: string,
  clubShort: string,
  clubId: number,
  position: string,
  code: number,
  goals: number,
): Player {
  return {
    id,
    name,
    club: { id: clubId, name: clubShort, shortName: clubShort },
    position,
    goals,
    photoUrl: `https://resources.premierleague.com/premierleague25/photos/players/110x140/${code}.png`,
    status: "a",
  };
}

function buildParticipant(
  entryId: number,
  managerName: string,
  teamName: string,
  players: Player[] | null,
): BlackjackParticipant {
  const totalGoals = players ? players.reduce((sum, p) => sum + p.goals, 0) : 0;
  const allScored = players ? players.every((p) => p.goals > 0) : false;
  return {
    entryId,
    managerName,
    teamName,
    players,
    totalGoals,
    allScored,
    status: players ? computeStatus(totalGoals, allScored, PREVIEW_GAMEWEEK) : "no-picks",
  };
}

const scenarios: BlackjackParticipant[] = [
  buildParticipant(1, "No picks yet", "Hasn't submitted", null),

  buildParticipant(2, "Bust example", "26 goals — over target", [
    player(411, "Haaland", "MCI", 15, "FWD", 223094, 12),
    player(106, "Thiago", "BRE", 4, "FWD", 502500, 8),
    player(397, "Semenyo", "MCI", 15, "MID", 437730, 4),
    player(55, "Watkins", "AVL", 2, "FWD", 178301, 2),
  ]),

  buildParticipant(3, "Blackjack — real win", "21 goals, all 4 scored", [
    player(165, "João Pedro", "CHE", 6, "FWD", 475168, 9),
    player(480, "Gibbs-White", "NFO", 18, "MID", 222531, 6),
    player(25, "Gyökeres", "ARS", 1, "FWD", 224117, 4),
    player(346, "Calvert-Lewin", "LEE", 13, "FWD", 177815, 2),
  ]),

  buildParticipant(4, "21 but NOT qualified", "Hit the number, one pick on 0", [
    player(78, "Kroupi.Jr", "BOU", 3, "MID", 560262, 10),
    player(136, "Welbeck", "CHE", 6, "FWD", 50175, 7),
    player(223, "Mateta", "CRY", 8, "FWD", 231747, 4),
    player(3, "Meslier", "ARS", 1, "GKP", 437495, 0),
  ]),

  buildParticipant(5, "Ahead of pace + qualified", "14 goals, all 4 scored", [
    player(380, "Ekitiké", "LIV", 14, "FWD", 510663, 6),
    player(427, "Mbeumo", "MUN", 16, "MID", 446008, 4),
    player(439, "Šeško", "MUN", 16, "FWD", 485711, 3),
    player(527, "Richarlison", "TOT", 19, "FWD", 212319, 1),
  ]),

  buildParticipant(6, "Ahead of pace, not qualified", "13 goals, one pick on 0", [
    player(40, "Rogers", "CHE", 6, "MID", 244850, 7),
    player(154, "Palmer", "CHE", 6, "MID", 244851, 4),
    player(155, "Enzo", "CHE", 6, "MID", 448047, 2),
    player(260, "Wilson", "LEE", 13, "MID", 153682, 0),
  ]),

  buildParticipant(7, "On pace + qualified", "8 goals, all 4 scored", [
    player(428, "Cunha", "MUN", 16, "MID", 430871, 3),
    player(208, "Sarr", "CRY", 8, "MID", 232185, 2),
    player(248, "Beto", "EVE", 9, "FWD", 486385, 2),
    player(426, "B.Fernandes", "MUN", 16, "MID", 141746, 1),
  ]),

  buildParticipant(8, "On pace, not qualified", "8 goals, two picks on 0", [
    player(452, "Bruno G.", "NEW", 17, "MID", 208706, 5),
    player(94, "Schade", "BRE", 4, "MID", 513418, 3),
    player(236, "Dewsbury-Hall", "EVE", 9, "MID", 215413, 0),
    player(249, "Barry", "EVE", 9, "FWD", 586309, 0),
  ]),

  buildParticipant(9, "Behind pace + qualified", "4 goals, all 4 scored", [
    player(336, "Okafor", "LEE", 13, "MID", 435997, 1),
    player(463, "Woltemade", "NEW", 17, "FWD", 470313, 1),
    player(12, "Saka", "ARS", 1, "MID", 223340, 1),
    player(14, "Eze", "ARS", 1, "MID", 232413, 1),
  ]),

  buildParticipant(10, "Behind pace, not qualified", "2 goals, three picks on 0", [
    player(68, "Tavernier", "BOU", 3, "MID", 201658, 2),
    player(95, "O.Dango", "BRE", 4, "MID", 533463, 0),
    player(367, "Gakpo", "LIV", 14, "MID", 243298, 0),
    player(398, "Foden", "MCI", 15, "MID", 209244, 0),
  ]),
].sort((a, b) => b.totalGoals - a.totalGoals);

export default function BlackjackPreviewPage() {
  return (
    <div>
      <p className="text-sm text-zinc-400 dark:text-zinc-500 -mt-2 mb-5">
        Style preview: every status combination with real player photos, at
        gameweek {PREVIEW_GAMEWEEK} of 38. Not linked from the real app.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 items-start">
        <div className="grid gap-4 sm:grid-cols-2">
          {scenarios.map((participant) => (
            <BlackjackParticipantCard
              key={participant.entryId}
              participant={participant}
            />
          ))}
        </div>
        <aside className="lg:sticky lg:top-24">
          <BlackjackLeaderboard participants={scenarios} />
        </aside>
      </div>
    </div>
  );
}
