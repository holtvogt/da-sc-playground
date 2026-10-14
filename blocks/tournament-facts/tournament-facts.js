import { createFacts } from '../../scripts/ui/components.js';
import { formatDateRange, formatLocation } from '../../scripts/ui/format.js';
import { renderTournamentBlock } from '../../scripts/ui/tournament-block.js';
import LABELS from '../../scripts/ui/tournament-labels.js';

/** Labels authors may override. */
const FACTS_LABELS = Object.freeze({
  dates: LABELS.dates,
  location: LABELS.location,
  venue: LABELS.venue,
});

/**
 * Renders the key facts of a tournament as a compact strip, such as in the footer.
 * Copy authored in the block stays in front of the facts.
 * @param {Element} block The tournament facts block
 */
export default function decorate(block) {
  return renderTournamentBlock(block, ({ tournament }, authored, labels) => {
    const { schedule, venue } = tournament;
    const facts = createFacts('tournament-facts-list', [
      [labels.place('dates'), formatDateRange(schedule.startDate, schedule.endDate)],
      [labels.place('location'), formatLocation(venue)],
      [labels.place('venue'), venue.name],
    ]);
    return facts && [...authored, facts];
  }, { labels: FACTS_LABELS });
}
