import { findHighlight, HIGHLIGHT_KEYS } from '../../scripts/structured-content/tournament.js';
import { createFacts, createPhoto } from '../../scripts/ui/components.js';
import { formatLocation } from '../../scripts/ui/format.js';
import {
  createSectionHeading, hasAuthoredHeading, renderTournamentSection,
} from '../../scripts/ui/tournament-block.js';
import LABELS from '../../scripts/ui/tournament-labels.js';
import { createElement } from '../../scripts/utils/dom.js';
import renderSeating, { formatSeats } from './seating.js';

/** Labels authors may override. */
const VENUE_LABELS = Object.freeze({
  venue: LABELS.venue,
  location: LABELS.location,
  capacity: LABELS.capacity,
  seating: LABELS.seating,
});

/**
 * Lists the venue facts. An authored heading replaces the venue name as title,
 * so the name moves into the facts.
 */
function createVenueFacts(venue, hasAuthoredTitle, labels) {
  return createFacts('tournament-venue-facts', [
    [labels.place('venue'), hasAuthoredTitle ? venue.name : ''],
    [labels.place('location'), formatLocation(venue)],
    [labels.place('capacity'), formatSeats(venue.capacity)],
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
  return renderTournamentSection(block, ({ tournament }, authored, labels) => {
    const { venue, experience } = tournament;
    const facts = createVenueFacts(venue, hasAuthoredHeading(authored), labels);
    const seating = renderSeating(experience.seating, labels.place('seating'));
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
  }, { labels: VENUE_LABELS });
}
