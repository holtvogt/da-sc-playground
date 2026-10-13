import { buildBlock } from '../aem.js';
import { createElement } from '../utils/dom.js';
import { readFormField, readSchemaName } from './form.js';
import SCHEMAS from './schemas.js';

/*
 * Renders a structured content record when its own page is opened, which is
 * also what the da.live canvas previews for the record. The page is composed
 * of the same blocks authors place on their pages, each linking the record.
 */

/** @typedef {{block: string, variant?: string, style?: string}} RecordSection */

/** @type {Object<string, RecordSection[]>} Sections of a record page, by schema name */
const RECORD_SECTIONS = Object.freeze({
  [SCHEMAS.tournament]: [
    { block: 'tournament-hero' },
    { block: 'tournament-highlights', style: 'dark' },
    { block: 'tournament-schedule' },
    { block: 'tournament-venue', style: 'muted' },
    { block: 'tournament-contenders' },
  ],
  [SCHEMAS.player]: [{ block: 'player', variant: 'record' }],
});

/**
 * @param {RecordSection} section
 * @param {string} recordPath Site-relative path of the record
 * @returns {HTMLElement} A section holding one block that links the record
 */
function createSection({ block, variant, style }, recordPath) {
  const link = createElement('a', { text: recordPath, attributes: { href: recordPath } });
  const element = buildBlock(block, [[link]]);
  if (variant) element.classList.add(variant);
  return createElement('div', { className: style, children: [element] });
}

/**
 * Replaces the record form with the blocks that render the record. Regular
 * pages and fragments, which share the page URL, are left untouched.
 * @param {Element} main The main element
 */
export default function buildRecordPage(main) {
  if (main !== document.querySelector('main')) return;
  const sections = RECORD_SECTIONS[readSchemaName(main)];
  if (!sections) return;
  // EDS titles a record page after its first heading, which is a field name.
  document.title = readFormField(main, 'title') || document.title;
  const recordPath = window.location.pathname;
  main.replaceChildren(...sections.map((section) => createSection(section, recordPath)));
}
