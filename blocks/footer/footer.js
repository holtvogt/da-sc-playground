import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

function element(tag, className, text) {
  const item = document.createElement(tag);
  item.className = className;
  item.textContent = text;
  return item;
}

function link(label, href) {
  const item = element('a', '', label);
  item.href = href;
  return item;
}

function decorateConceptFooter(block) {
  const { tournamentTitle, tournamentDates, tournamentLocation } = document.querySelector('main').dataset;
  const footer = element('div', 'luxury-footer-inner', '');

  const columns = element('div', 'luxury-footer-columns', '');
  const identity = element('div', 'luxury-footer-identity', '');
  const details = element('dl', 'luxury-footer-details', '');
  [
    ['Dates', tournamentDates],
    ['Location', tournamentLocation],
  ].forEach(([label, value]) => {
    const item = element('div', '', '');
    item.append(element('dt', '', label), element('dd', '', value));
    details.append(item);
  });
  identity.append(element('h3', '', tournamentTitle), details);

  const navigation = element('nav', 'luxury-footer-navigation', '');
  navigation.setAttribute('aria-label', 'Footer');
  navigation.append(element('h3', '', 'Explore'));
  const links = element('ul', '', '');
  [
    ['Tournament', '#experience'],
    ['Contenders', '#contenders'],
  ].forEach(([label, href]) => {
    const listItem = element('li', '', '');
    listItem.append(link(label, href));
    links.append(listItem);
  });
  navigation.append(links);
  columns.append(identity, navigation);

  const legal = element('div', 'luxury-footer-legal', '');
  legal.append(
    element('p', '', 'A fictional table tennis concept. Not affiliated with World Table Tennis or an official tournament.'),
    link('Image use under the Unsplash License', 'https://unsplash.com/license'),
  );
  footer.append(columns, legal);
  block.replaceChildren(footer);
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  if (document.body.classList.contains('luxury-home')) {
    decorateConceptFooter(block);
    return;
  }

  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);
}
