const LEAGUE_ID = 11903;
const GW_SCORES_SHEET = 'GW_Scores';
const MANAGERS_SHEET = 'Managers';

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

// Keeps the Managers sheet's team_name/manager_name columns in sync with
// the API, matched on entry_id - the only identifier guaranteed to stay
// constant if someone renames their team or themselves mid-season. Never
// adds or removes rows: rival_entry_id has to be set by hand, so a brand
// new entry is left for manual setup, and a sheet row whose entry_id no
// longer appears in the API is left untouched and reported instead.
function syncManagerNames_(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(MANAGERS_SHEET);
  if (!sheet) throw new Error('Sheet "' + MANAGERS_SHEET + '" not found.');

  const apiByEntryId = {};
  data.league_entries.forEach(function (le) {
    apiByEntryId[le.entry_id] = {
      teamName: le.entry_name,
      managerName: (le.player_first_name + ' ' + le.player_last_name).trim()
    };
  });

  const values = sheet.getDataRange().getValues();
  const header = values[0];
  const entryCol = header.indexOf('entry_id');
  const teamCol = header.indexOf('team_name');
  const managerCol = header.indexOf('manager_name');

  let updated = 0;
  const missingFromApi = [];

  for (let i = 1; i < values.length; i++) {
    const entryId = values[i][entryCol];
    const api = apiByEntryId[entryId];
    if (!api) {
      missingFromApi.push(entryId);
      continue;
    }
    let rowChanged = false;
    if (values[i][teamCol] !== api.teamName) {
      sheet.getRange(i + 1, teamCol + 1).setValue(api.teamName);
      rowChanged = true;
    }
    if (values[i][managerCol] !== api.managerName) {
      sheet.getRange(i + 1, managerCol + 1).setValue(api.managerName);
      rowChanged = true;
    }
    if (rowChanged) updated++;
  }

  return { updated: updated, missingFromApi: missingFromApi };
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
// Only writes once that gameweek is finished (locked by FPL) - H2H
// streaks/history built on this sheet shouldn't reflect a result that
// bonus points or defensive contribution points could still flip.
function syncCurrentGameweek() {
  // League details carry both the score-relevant standings and each
  // manager's current team_name/manager_name, so fetch it once up front and
  // sync names regardless of whether a gameweek happens to be live - names
  // can change at any point in the season, not just while scores are moving.
  const data = fetchLeagueDetails_();
  const nameResult = syncManagerNames_(data);

  const game = fetchGameState_();
  const eventNumber = game.current_event;
  if (!eventNumber) {
    throw new Error(
      'No gameweek is currently live yet (next_event: ' + game.next_event + ').' +
      ' Manager names were still synced: ' + nameResult.updated + ' updated.'
    );
  }

  if (!game.current_event_finished) {
    throw new Error(
      'Gameweek ' + eventNumber + ' is still live, not finished yet - skipping score sync' +
      ' until it locks. Manager names were still synced: ' + nameResult.updated + ' updated.'
    );
  }

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
    finished: game.current_event_finished,
    namesUpdated: nameResult.updated,
    namesMissingFromApi: nameResult.missingFromApi
  };
}

function syncNowPrompt() {
  const ui = SpreadsheetApp.getUi();
  try {
    const r = syncCurrentGameweek();
    let msg =
      'Synced GW' + r.eventNumber + ': ' + r.updated + ' updated, ' + r.inserted + ' inserted.' +
      (r.finished ? ' (gameweek finished)' : ' (gameweek still in progress)') +
      '\n\nManager names: ' + r.namesUpdated + ' updated.';
    if (r.namesMissingFromApi.length > 0) {
      msg += '\nNot found in API (left untouched): ' + r.namesMissingFromApi.join(', ');
    }
    ui.alert(msg);
  } catch (e) {
    ui.alert('Error: ' + e.message);
  }
}

function syncManagerNamesPrompt() {
  const ui = SpreadsheetApp.getUi();
  try {
    const data = fetchLeagueDetails_();
    const r = syncManagerNames_(data);
    let msg = 'Manager names: ' + r.updated + ' updated.';
    if (r.missingFromApi.length > 0) {
      msg += '\nNot found in API (left untouched): ' + r.missingFromApi.join(', ');
    }
    ui.alert(msg);
  } catch (e) {
    ui.alert('Error: ' + e.message);
  }
}

function dryRunPrompt() {
  dryRun();
  SpreadsheetApp.getUi().alert('Check Executions (clock icon on the left) for the raw API response.');
}

// One-click setup for the automatic pull — safe to re-run, clears any
// previous trigger for this function first so it never stacks duplicates.
// Runs every 15 minutes rather than once a day: syncCurrentGameweek()
// already refuses to write anything until FPL's own current_event_finished
// flag is true (see its own guard, above), so calling it this often is
// harmless - it just throws-and-skips on every run until the gameweek
// actually locks, then writes on the very next run after that. A daily
// trigger used to mean up to ~24h of lag between FPL locking a gameweek
// and the sheet (and everything downstream of it - H2H, wagers, the
// recap) reflecting it; this bounds that lag to ~15 minutes instead.
function installFrequentSyncTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncCurrentGameweek') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('syncCurrentGameweek')
    .timeBased()
    .everyMinutes(15)
    .create();
  SpreadsheetApp.getUi().alert('Automatic sync installed — will check every 15 minutes and write as soon as FPL locks the gameweek.');
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
    .addItem('Sync manager & team names now', 'syncManagerNamesPrompt')
    .addSeparator()
    .addItem('Install automatic sync (every 15min)', 'installFrequentSyncTrigger')
    .addSeparator()
    .addItem('Enable public read access (for web app)', 'enablePublicReadAccess')
    .addToUi();
}
