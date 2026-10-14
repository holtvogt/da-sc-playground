import {
  isSitePath, toImage, toNumber, toRecord, toText, toTextList,
} from './fields.js';
import readStructuredContent from './delivery.js';
import SCHEMAS from './schemas.js';

/** Only a name is required. Every other field normalizes to an empty default. */
function normalizePlayer(record, path) {
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
    seed: toNumber(competition.seed),
    group: toText(competition.group),
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
 * @param {string} path Site-relative player record path
 */
async function loadPlayer(path) {
  if (!isSitePath(path)) throw new Error(`Invalid player path "${path}"`);
  const record = await readStructuredContent(path, SCHEMAS.player);
  return normalizePlayer(record, path);
}

/**
 * Loads player records in order. A player that fails to load is left out.
 * @param {string[]} paths Site-relative player record paths
 * @returns {Promise<object[]>} Normalized players
 */
export default async function loadPlayers(paths) {
  const results = await Promise.allSettled(paths.map(loadPlayer));
  return results.flatMap((result) => {
    if (result.status === 'fulfilled') return [result.value];
    // eslint-disable-next-line no-console
    console.error('Structured player loading failed', result.reason);
    return [];
  });
}
