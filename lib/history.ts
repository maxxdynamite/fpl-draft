export type SeasonDraftResult = {
  place: 1 | 2 | 3;
  manager: string;
};

export type SeasonRecord = {
  season: string; // e.g. "2025/26"
  draft: SeasonDraftResult[];
  blackjack?: string[]; // one entry per winner - length 2 means a tie
  cup?: string;
};

// Manually tracked, not fetched - unlike every other section, there's no
// live API or sheet source for past seasons' results (see
// app/history/page.tsx). Newest season first, matching how every other
// timeline/leaderboard in this app already orders things. Draft only ever
// has one shared place-1 pair (2020/21) so far, but the shape allows any
// number of ties at any place, not just a hardcoded pair.
export const SEASON_HISTORY: SeasonRecord[] = [
  {
    season: "2025/26",
    draft: [
      { place: 1, manager: "Max Lambert" },
      { place: 2, manager: "Phil Thomas" },
      { place: 3, manager: "Marc Edwards" },
    ],
    blackjack: ["Jordan Gibbens", "Liam Zajdlic"],
    cup: "Brett Cooper",
  },
  {
    season: "2024/25",
    draft: [
      { place: 1, manager: "Alasdair Hall-Jones" },
      { place: 2, manager: "Brett Cooper" },
      { place: 3, manager: "Michael McKenna" },
    ],
    blackjack: ["Michael McKenna", "Cav Ferris"],
    cup: "Cav Ferris",
  },
  {
    season: "2023/24",
    draft: [
      { place: 1, manager: "Brett Cooper" },
      { place: 2, manager: "Liam Zajdlic" },
      { place: 3, manager: "Alasdair Hall-Jones" },
    ],
    cup: "Alasdair Hall-Jones",
  },
  {
    season: "2022/23",
    draft: [
      { place: 1, manager: "Cav Ferris" },
      { place: 2, manager: "Phil Thomas" },
      { place: 3, manager: "Liam Zajdlic" },
    ],
  },
  {
    season: "2021/22",
    draft: [
      { place: 1, manager: "Alasdair Hall-Jones" },
      { place: 2, manager: "Max Lambert" },
      { place: 3, manager: "Michael McKenna" },
    ],
  },
  {
    season: "2020/21",
    draft: [
      { place: 1, manager: "Alasdair Hall-Jones" },
      { place: 1, manager: "Matthew Giles" },
      { place: 3, manager: "Marc Edwards" },
    ],
  },
  {
    season: "2019/20",
    draft: [{ place: 1, manager: "Phil Thomas" }],
  },
  {
    season: "2018/19",
    draft: [{ place: 1, manager: "Phil Thomas" }],
  },
  {
    season: "2017/18",
    draft: [{ place: 1, manager: "Phil Thomas" }],
  },
];

export type ManagerTally = {
  manager: string;
  titles: number;
  draftGolds: number;
  blackjackWins: number;
  cupWins: number;
};

// Ranked purely by championships (Draft 1st / Blackjack win / Cup win),
// not podium finishes - "most decorated" should answer "who's actually
// won the most", not "who's finished top 3 the most". A tied Draft 1st
// (2020/21) counts as a full title for each of the tied managers, same
// as a shared Blackjack win - the trophy isn't diluted by being shared.
export function getMostDecorated(): ManagerTally[] {
  const tallies = new Map<string, ManagerTally>();

  function bump(manager: string, key: "draftGolds" | "blackjackWins" | "cupWins") {
    const existing = tallies.get(manager) ?? {
      manager,
      titles: 0,
      draftGolds: 0,
      blackjackWins: 0,
      cupWins: 0,
    };
    existing[key] += 1;
    existing.titles += 1;
    tallies.set(manager, existing);
  }

  for (const season of SEASON_HISTORY) {
    for (const result of season.draft) {
      if (result.place === 1) bump(result.manager, "draftGolds");
    }
    season.blackjack?.forEach((manager) => bump(manager, "blackjackWins"));
    if (season.cup) bump(season.cup, "cupWins");
  }

  return [...tallies.values()].sort((a, b) => b.titles - a.titles);
}
