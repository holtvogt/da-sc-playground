import { findHighlight, HIGHLIGHT_KEYS } from '../../scripts/structured-content/tournament.js';
import { createFacts, createPhoto } from '../../scripts/ui/components.js';
import { formatLocation } from '../../scripts/ui/format.js';
import { createSectionHeading, renderTournamentSection } from '../../scripts/ui/tournament-block.js';
import LABELS from '../../scripts/ui/tournament-labels.js';
import { createElement } from '../../scripts/utils/dom.js';
import renderSeating, { formatSeats } from './seating.js';

/**
 * Lists the venue facts. Authored content replaces the venue name as title,
 * so the name moves into the facts.
 */
function createVenueFacts(venue, hasAuthoredContent) {
  return createFacts('tournament-venue-facts', [
    [LABELS.venue, hasAuthoredContent ? venue.name : ''],
    [LABELS.location, formatLocation(venue)],
    [LABELS.capacity, formatSeats(venue.capacity)],
  ]);
}

/** Pairs the venue photo with the seating, when both are authored. */
function createVenueBody(photo, seating) {
  const parts = [photo && createPhoto(photo), seating].filter(Boolean);
  if (!parts.length) return null;
  return createElement('div', {
    className: `tournament-venue-body${parts.length > 1 ? ' tournament-venue-body-split' : ''}`,
    children: parts,
  });
}

/**
 * Renders the venue of a tournament with its facts, photo, and seating areas.
 * @param {Element} block The tournament venue block
 */
export default function decorate(block) {
  return renderTournamentSection(block, ({ tournament }, authored) => {
    const { venue, experience } = tournament;
    const facts = createVenueFacts(venue, authored.length > 0);
    const seating = renderSeating(experience.seating);
    if (!venue.name && !facts && !seating) return null;

    const highlight = findHighlight(tournament, HIGHLIGHT_KEYS.venue);
    const heading = createSectionHeading(authored, {
      eyebrow: highlight.label || LABELS.venue,
      title: venue.name || LABELS.venue,
      intro: venue.setting,
    });
    if (facts) heading.append(facts);
    const photo = seating && highlight.image;
    return [heading, createVenueBody(photo, seating)].filter(Boolean);
  });
}
