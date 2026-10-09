import { getMetadata } from '../../scripts/aem.js';
import { toRecordPath } from '../../scripts/structured-content/fields.js';
import { loadEntrants, loadTournament } from '../../scripts/structured-content/tournament.js';
import { createAlert, createEyebrow } from '../../scripts/ui/components.js';
import { createElement } from '../../scripts/utils/dom.js';
import LABELS from './labels.js';

/*
 * Shared behavior of the tournament block family. Each block renders one part
 * of a tournament record next to the content authors write on the page.
 * Authored elements are moved, never copied or rebuilt, because the da.live
 * canvas only keeps the elements it annotated editable.
 */

const HEADING = /^H[1-6]$/;

/**
 * @param {Element} element
 * @returns {boolean} Whether the element is a heading
 */
export function isHeading({ tagName }) {
  return HEADING.test(tagName);
}

/**
 * @param {Element} element
 * @returns {boolean} Whether the element is an authored call to action
 */
export function isButton(element) {
  return element.classList.contains('button-wrapper');
}

/**
 * Resolves the tournament a block renders. A link in the block wins over the
 * page's `tournament` metadata, so one page can mix tournaments.
 * @param {Element} block
 * @returns {string} Site-relative record path, or an empty string
 */
function readTournamentPath(block) {
  const href = block.querySelector('a[href]')?.href || getMetadata('tournament');
  return href ? toRecordPath(href) : '';
}

/**
 * Takes the default content authored right before the block in its section,
 * such as an eyebrow, a heading, an intro, and calls to action.
 * @param {Element} block
 * @returns {Element[]} The authored elements, empty when there are none
 */
function takeAuthoredContent(block) {
  const wrapper = block.parentElement?.previousElementSibling;
  if (!wrapper?.classList.contains('default-content-wrapper')) return [];
  const elements = [...wrapper.children];
  wrapper.remove();
  return elements;
}

/**
 * Splits authored content around its heading. Paragraphs before the heading
 * are eyebrows, and the other elements after it are body copy.
 * @param {Element[]} elements Content the block took from its section
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
 * Creates a section heading from authored content. Pages without one, such as
 * record pages, get a heading derived from the record instead.
 * @param {Element[]} authored Content the block took from its section
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
 * @param {Element[]} authored Content the block took from its section
 * @returns {?Node[]} The block content, or null when the record has nothing to show
 */

/**
 * Takes the authored content, loads the block's tournament, and replaces the
 * block content with the rendered nodes. When no tournament is referenced, or
 * the record has nothing to show, the authored content stays, so authors can
 * still see and edit it.
 * @param {Element} block
 * @param {TournamentRenderer} render
 * @param {{withPlayers?: boolean}} [options] Whether the block also needs the players
 */
export async function renderTournamentBlock(block, render, { withPlayers = false } = {}) {
  const authored = takeAuthoredContent(block);
  block.classList.add('ui-reset');
  const path = readTournamentPath(block);
  if (!path) {
    block.replaceChildren(...authored);
    return;
  }
  try {
    const tournament = await loadTournament(path);
    const players = withPlayers ? await loadEntrants(tournament) : undefined;
    const data = { tournament, players };
    block.replaceChildren(...(render(data, authored) ?? authored));
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
