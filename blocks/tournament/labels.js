/*
 * Interface copy for the tournament blocks. Editorial copy, such as section
 * headings and calls to action, is authored on the page. Tournament facts come
 * from structured content. Only field labels and fallbacks live here.
 */
const LABELS = Object.freeze({
  loadError: 'The tournament could not be loaded. Please try again later.',
  edition: (year, status) => (year || status
    ? [year, status, 'edition'].filter(Boolean).join(' ') : ''),

  overview: 'Tournament',
  schedule: 'Schedule',
  contenders: 'Contenders',
  contendersTitle: 'Meet the contenders.',
  venue: 'Venue',
  seating: 'Seating',

  dates: 'Dates',
  discipline: 'Discipline',
  format: 'Format',
  groups: 'Groups',
  matches: 'Matches',
  groupSummary: (groupCount, perGroup) => (perGroup
    ? `${groupCount} groups of ${perGroup}` : `${groupCount} groups`),
  matchSummary: (games, points) => `Best of ${games} games to ${points}`,
  group: (name) => `Group ${name}`,
  playerCount: (count) => `${count} ${count === 1 ? 'player' : 'players'}`,

  location: 'Location',
  capacity: 'Capacity',
  seats: (capacity) => `${capacity} seats`,
  amenitiesOf: (name) => `${name} amenities`,
  priceFrom: (price) => `From ${price}`,
});

export default LABELS;
