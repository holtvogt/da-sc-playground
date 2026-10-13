import { toRecordPath } from '../structured-content/fields.js';
import { loadEntrants, loadTournament } from '../structured-content/tournament.js';
import { createAlert, createEyebrow } from './components.js';
import LABELS from './tournament-labels.js';
import { createElement } from '../utils/dom.js';

/*
 * Shared behavior of the tournament blocks. Each block is self-contained, so
 * authors can place it on any page. One row links the tournament record, and
 * any other rows hold copy authored for the block, such as an eyebrow, a
 * heading, an intro, and calls to action. Authored elements are moved, never
 * copied or rebuilt, because the da.live canvas only keeps the elements it
 * annotated editable.
 */

const HEADING = /^H[1-6]$/;

/**
 * @param {Element} element
 * @returns {boolean} Whether the element is a heading
 */
function isHeading({ tagName }) {
  return HEADING.test(tagName);
}

/**
 * @param {Element} element
 * @returns {boolean} Whether the element is an authored call to action
 */
function isButton(element) {
  return element.classList.contains('button-wrapper');
}

/**
 * @param {Element} row A block row
 * @returns {?HTMLAnchorElement} The link, when it is the only content of the
 *   row and a plain link, since bold or italic links are calls to action
 */
function readReferenceLink(row) {
  const links = row.querySelectorAll('a[href]');
  if (links.length !== 1 || links[0].classList.contains('button')) return null;
  return row.textContent.trim() === links[0].textContent.trim() ? links[0] : null;
}

/**
 * Splits a block into the record it references and the copy authored for it.
 * The reference is the first row that holds nothing but a link, so authors
 * may order the rows as they like.
 * @param {Element} block
 * @returns {{path: string, authored: Element[]}} The site-relative record path,
 *   empty when there is none, and the authored elements in document order
 */
function readBlockContent(block) {
  const rows = [...block.children];
  const referenceRow = rows.find(readReferenceLink);
  const path = referenceRow ? toRecordPath(readReferenceLink(referenceRow).href) : '';
  const authored = rows
    .filter((row) => row !== referenceRow)
    .flatMap((row) => [...row.children].flatMap((cell) => [...cell.children]));
  return { path, authored };
}

/**
 * Splits authored content around its heading. Paragraphs before the heading
 * are eyebrows, and the other elements after it are body copy.
 * @param {Element[]} elements Content authored in the block
 * @returns {{eyebrows: Element[], heading: ?Element, body: Element[], buttons: Element[]}}
 */
export function partitionAuthored(elements) {
  const headingIndex = elements.findIndex(isHeading);
  const parts = {
    eyebrows: [], heading: elements[headingIndex] ?? null, body: [], buttons: [],
  };
  elements.forEach((element, index) => {
    if (index === headingIndex) return;
    if (isButton(element)) parts.buttons.push(element);
    else if (index < headingIndex && element.tagName === 'P') parts.eyebrows.push(element);
    else parts.body.push(element);
  });
  return parts;
}

/** Marks authored eyebrows, so they render like the ones derived from the record. */
export function decorateEyebrows(eyebrows) {
  eyebrows.forEach((eyebrow) => eyebrow.classList.add('ui-eyebrow', 'ui-eyebrow-ruled'));
}

function decorateAuthoredHeading(elements) {
  const { eyebrows, heading, body } = partitionAuthored(elements);
  decorateEyebrows(eyebrows);
  heading?.classList.add('tournament-section-title');
  body.filter(({ tagName }) => tagName === 'P')
    .forEach((paragraph) => paragraph.classList.add('tournament-section-intro'));
  return elements;
}

function createFallbackHeading({ eyebrow, title, intro }) {
  return [
    eyebrow && createEyebrow(eyebrow, { className: 'ui-eyebrow-ruled' }),
    createElement('h2', { className: 'tournament-section-title', text: title }),
    intro && createElement('p', { className: 'tournament-section-intro', text: intro }),
  ].filter(Boolean);
}

/**
 * Creates a section heading from authored content. Blocks without authored
 * copy, such as on record pages, get a heading derived from the record instead.
 * @param {Element[]} authored Content authored in the block
 * @param {{eyebrow?: string, title: string, intro?: string}} fallback
 * @returns {HTMLElement}
 */
export function createSectionHeading(authored, fallback) {
  return createElement('div', {
    className: 'tournament-section-heading',
    children: authored.length ? decorateAuthoredHeading(authored) : createFallbackHeading(fallback),
  });
}

/**
 * @callback TournamentRenderer
 * @param {{tournament: object, players?: object[]}} data The loaded tournament,
 *   with its players when the block asked for them
 * @param {Element[]} authored Content authored in the block
 * @returns {?Node[]} The block content, or null when the record has nothing to show
 */

/**
 * Loads the tournament a block references and replaces the block content with
 * the rendered nodes. When no tournament is referenced, or the record has
 * nothing to show, the authored copy stays, so authors can still see and edit it.
 * @param {Element} block
 * @param {TournamentRenderer} render
 * @param {{withPlayers?: boolean}} [options] Whether the block also needs the players
 */
export async function renderTournamentBlock(block, render, { withPlayers = false } = {}) {
  const { path, authored } = readBlockContent(block);
  block.classList.add('ui-reset');
  if (!path) {
    block.replaceChildren(...authored);
    return;
  }
  try {
    const tournament = await loadTournament(path);
    const players = withPlayers ? await loadEntrants(tournament) : undefined;
    block.replaceChildren(...(render({ tournament, players }, authored) ?? authored));
  } catch (error) {
    block.replaceChildren(...authored, createAlert(LABELS.loadError));
    // eslint-disable-next-line no-console
    console.error('Structured tournament loading failed', error);
  }
}

/**
 * Renders a block as a padded page section with a heading and a body.
 * @param {Element} block
 * @param {TournamentRenderer} render
 * @param {{withPlayers?: boolean}} [options] Whether the block also needs the players
 */
export function renderTournamentSection(block, render, options) {
  block.classList.add('tournament-section');
  return renderTournamentBlock(block, render, options);
}
