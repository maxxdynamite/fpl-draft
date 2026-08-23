import { ImageResponse } from "next/og";
import { getRecapData, type RecapBlackjackRow } from "@/lib/recap";

export const runtime = "nodejs";

const GREEN = "#00ff85";
const CYAN = "#04f5ff";

function BlackjackColumn({
  rows,
  startRank,
  maxGoals,
}: {
  rows: RecapBlackjackRow[];
  startRank: number;
  maxGoals: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", padding: "9px 0", fontSize: 20 }}>
          <span style={{ display: "flex", width: 26, color: "#52525b", fontWeight: 700, fontSize: 16 }}>
            {startRank + i}
          </span>
          <span style={{ display: "flex", flex: 1, color: "#d4d4d8", fontWeight: 600, overflow: "hidden" }}>
            {row.managerName}
          </span>
          <div style={{ display: "flex", width: 46, height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginRight: 10 }}>
            <div
              style={{
                display: "flex",
                width: `${Math.max(10, (row.goals / maxGoals) * 100)}%`,
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
  const data = await getRecapData();
  const maxGoals = data.blackjackAll[0]?.goals || 1;
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
        <div style={{ display: "flex", fontSize: 60, fontWeight: 800, letterSpacing: -1, color: "#fff", margin: "8px 0 40px" }}>
          Gameweek {data.gameweek} Recap
        </div>

        {/* H2H results - draft-page left/right order, not winner-first */}
        <span style={{ display: "flex", fontSize: 20, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "#6b6b74", marginBottom: 14 }}>
          Head-to-Head
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
                  padding: "16px 0",
                  borderTop: i === 0 ? "none" : "2px solid rgba(255,255,255,0.06)",
                  fontSize: 26,
                }}
              >
                <span style={{ display: "flex", flex: 1, color: "#d4d4d8", fontWeight: 600 }}>{r.aName}</span>
                <span style={{ display: "flex", width: 56, justifyContent: "center", fontWeight: 800, fontSize: 30, color: aWon ? GREEN : "#6b6b74" }}>
                  {r.aScore}
                </span>
                <span style={{ display: "flex", width: 34, justifyContent: "center", fontSize: 17, color: "#45454d", fontWeight: 700 }}>v</span>
                <span style={{ display: "flex", width: 56, justifyContent: "center", fontWeight: 800, fontSize: 30, color: !aWon ? GREEN : "#6b6b74" }}>
                  {r.bScore}
                </span>
                <span style={{ display: "flex", flex: 1, justifyContent: "flex-end", color: "#d4d4d8", fontWeight: 600 }}>{r.bName}</span>
              </div>
            );
          })}
        </div>

        {/* Blackjack - every manager, split into two columns so all 14
            names fit without shrinking past legibility. */}
        <span style={{ display: "flex", fontSize: 20, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "#6b6b74", margin: "36px 0 14px" }}>
          Blackjack — Target 21
        </span>
        <div style={{ display: "flex", flexDirection: "row", gap: 36 }}>
          <BlackjackColumn rows={colA} startRank={1} maxGoals={maxGoals} />
          <BlackjackColumn rows={colB} startRank={half + 1} maxGoals={maxGoals} />
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
