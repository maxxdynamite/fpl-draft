import { ImageResponse } from "next/og";
import { getRecapData, type RecapToken } from "@/lib/recap";

export const runtime = "nodejs";

const GREEN = "#00ff85";
const CYAN = "#04f5ff";

function Headline({ tokens }: { tokens: RecapToken[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", fontSize: 27, lineHeight: 1.5, color: "#e4e4e7" }}>
      {tokens.map((t, i) => (
        <span key={i} style={{ color: t.strong ? "#ffffff" : "#e4e4e7", fontWeight: t.strong ? 800 : 400 }}>
          {t.text}
        </span>
      ))}
    </div>
  );
}

export async function GET() {
  const data = await getRecapData();
  const results = data.h2hResults.slice(0, 7);
  const maxGoals = data.blackjackTop[0]?.goals ?? 1;

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
        {/* Header */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: "#7c7c85" }}>
            {data.leagueName}
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
              padding: "8px 20px 10px",
              borderRadius: 999,
            }}
          >
            Final
          </span>
        </div>
        <div style={{ display: "flex", fontSize: 56, fontWeight: 800, letterSpacing: -1, color: "#fff", margin: "6px 0 36px" }}>
          Gameweek {data.gameweek} Recap
        </div>

        {/* Storyline highlight */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderRadius: 28,
            padding: "26px 30px",
            background: "linear-gradient(135deg, rgba(0,255,133,0.14), rgba(4,245,255,0.10))",
            border: `2px solid rgba(0,255,133,0.28)`,
            marginBottom: 34,
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: GREEN, marginBottom: 10 }}>
            Storyline of the week
          </span>
          <Headline tokens={data.headline} />
        </div>

        {/* H2H results */}
        <span style={{ display: "flex", fontSize: 18, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "#6b6b74", marginBottom: 12 }}>
          Head-to-Head
        </span>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {results.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 0",
                borderTop: i === 0 ? "none" : "2px solid rgba(255,255,255,0.06)",
                fontSize: 22,
              }}
            >
              <span style={{ display: "flex", flex: 1, color: "#d4d4d8", fontWeight: 600 }}>{r.winnerName}</span>
              <span style={{ display: "flex", width: 50, justifyContent: "center", fontWeight: 800, fontSize: 26, color: GREEN }}>
                {r.winnerScore}
              </span>
              <span style={{ display: "flex", width: 30, justifyContent: "center", fontSize: 16, color: "#45454d", fontWeight: 700 }}>v</span>
              <span style={{ display: "flex", width: 50, justifyContent: "center", fontWeight: 800, fontSize: 26, color: "#6b6b74" }}>
                {r.loserScore}
              </span>
              <span style={{ display: "flex", flex: 1, justifyContent: "flex-end", color: "#d4d4d8", fontWeight: 600 }}>{r.loserName}</span>
            </div>
          ))}
        </div>

        {/* Blackjack */}
        <span style={{ display: "flex", fontSize: 18, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "#6b6b74", margin: "32px 0 12px" }}>
          Blackjack — Target 21
        </span>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {data.blackjackTop.map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", padding: "8px 0", fontSize: 22 }}>
              <span style={{ display: "flex", width: 30, color: "#52525b", fontWeight: 700, fontSize: 18 }}>{i + 1}</span>
              <span style={{ display: "flex", flex: 1, color: "#d4d4d8", fontWeight: 600 }}>{row.managerName}</span>
              <div style={{ display: "flex", width: 140, height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div
                  style={{
                    display: "flex",
                    width: `${Math.max(8, (row.goals / maxGoals) * 100)}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${GREEN}, ${CYAN})`,
                  }}
                />
              </div>
              <span style={{ display: "flex", width: 40, justifyContent: "flex-end", fontWeight: 800, color: "#fff" }}>{row.goals}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: 28,
            borderTop: "2px solid rgba(255,255,255,0.08)",
          }}
        >
          <span style={{ display: "flex", fontSize: 20, fontWeight: 800 }}>
            <span style={{ color: "#fff" }}>Bad Blokes&nbsp;</span>
            <span style={{ color: GREEN }}>Weekly</span>
          </span>
          <span style={{ display: "flex", fontSize: 16, color: "#52525b" }}>badblokesweekly.vercel.app</span>
        </div>
      </div>
    ),
    { width: 1080, height: 1350 },
  );
}
