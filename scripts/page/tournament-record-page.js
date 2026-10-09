import buildRecordBlock from './record-block.js';
import { loadTournament } from '../structured-content/tournament.js';
import { createElement } from '../utils/dom.js';

/*
 * Composes the page of a tournament record, which is also what the da.live
 * canvas previews for the record. Authored pages place the same blocks
 * themselves and choose ids and styles through Section Metadata.
 */

const SECTIONS = Object.freeze([
  { variant: 'hero' },
  { variant: 'highlights', id: 'overview', style: 'dark' },
  { variant: 'schedule', id: 'schedule' },
  { variant: 'venue', id: 'venue', style: 'muted' },
  { variant: 'contenders', id: 'contenders' },
]);

function createSection({ variant, id, style }, recordPath) {
  const block = buildRecordBlock('tournament', recordPath);
  block.classList.add(variant);
  return createElement('div', {
    className: style,
    attributes: id ? { id } : {},
    children: [block],
  });
}

function updateDocumentMetadata(tournament) {
  const title = [tournament.title, tournament.year].filter(Boolean).join(' ');
  const image = tournament.heroImage;
  document.title = title;
  [
    ['meta[property="og:title"]', title],
    ['meta[name="twitter:title"]', title],
    ['meta[name="description"]', tournament.summary],
    ['meta[property="og:description"]', tournament.summary],
    ['meta[name="twitter:description"]', tournament.summary],
    ['meta[property="og:image"]', image?.src],
    ['meta[property="og:image:secure_url"]', image?.src],
    ['meta[property="og:image:alt"]', image?.alt],
    ['meta[name="twitter:image"]', image?.src],
  ].forEach(([selector, content]) => {
    const meta = document.head.querySelector(selector);
    if (meta && content) meta.content = content;
  });
}

/**
 * Replaces the record form with the tournament sections and titles the page
 * after the tournament.
 * @param {Element} main The main element
 * @param {string} recordPath Site-relative path of the tournament record
 */
export default function buildTournamentRecordPage(main, recordPath) {
  main.replaceChildren(...SECTIONS.map((section) => createSection(section, recordPath)));
  // The blocks share this load and report a failure themselves.
  loadTournament(recordPath).then(updateDocumentMetadata).catch(() => {});
}
