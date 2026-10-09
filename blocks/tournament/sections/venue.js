import { createFacts, createPhoto } from '../../../scripts/ui/components.js';
import { formatLocation } from '../../../scripts/ui/format.js';
import { createElement } from '../../../scripts/utils/dom.js';
import LABELS from '../labels.js';
import renderSeating, { formatSeats } from './seating.js';
import {
  createSection, highlightImage, highlightLabel, SECTION_KEYS,
} from './section.js';

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
 * Renders the venue with its facts, photo, and seating areas.
 * @returns {?import('./section.js').RenderedSection}
 */
export default function renderVenue(tournament) {
  const { venue, experience } = tournament;
  const facts = createFacts('tournament-venue-facts', [
    [LABELS.location, formatLocation(venue)],
    [LABELS.capacity, formatSeats(venue.capacity)],
  ]);
  const seating = renderSeating(experience.seating);
  if (!venue.name && !facts && !seating) return null;

  const { section, heading, rendered } = createSection({
    key: SECTION_KEYS.venue,
    navLabel: LABELS.venue,
    eyebrow: highlightLabel(tournament, SECTION_KEYS.venue) || LABELS.venue,
    title: venue.name || LABELS.venue,
    intro: venue.setting,
  });
  if (facts) heading.append(facts);
  const body = createVenueBody(seating && highlightImage(tournament, SECTION_KEYS.venue), seating);
  if (body) section.append(body);
  return rendered;
}
