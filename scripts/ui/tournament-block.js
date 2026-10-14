import { toRecordPath } from '../structured-content/fields.js';
import { loadEntrants, loadTournament } from '../structured-content/tournament.js';
import BlockLabels from './block-labels.js';
import { createAlert, createEyebrow } from './components.js';
import LABELS from './tournament-labels.js';
import { createElement } from '../utils/dom.js';

/*
 * Shared behavior of the tournament blocks. Each block is self-contained, so
 * authors can place it on any page. One row links the tournament record. Rows
 * of two cells override the labels of the block, and any other rows hold copy
 * authored for the block, such as an eyebrow, a heading, an intro, and calls to
 * action. Authored elements are moved, never copied or rebuilt, because the
 * da.live canvas only keeps the elements it annotated editable.
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
 * Splits a block into the record it references, its label overrides, and the
 * copy authored for it. The reference is the first row that holds nothing but
 * a link, so authors may order the rows as they like.
 * @param {Element} block
 * @param {BlockLabels} labels Claims the rows that override a label
 * @returns {{path: string, authored: Element[], labelRows: Element[]}} The
 *   site-relative record path, empty when there is none, the authored elements
 *   in document order, and the rows that override a label
 */
function readBlockContent(block, labels) {
  const rows = [...block.children];
  const referenceRow = rows.find(readReferenceLink);
  const path = referenceRow ? toRecordPath(readReferenceLink(referenceRow).href) : '';
  const otherRows = rows.filter((row) => row !== referenceRow);
  const copyRows = labels.claimRows(otherRows);
  const authored = copyRows
    .flatMap((row) => [...row.children].flatMap((cell) => [...cell.children]));
  const labelRows = otherRows.filter((row) => !copyRows.includes(row));
  return { path, authored, labelRows };
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

/**
 * @param {Element[]} authored Content authored in the block
 * @returns {boolean} Whether the authored content replaces the derived title
 */
export function hasAuthoredHeading(authored) {
  return authored.some(isHeading);
}

function createEyebrows(eyebrows, fallback) {
  if (eyebrows.length) {
    decorateEyebrows(eyebrows);
    return eyebrows;
  }
  return fallback ? [createEyebrow(fallback, { className: 'ui-eyebrow-ruled' })] : [];
}

function createTitle(heading, fallback) {
  const title = heading ?? createElement('h2', { text: fallback });
  title.classList.add('tournament-section-title');
  return title;
}

function createIntro(body, fallback) {
  if (body.length) {
    body.filter(({ tagName }) => tagName === 'P')
      .forEach((paragraph) => paragraph.classList.add('tournament-section-intro'));
    return body;
  }
  return fallback ? [createElement('p', { className: 'tournament-section-intro', text: fallback })] : [];
}

/**
 * Creates a section heading. Each authored part, the eyebrows, the heading, and
 * the intro, replaces the part derived from the record. Parts left unauthored,
 * such as on record pages, stay derived from the record. As in
 * {@link partitionAuthored}, paragraphs are eyebrows only above an authored
 * heading, so without one they replace the intro.
 * @param {Element[]} authored Content authored in the block
 * @param {{eyebrow?: string, title: string, intro?: string}} fallback
 * @returns {HTMLElement}
 */
export function createSectionHeading(authored, fallback) {
  const {
    eyebrows, heading, body, buttons,
  } = partitionAuthored(authored);
  return createElement('div', {
    className: 'tournament-section-heading',
    children: [
      ...createEyebrows(eyebrows, fallback.eyebrow),
      createTitle(heading, fallback.title),
      ...createIntro(body, fallback.intro),
      ...buttons,
    ],
  });
}

/**
 * @callback TournamentRenderer
 * @param {{tournament: object, players?: object[]}} data The loaded tournament,
 *   with its players when the block asked for them
 * @param {Element[]} authored Content authored in the block
 * @param {BlockLabels} labels Labels of the block, with the authored overrides
 * @returns {?Node[]} The block content, or null when the record has nothing to show
 */

/**
 * Loads the tournament a block references and replaces the block content with
 * the rendered nodes. When no tournament is referenced, or the record has
 * nothing to show, the authored copy stays, so authors can still see and edit it.
 * Label overrides show in place of their labels, so they only show while their
 * field does, and in an unlinked block, which authors are still setting up.
 * @param {Element} block
 * @param {TournamentRenderer} render
 * @param {object} [options]
 * @param {boolean} [options.withPlayers] Whether the block also needs the players
 * @param {Object<string, string>} [options.labels] Default labels authors may override
 */
export async function renderTournamentBlock(block, render, {
  withPlayers = false, labels = {},
} = {}) {
  const blockLabels = new BlockLabels(labels);
  const { path, authored, labelRows } = readBlockContent(block, blockLabels);
  block.classList.add('ui-reset');
  if (!path) {
    block.replaceChildren(...authored, ...labelRows);
    return;
  }
  try {
    const tournament = await loadTournament(path);
    const players = withPlayers ? await loadEntrants(tournament) : undefined;
    block.replaceChildren(...(render({ tournament, players }, authored, blockLabels) ?? authored));
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
 * @param {object} [options] Options of {@link renderTournamentBlock}
 */
export function renderTournamentSection(block, render, options) {
  block.classList.add('tournament-section');
  return renderTournamentBlock(block, render, options);
}
