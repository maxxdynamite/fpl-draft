import { NextResponse } from "next/server";
import { getSheetsClient, getSpreadsheetId } from "@/lib/googleSheetsClient";
import { getManagers } from "@/lib/managers";
import { getPlayersData } from "@/lib/players";
import { isPickingWindowOpen } from "@/lib/pickingWindow";

const SHEET_NAME = "BlackjackPicks";
const REQUIRED_PICKS = 4;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const entryId = Number(body.entryId);
    const playerIds: number[] = Array.isArray(body.playerIds)
      ? body.playerIds.map(Number)
      : [];
    const uniqueIds = new Set(playerIds);

    if (
      !entryId ||
      playerIds.length !== REQUIRED_PICKS ||
      uniqueIds.size !== REQUIRED_PICKS
    ) {
      return NextResponse.json(
        { error: `Pick exactly ${REQUIRED_PICKS} different players.` },
        { status: 400 },
      );
    }

    const [managers, { players, seasonStartTime }] = await Promise.all([
      getManagers(),
      getPlayersData(),
    ]);

    if (!managers.some((m) => m.entryId === entryId)) {
      return NextResponse.json(
        { error: "Unrecognised participant." },
        { status: 400 },
      );
    }
    const validPlayerIds = new Set(players.map((p) => p.id));
    if (!playerIds.every((id) => validPlayerIds.has(id))) {
      return NextResponse.json(
        { error: "One or more players weren't recognised." },
        { status: 400 },
      );
    }

    if (!isPickingWindowOpen(seasonStartTime)) {
      return NextResponse.json(
        {
          error:
            "Picks are locked right now. They reopen during the January transfer window.",
        },
        { status: 403 },
      );
    }

    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();

    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A:F`,
    });
    const rows = existing.data.values ?? [];
    const rowIndex = rows.findIndex(
      (row, i) => i > 0 && Number(row[0]) === entryId,
    );

    const updatedAt = new Date().toISOString();
    const rowValues = [entryId, ...playerIds, updatedAt];

    if (rowIndex === -1) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${SHEET_NAME}!A:F`,
        valueInputOption: "RAW",
        requestBody: { values: [rowValues] },
      });
    } else {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!A${rowIndex + 1}:F${rowIndex + 1}`,
        valueInputOption: "RAW",
        requestBody: { values: [rowValues] },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to save Blackjack picks:", err);
    return NextResponse.json(
      { error: "Something went wrong saving your picks. Try again." },
      { status: 500 },
    );
  }
}
