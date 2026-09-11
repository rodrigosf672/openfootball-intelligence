/*
 * Client-side StatsBomb open-data loader. Fetches the raw event JSON directly
 * from GitHub (CORS-enabled: access-control-allow-origin: *) so any public
 * StatsBomb open-data match_id can be analyzed with zero server involvement.
 * See https://github.com/statsbomb/open-data for available match ids.
 */
const STATSBOMB_EVENTS_URL = (matchId) =>
  `https://raw.githubusercontent.com/statsbomb/open-data/master/data/events/${matchId}.json`;

const STATSBOMB_MATCHES_URL = (competitionId, seasonId) =>
  `https://raw.githubusercontent.com/statsbomb/open-data/master/data/matches/${competitionId}/${seasonId}.json`;

const STATSBOMB_COMPETITIONS_URL =
  "https://raw.githubusercontent.com/statsbomb/open-data/master/data/competitions.json";

async function fetchMatchEvents(matchId) {
  const res = await fetch(STATSBOMB_EVENTS_URL(matchId));
  if (!res.ok) {
    throw new Error(`StatsBomb open-data has no match_id ${matchId} (HTTP ${res.status})`);
  }
  const raw = await res.json();
  let events = window.OFI.flattenEvents(raw);
  events = events.filter((e) => e.period != null && e.period <= 4); // drop shootout, mirrors ofi.load_match(drop_shootout=True)
  return events;
}

let competitionsCache = null;

async function fetchCompetitions() {
  if (competitionsCache) return competitionsCache;
  const res = await fetch(STATSBOMB_COMPETITIONS_URL);
  if (!res.ok) throw new Error(`Could not load competition list (HTTP ${res.status})`);
  const data = await res.json();
  // De-dupe + sort: competition name, then season descending (most recent first)
  data.sort((a, b) => {
    if (a.competition_name !== b.competition_name) return a.competition_name.localeCompare(b.competition_name);
    return b.season_name.localeCompare(a.season_name);
  });
  competitionsCache = data;
  return data;
}

const matchesCache = new Map();

async function fetchMatches(competitionId, seasonId) {
  const key = `${competitionId}/${seasonId}`;
  if (matchesCache.has(key)) return matchesCache.get(key);
  const res = await fetch(STATSBOMB_MATCHES_URL(competitionId, seasonId));
  if (!res.ok) throw new Error(`Could not load matches for competition ${competitionId}/${seasonId} (HTTP ${res.status})`);
  const data = await res.json();
  data.sort((a, b) => (a.match_date || "").localeCompare(b.match_date || ""));
  matchesCache.set(key, data);
  return data;
}

window.OFI_LOADER = { fetchMatchEvents, fetchCompetitions, fetchMatches };
