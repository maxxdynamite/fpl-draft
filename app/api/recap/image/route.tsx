import { ImageResponse } from "next/og";
import { getRecapData, type RecapBlackjackRow } from "@/lib/recap";
import { BLACKJACK_TARGET } from "@/lib/blackjack";

export const runtime = "nodejs";

const GREEN = "#00ff85";
const CYAN = "#04f5ff";

function BlackjackColumn({ rows }: { rows: RecapBlackjackRow[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", padding: "13px 0", fontSize: 24 }}>
          <span style={{ display: "flex", flex: 1, color: "#d4d4d8", fontWeight: 600, overflow: "hidden" }}>
            {row.managerName}
          </span>
          {/* Progress toward the actual target (21), not relative to
              whoever's currently top of this list - the earlier version
              scaled against the current leader's own goal count, which
              showed anyone in the lead as a "full" bar regardless of how
              far from 21 they actually were. Capped at 100% since a bust
              can sit above 21. */}
          <div style={{ display: "flex", width: 56, height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginRight: 12 }}>
            <div
              style={{
                display: "flex",
                width: `${Math.max(4, Math.min(100, (row.goals / BLACKJACK_TARGET) * 100))}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${GREEN}, ${CYAN})`,
              }}
            />
          </div>
          <span style={{ display: "flex", width: 30, justifyContent: "flex-end", fontWeight: 800, color: "#fff" }}>
            {row.goals}
          </span>
        </div>
      ))}
    </div>
  );
}

export async function GET() {
  const data = await getRecapData();
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
          padding: "56px 48px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Title takes the very top spot now - the league name moved down
            into the H2H section label instead of getting its own header
            row. Sized as a clear headline, not the loudest thing on the
            card - the H2H scores below are the actual content people are
            here for, so the title shouldn't out-compete them. */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ display: "flex", fontSize: 48, fontWeight: 800, letterSpacing: -1, color: "#fff" }}>
            Gameweek {data.gameweek} Recap
          </span>
          <span
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 900,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#050505",
              background: `linear-gradient(90deg, ${GREEN}, ${CYAN})`,
              padding: "10px 26px 12px",
              borderRadius: 999,
              flexShrink: 0,
            }}
          >
            Final
          </span>
        </div>

        {/* H2H results - draft-page left/right order, not winner-first */}
        <span style={{ display: "flex", fontSize: 22, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "#6b6b74", margin: "40px 0 28px" }}>
          {data.leagueName} — H2H
        </span>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {data.h2hResults.map((r, i) => {
            const aWon = r.aScore >= r.bScore;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "22px 0",
                  borderTop: i === 0 ? "none" : "2px solid rgba(255,255,255,0.06)",
                  fontSize: 32,
                }}
              >
                <span style={{ display: "flex", flex: 1, color: "#d4d4d8", fontWeight: 600 }}>{r.aName}</span>
                <span style={{ display: "flex", width: 66, justifyContent: "center", fontWeight: 800, fontSize: 37, color: aWon ? "#fff" : "#6b6b74" }}>
                  {r.aScore}
                </span>
                <span style={{ display: "flex", width: 38, justifyContent: "center", fontSize: 19, color: "#45454d", fontWeight: 700 }}>v</span>
                <span style={{ display: "flex", width: 66, justifyContent: "center", fontWeight: 800, fontSize: 37, color: !aWon ? "#fff" : "#6b6b74" }}>
                  {r.bScore}
                </span>
                <span style={{ display: "flex", flex: 1, justifyContent: "flex-end", color: "#d4d4d8", fontWeight: 600 }}>{r.bName}</span>
              </div>
            );
          })}
        </div>

        {/* Blackjack - every manager, split into two columns so all 14
            names fit without shrinking past legibility. */}
        <span style={{ display: "flex", fontSize: 22, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "#6b6b74", margin: "40px 0 28px" }}>
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
            marginTop: 40,
            paddingTop: 28,
            borderTop: "2px solid rgba(255,255,255,0.08)",
          }}
        >
          <span style={{ display: "flex", fontSize: 20, fontWeight: 800 }}>
            <span style={{ display: "flex", color: "#fff" }}>Bad Blokes&nbsp;</span>
            <span style={{ display: "flex", color: GREEN }}>Weekly</span>
          </span>
          <span style={{ display: "flex", fontSize: 16, color: "#52525b" }}>badblokesweekly.vercel.app</span>
        </div>
      </div>
    ),
    // Measured, not guessed: content (title through footer) actually
    // needs ~1477px at this sizing, plus the same 56px the top padding
    // uses so the footer isn't flush against the bottom edge. A canvas
    // taller than the content also silently drops whatever doesn't fit -
    // Satori clips overflow rather than growing the container or erroring,
    // which is exactly what ate the footer entirely at the old 1350
    // height with no warning anywhere.
    { width: 1080, height: 1533 },
  );
}
