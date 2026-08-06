import Papa from "papaparse";

export type Manager = {
  entryId: number;
  teamName: string;
  managerName: string;
  rivalEntryId: number;
};

function sheetCsvUrl(sheetName: string) {
  const id = process.env.SHEETS_SPREADSHEET_ID;
  if (!id) throw new Error("SHEETS_SPREADSHEET_ID is not set");
  const params = new URLSearchParams({ tqx: "out:csv", sheet: sheetName });
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?${params}`;
}

export async function getManagers(): Promise<Manager[]> {
  const res = await fetch(sheetCsvUrl("Managers"), {
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Managers sheet: ${res.status}`);
  }
  const csv = await res.text();

  const { data } = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  return data.map((row) => ({
    entryId: Number(row.entry_id),
    teamName: row.team_name,
    managerName: row.manager_name,
    rivalEntryId: Number(row.rival_entry_id),
  }));
}
