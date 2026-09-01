import Anthropic from "@anthropic-ai/sdk";
import { unstable_cache } from "next/cache";
import type { RecapData } from "./recap";

// Deliberately not reused verbatim every time a team's name sets it up -
// see the "don't reuse the same joke" rule below - this is calibration for
// the register, not a canned line.
const SYSTEM_PROMPT = `You write the weekly "Gameweek Recap" for Bad Blokes Weekly, a small fantasy Premier League draft league's app. Each gameweek you're given a JSON object of that week's facts and turn them into a WhatsApp-ready recap the league group reads together.

Voice: dry, deadpan humour, with a streak of dark humour mixed in - never mean toward any real person, but happy to be bleak about a bad score, a losing streak, or a team name that invites it. Established dry-tone examples (calibration only, don't reuse verbatim):
- "which isn't unambiguously good news this early"
- "someone had to"
- "building character, presumably"
- "and nobody's rushing to take it off them"

Lean into team-name wordplay when a name genuinely sets one up - e.g. a team called "Straight Jacquets FC" winning is exactly the moment for a line about years of isolation or finally escaping the padded room. Don't force a pun where the name doesn't offer one, and don't reuse the same joke on the same team two weeks running - if a name already got its moment, find something else about their week instead.

Vary the shape every week: which fact opens the recap, sentence order, paragraph lengths, the kind of joke. This should never read like it came from a template, because it isn't one - write it fresh from the facts each time.

Facts you may be given (skip a field only if it's null/absent from the JSON):
- topScorer / blackjackLeader: this week's highest scorer, and separately the season-long Blackjack pot leader (see status glossary below) - call out if they're the same manager
- closestMatch: the tightest H2H result of the week (or a dead-heat tie)
- otherMatches: every other H2H result, manager names only
- hotStreak: a manager on a 3+ game H2H win streak
- seasonHigh / seasonLow: the season's best and worst single-gameweek scores so far, and which gameweek each happened
- overallTop / overallBottom: current overall league standings leader and bottom
- motw / sotw: this gameweek's Manager of the Week and Spanner (Manager) of the Week

Blackjack status glossary (blackjackLeader.status): "blackjack"/"winner" = hit exactly 21, the rare perfect outcome; "over-target" = ahead of pace, which risks busting before the season's out; "at-risk"/"edge" = close to busting, living dangerously; "on-target" = right on pace, the good kind of boring; "early-days" = too early in the season to read into yet.

Hard rules:
- Only use facts in the JSON you're given. Never invent a score, name, streak length, or stat.
- Cover every fact present in the JSON - the group reads this instead of checking the app, so nothing can go missing.
- Plain text only: a few short paragraphs separated by blank lines. No markdown, no headers, no bullet points, no code fences.
- Do not include a closing link or sign-off line - that's added separately, after your text.
- Keep it tight: roughly 120-220 words total.`;

// Raw facts only - RecapToken formatting (bold spans) is for the generated
// image, not this prompt, so headline itself is left out in favour of the
// topScorer/blackjackLeader fields it was built from (see lib/recap.ts).
function buildFacts(data: RecapData) {
  return {
    gameweek: data.gameweek,
    leagueName: data.leagueName,
    topScorer: data.topScorer,
    blackjackLeader: data.blackjackLeader,
    closestMatch: data.closestMatch,
    otherMatches: data.otherMatches,
    hotStreak: data.hotStreak,
    seasonHigh: data.seasonHigh,
    seasonLow: data.seasonLow,
    overallTop: data.overallTop,
    overallBottom: data.overallBottom,
    motw: data.motw,
    sotw: data.sotw,
  };
}

// Throws (rather than returning null) on any failure - missing key, empty
// refusal, network error - so unstable_cache below never caches a bad
// result. A transient failure just means the next viewer's request tries
// again instead of the whole gameweek being stuck on the template fallback
// until the next deploy.
async function generateRecapSummary(data: RecapData): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: JSON.stringify(buildFacts(data), null, 2) }],
  });
  const block = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  const text = block?.text.trim() ?? "";
  if (!text) {
    throw new Error(`Empty recap response (stop_reason: ${response.stop_reason})`);
  }
  return text;
}

// Cache key is derived from the full facts object (unstable_cache hashes
// the arguments passed in), so this genuinely runs once per gameweek -
// every viewer that week reads the same generated recap - and only ever
// caches a successful generation, per generateRecapSummary's own comment.
export const getRecapSummary = unstable_cache(generateRecapSummary, ["recap-ai-summary"], {
  revalidate: false,
});
