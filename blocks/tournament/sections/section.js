import { createEyebrow } from '../../../scripts/ui/components.js';
import { createElement } from '../../../scripts/utils/dom.js';

/**
 * @typedef {object} RenderedSection
 * @property {string} key Stable section key, such as `players`
 * @property {string} id Anchor id, also used for navigation
 * @property {string} label Navigation label
 * @property {HTMLElement} element
 */

/** Section keys. Highlights reference them to introduce a section. */
export const SECTION_KEYS = Object.freeze({
  overview: 'overview',
  schedule: 'schedule',
  venue: 'venue',
  players: 'players',
});

/**
 * Creates a titled page section. Its anchor id is prefixed so it cannot clash
 * with ids that Edge Delivery generates for authored headings.
 * @param {object} options
 * @param {string} options.key Section key, used to derive the anchor id
 * @param {string} options.navLabel Label of the section in page navigation
 * @param {string} [options.eyebrow] Small label above the title
 * @param {string} options.title
 * @param {string} [options.intro]
 * @param {'light'|'dark'} [options.tone]
 * @returns {{section: HTMLElement, heading: HTMLElement, rendered: RenderedSection}}
 */
export function createSection({
  key, navLabel, eyebrow, title, intro, tone = 'light',
}) {
  const id = `tournament-${key}`;
  const titleId = `${id}-title`;
  const heading = createElement('div', {
    className: 'tournament-section-heading',
    children: [
      eyebrow && createEyebrow(eyebrow),
      createElement('h2', { className: 'tournament-section-title', text: title, attributes: { id: titleId } }),
      intro && createElement('p', { className: 'tournament-section-intro', text: intro }),
    ].filter(Boolean),
  });
  const section = createElement('section', {
    className: `tournament-section tournament-section-${tone}`,
    attributes: { id, 'aria-labelledby': titleId },
    children: [heading],
  });
  return {
    section,
    heading,
    rendered: {
      key, id, label: navLabel, element: section,
    },
  };
}

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
