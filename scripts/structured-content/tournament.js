import {
  isSitePath, toImage, toNumber, toRecord, toRecords, toText, toTextList,
} from './fields.js';
import readStructuredContent from './delivery.js';
import loadPlayers from './player.js';
import SCHEMAS from './schemas.js';

/*
 * Only a tournament name is required. Every other field normalizes to an
 * empty default, and the renderers skip whatever is empty.
 */

function normalizeSchedule(value) {
  const schedule = toRecord(value);
  return {
    startDate: toText(schedule.startDate),
    endDate: toText(schedule.endDate),
    timeZone: toText(schedule.timeZone),
    sessions: toRecords(schedule.sessions)
      .map((session) => ({
        date: toText(session.date),
        round: toText(session.round),
        startTime: toText(session.startTime),
      }))
      .filter(({ date, round }) => date && round),
  };
}

function normalizeVenue(value) {
  const venue = toRecord(value);
  const location = toRecord(venue.location);
  return {
    name: toText(venue.name),
    setting: toText(venue.setting),
    city: toText(location.city),
    country: toText(location.country),
    capacity: toNumber(venue.capacity),
  };
}

function normalizeCompetition(value) {
  const competition = toRecord(value);
  const rules = toRecord(competition.rules);
  return {
    discipline: toText(competition.discipline),
    format: toText(competition.format),
    groupCount: toNumber(competition.groupCount),
    bestOfGames: toNumber(rules.bestOfGames),
    pointsPerGame: toNumber(rules.pointsPerGame),
  };
}

function normalizePrice(amountValue, currencyValue) {
  const amount = toNumber(amountValue);
  return amount === null ? null : { amount, currency: toText(currencyValue).toUpperCase() };
}

/** Only a name is required. Every other seating field is optional. */
function normalizeSeatingArea(area) {
  return {
    name: toText(area.name),
    description: toText(area.description),
    image: toImage(area.image),
    capacity: toNumber(area.capacity),
    priceFrom: normalizePrice(area.priceFrom, area.currency),
    availability: toText(area.availability),
    amenities: toTextList(area.amenities),
  };
}

function normalizeExperience(value) {
  const experience = toRecord(value);
  return {
    description: toText(experience.description),
    seating: toRecords(experience.seating)
      .map(normalizeSeatingArea)
      .filter(({ name }) => name),
  };
}

function normalizeHighlights(value, media) {
  const gallery = new Map(toRecords(toRecord(media).gallery)
    .map((image) => [toText(image.key), toImage(image)]));
  return toRecords(value)
    .map((highlight) => {
      const key = toText(highlight.key);
      return {
        key,
        label: toText(highlight.label),
        title: toText(highlight.title),
        description: toText(highlight.description),
        image: gallery.get(key) ?? null,
      };
    })
    .filter(({ title }) => title);
}

/** @returns {import('./player.js').PlayerEntry[]} Unique, valid entrants */
function normalizeEntrants(value) {
  const paths = new Set();
  return toRecords(value).reduce((entrants, entrant) => {
    const path = toText(entrant.playerPath);
    if (!isSitePath(path) || paths.has(path)) {
      // eslint-disable-next-line no-console
      console.warn(`Skipping tournament entrant "${path}"`);
      return entrants;
    }
    paths.add(path);
    entrants.push({ path, seed: toNumber(entrant.seed), group: toText(entrant.group) });
    return entrants;
  }, []);
}

function normalizeTournament(record, path) {
  const title = toText(record.name);
  if (!title) throw new Error(`Tournament ${path} has no name`);
  return {
    path,
    title,
    year: toNumber(record.year),
    status: toText(record.status),
    summary: toText(record.summary),
    schedule: normalizeSchedule(record.schedule),
    venue: normalizeVenue(record.venue),
    competition: normalizeCompetition(record.competition),
    experience: normalizeExperience(record.experience),
    heroImage: toImage(toRecord(record.media).heroImage),
    highlights: normalizeHighlights(record.highlights, record.media),
    entrants: normalizeEntrants(record.entrants),
  };
}

async function fetchTournament(path) {
  const record = await readStructuredContent(path, SCHEMAS.tournament);
  return normalizeTournament(record, path);
}

/*
 * Several blocks on a page render the same tournament, so each record loads
 * once. A failed load is forgotten, so the next block can retry it.
 */
const loadedTournaments = new Map();
const loadedEntrants = new Map();

function loadOnce(cache, key, load) {
  if (!cache.has(key)) {
    const loading = load();
    loading.catch(() => cache.delete(key));
    cache.set(key, loading);
  }
  return cache.get(key);
}

/**
 * Loads a tournament record without its players, so blocks that only show
 * tournament facts need a single request.
 * @param {string} path Site-relative tournament path, e.g. `/tournaments/monte-carlo-invitational`
 * @returns {Promise<object>} The normalized tournament
 */
export function loadTournament(path) {
  if (!isSitePath(path)) return Promise.reject(new Error(`Invalid tournament path "${path}"`));
  return loadOnce(loadedTournaments, path, () => fetchTournament(path));
}

/**
 * Loads every player a tournament references. A player that fails to load is
 * left out instead of failing the tournament.
 * @param {object} tournament A tournament from {@link loadTournament}
 * @returns {Promise<object[]>} The loaded players
 */
export function loadEntrants(tournament) {
  return loadOnce(loadedEntrants, tournament.path, () => loadPlayers(tournament.entrants));
}
