import { BlackjackLeaderboard } from "@/components/BlackjackLeaderboard";
import { BlackjackParticipantCard } from "@/components/BlackjackParticipantCard";
import {
  computeStatus,
  TOTAL_GAMEWEEKS,
  type BlackjackParticipant,
} from "@/lib/blackjack";
import type { Player } from "@/lib/players";

// Dev-only style preview, not linked from anywhere in the real nav - hits
// every status/qualification combination with real player photos so
// styling changes can be reviewed without needing real picks/gameweeks to
// line up. Reuses the actual components and the actual computeStatus
// logic, so this stays accurate to the real app rather than drifting into
// its own hand-maintained "looks right" copy.

// Mid-season gameweek so every pace band (at-risk/over-target/on-target/
// under-target/miles-off) is actually reachable - pre-season everything
// would trivially read "over target". The terminal/edge-of-season states
// (blackjack, fell-short) aren't reachable here though - totalGoals===21
// at this gameweek reads as "edge", not "blackjack", and totalGoals<21
// reads as a pace band, not "fell-short" - those scenarios pass their own
// gameweek: TOTAL_GAMEWEEKS override instead. Same for "early-days",
// which needs a gameweek inside the grace period.
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
  gameweek: number = PREVIEW_GAMEWEEK,
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
    status: players ? computeStatus(totalGoals, allScored, gameweek) : "no-picks",
  };
}

const scenarios: BlackjackParticipant[] = [
  buildParticipant(1, "No picks yet", "Hasn't submitted", null),

  // gameweek=0 - picks are in, but the season hasn't started so there's no
  // pace to read yet (see computeStatus's currentGameweek===0 check).
  buildParticipant(
    12,
    "Selected",
    "Picks in, season not started",
    [
      player(25, "Gyökeres", "ARS", 1, "FWD", 224117, 0),
      player(12, "Saka", "ARS", 1, "MID", 223340, 0),
      player(14, "Eze", "ARS", 1, "MID", 232413, 0),
      player(455, "Gabriel", "ARS", 1, "DEF", 172780, 0),
    ],
    0,
  ),

  buildParticipant(2, "Bust example", "26 goals — over target", [
    player(411, "Haaland", "MCI", 15, "FWD", 223094, 12),
    player(106, "Thiago", "BRE", 4, "FWD", 502500, 8),
    player(397, "Semenyo", "MCI", 15, "MID", 437730, 4),
    player(55, "Watkins", "AVL", 2, "FWD", 178301, 2),
  ]),

  // gameweek: TOTAL_GAMEWEEKS - 21 goals, all scored, only reads as the
  // real final "blackjack" win once the season is actually over. At the
  // default mid-season PREVIEW_GAMEWEEK the exact same picks read as
  // "edge" instead (see scenario 13 below).
  buildParticipant(
    3,
    "Blackjack — real win",
    "21 goals, all 4 scored, season over",
    [
      player(165, "João Pedro", "CHE", 6, "FWD", 475168, 9),
      player(480, "Gibbs-White", "NFO", 18, "MID", 222531, 6),
      player(25, "Gyökeres", "ARS", 1, "FWD", 224117, 4),
      player(346, "Calvert-Lewin", "LEE", 13, "FWD", 177815, 2),
    ],
    TOTAL_GAMEWEEKS,
  ),

  // 21 goals with one pick still on 0 is a dead end regardless of
  // gameweek (see computeStatus) - reads as "bust" here at GW15 already,
  // not just once the season ends. That's also what excludes it from
  // Blackjack pot eligibility (lib/money.ts, app/money/page.tsx both key
  // off status !== "bust").
  buildParticipant(4, "21, unqualified — reads as Bust", "Hit the number, one pick on 0", [
    player(78, "Kroupi.Jr", "BOU", 3, "MID", 560262, 10),
    player(136, "Welbeck", "CHE", 6, "FWD", 50175, 7),
    player(223, "Mateta", "CRY", 8, "FWD", 231747, 4),
    player(3, "Meslier", "ARS", 1, "GKP", 437495, 0),
  ]),

  // Same picks as scenario 3, but at the default mid-season gameweek -
  // sitting exactly on 21 with games still to play, zero buffer before a
  // bust. The tensest state in the game (see computeStatus's "edge" case).
  buildParticipant(13, "On the edge", "21 goals, all 4 scored, season not over", [
    player(165, "João Pedro", "CHE", 6, "FWD", 475168, 9),
    player(480, "Gibbs-White", "NFO", 18, "MID", 222531, 6),
    player(25, "Gyökeres", "ARS", 1, "FWD", 224117, 4),
    player(346, "Calvert-Lewin", "LEE", 13, "FWD", 177815, 2),
  ]),

  // gameweek: TOTAL_GAMEWEEKS - season over, never reached 21. A final
  // result, not a pace band to keep chasing.
  buildParticipant(
    14,
    "Fell short",
    "18 goals, season over",
    [
      player(428, "Cunha", "MUN", 16, "MID", 430871, 6),
      player(208, "Sarr", "CRY", 8, "MID", 232185, 5),
      player(248, "Beto", "EVE", 9, "FWD", 486385, 4),
      player(426, "B.Fernandes", "MUN", 16, "MID", 141746, 3),
    ],
    TOTAL_GAMEWEEKS,
  ),

  // gameweek: 2 - inside the grace period (GW1-3), too little of the
  // season played for the pace ladder to mean anything yet. Reads as
  // "early-days" regardless of totalGoals, not a noisy pace band.
  buildParticipant(
    15,
    "Early days",
    "1 goal, gameweek 2 - too soon to read pace",
    [
      player(25, "Gyökeres", "ARS", 1, "FWD", 224117, 1),
      player(12, "Saka", "ARS", 1, "MID", 223340, 0),
      player(14, "Eze", "ARS", 1, "MID", 232413, 0),
      player(455, "Gabriel", "ARS", 1, "DEF", 172780, 0),
    ],
    2,
  ),

  // 14 goals against an ~8.3 expected pace at GW15 is > pace+4, i.e. "At
  // Risk" (too fast a pace risks overshooting past 21).
  buildParticipant(5, "At risk + qualified", "14 goals, all 4 scored", [
    player(380, "Ekitiké", "LIV", 14, "FWD", 510663, 6),
    player(427, "Mbeumo", "MUN", 16, "MID", 446008, 4),
    player(439, "Šeško", "MUN", 16, "FWD", 485711, 3),
    player(527, "Richarlison", "TOT", 19, "FWD", 212319, 1),
  ]),

  buildParticipant(11, "Over pace + qualified", "12 goals, all 4 scored", [
    player(40, "Rogers", "CHE", 6, "MID", 244850, 4),
    player(154, "Palmer", "CHE", 6, "MID", 244851, 4),
    player(155, "Enzo", "CHE", 6, "MID", 448047, 2),
    player(260, "Wilson", "LEE", 13, "MID", 153682, 2),
  ]),

  buildParticipant(6, "Over pace, not qualified", "11 goals, one pick on 0", [
    player(40, "Rogers", "CHE", 6, "MID", 244850, 5),
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

  buildParticipant(9, "Under pace + qualified", "4 goals, all 4 scored", [
    player(336, "Okafor", "LEE", 13, "MID", 435997, 1),
    player(463, "Woltemade", "NEW", 17, "FWD", 470313, 1),
    player(12, "Saka", "ARS", 1, "MID", 223340, 1),
    player(14, "Eze", "ARS", 1, "MID", 232413, 1),
  ]),

  // 2 goals against an ~8.3 expected pace is < pace-5, i.e. "Miles Off It".
  buildParticipant(10, "Miles off it, not qualified", "2 goals, three picks on 0", [
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
        gameweek {PREVIEW_GAMEWEEK} of {TOTAL_GAMEWEEKS} unless a scenario
        overrides it (pre-season, early-days, and end-of-season states need
        their own gameweek to be reachable). Not linked from the real app.
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
