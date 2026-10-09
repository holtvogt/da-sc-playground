import { toRecordPath } from '../../scripts/structured-content/fields.js';
import loadPlayers from '../../scripts/structured-content/player.js';
import { createAlert } from '../../scripts/ui/components.js';
import renderPlayerRoster from '../../scripts/ui/player-card.js';

const LABELS = Object.freeze({
  loadError: 'The players could not be loaded. Please try again later.',
});

/** The `record` variant renders a record on its own page, so the player name is the page title. */
const RECORD_VARIANT = 'record';

function readRecordPaths(block) {
  const paths = [...block.querySelectorAll('a[href]')].map((link) => toRecordPath(link.href));
  return [...new Set(paths)];
}

/**
 * Renders `table-tennis-player` structured content records as player cards.
 * Each link in the block points to one player record, in display order.
 * @param {Element} block The player block element
 */
export default async function decorate(block) {
  block.classList.add('ui-reset');
  const paths = readRecordPaths(block);
  if (!paths.length) {
    block.replaceChildren();
    return;
  }

  const players = await loadPlayers(paths.map((path) => ({ path })));
  const headingLevel = block.classList.contains(RECORD_VARIANT) ? 1 : 3;
  const content = players.length
    ? renderPlayerRoster(players, { headingLevel })
    : createAlert(LABELS.loadError);
  block.replaceChildren(content);
}
