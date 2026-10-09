import {
  isSitePath, toImage, toNumber, toRecord, toText, toTextList,
} from './fields.js';
import readStructuredContent from './delivery.js';
import SCHEMAS from './schemas.js';

/**
 * @typedef {object} PlayerEntry
 * @property {string} path Site-relative player record path
 * @property {?number} [seed] Overrides the seed of the player record
 * @property {string} [group] Overrides the group of the player record
 */

/** Only a name is required. A tournament entry wins over the record's seed and group. */
function normalizePlayer(record, { path, seed = null, group = '' }) {
  const name = toText(record.name);
  if (!name) throw new Error(`Player ${path} has no name`);
  const playingStyle = toRecord(record.playingStyle);
  const competition = toRecord(record.competition);
  const equipment = toRecord(record.equipment);
  return {
    path,
    name,
    nationality: toText(record.nationality),
    bio: toText(record.bio),
    handedness: toText(record.handedness),
    ranking: toNumber(record.ranking),
    age: toNumber(record.age),
    archetype: toText(playingStyle.styleType),
    grip: toText(playingStyle.grip),
    strengths: toTextList(playingStyle.strengths),
    seed: seed ?? toNumber(competition.seed),
    group: group || toText(competition.group),
    debutYear: toNumber(competition.debutYear),
    equipment: {
      blade: toText(equipment.blade),
      forehandRubber: toText(equipment.forehandRubber),
      backhandRubber: toText(equipment.backhandRubber),
    },
    image: toImage(toRecord(record.media).profileImage),
  };
}

/**
 * Loads and normalizes one player record.
 * @param {PlayerEntry} entry
 */
async function loadPlayer(entry) {
  if (!isSitePath(entry.path)) throw new Error(`Invalid player path "${entry.path}"`);
  const record = await readStructuredContent(entry.path, SCHEMAS.player);
  return normalizePlayer(record, entry);
}

/**
 * Loads player records in order. A player that fails to load is left out.
 * @param {PlayerEntry[]} entries
 * @returns {Promise<object[]>} Normalized players
 */
export default async function loadPlayers(entries) {
  const results = await Promise.allSettled(entries.map(loadPlayer));
  return results.flatMap((result) => {
    if (result.status === 'fulfilled') return [result.value];
    // eslint-disable-next-line no-console
    console.error('Structured player loading failed', result.reason);
    return [];
  });
}
