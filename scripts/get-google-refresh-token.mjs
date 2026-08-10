// One-time setup script: authorizes this app to write to your Google
// Sheet as your own account (works around the org policy blocking
// service-account key creation) and saves the resulting refresh token
// into .env.local. Run with:
//   node --env-file=.env.local scripts/get-google-refresh-token.mjs
// Never prints the refresh token - it's written straight to the file.

import http from "node:http";
import fs from "node:fs";
import { exec } from "node:child_process";

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const PORT = 8080;
const REDIRECT_URI = `http://localhost:${PORT}`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Missing GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET in .env.local",
  );
  process.exit(1);
}

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", CLIENT_ID);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set(
  "scope",
  "https://www.googleapis.com/auth/spreadsheets",
);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get("code");
  if (!code) {
    res.end("No code received. You can close this tab and check the terminal.");
    return;
  }

  res.end("Success! You can close this tab and go back to the terminal.");
  server.close();

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = await tokenRes.json();

  if (!tokenData.refresh_token) {
    console.error("No refresh_token in response:", JSON.stringify(tokenData));
    process.exit(1);
  }

  fs.appendFileSync(
    ".env.local",
    `GOOGLE_OAUTH_REFRESH_TOKEN=${tokenData.refresh_token}\n`,
  );
  console.log(
    "Done. GOOGLE_OAUTH_REFRESH_TOKEN saved to .env.local (not printed here).",
  );
  process.exit(0);
});

server.listen(PORT, () => {
  console.log("Opening your browser to log in and approve access...");
  console.log(
    "If it doesn't open automatically, visit this URL:\n" + authUrl.toString(),
  );
  const opener =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";
  exec(`${opener} "${authUrl.toString()}"`);
});
