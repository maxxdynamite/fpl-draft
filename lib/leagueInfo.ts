export const LEAGUE_ID = 11903;

export async function getLeagueName(): Promise<string> {
  const res = await fetch(
    `https://draft.premierleague.com/api/league/${LEAGUE_ID}/details`,
    { next: { revalidate: 3600 } }, // league name essentially never changes mid-season
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch league details: ${res.status}`);
  }
  const data = await res.json();
  return data.league.name;
}
