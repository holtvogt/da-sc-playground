import { createPhoto } from '../../scripts/ui/components.js';
import { formatNumber, formatPrice, joinParts } from '../../scripts/ui/format.js';
import { createElement } from '../../scripts/utils/dom.js';
import LABELS from './labels.js';

/**
 * Formats a seat count, such as `120 seats`.
 * @param {?number} capacity
 * @returns {string} Empty when the capacity is unknown
 */
export function formatSeats(capacity) {
  return capacity === null ? '' : LABELS.seats(formatNumber(capacity));
}

function createTierHeader({ name, availability }) {
  return createElement('div', {
    className: 'tournament-seating-tier-header',
    children: [
      createElement('h4', { className: 'tournament-seating-tier-name', text: name }),
      availability && createElement('p', { className: 'tournament-seating-availability', text: availability }),
    ].filter(Boolean),
  });
}

function createTierMeta({ capacity, priceFrom }) {
  const meta = joinParts([
    formatSeats(capacity),
    priceFrom && LABELS.priceFrom(formatPrice(priceFrom)),
  ]);
  return meta && createElement('p', { className: 'tournament-seating-meta', text: meta });
}

function createAmenities({ name, amenities }) {
  if (!amenities.length) return null;
  return createElement('ul', {
    className: 'tournament-seating-amenities',
    attributes: { 'aria-label': LABELS.amenitiesOf(name) },
    children: amenities.map((amenity) => createElement('li', { text: amenity })),
  });
}

function createTier(area) {
  const body = createElement('div', {
    className: 'tournament-seating-tier-body',
    children: [
      area.image && createPhoto(area.image),
      createTierHeader(area),
      createTierMeta(area),
      area.description && createElement('p', { className: 'tournament-seating-description', text: area.description }),
      createAmenities(area),
    ].filter(Boolean),
  });
  return createElement('li', { className: 'tournament-seating-tier', children: [body] });
}

/**
 * Renders the seating areas as numbered tiers. Optional fields such as
 * description, image, capacity, price, and availability show only when authored.
 * @param {object[]} seating Normalized seating areas
 * @returns {?HTMLElement}
 */
export default function renderSeating(seating) {
  if (!seating.length) return null;
  return createElement('div', {
    className: 'tournament-seating',
    children: [
      createElement('h3', { className: 'tournament-seating-title', text: LABELS.seating }),
      createElement('ol', { className: 'tournament-seating-tiers', children: seating.map(createTier) }),
    ],
  });
}
