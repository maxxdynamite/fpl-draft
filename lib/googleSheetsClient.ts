import { google } from "googleapis";

// The one authenticated (write-capable) path into the spreadsheet -
// everything else in this app reads via the public CSV export. Uses OAuth
// as the user's own account rather than a service account key, since
// Google's org policy on this Cloud project blocks service-account key
// creation by default. The refresh token was obtained once via
// scripts/get-google-refresh-token.mjs and never expires unless revoked.
export function getSheetsClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_OAUTH_REFRESH_TOKEN",
    );
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });

  return google.sheets({ version: "v4", auth });
}

export function getSpreadsheetId(): string {
  const id = process.env.SHEETS_SPREADSHEET_ID;
  if (!id) throw new Error("SHEETS_SPREADSHEET_ID is not set");
  return id;
}
