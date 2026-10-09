import { createElement } from '../utils/dom.js';

/*
 * Shares the rendered tournament with page chrome (header and footer).
 * The tournament block settles the page once, either with a summary or with
 * null when the structured content could not be loaded.
 */

let settle;
const tournamentPage = new Promise((resolve) => {
  settle = resolve;
});

/**
 * @typedef {object} TournamentPageSummary
 * @property {string} title Tournament name
 * @property {string} dates Formatted date range
 * @property {string} location Formatted city and country
 * @property {Array<{id: string, label: string}>} sections Rendered page sections
 */

/**
 * @returns {boolean} Whether the current page renders a tournament block
 */
export function isTournamentPage() {
  return Boolean(document.querySelector('main [data-block-name="tournament"]'));
}

/**
 * @returns {Promise<TournamentPageSummary|null>}
 */
export function whenTournamentPage() {
  return tournamentPage;
}

/**
 * @param {TournamentPageSummary|null} summary
 */
export function settleTournamentPage(summary) {
  settle(summary);
}

/**
 * Creates list items that link to the rendered tournament sections.
 * @param {TournamentPageSummary['sections']} sections
 * @returns {HTMLLIElement[]}
 */
export function createSectionLinks(sections) {
  return sections.map(({ id, label }) => createElement('li', {
    children: [createElement('a', { text: label, attributes: { href: `#${id}` } })],
  }));
}
