import { LEAGUE_ID } from "./leagueInfo";

type DraftChoice = {
  entry: number;
  round: number;
  index: number;
};

// Maps entry_id -> pick position (1-based) in round 1 of the snake draft.
// Round 1 order is what people mean by "draft order" - later rounds reverse
// direction each time, so a round-3 index doesn't tell you where someone
// picked overall. Empty until the league's draft actually takes place.
export async function getDraftOrder(): Promise<Map<number, number>> {
  const res = await fetch(
    `https://draft.premierleague.com/api/draft/${LEAGUE_ID}/choices`,
    { next: { revalidate: 300 } },
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch draft choices: ${res.status}`);
  }
  const data = await res.json();
  const choices = (data.choices ?? []) as DraftChoice[];

  const firstRound = choices
    .filter((choice) => choice.round === 1)
    .sort((a, b) => a.index - b.index);

  return new Map(firstRound.map((choice, i) => [choice.entry, i + 1]));
}
