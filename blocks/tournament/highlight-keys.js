/** Highlight keys of a tournament record that introduce a page section. */
export const HIGHLIGHT_KEYS = Object.freeze({
  schedule: 'schedule',
  venue: 'venue',
  players: 'players',
});

function findHighlight(tournament, key) {
  return tournament.highlights.find((highlight) => highlight.key === key);
}

/** Returns the label of the highlight that introduces a section, if authored. */
export function highlightLabel(tournament, key) {
  return findHighlight(tournament, key)?.label ?? '';
}

/** Returns the gallery image of the highlight that introduces a section, if authored. */
export function highlightImage(tournament, key) {
  return findHighlight(tournament, key)?.image ?? null;
}
