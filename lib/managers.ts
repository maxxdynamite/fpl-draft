import Papa from "papaparse";
import { fetchSheetCsv } from "./sheets";

export type Manager = {
  entryId: number;
  teamName: string;
  managerName: string;
  rivalEntryId: number;
};

export async function getManagers(): Promise<Manager[]> {
  const csv = await fetchSheetCsv("Managers", 300);

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
