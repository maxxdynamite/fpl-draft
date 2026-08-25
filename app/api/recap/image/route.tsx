import { ImageResponse } from "next/og";
import { getRecapData, type RecapBlackjackRow } from "@/lib/recap";
import { BLACKJACK_TARGET } from "@/lib/blackjack";

export const runtime = "nodejs";

const GREEN = "#00ff85";
const CYAN = "#04f5ff";

// Without an embedded font, Satori falls back to a generic system sans
// with no real weight distinction beyond one synthetic "bold" - which is
// why bumping fontWeight 800 -> 900 on the FINAL badge didn't visibly
// change anything, there was no heavier face for it to pick. Fetches the
// same Manrope the app itself uses (see app/layout.tsx), two real weight
// files so 600 (names) and 800 (scores/labels/badge) actually look
// different. Cached at module scope, not re-fetched per request - the
// font data never changes.
let fontsPromise: Promise<{ name: string; data: ArrayBuffer; weight: 600 | 800; style: "normal" }[]> | null = null;

async function loadManropeFonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.all(
      ([600, 800] as const).map(async (weight) => {
        // Google serves woff2 to modern browsers and ttf to old ones -
        // ImageResponse only accepts ttf/otf/woff (see next/og docs), so
        // this pretends to be IE11 to get a ttf URL back from the CSS.
        const cssRes = await fetch(
          `https://fonts.googleapis.com/css2?family=Manrope:wght@${weight}`,
          { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko" } },
        );
        const css = await cssRes.text();
        const url = css.match(/src: url\(([^)]+)\)/)?.[1];
        if (!url) throw new Error(`No font URL found for Manrope ${weight}`);
        const data = await fetch(url).then((r) => r.arrayBuffer());
        return { name: "Manrope", data, weight, style: "normal" as const };
      }),
    );
  }
  return fontsPromise;
}

function BlackjackColumn({ rows }: { rows: RecapBlackjackRow[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", padding: "8px 0", fontSize: 21 }}>
          <span style={{ display: "flex", flex: 1, color: "#d4d4d8", fontWeight: 600, overflow: "hidden" }}>
            {row.managerName}
          </span>
          {/* Progress toward the actual target (21), not relative to
              whoever's currently top of this list - the earlier version
              scaled against the current leader's own goal count, which
              showed anyone in the lead as a "full" bar regardless of how
              far from 21 they actually were. Capped at 100% since a bust
              can sit above 21. */}
          <div style={{ display: "flex", width: 50, height: 9, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginRight: 11 }}>
            <div
              style={{
                display: "flex",
                width: `${Math.max(4, Math.min(100, (row.goals / BLACKJACK_TARGET) * 100))}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${GREEN}, ${CYAN})`,
              }}
            />
          </div>
          <span style={{ display: "flex", width: 26, justifyContent: "flex-end", fontWeight: 800, color: "#fff" }}>
            {row.goals}
          </span>
        </div>
      ))}
    </div>
  );
}

export async function GET() {
  const [data, fonts] = await Promise.all([getRecapData(), loadManropeFonts()]);
  // Same as the page this image is embedded in - null means no gameweek
  // has synced yet, not an error. The page never renders the <img> tag
  // in that case, so this is only ever hit directly/pre-first-sync.
  if (!data) {
    return new Response("No gameweek has finished and synced yet.", { status: 404 });
  }
  const half = Math.ceil(data.blackjackAll.length / 2);
  const colA = data.blackjackAll.slice(0, half);
  const colB = data.blackjackAll.slice(half);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#050505",
          padding: "40px 46px",
          fontFamily: "Manrope",
        }}
      >
        {/* Title takes the very top spot now - the league name moved down
            into the H2H section label instead of getting its own header
            row. Sized as a clear headline, not the loudest thing on the
            card - the H2H scores below are the actual content people are
            here for, so the title shouldn't out-compete them. */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ display: "flex", fontSize: 40, fontWeight: 800, letterSpacing: -1, color: "#fff" }}>
            Gameweek {data.gameweek} Recap
          </span>
          <span
            style={{
              display: "flex",
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#050505",
              background: `linear-gradient(90deg, ${GREEN}, ${CYAN})`,
              padding: "8px 20px 9px",
              borderRadius: 999,
              flexShrink: 0,
            }}
          >
            Final
          </span>
        </div>

        {/* H2H results - draft-page left/right order, not winner-first */}
        <span style={{ display: "flex", fontSize: 19, fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: "#6b6b74", margin: "22px 0 12px" }}>
          {data.leagueName} — H2H
        </span>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {data.h2hResults.map((r, i) => {
            // Independent comparisons, not aWon/!aWon - a draw needs both
            // sides faded, not one full-bright by default (see
            // components/H2hTile.tsx's own fix for the same bug).
            const aWon = r.aScore > r.bScore;
            const bWon = r.bScore > r.aScore;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "11px 0",
                  borderTop: i === 0 ? "none" : "2px solid rgba(255,255,255,0.06)",
                  fontSize: 26,
                }}
              >
                <span style={{ display: "flex", flex: 1, color: "#d4d4d8", fontWeight: 600 }}>{r.aName}</span>
                <span style={{ display: "flex", width: 56, justifyContent: "center", fontWeight: 800, fontSize: 30, color: aWon ? "#fff" : "#6b6b74" }}>
                  {r.aScore}
                </span>
                <span style={{ display: "flex", width: 30, justifyContent: "center", fontSize: 15, color: "#45454d", fontWeight: 700 }}>v</span>
                <span style={{ display: "flex", width: 56, justifyContent: "center", fontWeight: 800, fontSize: 30, color: bWon ? "#fff" : "#6b6b74" }}>
                  {r.bScore}
                </span>
                <span style={{ display: "flex", flex: 1, justifyContent: "flex-end", color: "#d4d4d8", fontWeight: 600 }}>{r.bName}</span>
              </div>
            );
          })}
        </div>

        {/* Blackjack - every manager, split into two columns so all 14
            names fit without shrinking past legibility. */}
        <span style={{ display: "flex", fontSize: 19, fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: "#6b6b74", margin: "22px 0 12px" }}>
          Blackjack — Target 21
        </span>
        <div style={{ display: "flex", flexDirection: "row", gap: 40 }}>
          <BlackjackColumn rows={colA} />
          <BlackjackColumn rows={colB} />
        </div>

        {/* Footer - a fixed marginTop, not "auto": Satori pushes an
            auto-margin flex child hard against the container's edge, past
            the container's own bottom padding, which clipped this right
            off the canvas instead of leaving it visible above the edge. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 14,
            paddingTop: 16,
            borderTop: "2px solid rgba(255,255,255,0.08)",
          }}
        >
          <span style={{ display: "flex", fontSize: 18, fontWeight: 800 }}>
            <span style={{ display: "flex", color: "#fff" }}>Bad Blokes&nbsp;</span>
            <span style={{ display: "flex", color: GREEN }}>Weekly</span>
          </span>
          <span style={{ display: "flex", fontSize: 14, fontWeight: 600, color: "#52525b" }}>badblokesweekly.vercel.app</span>
        </div>
      </div>
    ),
    // Measured, not guessed: content (title through footer) ends at row
    // 1038 at this sizing (checked by rendering at a deliberately
    // oversized canvas and finding the last non-background pixel row),
    // leaving ~42px of bottom breathing room to match the 40px top
    // padding. A canvas shorter than the real content also silently
    // clips whatever doesn't fit instead of erring, which is exactly
    // what ate the footer entirely the first time this was guessed
    // instead of measured. True 1:1 square (1080x1080), not just close -
    // WhatsApp's chat thumbnail essentially never crops a square image,
    // unlike any portrait ratio (even 4:5, the previous size here),
    // which still risks some cropping depending on the client.
    { width: 1080, height: 1080, fonts },
  );
}
