import { createFacts } from '../../scripts/ui/components.js';
import { formatDateRange, formatLocation } from '../../scripts/ui/format.js';
import { renderTournamentBlock } from '../../scripts/ui/tournament-block.js';
import LABELS from '../../scripts/ui/tournament-labels.js';

/**
 * Renders the key facts of a tournament as a compact strip, such as in the footer.
 * Copy authored in the block stays in front of the facts.
 * @param {Element} block The tournament facts block
 */
export default function decorate(block) {
  return renderTournamentBlock(block, ({ tournament }, authored) => {
    const { schedule, venue } = tournament;
    const facts = createFacts('tournament-facts-list', [
      [LABELS.dates, formatDateRange(schedule.startDate, schedule.endDate)],
      [LABELS.location, formatLocation(venue)],
      [LABELS.venue, venue.name],
    ]);
    return facts && [...authored, facts];
  });
}
