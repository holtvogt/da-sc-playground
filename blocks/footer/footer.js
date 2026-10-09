import { getMetadata } from '../../scripts/aem.js';
import { createElement } from '../../scripts/utils/dom.js';
import {
  createSectionLinks,
  isTournamentPage,
  whenTournamentPage,
} from '../../scripts/page/tournament-page.js';
import { loadFragment } from '../fragment/fragment.js';

const LABELS = Object.freeze({
  dates: 'Dates',
  location: 'Location',
  explore: 'Explore',
  navigation: 'Footer',
});

function createIdentity({ title, dates, location }) {
  const details = [[LABELS.dates, dates], [LABELS.location, location]]
    .filter(([, value]) => value)
    .map(([label, value]) => createElement('div', {
      children: [createElement('dt', { text: label }), createElement('dd', { text: value })],
    }));
  return createElement('div', {
    className: 'footer-tournament-identity',
    children: [
      createElement('h3', { text: title }),
      details.length > 0 && createElement('dl', { children: details }),
    ].filter(Boolean),
  });
}

function createNavigation(sections) {
  return createElement('nav', {
    className: 'footer-tournament-navigation',
    attributes: { 'aria-label': LABELS.navigation },
    children: [
      createElement('h3', { text: LABELS.explore }),
      createElement('ul', { children: createSectionLinks(sections) }),
    ],
  });
}

/**
 * Replaces the authored columns with the rendered tournament's identity and sections.
 * Other authored footer content, such as legal notes, stays as authored.
 * @param {Element} footer The decorated footer content
 * @param {import('../../scripts/page/tournament-page.js').TournamentPageSummary} page
 */
function applyTournament(footer, page) {
  const columns = createElement('div', {
    className: 'footer-tournament',
    children: [
      createIdentity(page),
      page.sections.length > 0 && createNavigation(page.sections),
    ].filter(Boolean),
  });
  const authoredColumns = footer.querySelector('.columns-wrapper');
  if (authoredColumns) authoredColumns.replaceWith(columns);
  else footer.prepend(columns);
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment?.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);

  if (isTournamentPage()) {
    whenTournamentPage().then((page) => page && applyTournament(footer, page));
  }
}
