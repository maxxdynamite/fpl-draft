function sheetCsvUrl(sheetName: string) {
  const id = process.env.SHEETS_SPREADSHEET_ID;
  if (!id) throw new Error("SHEETS_SPREADSHEET_ID is not set");
  const params = new URLSearchParams({ tqx: "out:csv", sheet: sheetName });
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?${params}`;
}

export async function fetchSheetCsv(
  sheetName: string,
  revalidateSeconds: number,
): Promise<string> {
  const res = await fetch(sheetCsvUrl(sheetName), {
    next: { revalidate: revalidateSeconds },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${sheetName} sheet: ${res.status}`);
  }
  return res.text();
}
