const LEAGUE_ID = 11903;
const GW_SCORES_SHEET = 'GW_Scores';

function fetchGameState_() {
  const res = UrlFetchApp.fetch('https://draft.premierleague.com/api/game');
  return JSON.parse(res.getContentText());
}

function fetchLeagueDetails_() {
  const url = 'https://draft.premierleague.com/api/league/' + LEAGUE_ID + '/details';
  const res = UrlFetchApp.fetch(url);
  return JSON.parse(res.getContentText());
}

// Maps the API's league-internal entry id (league_entries[].id) to the
// global manager entry_id used as the key throughout Managers/GW_Scores.
function buildLeagueEntryToEntryIdMap_(data) {
  const map = {};
  data.league_entries.forEach(function (le) {
    map[le.id] = le.entry_id;
  });
  return map;
}

function dryRun() {
  const game = fetchGameState_();
  Logger.log('game state: ' + JSON.stringify(game, null, 2));
  const data = fetchLeagueDetails_();
  Logger.log('standings: ' + JSON.stringify(data.standings, null, 2));
  Logger.log('league_entries: ' + JSON.stringify(data.league_entries, null, 2));
}

// Pulls whichever gameweek the API says is currently live and upserts its
// rows in GW_Scores (updates existing rows for that gameweek in place,
// inserts new ones for entries not yet present). Safe to run repeatedly
// through a gameweek's spread-out fixtures — never creates duplicates.
function syncCurrentGameweek() {
  const game = fetchGameState_();
  const eventNumber = game.current_event;
  if (!eventNumber) {
    throw new Error('No gameweek is currently live yet (next_event: ' + game.next_event + ').');
  }

  const data = fetchLeagueDetails_();
  if (!data.standings || data.standings.length === 0) {
    throw new Error('API returned no standings for the live gameweek.');
  }
  const entryMap = buildLeagueEntryToEntryIdMap_(data);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(GW_SCORES_SHEET);
  if (!sheet) throw new Error('Sheet "' + GW_SCORES_SHEET + '" not found.');

  const values = sheet.getDataRange().getValues();
  const header = values[0];
  const gwCol = header.indexOf('gameweek');
  const entryCol = header.indexOf('entry_id');

  const existingRowForEntry = {};
  for (let i = 1; i < values.length; i++) {
    if (values[i][gwCol] === eventNumber) {
      existingRowForEntry[values[i][entryCol]] = i + 1; // 1-based sheet row
    }
  }

  let updated = 0;
  let inserted = 0;
  const newRows = [];

  data.standings.forEach(function (s) {
    const entryId = entryMap[s.league_entry];
    const rowValues = [eventNumber, entryId, s.event_total, s.total];
    const existingRow = existingRowForEntry[entryId];
    if (existingRow) {
      sheet.getRange(existingRow, 1, 1, 4).setValues([rowValues]);
      updated++;
    } else {
      newRows.push(rowValues);
      inserted++;
    }
  });

  if (newRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, 4).setValues(newRows);
  }

  return {
    eventNumber: eventNumber,
    updated: updated,
    inserted: inserted,
    finished: game.current_event_finished
  };
}

function syncNowPrompt() {
  const ui = SpreadsheetApp.getUi();
  try {
    const r = syncCurrentGameweek();
    ui.alert(
      'Synced GW' + r.eventNumber + ': ' + r.updated + ' updated, ' + r.inserted + ' inserted.' +
      (r.finished ? ' (gameweek finished)' : ' (gameweek still in progress)')
    );
  } catch (e) {
    ui.alert('Error: ' + e.message);
  }
}

function dryRunPrompt() {
  dryRun();
  SpreadsheetApp.getUi().alert('Check Executions (clock icon on the left) for the raw API response.');
}

// One-click setup for the daily automatic pull — safe to re-run, clears
// any previous trigger for this function first so it never stacks duplicates.
function installDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncCurrentGameweek') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('syncCurrentGameweek')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();
  SpreadsheetApp.getUi().alert('Daily automatic sync installed — will run once a day around 7am.');
}

// Makes the sheet readable via link (view-only) so the web app can pull
// data from it without needing separate credentials. Safe to re-run.
function enablePublicReadAccess() {
  const file = DriveApp.getFileById(SpreadsheetApp.getActiveSpreadsheet().getId());
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const id = SpreadsheetApp.getActiveSpreadsheet().getId();
  const standingsUrl =
    'https://docs.google.com/spreadsheets/d/' + id + '/gviz/tq?tqx=out:csv&sheet=Standings';
  Logger.log('Standings CSV URL: ' + standingsUrl);
  SpreadsheetApp.getUi().alert(
    'Public read access enabled.\n\nStandings CSV URL:\n' + standingsUrl
  );
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('FPL Draft')
    .addItem('Dry run (log raw API data)', 'dryRunPrompt')
    .addItem('Sync current gameweek now', 'syncNowPrompt')
    .addSeparator()
    .addItem('Install daily automatic sync', 'installDailyTrigger')
    .addSeparator()
    .addItem('Enable public read access (for web app)', 'enablePublicReadAccess')
    .addToUi();
}
