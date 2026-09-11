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

window.OFI_LOADER = { fetchMatchEvents };
